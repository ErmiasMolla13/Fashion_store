import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { signAuthToken, authCookieOptions, AUTH_COOKIE_NAME } from '../../../lib/auth';

// Explicit shape matching your customer model
interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  password?: string | null;
  emailVerified?: boolean;
  isAdmin?: boolean;
}

interface CustomerDelegate {
  findUnique(args: { where: { email: string } }): Promise<CustomerRecord | null>;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Safely cast the delegate to match your register route pattern
    const customerDb = prisma.customer as unknown as CustomerDelegate;

    // 2. Fetch customer from PostgreSQL
    const customer = await customerDb.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Check if email is verified
    if (!customer.emailVerified) {
      return NextResponse.json(
        { error: 'Email not verified. Please verify your email using the OTP sent to you.' },
        { status: 403 }
      );
    }

    // 4. Verify password
    if (!customer.password) {
      return NextResponse.json(
        { error: 'Invalid authentication credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Successful login — issue a session cookie
    const token = signAuthToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      isAdmin: Boolean(customer.isAdmin),
    });

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          isAdmin: customer.isAdmin,
        },
      },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);

    return response;
  } catch (err) {
    console.error('Login Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong on our end' },
      { status: 500 }
    );
  }
}