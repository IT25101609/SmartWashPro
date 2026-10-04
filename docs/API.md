# SmartWash Pro — REST API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Response Format

### Success
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "timestamp": "2024-08-01T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Order not found with id: 123",
  "path": "/api/orders/123"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new customer account.

**Request Body:**
```json
{
  "fullName": "John Perera",
  "email": "john@example.com",
  "phoneNumber": "0771234567",
  "address": "123 Main Street, Colombo",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "email": "john@example.com",
  "fullName": "John Perera",
  "role": "CUSTOMER"
}
```

---

### POST /api/auth/login
Login and obtain a JWT token.

**Request Body:**
```json
{
  "email": "customer@smartwash.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "userId": 1,
  "email": "customer@smartwash.com",
  "fullName": "Demo Customer",
  "role": "CUSTOMER"
}
```

---

### GET /api/auth/me
Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": 1,
  "fullName": "Demo Customer",
  "email": "customer@smartwash.com",
  "phoneNumber": "0771234567",
  "address": "Colombo",
  "role": "CUSTOMER",
  "status": "ACTIVE",
  "createdAt": "2024-01-01T00:00:00"
}
```

---

### POST /api/auth/change-password
Change authenticated user's password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

---

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{ "email": "user@example.com" }
```

---

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newSecurePassword"
}
```

---

## Customer Endpoints

### GET /api/customers
Get all customers (BRANCH_MANAGER, RECEPTIONIST).

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)
- `search` (string) — search by name/email/phone
- `status` (ACTIVE|BLOCKED|SUSPENDED)

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "userId": 1,
      "fullName": "John Perera",
      "email": "john@example.com",
      "phoneNumber": "0771234567",
      "totalOrders": 5,
      "totalSpent": 12500.00
    }
  ],
  "totalElements": 50,
  "totalPages": 3,
  "number": 0
}
```

---

### GET /api/customers/{id}
Get customer by ID.

---

### PUT /api/customers/{id}
Update customer profile.

---

### DELETE /api/customers/{id}
Delete/deactivate customer (BRANCH_MANAGER only).

---

## Order Endpoints

### GET /api/orders
Get all orders with pagination and filtering.

**Query Parameters:**
- `page`, `size`
- `status` (PLACED|RECEIVED|ASSIGNED|PROCESSING|IN_WASH|READY|OUT_FOR_DELIVERY|DELIVERED|CANCELLED)
- `search` — order ID or customer name
- `dateFrom`, `dateTo` — ISO date format (YYYY-MM-DD)
- `customerId`

---

### GET /api/orders/{id}
Get complete order details including items, status history, payment, pickup, delivery.

**Response:**
```json
{
  "id": 1,
  "customer": { "id": 1, "fullName": "John Perera" },
  "orderDate": "2024-08-01T10:00:00",
  "orderStatus": "PROCESSING",
  "totalPrice": 2500.00,
  "totalWeight": 5.0,
  "specialInstructions": "Handle with care",
  "items": [
    {
      "id": 1,
      "serviceName": "Washing",
      "quantity": 5.0,
      "unitPrice": 300.00,
      "subtotal": 1500.00,
      "specialInstruction": "Cold wash"
    }
  ],
  "statusHistory": [
    {
      "oldStatus": null,
      "newStatus": "PLACED",
      "changedAt": "2024-08-01T10:00:00",
      "remarks": "Order placed by customer"
    }
  ],
  "payment": { "id": 1, "amount": 2500.00, "paymentStatus": "PENDING" },
  "pickup": { "id": 1, "pickupDate": "2024-08-02", "pickupStatus": "SCHEDULED" }
}
```

---

### POST /api/orders
Place a new order.

**Request Body:**
```json
{
  "items": [
    {
      "serviceId": 1,
      "quantity": 5.0,
      "specialInstruction": "Cold wash only"
    }
  ],
  "specialInstructions": "Handle with care, delicate fabrics",
  "paymentMethod": "CASH",
  "requestPickup": true,
  "pickupAddress": "123 Main St, Colombo",
  "pickupDate": "2024-08-02",
  "pickupTimeSlot": "09:00-11:00"
}
```

