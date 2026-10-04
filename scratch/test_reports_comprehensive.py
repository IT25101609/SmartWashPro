import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://localhost:8080/api"

def login(email, password):
    url = f"{BASE_URL}/auth/login"
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("token")
    except Exception as e:
        print(f"Failed to login: {e}")
        sys.exit(1)

def get(endpoint, token, params=None):
    url = f"{BASE_URL}{endpoint}"
    if params:
        query = "&".join([f"{k}={v}" for k, v in params.items() if v is not None])
        url += f"?{query}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            data = resp.read()
            if "application/json" in content_type:
                return resp.status, json.loads(data.decode("utf-8"))
            else:
                return resp.status, data.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return e.code, body
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("=== Testing SmartWash Pro Reports Module ===")
    token = login("mgr@smartwash.com", "password123")
    print(f"1. Logged in successfully. Token received (len: {len(token)})")

    # 1. Test Metadata
    status, meta = get("/reports/meta", token)
    assert status == 200, f"Expected 200 for /reports/meta, got {status}"
    branches = meta.get("branches", [])
    employees = meta.get("employees", [])
    services = meta.get("services", [])
    order_statuses = meta.get("orderStatuses", [])
    print(f"2. /reports/meta verified: {len(branches)} branches, {len(employees)} employees, {len(services)} services, {len(order_statuses)} order statuses.")

    # 2. Test all 12 Report Types
    report_types = [
        "DAILY_ORDERS",
        "MONTHLY_ORDERS",
        "REVENUE",
        "PAYMENTS",
        "INVENTORY",
        "LOW_STOCK",
        "CUSTOMERS",
        "SERVICES",
        "EMPLOYEE_ATTENDANCE",
        "PICKUPS",
        "DELIVERIES",
        "COMPLAINTS"
    ]

    print("\n3. Testing all 12 Report Types via /api/reports/data:")
    for rtype in report_types:
        status, data = get("/reports/data", token, {"type": rtype})
        assert status == 200, f"Report {rtype} failed with status {status}: {data}"
        records = data.get("records", [])
        summary = data.get("summary", {})
        chart_data = data.get("chartData", [])
        cols = data.get("columns", [])
        print(f"   [PASS] {rtype.ljust(20)} -> {len(records)} records | {len(cols)} columns | {len(chart_data)} chart points | Summary keys: {list(summary.keys())}")

    # 3. Test Filters
    print("\n4. Testing Dynamic Filters:")
    
    # Filter by Date range
    status, d_filt = get("/reports/data", token, {
        "type": "DAILY_ORDERS",
        "startDate": "2026-01-01",
        "endDate": "2026-12-31"
    })
    assert status == 200
    print(f"   [PASS] Date Range (2026-01-01 to 2026-12-31): {len(d_filt.get('records', []))} records")

    # Filter by Branch
    if branches:
        bid = branches[0]["id"]
        status, b_filt = get("/reports/data", token, {"type": "DAILY_ORDERS", "branchId": bid})
        assert status == 200
        print(f"   [PASS] Branch Filter (branchId={bid}): {len(b_filt.get('records', []))} records")

    # Filter by Status
    status, st_filt = get("/reports/data", token, {"type": "DAILY_ORDERS", "status": "DELIVERED"})
    assert status == 200
    print(f"   [PASS] Status Filter (status=DELIVERED): {len(st_filt.get('records', []))} records")

    # Filter by Service
    if services:
        sid = services[0]["id"]
        status, s_filt = get("/reports/data", token, {"type": "DAILY_ORDERS", "serviceId": sid})
        assert status == 200
        print(f"   [PASS] Service Filter (serviceId={sid}): {len(s_filt.get('records', []))} records")

    # Filter by Employee
    if employees:
        eid = employees[0]["id"]
        status, e_filt = get("/reports/data", token, {"type": "EMPLOYEE_ATTENDANCE", "employeeId": eid})
        assert status == 200
        print(f"   [PASS] Employee Filter on Attendance (employeeId={eid}): {len(e_filt.get('records', []))} records")

    # 4. Test CSV Export
    print("\n5. Testing CSV Export via /api/reports/export:")
    for rtype in ["DAILY_ORDERS", "REVENUE", "INVENTORY", "COMPLAINTS"]:
        status, csv_data = get("/reports/export", token, {"type": rtype})
        assert status == 200, f"CSV Export for {rtype} failed with {status}"
        lines = csv_data.strip().split("\n")
        print(f"   [PASS] {rtype.ljust(20)} CSV Export: {len(lines)} lines generated. Header: {lines[0] if lines else 'empty'}")

    print("\n=== ALL REPORT TESTS PASSED PERFECTLY ===")

if __name__ == "__main__":
    run_tests()
