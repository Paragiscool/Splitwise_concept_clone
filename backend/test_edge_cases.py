import urllib.request
import json
import time

API_URL = "http://localhost:8000"

def request(method, path, data=None):
    url = f"{API_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return 500, str(e)

def test_edges():
    print("Fetching users...")
    status, users = request("GET", "/users")
    if len(users) < 2:
        print("Need at least 2 users.")
        return
        
    user1 = users[0]
    user2 = users[1]
    
    print("\nCreating test group...")
    status, group = request("POST", f"/groups?creator_id={user1['id']}", {"name": f"Edge Test {int(time.time())}"})
    group_id = group["id"]
    
    # Add user 2
    request("POST", f"/groups/{group_id}/members", {"user_id": user2["id"]})
    
    print("\n1. Testing Zero Expense...")
    expense_zero = {
        "description": "Zero",
        "amount": 0.0,
        "payer_id": user1['id'],
        "strategy": "equal",
        "participants": [user1['id'], user2['id']]
    }
    status, res = request("POST", f"/groups/{group_id}/expenses", expense_zero)
    print(f"Status: {status}")
    print("Response:", res)
    assert status == 422, "Zero expense should be unprocessable!"
    
    print("\n2. Testing Negative Expense...")
    expense_neg = {
        "description": "Negative",
        "amount": -10.0,
        "payer_id": user1['id'],
        "strategy": "equal",
        "participants": [user1['id'], user2['id']]
    }
    status, res = request("POST", f"/groups/{group_id}/expenses", expense_neg)
    print(f"Status: {status}")
    print("Response:", res)
    assert status == 422, "Negative expense should be unprocessable!"
    
    print("\nCreating a valid $50 expense so there's debt (user2 owes user1 $25)...")
    expense_valid = {
        "description": "Valid",
        "amount": 50.0,
        "payer_id": user1['id'],
        "strategy": "equal",
        "participants": [user1['id'], user2['id']]
    }
    status, res = request("POST", f"/groups/{group_id}/expenses", expense_valid)
    assert status == 200, "Failed to create valid expense"
    
    print("\n3. Testing Self-Settlement...")
    settlement_self = {
        "payer_id": user2['id'],
        "payee_id": user2['id'],
        "amount": 10.0
    }
    status, res = request("POST", f"/groups/{group_id}/settlements", settlement_self)
    print(f"Status: {status}")
    print("Response:", res)
    assert status == 400, "Self-settlement should be blocked!"
    
    print("\n4. Testing Over-Settlement (paying $30 when debt is $25)...")
    settlement_over = {
        "payer_id": user2['id'],
        "payee_id": user1['id'],
        "amount": 30.0
    }
    status, res = request("POST", f"/groups/{group_id}/settlements", settlement_over)
    print(f"Status: {status}")
    print("Response:", res)
    assert status == 400, "Over-settlement should be blocked!"
    
    print("\n5. Testing Exact Settlement (paying $25)...")
    settlement_exact = {
        "payer_id": user2['id'],
        "payee_id": user1['id'],
        "amount": 25.0
    }
    status, res = request("POST", f"/groups/{group_id}/settlements", settlement_exact)
    print(f"Status: {status}")
    print("Response:", res)
    assert status == 200, "Exact settlement should succeed!"
    
    print("\nAll edge cases tested successfully!")

if __name__ == "__main__":
    for _ in range(5):
        try:
            urllib.request.urlopen(f"{API_URL}/users")
            break
        except:
            time.sleep(1)
    test_edges()
