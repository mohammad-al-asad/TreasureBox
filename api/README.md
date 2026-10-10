# 🗝️ Treasure Box — Core Backend API Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://mongoosejs.com/)
[![Payment](https://img.shields.io/badge/Payment-PayPal%20Only-003087.svg)](https://paypal.com/)

The high-security, low-latency central API platform powering the **Treasure Box Hunter Mobile App** and the **Operator Command Room Dashboard**. Engineered with zero-bug policies, strict Zod payload validation, modern Mongoose queries, and server-side cipher verification.

---

## 🏛️ System Architecture & Highlights

- **Server-Side Secret Cipher Engine:** Hunters interact with rotating brass cipher wheels in the mobile app, but the target sequence (e.g. `MALES`) is strictly validated on the server. Stage 2 secret GPS coordinates are released *only* upon valid sequence verification.
- **PayPal Exclusive Payments:** Direct PayPal order creation, verification, and automated expedition access permit grant.
- **Treasure Claims & Proof Verification:** Ingests live field discovery proof photos from hunters, queuing them into the operator claims register. Once verified, the treasure is locked permanently as `FOUND`.
- **Live Legal Governance:** Serves rich-text Terms, Privacy Policy, and About Us contents configured in real-time from the operator dashboard.
- **Action-Oriented API Routing:** Strictly organized with descriptive, actionable endpoint paths (`/create-new-hunt`, `/verify-cipher-solution`, `/capture-paypal-order`, etc.).
- **Zero-Deprecation Database Operations:** 100% compliant with modernized Mongoose patterns using `{ returnDocument: 'after' }` and `.lean()` projections.

---

## 📡 API Endpoints Reference

### 1. Expeditions & Ciphers (`/api/v1/hunts`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/get-all-live-hunts` | Fetches all active expeditions for the mobile catalog (secrets excluded) |
| `GET` | `/get-hunt-details/:id` | Detailed field brief, lore, hints, and preview cipher state |
| `POST` | `/verify-cipher-solution` | Verifies submitted cipher sequence; returns Stage 2 GPS coordinates on success |
| `POST` | `/create-new-hunt` | Creates a new expedition with cipher and stage coordinates (Operator) |
| `GET` | `/get-all-cabinet-hunts` | Full inventory of Draft, Live, and Found expeditions (Dashboard) |
| `PUT` | `/update-hunt-details/:id` | Updates an existing expedition |

### 2. PayPal Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/create-paypal-order` | Generates a new PayPal payment order for a hunt permit |
| `POST` | `/capture-paypal-order` | Captures PayPal payment and confirms hunter permit access |
| `GET` | `/get-all-payment-transactions` | Complete transaction registry for dashboard finance review |

### 3. Claims & History Register (`/api/v1/claims`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/submit-treasure-claim` | Submits field discovery proof photo and hunter name credit |
| `GET` | `/get-all-claims-register` | Claims queue with photo previews for operator review |
| `PATCH` | `/verify-or-reject-claim` | Approves claim and permanently seals the hunt as `FOUND` |

### 4. Legal & Settings (`/api/v1/settings`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/get-legal-document/:type` | Returns Terms, Privacy Policy, or About Us HTML content |
| `PUT` | `/update-legal-document` | Saves live rich-text document updates from the dashboard |

### 5. Dashboard Metrics (`/api/v1/dashboard`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/get-overview-metrics` | Aggregates total revenue, live hunts, pending claims, and recent activity |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** v6.0+ (Local or MongoDB Atlas)
- **Redis:** (Optional for distributed session cache)

### 2. Setup Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Run development server with live reload
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔒 Security & Code Standards
- **Zod Validation:** All incoming request bodies and parameters are validated prior to controller execution.
- **Rate Limiting:** Protects against brute-force cipher cracking and auth guessing.
- **Helmet & CORS:** HTTP security headers configured for mobile and web origin isolation.
