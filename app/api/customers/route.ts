import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getCurrentAdminSession } from '../../lib/auth';

export async function GET() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const customers = await prisma.customer.findMany({
    include: { orders: true },
    orderBy: { id: 'asc' },
  });

  const formatted = customers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    orders: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
    joined: c.createdAt.toISOString().split('T')[0],
  }));

  return NextResponse.json(formatted);
}