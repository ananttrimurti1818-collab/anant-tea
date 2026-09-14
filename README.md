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
