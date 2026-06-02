# Splitwise Clone API & React Frontend

A production-grade, full-stack expense sharing application built during a 2-day sprint. This project demonstrates advanced architectural patterns, strict financial integrity, and real-time bidirectional communication.

## 🚀 Tech Stack

*   **Frontend:** React (Vite, SPA, State-driven UI)
*   **Backend:** Python / FastAPI (Asynchronous REST API, WebSockets)
*   **Database:** PostgreSQL / SQLite (Via SQLAlchemy ORM & Alembic)

## 🏗️ Architectural Decisions & Tradeoffs

This project was built with a strict focus on enterprise-grade engineering principles over rapid prototyping shortcuts.

### 1. Financial Precision: The "Penny Problem"
Floating-point mathematics in software inherently leads to decimal inaccuracies (e.g., `$10.00 / 3 = $3.333333...`). 
*   **The Solution:** The backend calculation engine converts all incoming amounts into **integer cents** before any division occurs. 
*   **The Array Fix:** Any remainder from division (the "extra pennies") is isolated via modulo operations and gracefully distributed to the first participants in the expense array, ensuring the ledger always balances perfectly to the exact cent.

### 2. ACID Transactions & Ledger Cache
Rather than dynamically summing thousands of individual expense splits every time a user views their dashboard, the application utilizes a **Balance Cache Table** (`group_balances`).
*   **Transaction Safety:** When a new expense or cash settlement is posted, FastAPI uses strict SQLAlchemy `db.commit()` and `db.rollback()` transaction blocks. The system writes the raw expense, the individual splits, and updates the group cache table simultaneously. If any step fails, the entire transaction is rolled back, preventing orphaned data or financial corruption.

### 3. Debt Simplification (Greedy Matching Algorithm)
If User A owes B $20, and B owes C $20, executing two cash transfers is highly inefficient. 
*   **The Solution:** The backend extracts everyone's net balances into a directed graph and runs a greedy two-pointer matching algorithm. It pairs the largest debtors with the largest creditors, collapsing the debt graph and returning the absolute minimum number of cash transfers required to zero-out the entire group.

### 4. Hybrid Chat Architecture
To support discussion on individual expenses, the application uses a hybrid approach:
*   **REST (History):** On mount, React executes a `GET /expenses/{id}/chat` request to load historical messages from the database.
*   **FastAPI WebSockets (Real-time):** React then establishes a persistent WebSocket connection to a `ConnectionManager` room. The backend saves new messages to the DB (ensuring persistence) and instantly broadcasts them down the open socket to all active clients, providing a live, typing-indicator-ready experience.

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# Run Alembic migrations to setup the SQLite DB
alembic upgrade head

# Seed the database with test users
python seed.py

# Start the FastAPI Server
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Start the Vite React Server
npm run dev
```

## 🌍 Deployment Strategy (Free Tier)

This application is designed to be easily deployed on zero-cost infrastructure:

1.  **Database (Supabase / Neon):** Provision a free serverless PostgreSQL database. Take the connection string and paste it into the backend's `DATABASE_URL` environment variable. SQLAlchemy will automatically adapt from SQLite to Postgres.
2.  **Backend (Render):** Deploy the FastAPI `backend/` folder as a Web Service.
3.  **Frontend (Vercel):** Connect your GitHub repository to Vercel, set the Root Directory to `frontend/`, and add the `VITE_API_URL` pointing to your deployed Render URL.
