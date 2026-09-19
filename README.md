# SeatRelay — Face-Value Bus Ticket Resale Platform

> **"Your seat doesn't have to go to waste."**  
> Resell eligible bus seats at face value. Someone gets the seat. You recover your fare. Authorized operator reissuance guarantees boarding safety.

---

## 1. Architecture Overview

SeatRelay is an authorized resale and passenger reissuance layer between travellers and bus operators. It strictly enforces:
- **Face-value rule:** Resale price $\le$ original ticket price ($0$ markups, $0$ scalping).
- **Atomic reservation locking:** Prevents race conditions where two travellers purchase the same seat.
- **Operator-authorized reissue:** The original passenger's ticket is invalidated; a new verified digital ticket with a new Ticket ID & dynamic QR code is reissued to the buyer.
- **Escrow protection:** Funds are released as a refund to the original passenger only after the bus operator approves the reissue.
- **Privacy & security:** Seller details are completely hidden from buyers; buyer government ID details are masked (`XXXX XXXX 4821`).

---

## 2. Project Structure

```text
seatrelay/
├── backend/
│   ├── src/
│   │   ├── db.js                 # SQLite atomic transaction runner with WAL mode
│   │   ├── seed.js               # Realistic demo seed (Rahul, Priya, SwiftBus)
│   │   ├── workflow.js           # ResaleWorkflowService, MockOperatorService, MockPaymentService
│   │   └── server.js             # Express REST API (Search, Tickets, Resale, Operator)
│   ├── db_init.py                # Schema initialization & table migrations
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Role switcher, notifications, demo runner
│   │   │   ├── HomePage.tsx           # Hero section, 4-step explainer, role portals
│   │   │   ├── SearchBuses.tsx        # Route search, sold out status, resale badge
│   │   │   ├── CheckoutModal.tsx      # Passenger details, Govt ID, face-value breakdown
│   │   │   ├── MyTickets.tsx          # Seller ticket list, release seat modal, refund track
│   │   │   ├── OperatorDashboard.tsx  # Operator GDS terminal, Approve / Reject
│   │   │   ├── DigitalTicketModal.tsx # Digital boarding pass with verified QR code
│   │   │   ├── DemoProgressModal.tsx  # Interactive visual timeline for automated demo
│   │   │   └── TransactionLedger.tsx  # Public immutable audit ledger
│   │   ├── types.ts                   # TypeScript interfaces
│   │   ├── App.tsx                    # Main state machine
│   │   └── index.css                  # Tailwind styles
│   ├── package.json
│   ├── vite.config.ts                 # Proxy /api, /mock-operator, /demo to backend
│   └── Dockerfile
├── prisma/
│   └── schema.prisma                  # Data models
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Demo Credentials & Profiles

No password registration is required. You can instantly toggle between profiles from the top-right header role switcher or role cards on the home page:

| Role | Name | Email | Initial State |
| :--- | :--- | :--- | :--- |
| **Seller** | Rahul Sharma | `rahul@example.com` | Owns confirmed Ticket `#SB-92831` (Seat `U12`, Fare: `₹850`, Bangalore → Chennai) |
| **Buyer** | Priya Kumar | `priya@example.com` | Searching Bangalore → Chennai (19 Sep 2026); discovers resale seat `U12` |
| **Operator** | SwiftBus Operations | `ops@swiftbus.in` | Operator GDS portal with one-click **Approve Reissue** / **Reject** |

---

## 4. Local Development

### Prerequisites
- Node.js (v18+)
- Python 3 (standard on macOS / Linux)

### 1. Start the Backend Server (Port 4000)
```bash
cd backend
NODE_PATH=../frontend/node_modules node src/server.js
```
*Backend runs on: `http://localhost:4000`*

### 2. Start the Frontend Application (Port 5173)
```bash
cd frontend
npx vite --host 0.0.0.0 --port 5173
```
*Frontend runs on: `http://localhost:5173`*

---

## 5. Docker Deployment

