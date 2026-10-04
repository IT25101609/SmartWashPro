-- ============================================================
-- SmartWash Pro - Complete MySQL Database Schema
-- Crystal Clean Laundry (Pvt) Ltd.
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartwash_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartwash_pro;

-- ============================================================
-- TABLE: branches
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    branch_name     VARCHAR(255)    NOT NULL,
    branch_code     VARCHAR(50)     NOT NULL UNIQUE,
    address         VARCHAR(500),
    phone           VARCHAR(50),
    status          VARCHAR(50)     NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone_number    VARCHAR(20),
    address         VARCHAR(500),
    password_hash   VARCHAR(255)    NOT NULL,
    role            ENUM('ADMIN','BRANCH_MANAGER_ADMIN','CUSTOMER') NOT NULL,
    branch_id       BIGINT          NULL,
    status          ENUM('ACTIVE','BLOCKED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_role   ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id                          BIGINT  NOT NULL AUTO_INCREMENT,
    user_id                     BIGINT  NOT NULL UNIQUE,
    loyalty_points              INT             DEFAULT 0,
    total_orders                INT             DEFAULT 0,
    total_spent                 DECIMAL(12,2)   DEFAULT 0.00,
    preferred_payment_method    ENUM('CASH','CARD','DIGITAL_PAYMENT','CASH_ON_DELIVERY'),
    PRIMARY KEY (id),
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_customers_user_id ON customers(user_id);

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
    id                  BIGINT  NOT NULL AUTO_INCREMENT,
    user_id             BIGINT  NOT NULL UNIQUE,
    role                ENUM('BRANCH_MANAGER','RECEPTIONIST','LAUNDRY_STAFF','DELIVERY_DRIVER','FINANCE_LEAD') NOT NULL,
    employment_status   ENUM('ACTIVE','INACTIVE','ON_LEAVE') NOT NULL DEFAULT 'ACTIVE',
    hire_date           DATE,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_role    ON employees(role);

-- ============================================================
-- TABLE: laundry_services
-- ============================================================
CREATE TABLE IF NOT EXISTS laundry_services (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    service_name    VARCHAR(255)    NOT NULL,
    category        VARCHAR(100),
    description     VARCHAR(1000),
    price           DECIMAL(10,2)   NOT NULL,
    pricing_type    ENUM('PER_KG','PER_ITEM','FIXED') NOT NULL,
    available       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    customer_id             BIGINT          NOT NULL,
    receptionist_id         BIGINT,
    order_date              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pickup_date             DATE,
    delivery_date           DATE,
    total_weight            DECIMAL(8,2),
    total_quantity          INT,
    total_price             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    special_instructions    VARCHAR(1000),
    order_status            ENUM('PLACED','RECEIVED','ASSIGNED','PROCESSING','IN_WASH','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLACED',
    created_at              DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_customer     FOREIGN KEY (customer_id)    REFERENCES customers(id),
    CONSTRAINT fk_order_receptionist FOREIGN KEY (receptionist_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_orders_customer_id  ON orders(customer_id);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_order_date   ON orders(order_date);
CREATE INDEX idx_orders_created_at   ON orders(created_at);

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    order_id            BIGINT          NOT NULL,
    service_id          BIGINT,
    service_name        VARCHAR(255)    NOT NULL,
    quantity            DECIMAL(8,2)    NOT NULL,
    unit_price          DECIMAL(10,2)   NOT NULL,
    subtotal            DECIMAL(12,2)   NOT NULL,
    special_instruction VARCHAR(500),
    PRIMARY KEY (id),
    CONSTRAINT fk_order_item_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_service FOREIGN KEY (service_id) REFERENCES laundry_services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- TABLE: order_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    order_id    BIGINT      NOT NULL,
    old_status  ENUM('PLACED','RECEIVED','ASSIGNED','PROCESSING','IN_WASH','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'),
    new_status  ENUM('PLACED','RECEIVED','ASSIGNED','PROCESSING','IN_WASH','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL,
    changed_by_user_id  BIGINT,
    remarks     VARCHAR(500),
    changed_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_status_history_order      FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_history_changed_by FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    order_id                BIGINT          NOT NULL UNIQUE,
    customer_id             BIGINT,
    amount                  DECIMAL(12,2)   NOT NULL,
    payment_method          ENUM('CASH','CARD','DIGITAL_PAYMENT','CASH_ON_DELIVERY') NOT NULL,
    payment_status          ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    transaction_reference   VARCHAR(255),
    payment_date            DATETIME,
    receipt_number          VARCHAR(50)     UNIQUE,
    created_at              DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_payment_order    FOREIGN KEY (order_id)    REFERENCES orders(id),
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_payments_order_id      ON payments(order_id);
CREATE INDEX idx_payments_customer_id   ON payments(customer_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_payment_date  ON payments(payment_date);

-- ============================================================
-- TABLE: suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    supplier_name   VARCHAR(255)    NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         VARCHAR(500),
    status          ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    item_name           VARCHAR(255)    NOT NULL,
    category            ENUM('DETERGENT','CHEMICAL','PACKAGING','EQUIPMENT_PART','OTHER'),
    quantity            DECIMAL(12,2)   NOT NULL DEFAULT 0,
    unit                VARCHAR(50),
    minimum_stock_level DECIMAL(12,2)   NOT NULL DEFAULT 0,
    supplier_id         BIGINT,
    unit_cost           DECIMAL(10,2),
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_inventory_category ON inventory(category);

-- ============================================================
-- TABLE: stock_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    inventory_id        BIGINT      NOT NULL,
    transaction_type    ENUM('RESTOCK','USAGE','ADJUSTMENT','WASTE') NOT NULL,
    quantity            DECIMAL(12,2) NOT NULL,
    previous_quantity   DECIMAL(12,2),
    new_quantity        DECIMAL(12,2),
    notes               VARCHAR(500),
    created_by_user_id  BIGINT,
    created_at          DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_stock_tx_inventory   FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_tx_created_by  FOREIGN KEY (created_by_user_id)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_stock_tx_inventory_id ON stock_transactions(inventory_id);
CREATE INDEX idx_stock_tx_created_at   ON stock_transactions(created_at);

-- ============================================================
-- TABLE: equipment
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    equipment_name          VARCHAR(255)    NOT NULL,
    equipment_type          VARCHAR(100),
    model                   VARCHAR(255),
    serial_number           VARCHAR(100)    UNIQUE,
    purchase_date           DATE,
    status                  ENUM('ACTIVE','MAINTENANCE','UNDER_MAINTENANCE','BROKEN','INACTIVE','RETIRED') NOT NULL DEFAULT 'ACTIVE',
    branch_id               BIGINT,
    last_maintenance_date   DATE,
    next_maintenance_date   DATE,
    created_at              DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_equipment_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_equipment_status              ON equipment(status);
CREATE INDEX idx_equipment_next_maintenance    ON equipment(next_maintenance_date);

-- ============================================================
-- TABLE: maintenance
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    equipment_id    BIGINT          NOT NULL,
    scheduled_date  DATE,
    completed_date  DATE,
    maintenance_type VARCHAR(100),
    description     VARCHAR(1000),
    problem         TEXT,
    repair_details  TEXT,
    assigned_employee_id BIGINT,
    performed_by    VARCHAR(255),
    cost            DECIMAL(10,2),
    status          ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_employee  FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_maintenance_equipment_id ON maintenance(equipment_id);
CREATE INDEX idx_maintenance_scheduled    ON maintenance(scheduled_date);

-- ============================================================
-- TABLE: breakdowns
-- ============================================================
CREATE TABLE IF NOT EXISTS breakdowns (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    equipment_id    BIGINT          NOT NULL,
    reported_date   DATE,
    description     VARCHAR(1000),
    severity        ENUM('LOW','MEDIUM','HIGH','CRITICAL'),
    assigned_employee_id BIGINT,
    technician      VARCHAR(255),
    repaired_date   DATE,
    repair_cost     DECIMAL(10,2),
    repair_notes    VARCHAR(1000),
    status          ENUM('REPORTED','IN_PROGRESS','IN_REPAIR','REPAIRED','CLOSED','SCRAPPED') NOT NULL DEFAULT 'REPORTED',
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_breakdown_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    CONSTRAINT fk_breakdown_employee  FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: employee_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_tasks (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    employee_id     BIGINT      NOT NULL,
    order_id        BIGINT,
    task_type       ENUM('WASH','IRON','DRY_CLEAN','FOLD','PICKUP','DELIVERY','MAINTENANCE','OTHER'),
    task_description VARCHAR(1000),
    priority        ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
    assigned_date   DATETIME,
    due_date        DATETIME,
    task_status     ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    assigned_by_user_id     BIGINT,
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_task_employee     FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_task_order        FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_task_assigned_by  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_tasks_employee_id  ON employee_tasks(employee_id);
CREATE INDEX idx_tasks_task_status  ON employee_tasks(task_status);

-- ============================================================
-- TABLE: attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    employee_id         BIGINT      NOT NULL,
    date                DATE        NOT NULL,
    check_in            TIME,
    check_out           TIME,
    attendance_status   ENUM('PRESENT','ABSENT','LATE','LEAVE') NOT NULL DEFAULT 'PRESENT',
    created_at          DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_employee_date (employee_id, date),
    CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date        ON attendance(date);

-- ============================================================
-- TABLE: pickups
-- ============================================================
CREATE TABLE IF NOT EXISTS pickups (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    order_id            BIGINT          UNIQUE,
    customer_id         BIGINT          NOT NULL,
    driver_id           BIGINT,
    pickup_address      VARCHAR(500)    NOT NULL,
    pickup_date         DATE,
    pickup_time_slot    VARCHAR(50),
    pickup_status       ENUM('REQUESTED','SCHEDULED','ASSIGNED','COLLECTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    special_instruction VARCHAR(500),
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pickup_order    FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_pickup_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_pickup_driver   FOREIGN KEY (driver_id)   REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pickups_customer_id    ON pickups(customer_id);
CREATE INDEX idx_pickups_driver_id      ON pickups(driver_id);
CREATE INDEX idx_pickups_pickup_date    ON pickups(pickup_date);
CREATE INDEX idx_pickups_pickup_status  ON pickups(pickup_status);

-- ============================================================
-- TABLE: deliveries
-- ============================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    order_id        BIGINT          UNIQUE,
    driver_id       BIGINT,
    customer_id     BIGINT,
    delivery_address VARCHAR(500)   NOT NULL,
    delivery_date   DATE,
    estimated_time  VARCHAR(50),
    delivery_status ENUM('PENDING','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_status  ENUM('NOT_APPLICABLE','PENDING','COLLECTED') NOT NULL DEFAULT 'NOT_APPLICABLE',
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_delivery_order    FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_delivery_driver   FOREIGN KEY (driver_id)   REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_delivery_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_deliveries_driver_id       ON deliveries(driver_id);
CREATE INDEX idx_deliveries_customer_id     ON deliveries(customer_id);
CREATE INDEX idx_deliveries_delivery_date   ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_delivery_status ON deliveries(delivery_status);

-- ============================================================
-- TABLE: feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    customer_id     BIGINT      NOT NULL,
    order_id        BIGINT,
    rating          TINYINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text   TEXT,
    status          ENUM('PUBLISHED','HIDDEN') NOT NULL DEFAULT 'PUBLISHED',
    created_at      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_feedback_order    FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_feedback_customer_id ON feedback(customer_id);
CREATE INDEX idx_feedback_rating      ON feedback(rating);

-- ============================================================
-- TABLE: complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    customer_id     BIGINT          NOT NULL,
    order_id        BIGINT,
    category        VARCHAR(100)    DEFAULT 'OTHER',
    subject         VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    priority        ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
    status          ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
    assigned_employee_id BIGINT,
    created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at     DATETIME,
    closed_at       DATETIME,
    resolution      TEXT,
    PRIMARY KEY (id),
    CONSTRAINT fk_complaint_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_complaint_order    FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaint_employee FOREIGN KEY (assigned_employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX idx_complaints_status      ON complaints(status);
CREATE INDEX idx_complaints_created_at  ON complaints(created_at);
CREATE INDEX idx_complaints_employee_id ON complaints(assigned_employee_id);
CREATE INDEX idx_complaints_category    ON complaints(category);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    title               VARCHAR(255)    NOT NULL,
    message             VARCHAR(1000)   NOT NULL,
    notification_type   ENUM('ORDER_UPDATE','PAYMENT_UPDATE','PICKUP_SCHEDULED','LOW_INVENTORY','EQUIPMENT_ALERT','COMPLAINT_UPDATE','GENERAL') NOT NULL DEFAULT 'GENERAL',
    is_read             TINYINT(1)      NOT NULL DEFAULT 0,
    created_at          DATETIME        DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
