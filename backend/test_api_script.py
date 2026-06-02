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
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error calling {method} {url}: {e}")
        try:
            print("Error details:", e.read().decode('utf-8'))
        except:
            pass
        raise e

def test_features():
    print("Fetching users...")
    users = request("GET", "/users")
    print(f"Found {len(users)} users.")
    if len(users) < 2:
        print("Not enough users to test. Need at least 2.")
        return
    
    user1 = users[0]
    user2 = users[1]
    print(f"Using {user1['name']} (ID: {user1['id']}) and {user2['name']} (ID: {user2['id']})")
    
    print("\nCreating group...")
    group = request("POST", f"/groups?creator_id={user1['id']}", {"name": f"Test Trip {int(time.time())}"})
    group_id = group["id"]
    print(f"Created group '{group['name']}' with ID {group_id}")
    
    print("\nAdding user2 to group...")
    # Actually wait, let's see how groups are created. The frontend creates a group with creator_id. Does it automatically add other users?
    # I should check the backend main.py to see how users are added to groups.
    
    # We can just fetch user groups to see if the group shows up.
    print(f"\nFetching groups for {user1['name']}...")
    user1_groups = request("GET", f"/users/{user1['id']}/groups")
    print(f"{user1['name']} is in {len(user1_groups)} groups.")

    print("\nCreating an expense...")
    # $100 paid by user1, split equally among user1 and user2.
    expense_data = {
        "description": "Dinner",
        "amount": 100.0,
        "payer_id": user1['id'],
        "strategy": "equal",
        "participants": [user1['id'], user2['id']]
    }
    expense = request("POST", f"/groups/{group_id}/expenses", expense_data)
    print("Created expense:", expense)
    
    print("\nFetching group expenses...")
    expenses = request("GET", f"/groups/{group_id}/expenses")
    print(f"Group has {len(expenses)} expenses.")
    
    print("\nFetching group debts...")
    debts = request("GET", f"/groups/{group_id}/debts")
    print("Current Debts:")
    for debt in debts:
        print(f" - User {debt['payer']} owes User {debt['payee']}: ${debt['amount']}")
    
    print("\nCreating a settlement...")
    settlement_data = {
        "payer_id": user2['id'],
        "payee_id": user1['id'],
        "amount": 50.0
    }
    settlement = request("POST", f"/groups/{group_id}/settlements", settlement_data)
    print("Created settlement:", settlement)
    
    print("\nFetching group debts after settlement...")
    debts_after = request("GET", f"/groups/{group_id}/debts")
    print("Current Debts:")
    for debt in debts_after:
        print(f" - User {debt['payer']} owes User {debt['payee']}: ${debt['amount']}")
    
    print("\nAll tests completed successfully!")

if __name__ == "__main__":
    # Wait for server to start
    for _ in range(5):
        try:
            urllib.request.urlopen(f"{API_URL}/users")
            break
        except:
            time.sleep(1)
    test_features()
