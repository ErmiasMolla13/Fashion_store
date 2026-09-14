import { BrevoClient } from "@getbrevo/brevo";

// 1. Initialize the Brevo client instance
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || "",
});

// Types for Order Confirmation
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderId: string | number;
  totalAmount: number;
  items: OrderItem[];
}

/**
 * Sends a 6-digit OTP verification email
 */
export async function sendVerificationEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY is missing in environment variables.");
      return { success: false, error: "API key missing" };
    }

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.SENDER_NAME || "E-Commerce App",
        email: process.env.SENDER_EMAIL || "noreply@yourdomain.com",
      },
      to: [{ email }],
      subject: "Your Email Verification Code",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your Email</h2>
          <p>Your verification code is:</p>
          <h1 style="background-color: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 4px;">
            ${otp}
          </h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    console.log("✅ OTP Email Sent! Message ID:", response.messageId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
    console.error("❌ Brevo API Error (OTP):", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sends an order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: OrderDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.error("❌ BREVO_API_KEY is missing in environment variables.");
      return { success: false, error: "API key missing" };
    }

    const itemsListHtml = orderDetails.items
      .map(
        (item) =>
          `<li><strong>${item.name}</strong> x ${item.quantity} - $${item.price.toFixed(2)}</li>`
      )
      .join("");

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.SENDER_NAME || "E-Commerce App",
        email: process.env.SENDER_EMAIL || "noreply@yourdomain.com",
      },
      to: [{ email }],
      subject: `Order Confirmation #${orderDetails.orderId}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Thank you for your order!</h2>
          <p>Your order <strong>#${orderDetails.orderId}</strong> has been placed successfully.</p>
          <h3>Order Details:</h3>
          <ul>
            ${itemsListHtml}
          </ul>
          <p><strong>Total: $${orderDetails.totalAmount.toFixed(2)}</strong></p>
        </div>
      `,
    });

    console.log("✅ Order Confirmation Sent! Message ID:", response.messageId);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send order email";
    console.error("❌ Brevo API Error (Order):", errorMessage);
    return { success: false, error: errorMessage };
  }
}