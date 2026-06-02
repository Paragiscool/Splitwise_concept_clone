from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class GroupCreate(BaseModel):
    name: str

class GroupResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class GroupMemberCreate(BaseModel):
    user_id: int

class ExpenseSplitResponse(BaseModel):
    user_id: int
    amount_owed: float
    class Config:
        from_attributes = True

class ExpenseResponse(BaseModel):
    id: int
    group_id: int
    payer_id: int
    description: str
    amount: float
    created_at: datetime
    splits: List[ExpenseSplitResponse] = []
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    description: str
    amount: float = Field(..., gt=0)
    payer_id: int
    strategy: str # "equal", "percentage", "custom"
    participants: List[int]
    percentages: Optional[Dict[str, float]] = None
    exact_splits: Optional[Dict[str, float]] = None

class SettlementCreate(BaseModel):
    payer_id: int
    payee_id: int
    amount: float = Field(..., gt=0)

class DebtInstruction(BaseModel):
    payer: int
    payee: int
    amount: float

class GroupResponseWithBalance(GroupResponse):
    net_balance: float = 0.0

class ChatMessageResponse(BaseModel):
    id: int
    expense_id: int
    user_id: int
    content: str
    created_at: datetime
    class Config:
        from_attributes = True
