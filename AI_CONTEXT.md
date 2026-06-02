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
* **Authentication Scope:** We are utilizing a "Dummy Auth" system (Option A) to maximize our 2-day timeline. Users will select their profile from a dropdown, and the `user_id` will be stored in `localStorage` to simulate a session.
* **Frontend Routing (React SPA):**
  * `/` -> **Login Screen** (Dummy Auth selection)
  * `/dashboard` -> **Groups List** (User's active groups)
  * `/group/:id` -> **Group Details** (Expense feed, group balances, and modals for Add Expense / Settle Up)
  * `/expense/:id` -> **Expense Details & Chat** (Exact split breakdown and real-time WebSocket chat)

## Deployment Plan
(Pending)

## Testing Plan
(Pending)

## Trade-offs
(Pending)

## Prompts and AI Responses
- **Initial Discussion**: AI requested to act as a junior engineer and start the interview process. User provided a 6-step roadmap and suggested tech stack options.
- **Tech Stack & DB Design**: User confirmed React, FastAPI, and PostgreSQL. User outlined a 5-table schema to handle the many-to-many relationship of expenses and participants. AI updated the context and asked the user to finalize the balance calculation strategy.

## Changes made during implementation
- N/A (Planning phase)

## Known Limitations
- N/A (Planning phase)
