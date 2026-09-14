import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getCurrentAdminSession } from '../../lib/auth';

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
  });

  // Map Decimal fields to Number for JSON serialization
  const formattedProducts = products.map((product: (typeof products)[number]) => ({
    ...product,
    price: Number(product.price),
  }));

  return NextResponse.json(formattedProducts);
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();

  const product = await prisma.product.create({
    data: {
      name: body.name,
      category: body.category,
      price: body.price,
      stock: body.stock,
      image: body.image,
      badge: body.badge ?? 'None',
    },
  });

  // Convert Decimal to Number for the single product response as well
  return NextResponse.json(
    {
      ...product,
      price: Number(product.price),
    },
    { status: 201 }
  );
}
