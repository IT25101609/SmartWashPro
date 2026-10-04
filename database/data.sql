-- ============================================================
-- SmartWash Pro - Sample Data
-- Crystal Clean Laundry (Pvt) Ltd.
-- ============================================================
-- BCrypt hash for 'password123':
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ============================================================

USE smartwash_pro;

-- ============================================================
-- USERS (6 demo accounts + additional customers)
-- ============================================================
INSERT INTO users (full_name, email, phone_number, address, password_hash, role, status, created_at) VALUES
('Demo Customer',       'customer@smartwash.com',   '0771234567', '45 Lake Road, Colombo 06',        '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'CUSTOMER',         'ACTIVE', '2024-01-01 08:00:00'),
('Kamal Silva',         'manager@smartwash.com',    '0712345678', '12 Main Street, Colombo 03',      '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'BRANCH_MANAGER',   'ACTIVE', '2024-01-01 08:00:00'),
('Nimal Perera',        'reception@smartwash.com',  '0723456789', '78 Galle Road, Colombo 04',       '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'RECEPTIONIST',     'ACTIVE', '2024-01-01 08:00:00'),
('Sunil Fernando',      'staff@smartwash.com',      '0734567890', '23 High Level Road, Maharagama',  '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'LAUNDRY_STAFF',    'ACTIVE', '2024-01-01 08:00:00'),
('Ruwan Jayasinghe',    'driver@smartwash.com',     '0745678901', '15 Baseline Road, Dehiwala',      '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'DELIVERY_DRIVER',  'ACTIVE', '2024-01-01 08:00:00'),
('Anusha Wickrama',     'finance@smartwash.com',    '0756789012', '34 Duplication Road, Colombo 04', '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'FINANCE_LEAD',     'ACTIVE', '2024-01-01 08:00:00'),
-- Additional customers
('Amara Dissanayake',   'amara@example.com',        '0767890123', '56 Flower Road, Colombo 07',      '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'CUSTOMER',         'ACTIVE', '2024-02-15 09:00:00'),
('Priya Senanayake',    'priya@example.com',        '0778901234', '89 Bauddaloka Mawatha, Col 08',   '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'CUSTOMER',         'ACTIVE', '2024-03-10 10:00:00'),
('Dilshan Madusanka',   'dilshan@example.com',      '0789012345', '12 Rajagiriya, Sri Jayawardena',  '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'CUSTOMER',         'ACTIVE', '2024-04-05 11:00:00'),
('Sanduni Rathnayake',  'sanduni@example.com',      '0790123456', '67 Old Kelaniya Road, Kelaniya',  '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'CUSTOMER',         'ACTIVE', '2024-05-20 12:00:00'),
-- Additional staff
('Chamara Bandara',     'chamara.staff@smartwash.com', '0701234567', 'Nugegoda, Colombo',            '$2a$10$93WcIRliWOfMQRcRJBmvg.Dr5dPYj/5SNZbxPVSGFU4g3PBPTiUw.', 'LAUNDRY_STAFF',    'ACTIVE', '2024-01-15 08:00:00');

-- ============================================================
-- CUSTOMERS (profiles)
-- ============================================================
INSERT INTO customers (user_id, loyalty_points, total_orders, total_spent) VALUES
(1,  150, 8,  22500.00),  -- Demo Customer
(7,  80,  4,  11200.00),  -- Amara
(8,  200, 12, 38000.00),  -- Priya
(9,  60,  3,  8500.00),   -- Dilshan
(10, 120, 6,  16800.00);  -- Sanduni

-- ============================================================
-- EMPLOYEES (profiles)
-- ============================================================
INSERT INTO employees (user_id, role, employment_status, hire_date) VALUES
(2,  'BRANCH_MANAGER',  'ACTIVE', '2022-01-15'),
(3,  'RECEPTIONIST',    'ACTIVE', '2022-03-01'),
(4,  'LAUNDRY_STAFF',   'ACTIVE', '2022-06-01'),
(5,  'DELIVERY_DRIVER', 'ACTIVE', '2023-01-10'),
(6,  'FINANCE_LEAD',    'ACTIVE', '2022-02-14'),
(11, 'LAUNDRY_STAFF',   'ACTIVE', '2024-01-15');

-- ============================================================
-- LAUNDRY SERVICES
-- ============================================================
INSERT INTO laundry_services (service_name, category, description, price, pricing_type, available) VALUES
('Standard Washing',   'WASH',        'Machine wash with eco-friendly detergent',        300.00, 'PER_KG',   1),
('Dry Cleaning',       'DRY_CLEAN',   'Professional solvent-based dry cleaning',          750.00, 'PER_ITEM', 1),
('Ironing',            'IRON',        'Professional steam ironing service',               80.00,  'PER_ITEM', 1),
('Wash & Iron',        'COMBO',       'Complete wash and iron combo',                     350.00, 'PER_KG',   1),
('Express Service',    'EXPRESS',     '24-hour turnaround for urgent items',              500.00, 'PER_KG',   1),
('Folding Service',    'FOLD',        'Professional folding and packaging',               50.00,  'PER_ITEM', 1),
('Curtain Cleaning',   'SPECIAL',     'Professional curtain washing and ironing',         1200.00,'FIXED',    1),
('Blanket Washing',    'SPECIAL',     'Heavy item washing for blankets & duvets',        400.00, 'PER_ITEM', 1),
('Shoe Cleaning',      'SPECIAL',     'Deep cleaning for sneakers and leather shoes',    350.00, 'PER_ITEM', 1),
('Stain Treatment',    'TREATMENT',   'Specialized stain removal treatment',             250.00, 'PER_ITEM', 1);

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, status) VALUES
('Unilever Ceylon Ltd',     'Rajith Mendis',   '0112345678', 'rajith@unilever.lk',    'P.O. Box 500, Colombo 02',     'ACTIVE'),
('Hemas Industries Ltd',    'Shehan Fernando', '0113456789', 'shehan@hemas.lk',       '75 Braybrooke Place, Col 02',  'ACTIVE'),
('CleanPro Supplies',       'Mahesh Gupta',    '0114567890', 'info@cleanpro.lk',      'Industrial Zone, Ekala',       'ACTIVE');

-- ============================================================
-- INVENTORY
-- ============================================================
INSERT INTO inventory (item_name, category, quantity, unit, minimum_stock_level, supplier_id, unit_cost) VALUES
('Ariel Washing Powder 25kg',   'DETERGENT',        48.0,  'KG',    10.0,  1, 4500.00),
('Surf Excel 10kg',             'DETERGENT',        25.0,  'KG',    5.0,   1, 2200.00),
('Dry Cleaning Solvent 20L',    'CHEMICAL',         15.0,  'LITRE', 5.0,   2, 8500.00),
('Fabric Softener 5L',          'CHEMICAL',         30.0,  'LITRE', 8.0,   2, 1200.00),
('Stain Remover Spray 1L',      'CHEMICAL',         3.0,   'LITRE', 5.0,   2, 650.00),  -- LOW STOCK
('Laundry Bags - Large',        'PACKAGING',        200.0, 'UNIT',  50.0,  3, 25.00),
('Laundry Bags - Small',        'PACKAGING',        350.0, 'UNIT',  80.0,  3, 15.00),
('Plastic Hangers',             'PACKAGING',        500.0, 'UNIT',  100.0, 3, 8.00),
('Receipt Paper Rolls',         'PACKAGING',        4.0,   'UNIT',  10.0,  3, 180.00),  -- LOW STOCK
('Washing Machine Filters',     'EQUIPMENT_PART',   5.0,   'UNIT',  3.0,   3, 2500.00);

-- ============================================================
-- EQUIPMENT
-- ============================================================
INSERT INTO equipment (equipment_name, equipment_type, model, serial_number, purchase_date, status, last_maintenance_date, next_maintenance_date) VALUES
('Industrial Washer A',     'WASHING_MACHINE',  'LG WD-T1350QP',    'LG-WM-2022-001', '2022-01-15', 'ACTIVE',             '2024-07-01', '2024-09-01'),
('Industrial Washer B',     'WASHING_MACHINE',  'Samsung WW90T',    'SAM-WM-2022-002','2022-01-15', 'ACTIVE',             '2024-06-15', '2024-08-01'),
('Industrial Dryer A',      'DRYER',            'Electrolux T4900', 'ELX-DR-2022-001','2022-01-15', 'ACTIVE',             '2024-07-01', '2024-09-01'),
('Steam Iron Press A',      'IRON',             'Gravity GS-5000',  'GRA-IR-2023-001','2023-03-01', 'ACTIVE',             '2024-05-01', '2024-07-20'),
('Dry Cleaning Machine',    'DRY_CLEANER',      'Maestrex 220',     'MAE-DC-2022-001','2022-06-01', 'UNDER_MAINTENANCE',  '2024-07-15', '2024-10-01'),
('Folding Machine',         'FOLDER',           'Renzacci FC700',   'REN-FO-2023-001','2023-01-10', 'ACTIVE',             '2024-06-01', '2024-09-15');

-- ============================================================
-- ORDERS (sample orders across various statuses)
-- ============================================================
INSERT INTO orders (customer_id, receptionist_id, order_date, total_quantity, total_price, special_instructions, order_status, created_at) VALUES
(1, NULL, '2024-08-01 09:30:00', 5,  1500.00, 'Please handle delicately. Cold wash preferred.', 'DELIVERED',  '2024-08-01 09:30:00'),
(1, NULL, '2024-08-05 11:00:00', 3,  2250.00, 'Separate whites and colors.',                    'DELIVERED',  '2024-08-05 11:00:00'),
(1, NULL, '2024-08-08 10:00:00', 4,  1200.00, 'Express service needed for formal wear.',        'PROCESSING', '2024-08-08 10:00:00'),
(2, 3,    '2024-08-03 14:00:00', 8,  2400.00, NULL,                                             'DELIVERED',  '2024-08-03 14:00:00'),
(3, NULL, '2024-08-04 09:00:00', 12, 4200.00, 'Blankets need extra rinse cycle.',               'DELIVERED',  '2024-08-04 09:00:00'),
(3, NULL, '2024-08-07 16:00:00', 5,  1750.00, NULL,                                             'IN_WASH',    '2024-08-07 16:00:00'),
(4, 3,    '2024-08-06 11:30:00', 3,  900.00,  'Dry cleaning for suits only.',                   'READY',      '2024-08-06 11:30:00'),
(5, NULL, '2024-08-08 08:00:00', 6,  2100.00, 'Do not iron polyester items.',                   'PLACED',     '2024-08-08 08:00:00');

-- ============================================================
-- ORDER ITEMS
-- ============================================================
INSERT INTO order_items (order_id, service_id, service_name, quantity, unit_price, subtotal, special_instruction) VALUES
-- Order 1
(1, 1, 'Standard Washing', 5.0, 300.00, 1500.00, 'Cold wash, delicate cycle'),
-- Order 2
(2, 2, 'Dry Cleaning',     2.0, 750.00, 1500.00, 'Business suits'),
(2, 3, 'Ironing',          3.0, 80.00,  240.00,  NULL),
(2, 6, 'Folding Service',  7.0, 50.00,  350.00,  NULL),
-- Order 3
(3, 5, 'Express Service',  2.0, 500.00, 1000.00, 'Urgent for event tomorrow'),
(3, 3, 'Ironing',          2.0, 80.00,  160.00,  NULL),
-- Order 4
(4, 1, 'Standard Washing', 8.0, 300.00, 2400.00, NULL),
-- Order 5
(5, 8, 'Blanket Washing',  3.0, 400.00, 1200.00, 'Extra rinse'),
(5, 1, 'Standard Washing', 6.0, 300.00, 1800.00, NULL),
(5, 3, 'Ironing',          15.0, 80.00, 1200.00, NULL),
-- Order 6
(6, 1, 'Standard Washing', 5.0, 300.00, 1500.00, NULL),
-- Order 7
(7, 2, 'Dry Cleaning',     3.0, 750.00, 2250.00, 'Suits only, handle carefully'),
-- Order 8
(8, 4, 'Wash & Iron',      6.0, 350.00, 2100.00, 'Do not iron polyester');

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================
INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, remarks, changed_at) VALUES
-- Order 1 (DELIVERED)
(1, NULL,           'PLACED',           1, 'Order placed by customer',           '2024-08-01 09:30:00'),
(1, 'PLACED',       'RECEIVED',         3, 'Order received at reception',         '2024-08-01 10:15:00'),
(1, 'RECEIVED',     'ASSIGNED',         2, 'Assigned to laundry staff',           '2024-08-01 11:00:00'),
(1, 'ASSIGNED',     'PROCESSING',       4, 'Started processing',                  '2024-08-01 13:00:00'),
(1, 'PROCESSING',   'IN_WASH',          4, 'Items in washing machine A',          '2024-08-01 14:00:00'),
(1, 'IN_WASH',      'READY',            4, 'Washing complete, items ready',       '2024-08-01 17:00:00'),
(1, 'READY',        'OUT_FOR_DELIVERY', 5, 'Driver Ruwan out for delivery',       '2024-08-02 09:00:00'),
(1, 'OUT_FOR_DELIVERY', 'DELIVERED',    5, 'Successfully delivered to customer',  '2024-08-02 11:30:00'),
-- Order 3 (PROCESSING)
(3, NULL,           'PLACED',           1, 'Order placed',                        '2024-08-08 10:00:00'),
(3, 'PLACED',       'RECEIVED',         3, 'Received at branch',                  '2024-08-08 10:30:00'),
(3, 'RECEIVED',     'ASSIGNED',         2, 'Assigned to Sunil',                   '2024-08-08 11:00:00'),
(3, 'ASSIGNED',     'PROCESSING',       4, 'Processing started',                  '2024-08-08 13:00:00'),
-- Order 6 (IN_WASH)
(6, NULL,           'PLACED',           3, 'Order placed at reception',           '2024-08-07 16:00:00'),
(6, 'PLACED',       'RECEIVED',         3, 'Received',                            '2024-08-07 16:15:00'),
(6, 'RECEIVED',     'ASSIGNED',         2, 'Assigned',                            '2024-08-07 17:00:00'),
(6, 'ASSIGNED',     'PROCESSING',      11, 'Started processing',                  '2024-08-08 08:00:00'),
(6, 'PROCESSING',   'IN_WASH',         11, 'In wash cycle',                       '2024-08-08 09:00:00'),
-- Order 7 (READY)
(7, NULL,           'PLACED',           4, 'Order placed by receptionist',        '2024-08-06 11:30:00'),
(7, 'PLACED',       'RECEIVED',         3, 'Received',                            '2024-08-06 11:45:00'),
(7, 'RECEIVED',     'ASSIGNED',         2, 'Assigned for dry cleaning',           '2024-08-06 12:00:00'),
(7, 'ASSIGNED',     'PROCESSING',       4, 'Processing',                          '2024-08-06 14:00:00'),
(7, 'PROCESSING',   'IN_WASH',          4, 'In dry cleaning machine',             '2024-08-06 15:00:00'),
(7, 'IN_WASH',      'READY',            4, 'Dry cleaning complete',               '2024-08-07 10:00:00'),
-- Order 8 (PLACED)
(8, NULL,           'PLACED',           8, 'Order placed by customer online',     '2024-08-08 08:00:00');

-- ============================================================
-- PAYMENTS
-- ============================================================
INSERT INTO payments (order_id, customer_id, amount, payment_method, payment_status, transaction_reference, payment_date, receipt_number, created_at) VALUES
(1, 1, 1500.00, 'CASH',            'PAID',    NULL,           '2024-08-02 11:30:00', 'RCP-20240802-0001', '2024-08-01 09:30:00'),
(2, 1, 2250.00, 'CARD',            'PAID',    'TXN-VISA-1234','2024-08-05 16:00:00', 'RCP-20240805-0002', '2024-08-05 11:00:00'),
(3, 1, 1200.00, 'DIGITAL_PAYMENT', 'PENDING', NULL,           NULL,                  'RCP-20240808-0003', '2024-08-08 10:00:00'),
(4, 2, 2400.00, 'CASH',            'PAID',    NULL,           '2024-08-03 17:00:00', 'RCP-20240803-0004', '2024-08-03 14:00:00'),
(5, 3, 4200.00, 'CARD',            'PAID',    'TXN-MC-5678',  '2024-08-06 10:00:00', 'RCP-20240806-0005', '2024-08-04 09:00:00'),
(6, 3, 1750.00, 'CASH',            'PENDING', NULL,           NULL,                  'RCP-20240807-0006', '2024-08-07 16:00:00'),
(7, 4, 2250.00, 'DIGITAL_PAYMENT', 'PENDING', NULL,           NULL,                  'RCP-20240806-0007', '2024-08-06 11:30:00'),
(8, 5, 2100.00, 'CASH_ON_DELIVERY','PENDING', NULL,           NULL,                  'RCP-20240808-0008', '2024-08-08 08:00:00');

-- ============================================================
-- PICKUPS
-- ============================================================
INSERT INTO pickups (order_id, customer_id, driver_id, pickup_address, pickup_date, pickup_time_slot, pickup_status, special_instruction) VALUES
(1, 1, 4, '45 Lake Road, Colombo 06',          '2024-08-01', '09:00-11:00', 'COMPLETED',  'Ring doorbell twice'),
(3, 1, 4, '45 Lake Road, Colombo 06',          '2024-08-08', '10:00-12:00', 'COLLECTED',  NULL),
(8, 5, 4, '67 Old Kelaniya Road, Kelaniya',    '2024-08-09', '14:00-16:00', 'SCHEDULED',  'Call before arriving');

-- ============================================================
-- DELIVERIES
-- ============================================================
INSERT INTO deliveries (order_id, driver_id, customer_id, delivery_address, delivery_date, delivery_status, payment_status) VALUES
(1, 4, 1, '45 Lake Road, Colombo 06',         '2024-08-02', 'DELIVERED',        'NOT_APPLICABLE'),
(2, 4, 1, '45 Lake Road, Colombo 06',         '2024-08-07', 'DELIVERED',        'NOT_APPLICABLE'),
(7, 4, 4, '12 Rajagiriya, Sri Jayawardena',   '2024-08-09', 'PENDING',          'NOT_APPLICABLE');

-- ============================================================
-- EMPLOYEE TASKS
-- ============================================================
INSERT INTO employee_tasks (employee_id, order_id, task_type, task_description, priority, task_status, assigned_by_user_id, due_date) VALUES
(3, 3, 'WASH',         'Process express service order #3 - formal wear',     'HIGH',   'IN_PROGRESS', 2, '2024-08-09 17:00:00'),
(3, 6, 'WASH',         'Complete washing for order #6',                       'MEDIUM', 'IN_PROGRESS', 2, '2024-08-09 12:00:00'),
(3, 7, 'DRY_CLEAN',    'Pack and label order #7 - ready for delivery',        'HIGH',   'COMPLETED',   2, '2024-08-07 17:00:00'),
(3, 8, 'WASH',         'Process new order #8 - wash and iron',                'MEDIUM', 'PENDING',     2, '2024-08-10 17:00:00'),
(6, NULL, 'MAINTENANCE','Monthly maintenance check on Industrial Washer B',   'LOW',    'PENDING',     2, '2024-08-15 17:00:00');

-- ============================================================
-- ATTENDANCE (recent records)
-- ============================================================
INSERT INTO attendance (employee_id, date, check_in, check_out, attendance_status) VALUES
-- Employee 2 (Manager)
(1, '2024-08-05', '08:00:00', '17:30:00', 'PRESENT'),
(1, '2024-08-06', '08:15:00', '17:30:00', 'LATE'),
(1, '2024-08-07', '08:00:00', '18:00:00', 'PRESENT'),
(1, '2024-08-08', '08:00:00', '17:30:00', 'PRESENT'),
-- Employee 3 (Receptionist)
(2, '2024-08-05', '07:55:00', '17:00:00', 'PRESENT'),
(2, '2024-08-06', '08:00:00', '17:00:00', 'PRESENT'),
(2, '2024-08-07', NULL,       NULL,       'ABSENT'),
(2, '2024-08-08', '08:05:00', '17:00:00', 'PRESENT'),
-- Employee 4 (Laundry Staff)
(3, '2024-08-05', '07:00:00', '16:30:00', 'PRESENT'),
(3, '2024-08-06', '07:00:00', '16:30:00', 'PRESENT'),
(3, '2024-08-07', '07:00:00', '16:30:00', 'PRESENT'),
(3, '2024-08-08', '07:00:00', '16:30:00', 'PRESENT');

-- ============================================================
-- MAINTENANCE RECORDS
-- ============================================================
INSERT INTO maintenance (equipment_id, scheduled_date, completed_date, maintenance_type, description, performed_by, cost, status) VALUES
(5, '2024-07-15', '2024-07-15', 'ROUTINE',     'Monthly cleaning and inspection of dry cleaning machine',        'TechCare Services', 15000.00, 'COMPLETED'),
(1, '2024-07-01', '2024-07-01', 'ROUTINE',     'Filter replacement and drum inspection for Washer A',           'Sunil Fernando',    5000.00,  'COMPLETED'),
(5, '2024-08-08', NULL,         'REPAIR',       'Electrical fault in control panel, under repair',               'TechCare Services', NULL,     'IN_PROGRESS'),
(2, '2024-09-01', NULL,         'ROUTINE',      'Scheduled quarterly maintenance for Washer B',                  NULL,               NULL,     'SCHEDULED');

-- ============================================================
-- BREAKDOWNS
-- ============================================================
INSERT INTO breakdowns (equipment_id, reported_date, description, severity, status, created_at) VALUES
(5, '2024-08-07', 'Control panel display not responding, machine not starting',  'HIGH',    'IN_REPAIR',  '2024-08-07 09:00:00'),
(4, '2024-07-20', 'Steam pressure dropping intermittently during operation',      'MEDIUM',  'REPAIRED',   '2024-07-20 14:00:00');

-- ============================================================
-- FEEDBACK
-- ============================================================
INSERT INTO feedback (customer_id, order_id, rating, feedback_text, status, created_at) VALUES
(1, 1, 5, 'Excellent service! Clothes came back perfectly clean and neatly folded. Very happy with SmartWash Pro!', 'PUBLISHED', '2024-08-03 10:00:00'),
(1, 2, 4, 'Good service overall. Dry cleaning was perfect. Slight delay in delivery but understandable.', 'PUBLISHED', '2024-08-07 15:00:00'),
(2, 4, 5, 'Outstanding! Fast service and great quality. Will definitely use again.', 'PUBLISHED', '2024-08-05 11:00:00'),
(3, 5, 4, 'The blankets came out very clean. Took a bit longer than expected but quality was top notch.', 'PUBLISHED', '2024-08-07 09:00:00'),
(5, NULL, 3, 'Service is generally good but pricing seems a bit high for the quantity.', 'PUBLISHED', '2024-08-06 14:00:00');

-- ============================================================
-- COMPLAINTS
-- ============================================================
INSERT INTO complaints (customer_id, order_id, subject, description, priority, status, created_at, resolved_at, resolution) VALUES
(1, 2, 'Delayed Delivery', 'My delivery was supposed to arrive on Friday but came on Saturday. This caused inconvenience as I needed the clothes for an event.', 'MEDIUM', 'RESOLVED', '2024-08-07 10:00:00', '2024-08-07 16:00:00', 'We sincerely apologize for the delay. We have offered a 10% discount on the next order as compensation. Delivery team has been instructed to improve punctuality.'),
(4, 7, 'Missing Item', 'One of my dress shirts appears to be missing from the returned items. The order was for 3 items but only 2 were returned.', 'HIGH', 'IN_PROGRESS', '2024-08-08 09:00:00', NULL, NULL),
(5, NULL, 'General Inquiry', 'I would like to know if you offer corporate accounts for bulk laundry orders.', 'LOW', 'CLOSED', '2024-08-01 11:00:00', '2024-08-01 14:00:00', 'Yes, we offer corporate accounts! Contacted customer with details about our B2B packages.');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at) VALUES
-- Customer 1
(1, 'Order Placed Successfully', 'Your order #3 has been placed. Total: Rs. 1,200.00', 'ORDER_UPDATE', 0, '2024-08-08 10:00:00'),
(1, 'Order Status Updated', 'Your order #3 status is now: PROCESSING', 'ORDER_UPDATE', 0, '2024-08-08 13:00:00'),
(1, 'Payment Reminder', 'Payment of Rs. 1,200.00 is pending for order #3', 'PAYMENT_UPDATE', 0, '2024-08-08 10:01:00'),
(1, 'Pickup Scheduled', 'Your pickup has been scheduled for 2024-08-08, slot: 10:00-12:00', 'PICKUP_SCHEDULED', 1, '2024-08-08 10:02:00'),
(1, 'Order Delivered', 'Your order #1 has been delivered successfully. Thank you!', 'ORDER_UPDATE', 1, '2024-08-02 11:30:00'),
-- Manager
(2, 'Low Stock Alert', 'Item Stain Remover Spray 1L is below minimum stock level. Remaining: 3.0', 'LOW_INVENTORY', 0, '2024-08-08 08:00:00'),
(2, 'Low Stock Alert', 'Item Receipt Paper Rolls is below minimum stock level. Remaining: 4.0', 'LOW_INVENTORY', 0, '2024-08-08 08:01:00'),
(2, 'Equipment Alert', 'Dry Cleaning Machine requires immediate maintenance attention', 'EQUIPMENT_ALERT', 0, '2024-08-07 09:00:00'),
(2, 'New Complaint', 'A new HIGH priority complaint has been submitted by customer Amara Dissanayake', 'COMPLAINT_UPDATE', 0, '2024-08-08 09:00:00'),
(2, 'New Order', 'New order #8 placed by Sanduni Rathnayake. Total: Rs. 2,100.00', 'ORDER_UPDATE', 0, '2024-08-08 08:00:00'),
-- Customer 5
(8, 'Order Placed Successfully', 'Your order #8 has been placed. Total: Rs. 2,100.00', 'ORDER_UPDATE', 0, '2024-08-08 08:00:00'),
(8, 'Pickup Scheduled', 'Pickup confirmed for 2024-08-09, 14:00-16:00', 'PICKUP_SCHEDULED', 0, '2024-08-08 08:01:00');