**Response (201 Created):** Full order object

---

### PUT /api/orders/{id}/status
Update order status (authorized staff).

**Request Body:**
```json
{
  "status": "PROCESSING",
  "remarks": "Started processing batch #5"
}
```

**Valid Transitions:**
```
PLACED → RECEIVED → ASSIGNED → PROCESSING → IN_WASH → READY → OUT_FOR_DELIVERY → DELIVERED
Any → CANCELLED (manager only)
```

---

### GET /api/orders/my
Get orders for the authenticated customer (CUSTOMER only).

---

## Payment Endpoints

### GET /api/payments
List all payments (BRANCH_MANAGER, FINANCE_LEAD, RECEPTIONIST).

**Query Parameters:** `page`, `size`, `status`, `method`, `dateFrom`, `dateTo`

---

### GET /api/payments/{id}
Get payment details.

---

### POST /api/payments
Record a payment.

**Request Body:**
```json
{
  "orderId": 1,
  "amount": 2500.00,
  "paymentMethod": "CASH",
  "transactionReference": "TXN001"
}
```

---

### PUT /api/payments/{id}
Update payment status.

---

### GET /api/payments/{id}/receipt
Generate receipt for a payment.

---

## Employee Endpoints

### GET /api/employees
List all employees (BRANCH_MANAGER).

**Query Parameters:** `page`, `size`, `search`, `role`, `status`

---

### POST /api/employees
Create a new employee account.

**Request Body:**
```json
{
  "fullName": "Nimal Perera",
  "email": "nimal@smartwash.com",
  "phoneNumber": "0771234567",
  "address": "Colombo",
  "role": "LAUNDRY_STAFF",
  "password": "tempPassword123",
  "hireDate": "2024-01-15"
}
```

---

### PUT /api/employees/{id}
Update employee information.

---

### DELETE /api/employees/{id}
Deactivate employee.

---

## Laundry Service Endpoints

### GET /api/services
List all available laundry services (public).

**Response:**
```json
[
  {
    "id": 1,
    "serviceName": "Washing",
    "category": "WASH",
    "description": "Standard machine washing",
    "price": 300.00,
    "pricingType": "PER_KG",
    "available": true
  }
]
```

---

### POST /api/services
Create a new service (BRANCH_MANAGER).

---

### PUT /api/services/{id}
Update service (BRANCH_MANAGER).

---

### DELETE /api/services/{id}
Delete/deactivate service (BRANCH_MANAGER).

---

## Equipment Endpoints

### GET /api/equipment
List all equipment (BRANCH_MANAGER).

---

### POST /api/equipment
Add new equipment.

**Request Body:**
```json
{
  "equipmentName": "Industrial Washing Machine A",
  "equipmentType": "WASHING_MACHINE",
  "model": "LG WD-T1350QP",
  "serialNumber": "LG2024001",
  "purchaseDate": "2023-01-01",
  "nextMaintenanceDate": "2024-07-01"
}
```

---

### PUT /api/equipment/{id}
Update equipment.

---

### DELETE /api/equipment/{id}
Remove equipment.

---

## Maintenance Endpoints

### GET /api/maintenance
List maintenance records.

---

### POST /api/maintenance
Schedule maintenance.

**Request Body:**
```json
{
  "equipmentId": 1,
  "scheduledDate": "2024-08-15",
  "maintenanceType": "ROUTINE",
  "description": "Monthly filter cleaning and inspection"
}
```

---

## Inventory Endpoints

### GET /api/inventory
List inventory items.

**Query Parameters:** `page`, `size`, `search`, `category`, `lowStock` (boolean)

---

### POST /api/inventory
Add inventory item.

**Request Body:**
```json
{
  "itemName": "Ariel Washing Powder 25kg",
  "category": "DETERGENT",
  "quantity": 50,
  "unit": "KG",
  "minimumStockLevel": 10,
  "supplierId": 1,
  "unitCost": 4500.00
}
```

---

### PUT /api/inventory/{id}
Update inventory item.

---

### POST /api/inventory/{id}/restock
Record a restocking transaction.

**Request Body:**
```json
{
  "quantity": 25,
  "notes": "Received from supplier - Invoice #INV2024001"
}
```

