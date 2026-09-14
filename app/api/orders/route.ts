
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getCurrentSession, getCurrentAdminSession } from '../../lib/auth';
import { sendOrderConfirmationEmail } from '../../lib/brevo';

export async function GET() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: { 
      customer: true, 
      orderItems: true 
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = orders.map(o => ({
    id: `#ORD-${o.id}`,
    numericId: o.id,
    customer: o.customer.name,
    date: o.createdAt.toISOString().split('T')[0],
    items: o.orderItems.reduce((sum, i) => sum + i.quantity, 0), 
    total: Number(o.total),
    status: o.status,
  }));

  return NextResponse.json(formatted);
}

interface OrderItemInput {
  productId: number;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    // Customers must be logged in to place an order.
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Please sign in to place an order.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, shippingName, shippingPhone, shippingAddress } = body as {
      items: OrderItemInput[];
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }
    if (!shippingName?.trim() || !shippingPhone?.trim() || !shippingAddress?.trim()) {
      return NextResponse.json(
        { error: 'Shipping name, phone, and address are required.' },
        { status: 400 }
      );
    }

    // Never trust prices/stock from the client — look products up server-side.
    const productIds = items.map((i) => Number(i.productId));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      const quantity = Number(item.quantity);

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} was not found.` },
          { status: 400 }
        );
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}.` },
          { status: 400 }
        );
      }
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.name}. Only ${product.stock} left.` },
          { status: 400 }
        );
      }
    }

    const total = items.reduce((sum, item) => {
      const product = productMap.get(Number(item.productId))!;
      return sum + Number(product.price) * Number(item.quantity);
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId: session.id,
          total,
          paymentMethod: 'CashOnDelivery',
          shippingName: shippingName.trim(),
          shippingPhone: shippingPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          orderItems: {
            create: items.map((item) => {
              const product = productMap.get(Number(item.productId))!;
              return {
                productId: product.id,
                quantity: Number(item.quantity),
                price: product.price,
              };
            }),
          },
        },
        include: { orderItems: true },
      });

      // Decrement stock for each purchased product.
      for (const item of items) {
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { stock: { decrement: Number(item.quantity) } },
        });
      }

      return created;
    });


sendOrderConfirmationEmail(session.email, {
  orderId: order.id,
  items: order.orderItems.map((oi) => {
    const product = productMap.get(oi.productId);
    return {
      name: product?.name ?? `Product #${oi.productId}`,
      quantity: oi.quantity,
      price: Number(oi.price),
    };
  }),
  totalAmount: Number(order.total),
}).catch((err) => console.error("Order confirmation email failed:", err));

    return NextResponse.json(
      {
        message: 'Order placed successfully. Pay in cash when your order is delivered.',
        order: {
          id: order.id,
          total: Number(order.total),
          status: order.status,
          paymentMethod: order.paymentMethod,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Create Order Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong while placing your order.' },
      { status: 500 }
    );
  }
}