To launch the full stack with Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:4000`

---

## 6. End-to-End Acceptance Test Walkthrough

You can test the entire lifecycle manually or by clicking **"▶ Run Complete Demo"** in the top navigation bar.

### Manual Step-by-Step Scenario:

1. **Login as Rahul (Seller):**
   - Click **My Tickets** in navigation.
   - See ticket `SB-92831` on SwiftBus (Bangalore → Chennai, 19 Sep 2026, 10:30 PM, Seat: U12, ₹850).
2. **Release Seat for Resale:**
   - Click **"Release Seat for Resale"**.
   - Modal shows Original fare: ₹850, Platform fee: ₹0, Expected refund: ₹850.
   - Click **"List for ₹850"**. Status updates to **"Listed for Resale"**.
3. **Switch to Priya (Buyer):**
   - Switch role to **Priya Kumar** in top dropdown.
   - Navigate to **Search Buses** (Bangalore → Chennai, 19 Sep 2026).
   - See SwiftBus Express marked **"Sold Out"**.
   - Underneath, see: `♻️ 1 seat available through SeatRelay` (Seat U12 for ₹850).
4. **Buyer Checkout:**
   - Click **"Seat U12 (UPPER_BERTH) ₹850 →"**.
   - Passenger details autofilled for Priya (Age: 24, Gender: Female, Aadhaar: `XXXX XXXX 4821`).
   - Click **"Confirm Purchase & Pay ₹850"**.
   - Mock payment succeeds and generates transaction reference.
5. **Switch to Operator:**
   - Navigate to **Operator Portal**.
   - Review pending reissue request `#SR-XXXXX`.
   - Compares Rahul Sharma (original holder) with Priya Kumar (new verified passenger).
   - Click **"Approve Reissue"**.
6. **Verification of Final State:**
   - **Priya (Buyer):** Click **My Tickets** as Priya. View new digital ticket `SR-XXXXX` with verified QR code showing Priya's identity and `Original Ticket: INVALIDATED`.
   - **Rahul (Seller):** Switch to Rahul. Ticket `SB-92831` shows `INVALIDATED`. Resale card shows **"Refund initiated & COMPLETED: ₹850"**.
   - **Public Ledger:** Click **Ledger** to review complete immutable transaction audit trail.

---

## 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/buses/search?from=..&to=..&date=..` | Search buses with direct and resale availability |
| `GET` | `/api/tickets/my?userId=xxx` | Fetch tickets and active resale statuses for a user |
| `POST` | `/api/tickets/:id/list` | List an eligible ticket for resale at face value |
| `DELETE` | `/api/resale/:id` | Cancel an unpurchased resale listing |
| `GET` | `/api/resale/search` | Browse active resale inventory across routes |
| `GET` | `/api/resale/:id` | Get sanitized resale seat details (seller identity stripped) |
| `POST` | `/api/resale/:id/purchase` | Atomically lock seat, process mock payment, create reissue request |
| `GET` | `/api/operator/reissues` | List pending and historical reissue requests |
| `POST` | `/api/operator/reissues/:id/approve` | Invalidate original ticket, reissue new QR ticket, release seller refund |
| `POST` | `/api/operator/reissues/:id/reject` | Reject request and initiate buyer refund |
| `POST` | `/mock-operator/reissue` | Simulated bus operator GDS endpoint (Section 13) |
| `GET` | `/mock-operator/capabilities` | Exposes operator resale & reissue capabilities (Section 25) |
| `POST` | `/demo/run-full-flow` | Automated end-to-end demo runner |
| `POST` | `/demo/reset` | Resets database to pristine initial state |

---

## 8. Transitioning from Mock Operator to Production

In real-world deployment, `MockOperatorService` in [`backend/src/workflow.js`](file:///Users/balaji/Bharath-Build-First-Commit/backend/src/workflow.js) will be replaced with direct integrations to bus operator GDS platforms (such as Bitla Software, Mantis, RedBus Open API, or AbhiBus):

```text
SeatRelay Core
      │
      ├── [Operator Adapter Layer]
      │         ├── Bitla GDS Connector
      │         ├── Mantis API Connector
      │         └── RedBus API Connector
      │
      ├── [Payment Gateway] (Razorpay / Stripe)
      │
      ├── [Government ID Verification] (DigiLocker / Aadhaar OTP)
      │
      └── [Ticket & QR Service]
```

### Operator Capability Handshake
Each operator integration exposes their capability matrix:
```json
{
  "operator_code": "SWIFT",
  "supports_resale": true,
  "supports_passenger_reissue": true,
  "minimum_resale_window_minutes": 60,
  "maximum_resale_price": "FACE_VALUE",
  "reissue_fee_waived": true
}
```
If an operator does not support passenger reissuance or if departure is inside the blackout window, SeatRelay dynamically disables listing to prevent unserviceable sales.
