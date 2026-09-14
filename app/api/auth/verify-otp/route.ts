import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { signAuthToken, authCookieOptions, AUTH_COOKIE_NAME } from "../../../lib/auth";

interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  password?: string;
  emailVerified?: boolean;
  otp?: string | null;
  otpExpires?: Date | null;
}

interface CustomerDelegate {
  findUnique(args: { where: { email: string } }): Promise<CustomerRecord | null>;
  update(args: { where: { email: string }; data: Partial<CustomerRecord> }): Promise<CustomerRecord>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.email || !body.otp) {
      return NextResponse.json({ error: "Email and OTP code are required" }, { status: 400 });
    }

    const { email, otp } = body;
    const customerDb = prisma.customer as unknown as CustomerDelegate;

    const customer = await customerDb.findUnique({ where: { email } });

    if (!customer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!customer.otp || customer.otp !== String(otp).trim()) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    if (customer.otpExpires && new Date() > new Date(customer.otpExpires)) {
      return NextResponse.json({ error: "OTP code has expired. Please register again." }, { status: 400 });
    }

    // Activate user
    await customerDb.update({
      where: { email },
      data: {
        emailVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

    // Auto-login: verifying OTP completes registration, so start a session immediately
    const token = signAuthToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      isAdmin: customer.isAdmin,
    });

    const response = NextResponse.json(
      {
        message: "Email verified successfully",
        user: { id: customer.id, name: customer.name, email: customer.email, isAdmin: customer.isAdmin },
      },
      { status: 200 }
    );
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);

    return response;
  } catch (err) {
    console.error("OTP Verification Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}