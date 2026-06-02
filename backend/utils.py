def calculate_splits(total_amount: float, users: list, strategy: str, percentages: dict = None, exact_splits: dict = None) -> dict:
    """
    Calculates exact splits ensuring the sum equals the total amount.
    Returns a dictionary mapping user_id to their exact owed amount.
    """
    total_cents = int(round(total_amount * 100))
    splits_in_cents = {}
    
    if strategy == "equal":
        num_users = len(users)
        if num_users == 0:
            raise ValueError("Group has no members to split with.")
        base_cent_split = total_cents // num_users
        remainder = total_cents % num_users
        
        for i, user_id in enumerate(users):
            if i == 0:
                splits_in_cents[user_id] = base_cent_split + remainder
            else:
                splits_in_cents[user_id] = base_cent_split
                
    elif strategy == "percentage":
        if not percentages:
            raise ValueError("percentages dict required for percentage strategy")
        allocated_cents = 0
        for i, user_id in enumerate(users):
            if i == len(users) - 1:
                splits_in_cents[user_id] = total_cents - allocated_cents
            else:
                # Need to handle string or int keys gracefully
                pct = percentages.get(str(user_id), percentages.get(user_id, 0))
                user_share = int(round(total_cents * (pct / 100.0)))
                splits_in_cents[user_id] = user_share
                allocated_cents += user_share
                
    elif strategy == "custom":
        if not exact_splits:
            raise ValueError("exact_splits dict required for custom strategy")
        for user_id in users:
            val = exact_splits.get(str(user_id), exact_splits.get(user_id, 0))
            splits_in_cents[user_id] = int(round(val * 100))
            
    return {user_id: cents / 100.0 for user_id, cents in splits_in_cents.items()}

def simplify_debts(balances: dict) -> list:
    """
    Takes a dictionary of user_id -> net_balance.
    Returns a list of dicts: [{"payer": user_id, "payee": user_id, "amount": float}]
    """
    debtors = []
    creditors = []
    
    for user_id, balance in balances.items():
        cents = int(round(balance * 100))
        if cents < 0:
            debtors.append([user_id, -cents])
        elif cents > 0:
            creditors.append([user_id, cents])
            
    debtors.sort(key=lambda x: x[1], reverse=True)
    creditors.sort(key=lambda x: x[1], reverse=True)
    
    transactions = []
    i = 0
    j = 0
    
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_amount = debtors[i]
        creditor_id, credit_amount = creditors[j]
        
        transfer = min(debt_amount, credit_amount)
        
        transactions.append({
            "payer": debtor_id,
            "payee": creditor_id,
            "amount": transfer / 100.0
        })
        
        debtors[i][1] -= transfer
        creditors[j][1] -= transfer
        
        if debtors[i][1] == 0:
            i += 1
        if creditors[j][1] == 0:
            j += 1
            
    return transactions