---

### POST /api/inventory/{id}/use
Record stock usage.

**Request Body:**
```json
{
  "quantity": 5,
  "notes": "Used for morning batch processing"
}
```

---

## Supplier Endpoints

### GET /api/suppliers
List suppliers.

---

### POST /api/suppliers
Add supplier.

---

### PUT /api/suppliers/{id}
Update supplier.

---

### DELETE /api/suppliers/{id}
Remove supplier.

---

## Task Endpoints

### GET /api/tasks
List tasks (BRANCH_MANAGER sees all, others see own).

---

### POST /api/tasks
Assign task (BRANCH_MANAGER only).

**Request Body:**
```json
{
  "employeeId": 5,
  "orderId": 10,
  "taskType": "WASH",
  "taskDescription": "Process order ORD-010, delicate fabrics",
  "priority": "HIGH",
  "dueDate": "2024-08-02T17:00:00"
}
```

---

### PUT /api/tasks/{id}
Update task.

---

### PUT /api/tasks/{id}/status
Update task status (assigned employee).

---

## Attendance Endpoints

### GET /api/attendance
List attendance records.

---

### POST /api/attendance
Record attendance.

---

## Pickup Endpoints

### GET /api/pickups
List pickups.

---

### POST /api/pickups
Schedule a pickup.

---

### PUT /api/pickups/{id}
Update pickup.

---

### PUT /api/pickups/{id}/assign
Assign driver to pickup.

---

### PUT /api/pickups/{id}/collect
Mark pickup as collected (DELIVERY_DRIVER).

---

## Delivery Endpoints

### GET /api/deliveries
List deliveries.

---

### POST /api/deliveries
Create delivery record.

---

### PUT /api/deliveries/{id}/status
Update delivery status.

---

## Feedback Endpoints

### GET /api/feedback
List feedback (BRANCH_MANAGER sees all, CUSTOMER sees own).

---

### POST /api/feedback
Submit feedback (CUSTOMER).

**Request Body:**
```json
{
  "orderId": 5,
  "rating": 5,
  "feedbackText": "Excellent service! Clothes came back perfectly clean."
}
```

---

### PUT /api/feedback/{id}
Update feedback (own feedback only).

---

### DELETE /api/feedback/{id}
Delete feedback (own feedback or BRANCH_MANAGER).

---

## Complaint Endpoints

### GET /api/complaints
List complaints.

---

### POST /api/complaints
Submit complaint (CUSTOMER).

**Request Body:**
```json
{
  "orderId": 3,
  "subject": "Damaged clothing",
  "description": "My shirt came back with a tear",
  "priority": "HIGH"
}
```

---

### PUT /api/complaints/{id}/status
Update complaint status (BRANCH_MANAGER).

**Request Body:**
```json
{
  "status": "RESOLVED",
  "resolution": "Apologized and offered discount on next order"
}
```

---

## Notification Endpoints

### GET /api/notifications
Get notifications for the authenticated user.

---

### PUT /api/notifications/{id}/read
Mark notification as read.

---

### PUT /api/notifications/read-all
Mark all notifications as read.

---

## Dashboard Endpoints

### GET /api/dashboard/manager
Manager analytics dashboard data.

### GET /api/dashboard/customer
Customer dashboard data.

### GET /api/dashboard/finance
Finance dashboard data.

### GET /api/dashboard/receptionist
Receptionist dashboard data.

### GET /api/dashboard/staff
Laundry staff dashboard data.

### GET /api/dashboard/driver
Driver dashboard data.

---

## Report Endpoints

### GET /api/reports/orders
Order reports with date filtering.

### GET /api/reports/revenue
Revenue reports.

### GET /api/reports/inventory
Inventory reports.

### GET /api/reports/employees
Employee performance reports.

### GET /api/reports/equipment
Equipment maintenance reports.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Success |
| 201 | Created — Resource created |
| 400 | Bad Request — Validation error |
| 401 | Unauthorized — No/invalid token |
| 403 | Forbidden — Insufficient role |
| 404 | Not Found — Resource not found |
| 409 | Conflict — Duplicate resource |
| 500 | Internal Server Error |
