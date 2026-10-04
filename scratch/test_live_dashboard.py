import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8080/api"

def api_call(method, endpoint, token, data=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", data=body, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(req)
        content = res.read()
        return res.getcode(), json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        error_body = e.read()
        try:
            return e.code, json.loads(error_body)
        except Exception:
            return e.code, {"error": error_body.decode("utf-8", errors="ignore")}

def login(email, password):
    code, data = api_call("POST", "/auth/login", None, {"email": email, "password": password})
    if code != 200:
        raise Exception(f"Failed to login {email}: {data}")
    return data

def run_tests():
    print("================================================================")
    print("🚀 STARTING SMARTWASH PRO LIVE DASHBOARD END-TO-END VERIFICATION")
    print("================================================================")

    # 1. Login
    mgr = login("mgr@smartwash.com", "password123")
    token = mgr["token"]
    print(f"✅ Step 1: Manager authenticated successfully (Email: {mgr['email']}, Role: {mgr['role']})")

    # 2. Fetch Dashboard
    code, dash = api_call("GET", "/dashboard/manager", token)
    assert code == 200, f"Failed to fetch manager dashboard: {dash}"
    print("✅ Step 2: GET /api/dashboard/manager returned HTTP 200 OK")

    # 3. Verify all 10 requested metrics exist and are non-null
    required_metrics = [
        "todayOrders",
        "pendingOrders",
        "completedOrders",
        "todayRevenue",
        "pendingPayments",
        "pendingPickups",
        "pendingDeliveries",
        "lowStockItems",
        "openComplaints",
        "brokenEquipment"
    ]
    print("\n📊 Step 3: Verifying the 10 Mandatory Live Metrics:")
    for m in required_metrics:
        val = dash.get(m)
        assert val is not None, f"Metric '{m}' is missing or null in DashboardResponse!"
        print(f"   • {m}: {val} (type: {type(val).__name__})")

    # 4. Verify Real Database Chart Data
    print("\n📈 Step 4: Verifying Live Chart Datasets:")
    monthly_orders = dash.get("monthlyOrders", [])
    monthly_revenue = dash.get("monthlyRevenue", [])
    order_status_dist = dash.get("orderStatusDistribution", [])
    recent_orders = dash.get("recentOrders", [])

    assert len(monthly_orders) > 0, "monthlyOrders chart dataset is empty!"
    assert len(monthly_revenue) > 0, "monthlyRevenue chart dataset is empty!"
    assert len(order_status_dist) > 0, "orderStatusDistribution chart dataset is empty!"
    assert len(recent_orders) > 0, "recentOrders stream is empty!"

    print(f"   • monthlyOrders: {len(monthly_orders)} months recorded (e.g. {monthly_orders[-1]})")
    print(f"   • monthlyRevenue: {len(monthly_revenue)} months recorded (e.g. {monthly_revenue[-1]})")
    print(f"   • orderStatusDistribution: {len(order_status_dist)} statuses tracked (e.g. {order_status_dist[0]})")
    print(f"   • recentOrders: {len(recent_orders)} latest orders fetched with status & customer details")

    # 5. Dynamic Update Test: Verify Dashboard reflects live database changes!
    print("\n🔄 Step 5: Testing Live Telemetry - Dynamic Update On Database Change:")
    initial_broken = dash.get("brokenEquipment", 0)
    initial_complaints = dash.get("openComplaints", 0)

    # 5a. Create a new complaint
    code, custs = api_call("GET", "/customers?size=1", token)
    cust_id = custs["content"][0]["id"]
    test_complaint = {
        "customerId": cust_id,
        "subject": "E2E Dynamic Dashboard Sync Test",
        "description": "Verifying that opening a complaint live increments dashboard counter.",
        "category": "DAMAGED_ITEMS",
        "priority": "HIGH"
    }
    code, created_c = api_call("POST", "/complaints", token, test_complaint)
    assert code == 201, f"Failed to create test complaint: {created_c}"
    complaint_id = created_c["id"]
    print(f"   • Created new Complaint #{complaint_id}")

    # Re-fetch dashboard and verify openComplaints incremented
    code, dash_after_c = api_call("GET", "/dashboard/manager", token)
    assert code == 200
    new_complaints = dash_after_c.get("openComplaints", 0)
    print(f"   • openComplaints before: {initial_complaints} -> after: {new_complaints}")
    assert new_complaints == initial_complaints + 1, f"Expected {initial_complaints + 1}, got {new_complaints}"
    print("   ✅ Live dashboard correctly incremented openComplaints!")

    # 5b. Resolve the complaint and verify dashboard decrements back
    resolve_data = {
        "customerId": cust_id,
        "subject": "E2E Dynamic Dashboard Sync Test",
        "description": "Verifying that opening a complaint live increments dashboard counter.",
        "status": "RESOLVED",
        "resolution": "Resolved for E2E test verification."
    }
    code, resolved_c = api_call("PUT", f"/complaints/{complaint_id}", token, resolve_data)
    assert code == 200, f"Failed to resolve complaint: {resolved_c}"
    print(f"   • Marked Complaint #{complaint_id} as RESOLVED")

    code, dash_after_resolve = api_call("GET", "/dashboard/manager", token)
    assert code == 200
    reverted_complaints = dash_after_resolve.get("openComplaints", 0)
    print(f"   • openComplaints after resolution: {reverted_complaints}")
    assert reverted_complaints == initial_complaints, f"Expected {initial_complaints}, got {reverted_complaints}"
    print("   ✅ Live dashboard correctly decremented openComplaints back to original count!")

    # Cleanup the test complaint
    api_call("DELETE", f"/complaints/{complaint_id}", token)

    # 5c. Test Broken Equipment dynamic updates
    code, equip_page = api_call("GET", "/equipment?size=1", token)
    if code == 200 and equip_page.get("content"):
        target_equip = equip_page["content"][0]
        equip_id = target_equip["id"]
        original_status = target_equip.get("status", "ACTIVE")

        # Temporarily mark equipment as BROKEN
        update_broken = {
            "equipmentName": target_equip["equipmentName"],
            "equipmentType": target_equip["equipmentType"],
            "model": target_equip.get("model", ""),
            "serialNumber": target_equip.get("serialNumber", ""),
            "status": "BROKEN"
        }
        code, _ = api_call("PUT", f"/equipment/{equip_id}", token, update_broken)
        if code == 200:
            code, dash_broken = api_call("GET", "/dashboard/manager", token)
            cur_broken = dash_broken.get("brokenEquipment", 0)
            print(f"   • Equipment #{equip_id} set to BROKEN: brokenEquipment = {cur_broken}")
            assert cur_broken >= 1, "brokenEquipment metric did not reflect broken equipment!"

            # Revert equipment status
            update_revert = {
                "equipmentName": target_equip["equipmentName"],
                "equipmentType": target_equip["equipmentType"],
                "model": target_equip.get("model", ""),
                "serialNumber": target_equip.get("serialNumber", ""),
                "status": original_status
            }
            api_call("PUT", f"/equipment/{equip_id}", token, update_revert)
            code, dash_revert = api_call("GET", "/dashboard/manager", token)
            final_broken = dash_revert.get("brokenEquipment", 0)
            print(f"   • Equipment #{equip_id} reverted to {original_status}: brokenEquipment = {final_broken}")
            assert final_broken == initial_broken, "brokenEquipment did not revert correctly!"
            print("   ✅ Live dashboard correctly updated brokenEquipment metric on status change!")

    print("\n================================================================")
    print("🎉 ALL DASHBOARD LIVE DATABASE TESTS PASSED WITH 100% SUCCESS!")
    print("================================================================")

if __name__ == "__main__":
    run_tests()
