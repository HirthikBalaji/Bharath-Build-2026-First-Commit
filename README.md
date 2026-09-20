# SeatRelay: Operator-Authorized Bus Seat Resale at Face Value

> Built for **First Commit** (Bharat Builds Tour, WeMakeDevs x AWS), Sept 17 to 20, 2026.  
> **Tagline:** *"Your seat doesn't have to go to waste."*

---

## 1. The Problem

A traveller books a bus seat on an operator or aggregator platform. Plans change close to departure. By then the cancellation charge is high, and inside the operator's no-refund window, it is the entire fare (100% loss).

At the same time, someone else searching that exact route finds it **sold out**.

The naive fix — *"just give the ticket to someone who needs it"* — fails because tickets carry the original passenger's name and boarding requires matching government photo ID.

Today, one of three things happens:
1. The traveller cancels and loses most or all of the fare.
2. The traveller does not bother cancelling, and the seat runs empty.
3. The seat gets filled along the route by a passenger paying cash to crew who is not on the manifest.

**Everyone loses:** the original traveller loses money, the buyer cannot travel, and the manifest is compromised.

### Precedent
Indian Railways allows confirmed tickets to be transferred, but only to immediate family members, 24+ hours before departure at a physical counter. SeatRelay provides an authorized digital protocol that works **between strangers, online, up to departure**.

---

## 2. Why an Open Resale Forum Fails

| Problem | What Goes Wrong in an Open Forum |
|---|---|
| **Name on the Ticket** | Money changes hands, but the ticket still says the seller's name. The buyer is turned away at boarding or travels under a fake identity. |
| **No Fraud Protection** | The seller can still cancel the original ticket, take a refund, or sell the same seat to multiple people. Only the operator can void the old ticket. |
| **Scalping Optics** | Third-party markups inflate prices above face value during peak demand. |

**Key Insight:** The transfer must happen at the **operator level**, because only the operator can cancel the old ticket and issue an authentic ticket in the buyer's name.

---

## 3. The Solution & Guarantees

SeatRelay acts as an authorized resale layer between passengers and bus operators:
1. A traveller **releases** their seat.
2. A buyer searching that route **claims** it at exactly the original fare.
3. The **operator re-issues** the ticket in the buyer's name and ID, cancelling the old one.
4. The original traveller is **refunded only once the seat has actually sold**.

### Guarantees
- **The buyer pays exactly face value.** Never more (zero scalping).
- **The seller is never worse off than today.** If the seat does not sell, they fall back to the operator's normal policy.
- **A seat can only be sold once.** Conditional writes and atomic locks prevent race conditions.
- **Every passenger is on the record.** The re-issued ticket carries the real traveller's name and ID with an authorized dynamic QR code.

---

## 4. The Three Roles

| Role | Persona in Demo | What They Do |
|---|---|---|
| **Seller** | Rahul Sharma (`rahul@example.com`) | Holds confirmed ticket `#SB-92831` (Seat `U12`, ₹850). Releases seat; gets ₹850 refund when sold. |
| **Buyer** | Priya Kumar (`priya@example.com`) | Searches Bangalore → Chennai (19 Sep 2026), sees the sold-out 22:30 coach with one relayed berth at the printed fare, buys at ₹850, receives a new QR boarding pass. |
| **Operator** | SwiftBus Operations (`ops@swiftbus.in`) | Simulated GDS portal. Reviews side-by-side identity verification, clicks 1-Click Approve / Reject Reissue. |

---

## 5. Money Model (Exact Face Value)

*Example: ₹850 (or ₹1,200) fare inside the no-refund window.*

| Stakeholder | Today (Standard Cancellation) | With SeatRelay Protocol |
|---|---|---|
| **Buyer pays** | Seat unavailable (Sold Out) | **Exact Face Value** (e.g. ₹850) |
| **Operator keeps** | ₹0 if traveller no-shows, or penalty fee with empty seat | Fee + a paid seat + 100% accurate manifest |
| **Platform keeps** | n/a | Nominal operational fee from recovered fare |
| **Seller gets back** | **₹0** (100% loss) | **Full / Net Recovered Fare** |

The platform and operator fees come **out of money the seller would otherwise have lost**, not on top of the buyer's price.

---

## 6. AWS Architecture (Ship It Track)

SeatRelay is designed using the hackathon's **Ship It** AWS services:

| AWS Service | Job in SeatRelay |
|---|---|
| **AWS Amplify Hosting** | Hosts the React + TypeScript frontend (Seller, Buyer, Operator views). |
| **Amazon Cognito** | User authentication with three RBAC user groups: `seller`, `buyer`, `operator`. |
| **Amazon API Gateway + Lambda** | REST API for listings, search, atomic claims, payments, and operator dispatch. |
| **Amazon DynamoDB** | `Listings`, `OperatorTickets`, and `Transfers`. Conditional writes guarantee exactly one buyer per seat. |
| **AWS Step Functions** | Centerpiece workflow orchestrating payment windows, operator task token approvals, and rollbacks. |
| **Amazon EventBridge Scheduler** | One-time schedules per listing to auto-expire unsold seats at cutoff (T-60 min). |
| **Amazon SNS** | Real-time notifications to seller, buyer, and operator at each transition. |
| **Amazon S3** | Secure storage for uploaded ticket receipts and generated QR boarding passes. |
| **Amazon CloudWatch** | Structured logging, alarms, and a metric dashboard for recovered revenue. |

### Architecture Flow
```text
 React (Amplify) ── Cognito (seller, buyer, operator)
        │
   API Gateway
        │
     Lambdas ──────────► DynamoDB (Listings, OperatorTickets, Transfers)
        │                     ▲ (Conditional writes: status = 'LISTED')
        ├── start ──► Step Functions (Transfer Workflow) ──► SNS notifications
        │                     │
        │              wait for operator task token
        │                     ▲
        └── operator approve/reject sends task token back
        
 EventBridge Scheduler ──(at cutoff: T-60m)──► expireListing Lambda
 S3 ◄── ticket uploads / re-issued tickets
```

