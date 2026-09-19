# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Seller (original traveller):** someone in India who booked an intercity bus seat (often an overnight sleeper) and can no longer travel, usually close to departure, when the operator's cancellation charge is high or the full fare.
- **Buyer:** a traveller searching the same route and date who finds it sold out and needs a seat now.
- **Operator:** the bus company's operations staff, who approve or reject the transfer and own the passenger manifest.
- **Evaluators:** hackathon judges (First Commit, WeMakeDevs x AWS, Sept 2026) who watch a 3 minute demo video and review the repo. *(Inferred from the project brief.)*

## Product Purpose

SeatRelay lets a traveller release a seat they cannot use. A buyer on the same route claims it at exactly the original fare, the operator reissues the ticket in the buyer's name and cancels the old one, and the seller is refunded only once the seat has actually sold. Success: the seller recovers money they would have lost, the buyer travels, and the manifest matches who is on board.

## Positioning

The transfer happens at the operator, not between strangers. Only the operator can cancel the old ticket and issue a new one in the buyer's name, which is what makes boarding with ID possible and what an open resale forum cannot copy.

## Operating Context

- Seller flow: My tickets, release seat, see refund preview, withdraw while listed.
- Buyer flow: search route and date, see sold-out coaches with released seats, enter passenger name, age, gender, phone and government ID, pay (mock), wait for operator approval, receive a QR boarding pass.
- Operator flow: queue of pending reissues comparing original and new passenger, approve or reject with reason, history of processed reissues.
- A public ledger of resale transactions.
- An automated end-to-end demo runner and demo reset exist for recording.

## Capabilities and Constraints

- Frontend: React 18, Vite, Tailwind 3. Backend: Express with SQLite, JWT auth, mock payments and a simulated operator system. These backend contracts must not change in a UI-only redesign.
- Demo personas: Rahul Sharma (seller, ticket SB-92831, seat U12, fare 850 rupees), Priya Kumar (buyer), SwiftBus Operations (operator). Demo route Bangalore to Chennai, 19 Sep 2026.
- Operator console is restricted to the operator role.
- Government ID is masked on public records and hidden from the seller.
- The AWS architecture (Step Functions, DynamoDB, EventBridge, Cognito, SNS, S3, Amplify) is the target design described in the app; the current backend is Express and SQLite. *(Observed in repo.)*

## Brand Commitments

- Name: SeatRelay. Existing logo mark (bus with relay arrows) in `frontend/src/components/Logo.tsx` and `frontend/public/logo.svg`.
- Face value only: the buyer never pays more than the original fare.
- User's brief for the redesign: premium, luxury, travel oriented, the polish of large company business applications, light and dark modes with a dramatic light switch style transition, rich motion. *(Stated by user, 2026-09-19.)*

## Evidence on Hand

- Real: the working flows above, seeded demo data, the Indian Railways family ticket transfer rule as precedent (see SOLUTION.md sources).
- Absent, must not be fabricated: customer counts, testimonials, partner operators, usage statistics, uptime or latency figures, press.

## Product Principles

1. The name on the ticket is the product. Every screen should make clear whose name is on the seat.
2. Exact fare, always. Never show or imply a markup.
3. Nobody is worse off than today. Failure paths return money automatically.
4. Honest about what is simulated.

## Accessibility & Inclusion

Respect reduced motion. Readable contrast in both themes. Works on phones, since most bus tickets in India are booked on mobile. *(Inferred.)*
