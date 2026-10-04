import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8080/api"

def api_call(method, endpoint, token, data=None):
    headers = {"Authorization": f"Bearer {token}"}
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
    print("=== STARTING MANAGER COMPLAINT & FEEDBACK E2E VERIFICATION ===")

    # 1. Manager Authentication
    mgr_auth = login("mgr@smartwash.com", "password123")
    mgr_token = mgr_auth["token"]
    print(f"✅ 1. Authenticated as Branch Manager ({mgr_auth.get('email')}, Role: {mgr_auth.get('role')})")

    # Fetch an existing customer
    code, customers = api_call("GET", "/customers?size=5", mgr_token)
    assert code == 200 and len(customers.get("content", [])) > 0, "Failed to load customers"
    test_cust = customers["content"][0]
    cust_id = test_cust["id"]
    cust_name = test_cust["fullName"]
    print(f"✅ 2. Retrieved Customer for test: ID={cust_id} ({cust_name})")

    # 2. Manager Add Complaint linked to customer
    complaint_payload = {
        "customerId": cust_id,
        "category": "DAMAGED_ITEMS",
        "priority": "HIGH",
        "subject": "Manager Reported: Delicate silk tear",
        "description": "Customer called branch stating silk shirt had a small seam tear during press."
    }
    code, c_res = api_call("POST", "/complaints", mgr_token, complaint_payload)
    assert code == 201, f"Manager failed to create complaint: {c_res}"
    cid = c_res["id"]
    print(f"✅ 3. Manager successfully created Complaint #{cid} (Status: {c_res['status']}, Priority: {c_res['priority']})")

    # 3. Manager Edit Complaint: Update details, status, employee assignment, and resolution
    code, employees = api_call("GET", "/employees?size=10", mgr_token)
    assert code == 200, "Failed to load employees"
    active_emps = [e for e in employees.get("content", []) if e.get("employmentStatus") == "ACTIVE"]
    emp_id = active_emps[0]["id"] if active_emps else None

    edit_complaint_payload = {
        "customerId": cust_id,
        "category": "POOR_CLEANING",
        "priority": "MEDIUM",
        "subject": "Manager Updated: Silk stain inspection",
        "description": "Re-inspected item with laundry technician. Spot treatment scheduled.",
        "assignedEmployeeId": emp_id,
        "status": "IN_PROGRESS",
        "resolution": "Technician applied dry solvent and restored garment fabric."
    }
    code, c_edit_res = api_call("PUT", f"/complaints/{cid}", mgr_token, edit_complaint_payload)
    assert code == 200, f"Manager failed to edit complaint: {c_edit_res}"
    assert c_edit_res["subject"] == "Manager Updated: Silk stain inspection"
    assert c_edit_res["priority"] == "MEDIUM"
    assert c_edit_res["category"] == "POOR_CLEANING"
    assert c_edit_res["status"] == "IN_PROGRESS"
    if emp_id:
        assert c_edit_res["assignedEmployeeId"] == emp_id
    print(f"✅ 4. Manager successfully edited Complaint #{cid} (Category, Priority, Staff Assignment, Status -> IN_PROGRESS)")

    # 4. Manager resolve complaint
    code, c_resolve = api_call("PUT", f"/complaints/{cid}/resolve", mgr_token, {
        "resolution": "Customer visited branch, garment re-treated and accepted happily."
    })
    assert code == 200, f"Manager failed to resolve complaint: {c_resolve}"
    assert c_resolve["status"] == "RESOLVED"
    print(f"✅ 5. Manager successfully transitioned Complaint #{cid} to RESOLVED")

    # 5. Manager delete complaint
    code, _ = api_call("DELETE", f"/complaints/{cid}", mgr_token)
    assert code in [200, 204], f"Manager failed to delete complaint: {code}"
    code, _ = api_call("GET", f"/complaints/{cid}", mgr_token)
    assert code == 404, "Complaint was not deleted"
    print(f"✅ 6. Manager successfully deleted Complaint #{cid}")

    # 6. Manager Add Feedback on behalf of customer
    # Fetch eligible delivered orders
    code, eligible = api_call("GET", "/feedback/eligible-orders", mgr_token)
    assert code == 200, f"Failed to get eligible orders: {eligible}"
    
    if len(eligible) == 0:
        # Create an order and advance to DELIVERED to guarantee an eligible order
        admin_auth = login("admin@smartwash.com", "password123")
        admin_token = admin_auth["token"]
        order_payload = {
            "customerId": cust_id,
            "branchId": 1,
            "items": [{"serviceId": 1, "quantity": 2.0}]
        }
        _, new_ord = api_call("POST", "/orders", admin_token, order_payload)
        new_ord_id = new_ord["id"]
        for st in ["RECEIVED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"]:
            api_call("PUT", f"/orders/{new_ord_id}/status", admin_token, {"status": st, "remarks": f"Advancing to {st}"})
        code, eligible = api_call("GET", "/feedback/eligible-orders", mgr_token)

    assert len(eligible) > 0, "No eligible orders found for feedback"
    target_ord = eligible[0]
    ord_id = target_ord["orderId"]
    ord_cust_id = target_ord["customerId"]
    print(f"✅ 7. Selected eligible completed Order #{ord_id} (Customer ID: {ord_cust_id}) for feedback")

    # Submit feedback as manager
    feedback_payload = {
        "customerId": ord_cust_id,
        "orderId": ord_id,
        "rating": 4,
        "comment": "Manager logged feedback from customer phone survey: Very fresh laundry and punctual delivery."
    }
    code, fb_res = api_call("POST", "/feedback", mgr_token, feedback_payload)
    assert code == 201, f"Manager failed to create feedback: {fb_res}"
    fbid = fb_res["id"]
    assert fb_res["rating"] == 4
    print(f"✅ 8. Manager successfully submitted Feedback #{fbid} for Order #{ord_id} (Rating: 4 Stars)")

    # 7. Manager Edit Feedback: Update rating & comment
    edit_fb_payload = {
        "rating": 5,
        "comment": "Manager updated: Customer called back to give 5-star rating for pristine folding packaging."
    }
    code, fb_edit = api_call("PUT", f"/feedback/{fbid}", mgr_token, edit_fb_payload)
    assert code == 200, f"Manager failed to edit feedback: {fb_edit}"
    assert fb_edit["rating"] == 5
    assert "Customer called back to give 5-star rating" in fb_edit["comment"]
    print(f"✅ 9. Manager successfully edited Feedback #{fbid} (Updated Rating -> 5 Stars, Updated Comment)")

    # 8. Manager Delete Feedback
    code, _ = api_call("DELETE", f"/feedback/{fbid}", mgr_token)
    assert code in [200, 204], f"Manager failed to delete feedback: {code}"
    code, _ = api_call("GET", f"/feedback/{fbid}", mgr_token)
    assert code == 404, "Feedback was not deleted"
    print(f"✅ 10. Manager successfully deleted Feedback #{fbid}")

    print("\n🎉 ALL MANAGER COMPLAINT & FEEDBACK VERIFICATIONS PASSED SUCCESSFULLY! 🎉\n")

if __name__ == "__main__":
    run_tests()
