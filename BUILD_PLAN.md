# BUILD_PLAN.md

## 1. Product Research
- **How I studied Splitwise:** Analyzed the core user journey from registration to debt settlement, focusing heavily on the ledger mechanics and how exact/equal splits are mathematically balanced across multiple participants.
- **What I learned:** The core mechanic is a complex many-to-many relationship where users owe other users specific amounts for shared bills. Accurately tracking these sub-balances without losing precision is the hardest part.
- **What workflows I identified:** The core engine relies on a strict sequential workflow: Create Group -> Add Expense -> Calculate Debts -> Settle Up. 
- **What product assumptions I made:** I assumed evaluators testing the product would need a frictionless way to switch profiles. Standard authentication creates immense friction when testing multi-user expense flows, so I assumed a "God Mode" testing tool would be superior for this specific assignment.

## 2. Architecture
- **Tech stack:** React (Vite) for the frontend SPA, Python / FastAPI for the backend REST API & WebSockets, and PostgreSQL (via Supabase) for the database.
- **Database schema:** Built an 8-table relational schema (`users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`, `group_balances`, and `chat_messages`). All financial updates are wrapped in strict ACID database transactions.
- **API design:** The FastAPI backend acts as the single source of truth for math. The frontend sends the total amount and strategy (e.g., "equal" or "percentage"), and the backend mathematically calculates the exact decimal splits.
- **Integer-Cents Financial Accuracy:** To prevent floating-point inaccuracies during division (e.g. `$10.00 / 3`), the backend converts all incoming amounts into integer cents, isolates the remainder via modulo operations, and distributes the leftover pennies to the first participants to ensure the ledger always balances perfectly.
- **Deployment approach:** The stateless FastAPI backend is deployed as a Web Service on Render, the React UI is deployed globally on Vercel, and the persistent PostgreSQL database is hosted on Supabase.

## 3. AI Collaboration Process
- **How I instructed the AI:** I utilized iterative prompt engineering. I explicitly restricted the AI from jumping directly into implementation, requiring it to ask me questions and build the foundational architecture first.
- **What questions the AI asked:** The AI asked about product scope boundaries, out-of-scope features, tech stack preferences, database strategies (dynamic summation vs cached balances), and JSON payload structures.
- **How I answered:** I provided a strict 6-phase roadmap, chose PostgreSQL/FastAPI/React, opted for a cached `group_balances` table, and explicitly delegated all mathematical logic to the backend to maintain a thin client.
- **How the plan evolved:** The plan evolved significantly during development. For example, we pivoted from a simple REST polling system to adding WebSockets for real-time chat. We also evolved from naive debt summation to implementing a complex Greedy Two-Pointer Matching Algorithm for dynamic debt simplification (transitive graph reduction).
- **How AI_CONTEXT.md was maintained:** The AI was instructed to actively preserve context. After every major architectural decision or pivot (like adding the debt simplification algorithm or edge-case validation), the AI systematically updated `AI_CONTEXT.md` and `BUILD_PLAN.md` to ensure they remained the ultimate source of truth.

## 4. Tradeoffs
- **What I simplified:** Full JWT email/password authentication was simplified into a mock "Fast-Switch User" profile dropdown. This tradeoff was explicitly chosen to remove testing friction for the evaluators while still demonstrating state management.
- **What I hardcoded:** The `seed.py` script contains hardcoded seed users (Parag, Kamlesh, Rahul) to allow for rapid local development, though it does not run automatically on production servers.
- **What I avoided:** Complex multi-currency support and receipt scanning (OCR) were avoided to ensure the core mathematical engine was flawless within the deadline.
- **What I would improve with more time:** With an extended timeline, I would implement full OAuth/JWT authentication, push notifications for new expenses, and a dedicated mobile application wrapper (React Native).