---

## 7. Step Functions Transfer State Machine

```text
             withdraw
   LISTED ─────────────► WITHDRAWN
     │  ▲
claim│  │ payment window timeout (10m)
     ▼  │ or operator reject/timeout (before cutoff)
   CLAIMED ──pay──► PAYMENT_HELD ──► AWAITING_OPERATOR ──approve──► REISSUED ──► SELLER_REFUNDED ──► COMPLETE
     
   LISTED ── cutoff reached (T-60m) ──► EXPIRED
   AWAITING_OPERATOR ── reject/timeout after cutoff ──► buyer refunded ──► EXPIRED
```

### Automatic Failure Paths
1. **Payment Window Timeout (10 mins):** Claim released, seat status reverts to `LISTED`.
2. **Operator Rejection / Timeout:** Buyer held payment refunded immediately. If before cutoff, seat reverts to `LISTED`; otherwise expires.
3. **Cutoff Auto-Expiry (T-60 min):** EventBridge triggers expiry. Hold lifted. Seller falls back to standard operator policy.
4. **Seller Withdrawal:** Seller can withdraw at any time prior to buyer purchase.

---

## 8. DynamoDB One-Buyer Atomic Claim Guarantee

To eliminate race conditions when multiple buyers click claim simultaneously:
```sql
UpdateItem Listings
  SET status = 'CLAIMED', buyerId = :buyer, claimExpiresAt = :timeout
  WHERE listingId = :id
  CONDITION status = 'LISTED'
```
If two buyers claim at the exact same millisecond, **exactly one update succeeds**. The second buyer receives a clean `409 Conflict: "Seat already claimed"` response.

---

## 9. Real vs Simulated Scope

Judges reward transparent scoping:

| Real | Simulated |
|---|---|
| Full-stack deployed application with React UI & Node.js backend | Operator reservation system (`MockOperatorService` + operator console) |
| Multi-persona state machine (Seller, Buyer, Operator) | Payments (mock escrow hold and release, no real payment gateway) |
| Atomic claims, transfer workflow, timeouts, and rollbacks | Government ID verification (Aadhaar / DigiLocker masking simulation) |
| Dynamic QR code generation & boarding ticket rendering | Carrier manifest GDS webhook triggers |
| Real database persistence with SQLite WAL concurrency | |

---

## 10. Three-Minute Live Demo Script

| Time | Scene | Action in Prototype |
|---|---|---|
| **0:00 - 0:25** | The Problem | Show "Sold Out" route and standard 100% cancellation penalty on screen. Explain why Rahul loses ₹850 while Priya is stranded. |
| **0:25 - 0:45** | Why Resale Forums Fail | Highlight identity mismatch on boarding, fraudulent duplicate sales, and scalping. |
| **0:45 - 1:15** | Seller Lists Seat | Sign in as Rahul (demo account button in the sign-in window). In **My journeys**, click **Release this seat** and show the refund preview: *"Cancel with the operator now: ₹0. Release on SeatRelay: ₹850."* |
| **1:15 - 1:40** | Buyer Finds & Claims | Open **Find a seat** and search Bangalore → Chennai. The 22:30 coach is sold out with berth U12 released at the printed fare. Click it (the app switches to Priya, the demo buyer), enter passenger details and ID, and pay ₹850. |
| **1:40 - 2:10** | Operator Approves | Sign in as SwiftBus (operator demo account). In **Dispatch**, compare who comes off the manifest and who goes on. Click **Approve reissue**. |
| **2:10 - 2:35** | Verification & Reissuance | Sign in as Priya and open **My journeys → Boarding pass** (reissued, with QR). Rahul's card shows Transferred and ₹850 refunded. Open the **Ledger**. |
| **2:35 - 2:50** | AWS Architecture | Open **Platform → Reference architecture** (or press Ctrl K) to show the Step Functions state machine and the DynamoDB conditional update. |
| **2:50 - 3:00** | Closing Summary | *"Nobody loses the fare, nobody misses the bus, and everyone on board is on the record."* |

---

## 11. Local Setup & Quickstart

### Prerequisites
- Node.js (v18+)
- Python 3

### 1. Run the Backend (Port 4000)
```bash
cd backend
NODE_PATH=../frontend/node_modules node src/server.js
```

### 2. Run the Frontend (Port 5173)
```bash
cd frontend
npx vite --host 0.0.0.0 --port 5173
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:4000`

### Demo controls
- **Demo accounts:** the sign-in window has one-tap buttons for Rahul (seller), Priya (buyer) and SwiftBus (operator).
- **Live walkthrough / Reset demo data:** in the account menu (top right) and the command menu (Ctrl K).
- **Light and dark:** pull the cord hanging at the top right of the page.

### Run the whole stack with Docker
```bash
docker compose up -d --build
```
Frontend on `http://localhost`, with `/api` proxied to the backend. The SQLite
database is seeded on first start and kept in the `seatrelay_data` volume.

### Deploy to AWS
One EC2 Free Tier instance runs both containers - see **[DEPLOY_AWS.md](DEPLOY_AWS.md)**
for instance sizing, the security group rules, the user-data bootstrap script and the
update/teardown steps.

---

## 12. AI Tools Used

In accordance with hackathon guidelines:
- **Google Antigravity Agentic Assistant:** End-to-end fullstack architecture, React component synthesis, workflow state machine modeling, and documentation.
- **Claude Code (Anthropic):** Solution design review and the frontend redesign (design system, light and dark themes, motion, and all screens).
