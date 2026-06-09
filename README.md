# Zara Thrift (Working Name) — Thrift Clothes E-commerce App for Nigeria

**Premium curated secondhand fashion.**

**⚠️ IMPORTANT NAME WARNING**  
"Zara" is a registered trademark of Inditex. Using "Zara Thrift", "ZaraThrift", or similar in your app name, logo, domain, or marketing may result in legal action (cease & desist, takedown from app stores, etc.).  

**Strongly recommended alternatives:**
- Vera Thrift
- Zora Thrift / Z Thrift
- ThreadCycle NG
- PreLoved NG
- Relove Lagos
- SecondSkin NG
- Naija Threads
- Vintara

Update `lib/config.ts`, metadata, and branding before launch.

## Features (MVP — Ready to Run)

- Beautiful Zara-inspired minimal design (clean photography focus)
- Full shop with filters (gender, category, condition, search, price sort)
- Product detail pages with image gallery + measurements
- Cart with local persistence
- **Checkout with manual Moniepoint / Bank Transfer** (as requested)
  - Shows your Moniepoint account details + reference
  - Optional receipt upload
  - "I've paid" flow
- Cash on Delivery option (Lagos only for now)
- WhatsApp deep links for customer support + payment confirmation (very important in Nigeria)
- Simple **Admin dashboard** (`/admin`) to view orders, verify payments, update status, message customers on WhatsApp
- All data in localStorage for instant demo (replace with real DB)

## Quick Start

```bash
npm run dev
```

Open http://localhost:3000

**Critical configuration (do this now):**
1. Edit `lib/config.ts`:
   - Put your real **Moniepoint account number + name**
   - Your WhatsApp number (international format, e.g. 23480...)
2. The admin login is now username: admin123 and password: Chikenfood!1 (hardcoded in app/admin/page.tsx)

## Payments

**Manual (as requested):**
- Customer pays to your Moniepoint account (or any bank)
- Uses order reference as narration
- Uploads screenshot (optional)
- You verify in `/admin` and mark confirmed

Cash on Delivery is also available (Lagos for now).

## Next Steps (Recommended)

1. **Real backend & persistence**
   - Add Supabase (auth + Postgres + Storage for product images + receipts)
   - Or Firebase / Neon + Prisma

2. **Image uploads**
   - Allow admins to upload real photos of thrift items (currently using demo picsum)

3. **Auth**
   - Real customer accounts + order history
   - Proper admin login with username + password

4. **Production payments & logistics**
   - Integrate Gokada / MAX / local dispatch for delivery quotes
   - Add "Pay on Delivery" properly with verification
   - Consider adding Paystack later if manual payments become too slow for customers

5. **Marketing**
   - Instagram / TikTok feed integration (huge for thrift in Nigeria)
   - "New drops" via WhatsApp broadcast lists

## Deploy

Deploy easily on Vercel (recommended):
- Push to GitHub
- Import project in Vercel
- Add environment variables if you move to Supabase later

## Sample Data

12 realistic thrift items included (Levi's, Nike, cashmere, etc.). Replace with your actual inventory.

## Support

Built for you by Grok. Run `npm run dev` and start selling.

Good luck with Zara Thrift (or your rebranded version)! Quality photos + fast WhatsApp response = conversion in the Nigerian thrift market.

