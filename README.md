# 🚗 Er-Car Rentals

A full-stack car rental platform built with **Next.js** and **MySQL**, supporting three separate user roles — **Customer**, **Owner**, and **Admin** — each with their own authentication, dashboard, and permissions.

---

## ✨ Features

- **Role-based authentication** for customers, owners, and admins, each with its own signed, httpOnly session cookie.
- **Email verification via Brevo** — new customer and owner accounts must verify their email before they can sign in.
- **Forgot / reset password** flow via email for all three roles.
- **Car browsing & booking** — filter by category, make, price, etc., and rent a car (requires a signed-in, verified customer).
- **Customer car ratings** — signed-in customers can rate cars they've viewed; the displayed rating is a live average across all customer reviews.
- **Admin dashboard** — manage admins, owners, customers, and cars.
- **Owner dashboard** — list and manage your own vehicles.
- **Advertisement slots** — dedicated ad space on the homepage and car-listing sidebar.
- **CSRF protection & security headers** applied globally via middleware.

---

## 🧱 Tech stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Framework  | Next.js 15 (App Router)             |
| UI         | React, Ant Design, Tailwind CSS     |
| Database   | MySQL                               |
| Email      | Brevo (transactional email API)     |
| Auth       | Custom signed session cookies (HMAC-SHA256) |

---

## 🚀 Getting started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd <your-repo-folder>
npm install
```

### 2. Set up the database

Create a MySQL database (e.g. `er_car_rent`) and import your base schema first, then run the included migration to add the email verification / password reset columns:

```bash
mysql -u root -p er_car_rent < migrations/002_add_email_verification_and_password_reset.sql
```

> **No `mysql` CLI?** Open the file in phpMyAdmin's **SQL** tab (select your database first) and run it there instead. If your MySQL/MariaDB version is older and complains about `IF NOT EXISTS` on `ADD COLUMN`, remove those two words from each line and re-run — it's safe as long as you only run it once.

This adds `email_verified`, `verification_token_hash`, `verification_expires`, `reset_token_hash`, and `reset_expires` to the `customer` and `owner` tables (plus reset columns on `admin`), and marks any pre-existing accounts as already verified so nobody gets locked out retroactively.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

```dotenv
# MySQL connection
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_SCHEMA=er_car_rent

# Signs session cookies — required in production.
# Generate one with:
#   openssl rand -hex 32
# or, if you don't have openssl (e.g. on Windows PowerShell):
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=

# Used to build links in verification/reset emails
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Brevo (https://app.brevo.com) — required to actually deliver emails.
# Get a key from Settings → SMTP & API → API Keys.
# SENDER_EMAIL must be verified under Settings → Senders in Brevo.
BREVO_API_KEY=
SENDER_EMAIL=
SENDER_NAME="Er-Car Rentals"
```

> **No Brevo key yet?** The app still works — verification/reset emails are printed to your terminal instead of sent, so you can copy the link from there manually during development.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm start
```

---

## 🔑 Roles & auth

| Role     | Sign-up flow                          | Email verification required? |
|----------|----------------------------------------|-------------------------------|
| Customer | Self-registration                     | ✅ Yes                        |
| Owner    | Self-registration                     | ✅ Yes                        |
| Admin    | Created directly (no public sign-up)  | ❌ No                         |

Each role gets its own cookie: `admin_session`, `owner_session`, `customer_session`. See `src/app/libs/session.js` and `src/app/libs/authGuard.js` for how tokens are signed and verified, and `src/middleware.js` for route protection (e.g. `/admin/**` requires a valid `admin_session`).

Useful endpoints:
- `GET /api/auth/check` — check whether the current request is authenticated (optionally `?role=admin|owner|customer`).
- `POST /api/auth/logout` — clear the session cookie.
- `GET /api/health` — returns `{status: "ok"}` if the app can reach the database (handy for uptime checks / deploy platforms).

---

## 📁 Project structure

```
src/
  app/
    api/            REST-style route handlers, one folder per resource
    libs/
      mysql.js       MySQL connection pool
      session.js      Session cookie signing/verification
      authGuard.js     requireRole() / getAnySession() helpers
      mailer.js        Brevo email sending
      accountAuth.js   Verification/reset token generation
      rateLimit.js     Basic in-memory rate limiting
    components/      Shared React components (header, login drawer, ad space, etc.)
    admin/           Admin dashboard pages
    EconomicCar/      Main car browsing & booking page
  middleware.js       Global security headers, CSRF check, admin route guard
migrations/           SQL migrations (run manually, see setup above)
```

---

## ⚠️ Troubleshooting

- **Admin login redirects back to the homepage** — make sure you've pulled the latest `src/middleware.js`; older versions checked the wrong cookie name.
- **Login returns `403 EMAIL_NOT_VERIFIED`** — the account hasn't clicked its verification link yet. Check your terminal for the printed link (if Brevo isn't configured) or your inbox (if it is), or manually run:
  ```sql
  UPDATE customer SET email_verified = 1 WHERE email = 'someone@example.com';
  ```
- **`Unknown column 'email_verified'`** — you haven't run the migration yet; see step 2 above.
- **No email arrives even with a Brevo key set** — confirm `SENDER_EMAIL` is a *verified* sender in your Brevo account (Settings → Senders), and check the terminal for a `[mailer] Brevo send failed` error with details.

---

## 📄 License

Add your license of choice here (MIT, etc.).