from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, utils
from database import engine, get_db

app = FastAPI(title="Splitwise Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, expense_id: int):
        await websocket.accept()
        if expense_id not in self.active_connections:
            self.active_connections[expense_id] = []
        self.active_connections[expense_id].append(websocket)

    def disconnect(self, websocket: WebSocket, expense_id: int):
        if expense_id in self.active_connections:
            if websocket in self.active_connections[expense_id]:
                self.active_connections[expense_id].remove(websocket)

    async def broadcast(self, message: str, expense_id: int):
        if expense_id in self.active_connections:
            for connection in self.active_connections[expense_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "Splitwise Clone API is running"}

@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.post("/groups", response_model=schemas.GroupResponse)
def create_group(group: schemas.GroupCreate, creator_id: int, db: Session = Depends(get_db)):
    db_group = models.Group(name=group.name)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Automatically add creator
    db_member = models.GroupMember(group_id=db_group.id, user_id=creator_id)
    db.add(db_member)
    db.commit()
    
    return db_group

@app.post("/groups/{group_id}/members")
def add_group_member(group_id: int, member: schemas.GroupMemberCreate, db: Session = Depends(get_db)):
    existing = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id, 
        models.GroupMember.user_id == member.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already in group")
        
    db_member = models.GroupMember(group_id=group_id, user_id=member.user_id)
    db.add(db_member)
    db.commit()
    return {"message": "Member added successfully"}

@app.get("/users/{user_id}/groups", response_model=List[schemas.GroupResponseWithBalance])
def get_user_groups(user_id: int, db: Session = Depends(get_db)):
    memberships = db.query(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()
    groups_with_balance = []
    for m in memberships:
        gb = db.query(models.GroupBalance).filter(
            models.GroupBalance.group_id == m.group_id,
            models.GroupBalance.user_id == user_id
        ).first()
        bal = gb.balance if gb else 0.0
        
        groups_with_balance.append({
            "id": m.group.id,
            "name": m.group.name,
            "created_at": m.group.created_at,
            "net_balance": bal
        })
    return groups_with_balance

@app.post("/groups/{group_id}/expenses", response_model=schemas.ExpenseResponse)
def create_expense(group_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    # 1. Create the Expense record
    db_expense = models.Expense(
        group_id=group_id,
        payer_id=expense.payer_id,
        description=expense.description,
        amount=expense.amount
    )
    db.add(db_expense)
    db.flush() # Get the expense ID without committing
    
    try:
        # 2. Calculate exact splits
        calculated_splits = utils.calculate_splits(
            total_amount=expense.amount,
            users=expense.participants,
            strategy=expense.strategy,
            percentages=expense.percentages,
            exact_splits=expense.exact_splits
        )
        
        # 3. Create ExpenseSplit rows & 4. Update GroupBalances
        for user_id, amount_owed in calculated_splits.items():
            # Create split
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=user_id,
                amount_owed=amount_owed
            )
            db.add(db_split)
            
            # Update debtor's balance (they owe money, so balance goes down)
            if amount_owed > 0:
                debtor_balance = db.query(models.GroupBalance).filter(
                    models.GroupBalance.group_id == group_id,
                    models.GroupBalance.user_id == user_id
                ).first()
                if not debtor_balance:
                    debtor_balance = models.GroupBalance(group_id=group_id, user_id=user_id, balance=0.0)
                    db.add(debtor_balance)
                debtor_balance.balance -= amount_owed
        
        # Update payer's balance (they paid the bill, so balance goes up by total amount)
        payer_balance = db.query(models.GroupBalance).filter(
            models.GroupBalance.group_id == group_id,
            models.GroupBalance.user_id == expense.payer_id
        ).first()
        if not payer_balance:
            payer_balance = models.GroupBalance(group_id=group_id, user_id=expense.payer_id, balance=0.0)
            db.add(payer_balance)
        payer_balance.balance += expense.amount
        
        # 5. Commit the transaction
        db.commit()
        db.refresh(db_expense)
        return db_expense
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/groups/{group_id}/expenses", response_model=List[schemas.ExpenseResponse])
def get_group_expenses(group_id: int, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.created_at.desc()).all()
    return expenses

@app.post("/groups/{group_id}/settlements")
def create_settlement(group_id: int, settlement: schemas.SettlementCreate, db: Session = Depends(get_db)):
    db_settlement = models.Settlement(
        group_id=group_id,
        payer_id=settlement.payer_id,
        payee_id=settlement.payee_id,
        amount=settlement.amount
    )
    db.add(db_settlement)
    
    payer_balance = db.query(models.GroupBalance).filter(
        models.GroupBalance.group_id == group_id,
        models.GroupBalance.user_id == settlement.payer_id
    ).first()
    if not payer_balance:
        payer_balance = models.GroupBalance(group_id=group_id, user_id=settlement.payer_id, balance=0.0)
        db.add(payer_balance)
    payer_balance.balance += settlement.amount
    
    payee_balance = db.query(models.GroupBalance).filter(
        models.GroupBalance.group_id == group_id,
        models.GroupBalance.user_id == settlement.payee_id
    ).first()
    if not payee_balance:
        payee_balance = models.GroupBalance(group_id=group_id, user_id=settlement.payee_id, balance=0.0)
        db.add(payee_balance)
    payee_balance.balance -= settlement.amount
    
    db.commit()
    return {"message": "Settlement recorded successfully"}

@app.get("/groups/{group_id}/debts", response_model=List[schemas.DebtInstruction])
def get_group_debts(group_id: int, db: Session = Depends(get_db)):
    balances = db.query(models.GroupBalance).filter(models.GroupBalance.group_id == group_id).all()
    balance_dict = {b.user_id: b.balance for b in balances}
    transactions = utils.simplify_debts(balance_dict)
    return transactions

@app.get("/expenses/{expense_id}/chat", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(expense_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.expense_id == expense_id).order_by(models.ChatMessage.created_at.asc()).all()
    return messages

@app.websocket("/ws/expenses/{expense_id}")
async def websocket_endpoint(websocket: WebSocket, expense_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, expense_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            chat_msg = models.ChatMessage(
                expense_id=expense_id,
                user_id=payload["user_id"],
                content=payload["content"]
            )
            db.add(chat_msg)
            db.commit()
            db.refresh(chat_msg)
            
            response_data = {
                "id": chat_msg.id,
                "expense_id": chat_msg.expense_id,
                "user_id": chat_msg.user_id,
                "content": chat_msg.content,
                "created_at": chat_msg.created_at.isoformat()
            }
            await manager.broadcast(json.dumps(response_data), expense_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, expense_id)
