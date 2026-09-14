import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sendVerificationEmail } from "../../../lib/brevo";
import bcrypt from "bcryptjs";

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
  upsert(args: {
    where: { email: string };
    update: Partial<CustomerRecord>;
    create: Omit<CustomerRecord, "id">;
  }): Promise<CustomerRecord>;
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const customerDb = prisma.customer as unknown as CustomerDelegate;

    // 1. Check if user already exists and is verified
    const existingCustomer = await customerDb.findUnique({ where: { email } });
    if (existingCustomer && existingCustomer.emailVerified) {
      return NextResponse.json({ error: "Email already registered and verified" }, { status: 400 });
    }

    // 2. Hash password & generate OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Upsert user in database
    await customerDb.upsert({
      where: { email },
      update: { name, password: hashedPassword, otp, otpExpires },
      create: { name, email, password: hashedPassword, otp, otpExpires, emailVerified: false },
    });

    // 4. Send email
    const emailResult = await sendVerificationEmail(email, otp);

    if (!emailResult.success) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Verification OTP sent to email" }, { status: 200 });
  } catch (err: unknown) {
    console.error("Register Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}