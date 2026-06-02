# AI_CONTEXT.md

This document serves as the source of truth for the entire project, updating continuously as requirements and implementations evolve.

## Product Understanding
- Building a simplified Splitwise-inspired application in a 2-day timeframe.
- The app must include a login module, group management (invite, add, remove users), expense creation (split equally, unequally, by percentage, by share), real-time user chat within expenses, balance summaries (group-wise and individual), and settlement/debt recording.

## Product Scope
The development follows a strict 6-phase roadmap prioritizing foundational architecture:
1. **System Design & Architecture**: Tech stack, database schema, math logic for splits.
2. **Project Setup & Authentication**: Repository scaffolding, DB connection, secure login.
3. **Groups & Memberships**: Creating groups and managing user memberships.
4. **The Expense Engine**: Recording paid amounts and splitting them among group members.
5. **Balances & Settlements**: Algorithms for net balances ("who owes whom") and recording payments.
6. **Polish & Deployment**: Expense chat, final README, public deployment.

## Implementation Decisions
- Prioritizing ruthless serialization of tasks (foundation first).
- Decided to use a Python-based backend to easily handle complex list/dictionary math for splitting algorithms.

## Engineering Requirements
- Use relational databases only.
- Final deployed application must be reproducible solely from this AI_CONTEXT.md.

## API & Tech Stack
* **Frontend:** React (SPA, state-driven UI)
* **Backend:** Python / FastAPI (Asynchronous REST API, automatic OpenAPI documentation)
* **Database:** PostgreSQL (Relational database ensuring strict data integrity)
* **ORM / Database Layer:** SQLAlchemy (used strictly for transaction management and rollbacks)
* **Real-time Engine:** WebSockets (via FastAPI) for real-time expense chat

## Data Model & Schema (Relational DB)
* **Tables:** `users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`, `group_balances`.
* **Balances Strategy (Cached Table):** We will maintain a `group_balances` table. Reads will be instantaneous.
* **Settlements Strategy (Separate Table):** We will use a dedicated `settlements` table to track cash transfers between users, keeping the `expenses` table strictly for actual bills.
* **Engineering Requirement - Data Integrity:** To prevent synchronization bugs between `expenses`/`settlements` and the `group_balances` cache, all create/update/delete operations will be wrapped in strict **Database Transactions**. If any part of the ledger update fails, the entire operation will `ROLLBACK` to maintain ACID compliance.

## API Design & Logic Delegation
* **Logic Delegation (Approach B):** The FastAPI backend is the single source of truth for all math and business logic. The React frontend will send the total amount, the involved user IDs, and the split strategy (e.g., "equal", "percentage").
* **Backend Responsibility:** Python will calculate the exact decimal splits, validate the math, execute the database transaction to `expenses` and `expense_splits`, and update the `group_balances` cache. 
* **Payload Structure:** 
  * Default: `{ "total": 100.00, "payer_id": 1, "strategy": "equal", "participants": [1, 2, 3] }`
  * Custom: `{ "total": 100.00, "payer_id": 1, "strategy": "custom", "exact_splits": [{"user_id": 1, "amount": 40}, {"user_id": 2, "amount": 60}] }`
* **Core Endpoints:**
  * `POST /groups/`, `POST /groups/{id}/members`, `GET /groups/{id}/`
  * `POST /groups/{id}/expenses/`, `GET /groups/{id}/expenses/`
  * `POST /groups/{id}/settlements/`

2. **Database Provisioning**: For the initial 2-day sprint, we are using a local SQLite file (`splitwise.db`) for rapid iteration and zero-configuration setup. For Phase 6 (Deployment), we will provision a free serverless PostgreSQL database via **Supabase** and inject its connection string into SQLAlchemy via environment variables.

## 7. Real-Time Chat Engine (Phase 5)
* **Architecture:** Hybrid approach using both REST and WebSockets.
* **Database Updates:** Added `chat_messages` table to persist all conversation history tied to specific `expense_id`s.
* **Backend Protocol:** 
  * `GET /expenses/{id}/chat` retrieves historical messages.
  * `WebSocket /ws/expenses/{id}` establishes a persistent two-way connection. FastAPI uses a `ConnectionManager` to broadcast messages to all connected clients in a specific expense room.
