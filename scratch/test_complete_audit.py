import json
import urllib.request
import urllib.error
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8080/api"

def make_req(method, endpoint, token=None, body=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "application/json" in content_type:
                return resp.status, json.loads(raw.decode("utf-8"))
            return resp.status, raw.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw
    except Exception as e:
        return 500, str(e)

def login(email, password):
    status, res = make_req("POST", "/auth/login", body={"email": email, "password": password})
    if status == 200:
        return res.get("token")
    return None

def main():
    print("==================================================")
    print("SMARTWASH PRO END-TO-END AUDIT SCRIPT - FULL PASS")
    print("==================================================")

    # 1. Authentication
    mgr_token = login("mgr@smartwash.com", "password123")
    cust_token = login("customer@smartwash.com", "password123")
    admin_token = login("admin@smartwash.com", "password123")

    assert mgr_token, "Failed to authenticate Manager"
    assert cust_token, "Failed to authenticate Customer"
    assert admin_token, "Failed to authenticate Admin"
    print("✅ 1. Authenticated Manager, Customer, and Admin successfully")

    # 2. Get Services
    status, services = make_req("GET", "/services", cust_token)
    assert status == 200 and len(services) > 0, "No services available"
    service_id = services[0]["id"]
    print(f"✅ 2. Retrieved Services: ID {service_id} ({services[0]['serviceName']})")

    # ----------------------------------------------------
    # WORKFLOW 1: Customer Order Lifecycle
    # ----------------------------------------------------
    print("\n--- WORKFLOW 1: Complete Real-World Customer Order Lifecycle ---")
    # 1.1 Customer creates Order
    order_payload = {
        "branchId": 1,
        "items": [
            {"serviceId": service_id, "quantity": 3.0, "specialInstruction": "Delicate wash"},
            {"serviceId": services[1]["id"] if len(services) > 1 else service_id, "quantity": 1.5}
        ],
        "specialInstructions": "E2E Audit Order - Please handle with care",
        "paymentMethod": "CASH"
    }
    status, order_resp = make_req("POST", "/orders", cust_token, order_payload)
    assert status == 201, f"Customer failed to create order: {order_resp}"
    order_id = order_resp["id"]
    total_price = order_resp["totalPrice"]
    print(f"✅ 1.1 Customer Order placed: ID #{order_id}, Items: {len(order_resp['items'])}, Total: Rs. {total_price}, Status: {order_resp['orderStatus']}")

    # 1.2 Customer schedules Pickup for this order
    pickup_payload = {
        "orderId": order_id,
        "pickupAddress": "No. 45 Galle Road, Colombo 03",
        "pickupDate": "2026-10-02",
        "pickupTimeSlot": "09:00 - 11:00",
        "specialInstruction": "Apartment 4B, buzzer 102"
    }
    status, pickup_resp = make_req("POST", "/pickups", cust_token, pickup_payload)
    assert status == 201, f"Failed to create pickup: {pickup_resp}"
    pickup_id = pickup_resp["id"]
    print(f"✅ 1.2 Customer requested Pickup: ID #{pickup_id}, Status: {pickup_resp['pickupStatus']}")

    # 1.3 Manager assigns Driver to Pickup and completes pickup
    status, p_assign = make_req("PUT", f"/pickups/{pickup_id}/assign", mgr_token, {"driverId": 4})
    assert status == 200, f"Failed to assign driver: {p_assign}"
    status, p_collect = make_req("PUT", f"/pickups/{pickup_id}/status", mgr_token, {"status": "COLLECTED"})
    assert status == 200, f"Failed to update pickup status: {p_collect}"
    print(f"✅ 1.3 Pickup assigned to Driver and COLLECTED successfully")

    # 1.4 Laundry Processing progression
    # The order may already be RECEIVED from pickup collection. Progress through: ASSIGNED -> PROCESSING -> IN_WASH -> READY
    print("1.4 Progressing Order Through Facility Processing...")
    steps = ["ASSIGNED", "PROCESSING", "IN_WASH"]
    for step in steps:
        status, trans = make_req("PUT", f"/orders/{order_id}/status", mgr_token, {
            "status": step,
            "remarks": f"Order advanced to {step} in plant"
        })
        assert status == 200, f"Failed to transition to {step}: {trans}"
        print(f"    -> Order #{order_id} status updated to: {trans['orderStatus']}")

    # 1.5 Inventory usage during wash
    status, inv_page = make_req("GET", "/inventory", mgr_token, {"size": 15})
    assert status == 200 and len(inv_page.get("content", [])) > 0, "No inventory items"
    available_skus = [i for i in inv_page["content"] if (i.get("quantity") or 0) >= 2.0]
    target_sku = available_skus[0] if available_skus else inv_page["content"][0]
    inv_id = target_sku["id"]
    status, tx_resp = make_req("POST", "/stock-transactions", mgr_token, {
        "inventoryId": inv_id,
        "transactionType": "USAGE",
        "quantity": 2.0,
        "notes": f"Batch consumption for Order #{order_id}"
    })
    assert status in (200, 201), f"Stock transaction failed: {tx_resp}"
    print(f"✅ 1.5 Inventory Stock Usage recorded: 2.0 units consumed from SKU #{inv_id} ({target_sku['itemName']})")

    # 1.6 Order becomes READY
    status, trans_ready = make_req("PUT", f"/orders/{order_id}/status", mgr_token, {
        "status": "READY",
        "remarks": "Washing and pressing complete, ready for dispatch"
    })
    assert status == 200, f"Failed to transition to READY: {trans_ready}"
    print(f"✅ 1.6 Order #{order_id} marked as READY")

    # 1.7 Create Delivery & dispatch
    delivery_payload = {
        "orderId": order_id,
        "deliveryAddress": "No. 45 Galle Road, Colombo 03",
        "deliveryDate": "2026-10-02",
        "estimatedTime": "14:00 - 16:00",
        "deliveryStatus": "PENDING"
    }
    status, d_resp = make_req("POST", "/deliveries", mgr_token, delivery_payload)
    assert status == 201, f"Failed to create delivery: {d_resp}"
    delivery_id = d_resp["id"]

    # Assign driver to delivery (moves PENDING -> ASSIGNED)
    status, d_assign = make_req("PUT", f"/deliveries/{delivery_id}/assign", mgr_token, {"driverId": 4})
    assert status == 200, f"Failed to assign delivery driver: {d_assign}"

    # Move delivery to OUT_FOR_DELIVERY (syncs order to OUT_FOR_DELIVERY)
    status, d_out = make_req("PUT", f"/deliveries/{delivery_id}/status", mgr_token, {"status": "OUT_FOR_DELIVERY"})
    assert status == 200, f"Failed to dispatch delivery: {d_out}"
    print(f"    -> Delivery #{delivery_id} marked as OUT_FOR_DELIVERY")

    # Mark delivery as DELIVERED (syncs order to DELIVERED)
    status, d_done = make_req("PUT", f"/deliveries/{delivery_id}/status", mgr_token, {"status": "DELIVERED"})
    assert status == 200, f"Failed to complete delivery: {d_done}"
    print(f"✅ 1.7 Delivery completed and Order #{order_id} marked as DELIVERED")

    # 1.8 Payment settlement
    status, pay_page = make_req("GET", f"/payments/order/{order_id}", mgr_token)
    assert status == 200, f"Payment not found for order: {pay_page}"
    pay_id = pay_page["id"]
    status, pay_settle = make_req("PUT", f"/payments/{pay_id}/status", mgr_token, {
        "status": "PAID",
        "transactionReference": "COD-COLLECTED-102"
    })
    assert status == 200, f"Failed to settle payment: {pay_settle}"
    print(f"✅ 1.8 Payment settled: Receipt #{pay_settle['receiptNumber']}, Status: {pay_settle['paymentStatus']}")

    # 1.9 Customer submits Feedback
    feedback_payload = {
        "orderId": order_id,
        "rating": 5,
        "comment": "Exceptional service! Fabric feels crisp and clean, fast delivery."
    }
    status, fb_resp = make_req("POST", "/feedback", cust_token, feedback_payload)
    assert status == 201, f"Failed to submit feedback: {fb_resp}"
    print(f"✅ 1.9 Customer submitted 5-Star Feedback for Order #{order_id}: ID #{fb_resp['id']}")

    # ----------------------------------------------------
    # WORKFLOW 2: Inventory, Stock Transactions & Low Stock Alert
    # ----------------------------------------------------
    print("\n--- WORKFLOW 2: Inventory, Stock Restock & Low Stock Monitoring ---")
    status, low_stock = make_req("GET", "/inventory/low-stock", mgr_token)
    assert status == 200, f"Failed to query low stock: {low_stock}"
    print(f"✅ 2.1 Low stock query verified: {len(low_stock)} items currently below threshold")

    # Restock transaction
    status, restock_tx = make_req("POST", "/stock-transactions", mgr_token, {
        "inventoryId": inv_id,
        "transactionType": "RESTOCK",
        "quantity": 10.0,
        "notes": "Warehouse weekly replenishment"
    })
    assert status in (200, 201), f"Restock transaction failed: {restock_tx}"
    print(f"✅ 2.2 Restock transaction recorded: +10.0 units for SKU #{inv_id}")

    # ----------------------------------------------------
    # WORKFLOW 3: Equipment Breakdown -> Maintenance -> Active
    # ----------------------------------------------------
    print("\n--- WORKFLOW 3: Equipment Breakdown, Maintenance & Reactivation ---")
    status, eq_page = make_req("GET", "/equipment", mgr_token, {"size": 1})
    assert status == 200 and len(eq_page.get("content", [])) > 0, "No equipment found"
    test_eq = eq_page["content"][0]
    eq_id = test_eq["id"]

    # 3.1 Report breakdown
    status, bd_resp = make_req("POST", "/breakdowns", mgr_token, {
        "equipmentId": eq_id,
        "reportedDate": "2026-10-01",
        "description": "Drain pump blockage alert triggered",
        "severity": "MEDIUM",
        "status": "REPORTED"
    })
    assert status == 201, f"Failed to report breakdown: {bd_resp}"
    bd_id = bd_resp["id"]

    # Verify equipment status is BROKEN
    status, eq_chk1 = make_req("GET", f"/equipment/{eq_id}", mgr_token)
    assert eq_chk1["status"] == "BROKEN", f"Equipment status expected BROKEN, got: {eq_chk1['status']}"
    print(f"✅ 3.1 Breakdown reported: Equipment #{eq_id} automatically set to BROKEN")

    # 3.2 Schedule Maintenance
    status, maint_resp = make_req("POST", "/maintenance", mgr_token, {
        "equipmentId": eq_id,
        "scheduledDate": "2026-10-01",
        "maintenanceType": "UNSCHEDULED_REPAIR",
        "description": "Cleared lint and coin debris from drain impeller pump",
        "performedBy": "Technician Nuwan",
        "cost": 1500.0,
        "status": "COMPLETED",
        "completedDate": "2026-10-01"
    })
    assert status == 201, f"Failed to record maintenance: {maint_resp}"

    # 3.3 Close breakdown
    status, bd_up = make_req("PUT", f"/breakdowns/{bd_id}", mgr_token, {
        "status": "REPAIRED",
        "repairNotes": "Pump cleared and verified at full drain speed",
        "repairCost": 1500.0,
        "repairedDate": "2026-10-01"
    })
    assert status == 200, f"Failed to update breakdown: {bd_up}"

    # Verify equipment status returns to ACTIVE
    status, eq_chk2 = make_req("GET", f"/equipment/{eq_id}", mgr_token)
    assert eq_chk2["status"] == "ACTIVE", f"Equipment expected ACTIVE, got: {eq_chk2['status']}"
    print(f"✅ 3.2 Maintenance completed & Breakdown repaired: Equipment #{eq_id} automatically returned to ACTIVE")

    # ----------------------------------------------------
    # WORKFLOW 4: Complaint -> Assignment -> Investigation -> Resolution
    # ----------------------------------------------------
    print("\n--- WORKFLOW 4: Complaint Lifecycle & Resolution ---")
    status, cp_resp = make_req("POST", "/complaints", cust_token, {
        "orderId": order_id,
        "subject": "Missing laundry hanger bag",
        "description": "Suit jacket was delivered on wire hanger instead of wooden luxury hanger.",
        "priority": "LOW"
    })
    assert status == 201, f"Failed to create complaint: {cp_resp}"
    cp_id = cp_resp["id"]
    print(f"✅ 4.1 Customer logged Complaint: ID #{cp_id}, Status: {cp_resp['status']}")

    # Manager assigns employee via dedicated endpoint /assign
    status, cp_assign = make_req("PUT", f"/complaints/{cp_id}/assign?employeeId=2", mgr_token)
    assert status == 200, f"Failed to assign complaint: {cp_assign}"
    print(f"✅ 4.2 Manager assigned employee #{cp_assign.get('assignedEmployeeId')} to Complaint #{cp_id}")

    # Manager moves status to IN_PROGRESS via /status
    status, cp_status = make_req("PUT", f"/complaints/{cp_id}/status?status=IN_PROGRESS", mgr_token)
    assert status == 200, f"Failed to move complaint to IN_PROGRESS: {cp_status}"
    print(f"    -> Complaint #{cp_id} status moved to: {cp_status['status']}")

    # Manager resolves complaint via /resolve
    status, cp_resolve = make_req("PUT", f"/complaints/{cp_id}/resolve", mgr_token, {
        "resolution": "Delivered wooden suit hanger and apologized to customer. Customer satisfied."
    })
    assert status == 200, f"Failed to resolve complaint: {cp_resolve}"
    assert cp_resolve["status"] == "RESOLVED"
    print(f"✅ 4.3 Complaint #{cp_id} successfully RESOLVED with recorded resolution notes")

    # Manager closes complaint via /close
    status, cp_close = make_req("PUT", f"/complaints/{cp_id}/close", mgr_token)
    assert status == 200, f"Failed to close complaint: {cp_close}"
    assert cp_close["status"] == "CLOSED"
    print(f"✅ 4.4 Complaint #{cp_id} successfully CLOSED")

    # ----------------------------------------------------
    # WORKFLOW 5: Employee Tasks & Attendance
    # ----------------------------------------------------
    print("\n--- WORKFLOW 5: Employee Task Assignment & Attendance ---")
    # Get active employees
    status, emps = make_req("GET", "/employees?size=10", mgr_token)
    assert status == 200, "Failed to get employees"
    active_emp = None
    for e in emps.get("content", []):
        if e.get("employmentStatus") == "ACTIVE":
            active_emp = e
            break
    assert active_emp, "No active employee found"
    target_emp_id = active_emp["id"]

    # 5.1 Assign Task
    task_payload = {
        "employeeId": target_emp_id,
        "taskType": "FOLD",
        "title": "Fold & Pack Order #" + str(order_id),
        "description": "Double check tag counts before placing in garment bags",
        "priority": "MEDIUM",
        "dueDate": "2026-10-02T18:00:00"
    }
    status, task_resp = make_req("POST", "/tasks", mgr_token, task_payload)
    assert status == 201, f"Failed to create task: {task_resp}"
    task_id = task_resp["id"]
    print(f"✅ 5.1 Task #{task_id} assigned to Employee #{target_emp_id} ({active_emp['fullName']})")

    # 5.2 Complete Task
    status, task_done = make_req("PUT", f"/tasks/{task_id}/complete", mgr_token)
    assert status == 200, f"Failed to complete task: {task_done}"
    assert task_done["taskStatus"] == "COMPLETED"
    print(f"✅ 5.2 Task #{task_id} successfully marked as COMPLETED")

    # 5.3 Attendance check-in & check-out
    # Find an employee who hasn't checked in yet today, or verify existing check-in
    status, today_att = make_req("GET", "/attendance/today", mgr_token)
    checked_in_emp_ids = [a["employeeId"] for a in today_att.get("content", [])] if status == 200 else []
    
    candidate_emp_id = None
    for e in emps.get("content", []):
        if e.get("employmentStatus") == "ACTIVE" and e["id"] not in checked_in_emp_ids:
            candidate_emp_id = e["id"]
            break
            
    if candidate_emp_id:
        status, att_in = make_req("POST", "/attendance/check-in", mgr_token, {
            "employeeId": candidate_emp_id,
            "date": "2026-10-01",
            "time": "08:00:00"
        })
        assert status in (200, 201), f"Failed attendance check-in: {att_in}"
        print(f"✅ 5.3 Attendance Check-In logged for Employee #{candidate_emp_id}: Status {att_in['attendanceStatus']}")
        
        status, att_out = make_req("POST", "/attendance/check-out", mgr_token, {
            "employeeId": candidate_emp_id,
            "date": "2026-10-01",
            "time": "17:00:00"
        })
        assert status in (200, 201), f"Failed attendance check-out: {att_out}"
        print(f"✅ 5.4 Attendance Check-Out logged for Employee #{candidate_emp_id}: Out {att_out['checkOut']}")
    else:
        # Check out an existing checked in employee
        checked_emp = checked_in_emp_ids[0]
        status, att_out = make_req("POST", "/attendance/check-out", mgr_token, {
            "employeeId": checked_emp,
            "date": "2026-10-01",
            "time": "17:30:00"
        })
        assert status in (200, 201), f"Failed attendance check-out: {att_out}"
        print(f"✅ 5.3 & 5.4 Attendance shift verified & Check-Out updated for Employee #{checked_emp}: Out {att_out['checkOut']}")

    print("\n==================================================")
    print("ALL REAL-WORLD WORKFLOWS VERIFIED 100% SUCCESSFUL!")
    print("==================================================")

if __name__ == "__main__":
    main()
