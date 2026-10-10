# 🏛️ Treasure Box Command Room — Operator Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-orange.svg)](https://www.framer.com/motion/)

The private, high-security web command room designed for **Treasure Box Operators and Curators**. Manages expeditions, configures complex physical brass ciphers, verifies real-world hunter claims, and oversees financial operations.

---

## 🧭 Core Operator Capabilities

### 1. Overview & Metrics
- Live tracking of total platform revenue, active expeditions, and pending claims.
- Recent field discovery feed and hunter activity telemetry.

### 2. Treasure Cabinet (`/cabinet`)
- **Inventory Control:** Complete overview of all expeditions filtered by status (`LIVE`, `DRAFT`, `FOUND`).
- **Hunt Creation & Editor (`/cabinet/create`):**
  - Multi-language titles, lores, and photographic galleries.
  - Interactive brass cylinder dial configuration (3 to 6 columns).
  - Target sequence locking (e.g. `MALES`, validated server-side).
  - Stage 1 and Stage 2 GPS coordinate pinning with map location names.
  - Photographic hint cards with ordering.

### 3. Claims Register (`/claims`)
- Review proof photos uploaded directly from hunters' cameras in the field.
- Verify authenticity and approve findings to permanently seal the treasure.

### 4. Earnings & Finance (`/earnings`)
- Real-time revenue insights, PayPal transaction histories, and gross payout logs.

### 5. Settings & Legal Governance (`/settings`)
- Operator profile and security password management.
- Live **React-Quill Rich Text Editor** for instant updating of Terms & Conditions, Privacy Policy, and About Us content delivered seamlessly to mobile applications.

---

## 💻 Tech Stack & Aesthetic Design

- **Framework:** Next.js 16 with modern App Router architecture.
- **Styling:** Custom luxury aesthetic with Deep Emerald Green (`#0D2823`), Antique Brass Gold (`#E1BF62`), and Parchment White.
- **Typography:** Playfair Display (Serif) & Plus Jakarta Sans (Sans-serif).
- **Motion:** Micro-interactions and fluid tab transitions via Framer Motion.
- **Resilience:** Built-in client hydration guards preventing Chrome extension DOM mutation conflicts (`suppressHydrationWarning`).

---

## 🛠️ Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Type check
npx tsc --noEmit

# 4. Production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the command room.