* **Frontend Protocol:** React fetches history on mount, establishes the WS connection, and appends incoming broadcast messages to the UI state array.

## Authentication & Frontend Routing
* **Authentication Scope:** We are utilizing a "Fast-Switch User" system (God Mode) to maximize our 2-day timeline and make evaluator testing frictionless. Users can select any profile from a global navigation dropdown, instantly masquerading as that user without logging out.
* **Frontend Routing (React SPA):**
  * `/` -> **Login Screen** (Initial Profile selection)
  * `/dashboard` -> **Groups List** (User's active groups)
  * `/group/:id` -> **Group Details** (Expense feed, group balances, specific group members list, + Invite Member UI, and modals for Add Expense / Settle Up)
  * `/expense/:id` -> **Expense Details & Chat** (Exact split breakdown and real-time WebSocket chat)

## Deployment Plan
- **Database:** Supabase (Serverless PostgreSQL). We rely on Supabase to host our relational database. The connection string is provided via environment variables.
- **Backend:** Render (Web Service). The FastAPI backend is deployed on Render, utilizing Gunicorn with Uvicorn workers for asynchronous capability and WebSocket support.
- **Frontend:** Vercel. The Vite/React application is deployed as a static site on Vercel. The `VITE_API_URL` environment variable points to the Render backend URL.

## Testing Plan
- **Edge Cases Tested & Validated:**
  - *Mathematical Precision:* Handled integer cent conversion and modulo remainders correctly in `utils.py` to prevent "penny leaks".
  - *Negative/Zero Boundaries:* Pydantic schemas enforce `Field(gt=0)` to reject invalid expense and settlement amounts (returns 422).
  - *Self-Settlements:* Backend rejects settlements where `payer_id == payee_id` (returns 400).
  - *Over-Settlements:* Backend computes simplified debts dynamically at runtime and blocks users from settling an amount greater than what they owe (returns 400).
  - *Dirty Deletions:* Backend `DELETE /groups/{id}/members/{user_id}` route checks if the user has an active, non-zero `GroupBalance`. If so, deletion is blocked to prevent orphaned debts.

## Trade-offs
- **Authentication (Mock Auth):** To meet the 2-day MVP requirement and reduce testing friction, we bypassed full JWT/OAuth flows. Instead, we built a "Fast-Switch User" global dropdown that allows instant switching between user profiles.
- **Global User List:** Anyone can currently add anyone to a group. In a real app, there would be a friendship request system.
- **Group-centric Expenses:** All expenses must be tied to a group. 1-on-1 expenses require creating a 2-person group. This vastly simplifies the schema.

## Prompts and AI Responses
- **Initial Discussion**: AI acted as a junior engineer and started the interview process. User provided a 6-step roadmap and suggested tech stack options.
- **Tech Stack & DB Design**: Confirmed React, FastAPI, and PostgreSQL. Decided on a 7-table schema to handle the many-to-many relationship of expenses and participants.
- **Edge Case Optimization Prompt**: User asked to fix mathematical edge cases (penny rounding), graph cycles, and malicious input (self-settlements/over-settlements). AI updated schemas, added strict validations in `main.py`, and verified them with an integration test script.

## Changes made during implementation
- **Debt Simplification Pivot:** Initially planned to just sum up debts naively, but built a full **Greedy Two-Pointer Algorithm** in `utils.py` to simplify debts (transitive reduction).
- **Group Member Deletion Constraint:** Added strict business logic to block user removal if their balance is non-zero, returning a 400 error.
- **UI Bug Fixes:** Fixed a bug where the UI fetched global users instead of specific group members. Added an "+ Invite" dropdown to dynamically invite external users into the group.
- **WebSockets:** Upgraded from pure REST to hybrid WebSockets for real-time chat in the `ExpenseDetails` view.

## Known Limitations
- No multi-currency support.
- No receipt scanning or OCR.
- Mock authentication means no real security against impersonation in this MVP state.
