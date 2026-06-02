# BUILD_PLAN.md - 48-Hour Splitwise MVP

## 1. Product Research
- **How I studied Splitwise:** Analyzed the core user journey from registration to debt settlement, focusing on how expenses are split and balances are calculated.
- **What I learned:** The core mechanic is a many-to-many relationship where users owe other users specific amounts for shared bills. Accurately tracking these sub-balances is the hardest part.
- **Workflows identified:** 
  - User Login (Dummy auth for MVP)
  - Group Creation & Membership
  - Adding an Expense (equal, custom, percentage)
  - Viewing Group Balances
  - Settling Up (recording cash transfers)
- **Product assumptions made:** We assume all expenses belong to a group. We assume a 2-day MVP can bypass JWT auth and use a simple dropdown login.

## 2. Architecture
- **Tech stack:** React (Frontend SPA), Python / FastAPI (Backend REST API & WebSockets), PostgreSQL (Database), SQLAlchemy (ORM).
- **Database schema:** 7 Tables (`users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`, `group_balances`). Operations wrapped in strict database transactions.
- **API design:** Backend is the single source of truth for math. Frontend sends the total and strategy; backend calculates splits.
- **Frontend structure:** React Router handling `/`, `/dashboard`, `/group/:id`, `/expense/:id`.
- **Deployment approach:** FastAPI on Render/Railway, React on Vercel/Netlify.

## 3. AI Collaboration Process
- **How I instructed the AI:** Set strict constraints to not jump into implementation and required a thorough interview process to build the foundational architecture first.
- **What questions the AI asked:** The AI asked about product scope, out-of-scope features, tech stack preferences, database strategies (dynamic vs cached), and JSON payload structures.
- **How I answered:** Provided a 6-phase roadmap, chose PostgreSQL/FastAPI/React, opted for a cached `group_balances` table with ACID transactions, and delegated math logic to the backend.
- **How the plan evolved:** We moved from a simple dynamic balance query to a more robust, production-grade cached balance system with a dedicated settlements table.
- **How AI_CONTEXT.md was maintained:** The AI actively updated it after every major architectural decision was locked in.

## 4. Tradeoffs
- **What I simplified:** Authentication is reduced to a "Dummy Auth" dropdown. We assume all expenses happen within groups.
- **What I hardcoded:** Seed users for the dummy login.
- **What I avoided:** Complex debt simplification algorithms (minimizing transactions), multi-currency support, receipt scanning.
- **What I would improve with more time:** Full JWT email/password authentication, push notifications, and advanced graph-based debt simplification.

---

## 5. Execution Roadmap (The 48-Hour Plan)

### Phase 1: Foundation & Scaffold (Hours 1-4)
1. **Initialize Repositories:** Set up Git repo, FastAPI backend, and React frontend.
2. **Database Provisioning:** Spin up PostgreSQL database.
3. **ORM Setup:** Configure SQLAlchemy. Define models.
4. **Migrations:** Generate and apply Alembic migrations.

### Phase 2: Core API & Dummy Auth (Hours 5-10)
1. **Users API:** Seed dummy users. Build `GET /users`.
2. **Frontend Auth:** Build `/` route to save `user_id` to `localStorage`.
3. **Groups API:** Build `POST /groups` and `POST /groups/{id}/members`.
4. **Groups UI:** Build `/dashboard` screen.

### Phase 3: The Expense Engine (Hours 11-22)
1. **Math Logic:** Write Python utilities to calculate exact splits.
2. **Expense API:** Build `POST /groups/{id}/expenses` with transactions and rollbacks.
3. **Expense UI:** Build `/group/:id` page and Add Expense modal.

### Phase 4: Balances & Settlements (Hours 23-32)
1. **Balances API:** Build `GET /groups/{id}/balances`.
2. **Settlements API:** Build `POST /groups/{id}/settlements`.
3. **Settlements UI:** Build Settle Up modal.

### Phase 5: Real-Time Chat (Hours 33-40)
1. **WebSocket Backend:** Build `/expenses/{id}/chat`.
2. **Chat UI:** Build `/expense/:id` and integrate WebSocket.

### Phase 6: Polish & Deployment (Hours 41-48)
1. **Documentation:** Finalize `README.md` and `AI_CONTEXT.md`.
2. **Deployment:** Deploy backend and frontend.
3. **E2E Testing:** Verify the happy path on live URLs.
