# FASHION — E-Commerce Store

A full-stack fashion e-commerce storefront built with Next.js (App Router), Prisma, and PostgreSQL. Customers can browse products by category, register/sign in, check out with Cash on Delivery, and admins can manage products, orders, and customers from a dedicated dashboard.

## Features

- **Storefront** — home page with hero, categories, new arrivals, and sale sections, plus dedicated Men / Women / Kids / Sale / New Arrivals pages
- **Cart** — persistent shopping cart drawer available on every page
- **Authentication** — email/password registration with OTP email verification, JWT session cookies, login/logout
- **Checkout** — requires an account; Cash on Delivery payment, server-side stock and price validation
- **Order confirmation emails** — sent via Brevo after an order is placed
- **Admin dashboard** (`/admin`) — protected by an `isAdmin` flag on the account:
  - Manage products (create, edit, delete)
  - View and update order status (Pending → Processing → Shipped → Delivered / Cancelled)
  - View registered customers

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 (with `@prisma/adapter-pg` driver adapter) |
| Auth | JWT (`jsonwebtoken`) stored in an httpOnly cookie, passwords hashed with `bcryptjs` |
| Email | Brevo (`@getbrevo/brevo` REST API SDK) |
| Styling | Tailwind CSS |
| Icons | lucide-react |

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, Docker, or a hosted service like Supabase/Neon/Railway)
- A free [Brevo](https://www.brevo.com) account and API key (for verification/order emails)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxx"
BREVO_SENDER_EMAIL="you@yourdomain.com"
JWT_SECRET="a-long-random-secret-string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BREVO_API_KEY` | API key from your Brevo account (Settings → SMTP & API → API Keys), used to send verification and order-confirmation emails |
| `BREVO_SENDER_EMAIL` | The "from" address for outgoing emails — must be a verified sender in Brevo |
| `JWT_SECRET` | Any long random string, used to sign session tokens |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (used in email links) |

> **Note on emails:** Brevo requires the sender address to be verified before it will send anything — add and verify it under **Senders & IP → Senders** in your Brevo dashboard. The free plan allows **300 emails/day**, which is plenty for development and small stores; if you outgrow it, upgrade your Brevo plan.

### 3. Set up the database

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Creating an Admin Account

There's no self-service way to become an admin (by design). Register a normal account through the site, then promote it manually:

```sql
UPDATE "Customer" SET "isAdmin" = true WHERE email = 'you@example.com';
```

Log out and back in so your session picks up the change, then visit `/admin`.

## Project Structure

```
app/
├── admin/                 # Admin dashboard (products, orders, customers)
├── checkout/              # Checkout page (Cash on Delivery)
├── menProduct/            # Men's category page
├── womenProduct/          # Women's category page
├── kidsProduct/           # Kids' category page
├── sale/                  # Sale category page
├── newArrival/            # New arrivals page
├── api/
│   ├── auth/              # register, login, logout, verify-otp, me
│   ├── products/          # product CRUD (admin-protected writes)
│   ├── orders/            # order creation + admin order management
│   └── customers/         # admin customer list
├── components/
│   ├── context/           # CartContext, AuthContext
│   ├── navbar.tsx, footer.tsx, cart-drawer.tsx, login.tsx
│   └── ...section components (hero, category grid, product grid, etc.)
└── lib/
    ├── prisma.ts          # Prisma client (with PostgreSQL driver adapter)
    ├── auth.ts             # JWT session helpers
    └── brevo.ts            # Email sending (verification + order confirmation) via Brevo

prisma/
├── schema.prisma          # Data model
└── migrations/            # SQL migration history
```

> If your Brevo integration lives in a different file than `app/lib/brevo.ts`, adjust the path above to match your project.

## Data Model

- **Product** — name, category, price, stock, image, badge
- **Customer** — name, email, password (hashed), email verification (OTP), `isAdmin` flag
- **Order** — linked to a customer, status, total, payment method, shipping details
- **OrderItem** — line items linking an order to products with quantity/price

## Authentication Flow

1. Customer registers → an OTP is emailed via Brevo and stored (with expiry) on the account
2. Customer verifies the OTP → account marked verified, session cookie issued (auto-login)
3. Subsequent visits use `POST /api/auth/login` to sign in, which issues the same JWT session cookie
4. `GET /api/auth/me` lets the client check the current session; `POST /api/auth/logout` clears it
5. Checkout and all admin routes check this session server-side — the API enforces access control, not just the UI

## Known Limitations / Next Steps

- Only Cash on Delivery is supported; no online payment gateway is integrated yet
- No password-reset flow
- No pagination on admin product/order/customer lists
- No automated tests
