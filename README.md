# Anant Tea Production V7

Production-ready Anant Tea storefront/admin source.

## Latest storefront updates
- Homepage shows all active products directly in the Products section.
- Removed the homepage Product-section "View All Products" / "Shop All" CTA.
- Homepage order: Products → Why Choose Anant Tea → Featured Products → About Us → Join Us / Become Our Partner → Gallery preview.
- Gallery preview now reads active images from the existing legacy gallery tables so admin-uploaded images appear on the storefront.
- Gallery images use contain behavior so the complete image remains visible without cropping.
- Public gallery also displays complete images without forced cropping.
- Added `/partner` page with separate Distributor and Sub Distributor partnership sections.
- Both partnership forms validate the phone number and open WhatsApp with a properly formatted message.
- Partnership WhatsApp destination: +91 70385 21818.
- Footer includes clickable "Designed and Developed by Arvik Digital" linking to arvikdigital.in.
- Checkout shows active, visible, currently valid coupons with eligibility and a Use button.
- Buyer OTP / welcome-coupon flow is not used.

## Environment
Create `.env` locally. Never commit or package production secrets.

## Run
```powershell
npm install
npm run db:migrate
npm run build
npm run dev
```

Existing populated legacy Prisma-style tables remain the ecommerce source of truth.

## Admin authentication

The admin panel uses Firebase Authentication with an HTTP-only Firebase Admin session cookie.

1. In Firebase Console, enable **Authentication → Sign-in method → Email/Password**.
2. Create the admin's Firebase user with the email address used by the existing Anant Tea admin record, or add the email to `ADMIN_EMAILS`.
3. Add the Firebase Web App values to `.env.local` using the `NEXT_PUBLIC_FIREBASE_*` names in `.env.example`.
4. Add the Firebase Admin SDK service-account values as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
5. Start the app and open `/admin/login`.

All `/api/admin/*` data and mutation endpoints require a valid admin session. The public storefront does not require Firebase login.

## Latest admin improvements (V14)

- Product variants support an optional discounted selling price. `price` remains the regular price for compatibility; `discountPrice` is used only when it is lower than the regular price.
- Apply the new Neon migration before using the updated product APIs: `npm run db:migrate` (run from the project root with the correct `DATABASE_URL` configured in `.env`). The migration adds the nullable `"discountPrice"` column to the existing populated `"ProductVariant"` table.
- Orders support confirmed deletion from the admin Orders page.
- Order documents are available at `/admin/orders/<order-id>/documents`: A5 packing slip, A5 invoice, or both. The PDF buttons open the browser print dialog; choose **Save as PDF** as the destination.
- Sales report day grouping now uses a non-reserved `day_label` alias, and today's sales is calculated explicitly.


## V16 updates: About Us and shipping management

- Store navigation "Products" and the order-success "Continue Shopping" button now lead to the homepage.
- Admin > About Us Page edits the About page copy and story photo. Upload the photo by drag-and-drop/click; no image URL is required.
- Admin > Shipping & Delivery controls the shipping fee and free-shipping threshold. Checkout display and server-side order totals use these saved values.
- New database migration: `db/migrations/005_about_shipping_settings.sql`.

After replacing the project files, run:

```powershell
npm install
npm run db:migrate
npm run build
npm run dev
```

Run `npm run db:migrate` against the same `DATABASE_URL` used by the site before testing the new admin pages. Keep `.env` out of GitHub; do not share Firebase service-account keys, database URLs, or Cloudinary secrets.


## V17: Razorpay Standard Checkout (test mode)

- Checkout now offers Cash on Delivery and Razorpay Online Payment.
- `POST /api/orders` creates the store order using server-resolved prices, active discount prices, coupons and saved shipping settings. For online payment it also creates a Razorpay order through Razorpay's authenticated REST API.
- `POST /api/razorpay/verify-payment` verifies the Razorpay HMAC-SHA256 signature server-side and only then marks the order `PAID` / `CONFIRMED`.
- A dismissed or failed checkout is never marked paid. The secret is only read on the server.
- Navbar duplicate React keys are fixed, and the logo image sizing preserves its aspect ratio.

### Razorpay environment setup

Add these to local `.env` (do not commit `.env`):

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Use the actual Test Mode Key ID and Key Secret from Razorpay Dashboard. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe to expose, but `RAZORPAY_KEY_SECRET` must never use a `NEXT_PUBLIC_` prefix. The server uses `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` for authenticated order creation and signature verification.

For Vercel, add the same variables in Project Settings → Environment Variables, then redeploy. Do not share or commit the secret.

### Apply and test

```powershell
npm install
npm run db:migrate
npm run build
npm run dev
```

Migration `006_razorpay.sql` adds Razorpay order/payment IDs to the existing `"Order"` table; it does not create a second order system. Test an order using Razorpay Test Mode and a Razorpay-provided test payment method. Confirm the order appears in Admin with payment status `PAID` only after signature verification. Also test dismissing the modal and a failed payment; neither should show as paid.

This integration uses the Razorpay Standard Checkout script and server-side REST API via built-in `fetch`, so no extra Razorpay SDK package is required.

## V18 additions: COD toggle and policy pages

- Admin → Shipping & Delivery now includes a Cash on Delivery on/off switch. When disabled, the COD option is hidden at checkout and the orders API rejects COD submissions server-side.
- Admin → Policy Pages lets an admin create, edit, publish/unpublish, delete, and choose footer visibility/order for Terms & Conditions, Privacy Policy, Shipping & Delivery Policy, Refund/Cancellation Policy, and any custom page.
- Published pages are available at `/pages/<slug>` and eligible page links are loaded dynamically in the footer.
- Apply database migration `007_cod_and_policy_pages.sql` using `npm run db:migrate` before testing.
- The four default policy pages contain placeholder text. Replace it with your approved business/legal wording in Admin → Policy Pages before publishing the website to customers.
