USE cracker_shop_db;

-- Clear existing data if any (safely in order due to FK constraints)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE backups;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE salaries;
TRUNCATE TABLE attendance;
TRUNCATE TABLE workers;
TRUNCATE TABLE customers;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Users (Passwords: admin -> password123, staff -> staff123)
INSERT INTO users (username, password_hash, role, name, email) VALUES
('admin', '$2y$10$go5/A26lLiyZ2VrCff.u9uh0LfUQrCL6m4J/mKtpeVbVoHDxdPUjq', 'admin', 'SM Crackers Admin', 'admin@smcrackers.com'),
('staff', '$2y$10$ssN7smAjhnNhl/El2ShW6eRswJe85kjmrPYVaPp.lWTrRJYD7X0qK', 'staff', 'Billing Staff', 'staff@smcrackers.com');

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Sparklers', 'Sparkling sticks in green, red, and gold colors'),
('Ground Chakkars', 'Spinning wheels that light up the ground'),
('Flower Pots', 'Fountains of sparks in various heights'),
('Rockets', 'Aerial sound and light rockets'),
('Atom Bombs', 'Loud sounding sound-based crackers'),
('Gift Boxes', 'Assorted crackers packed in premium boxes');

-- Seed Products
-- Get category IDs manually or subqueries. Since we truncated, IDs are 1, 2, 3, 4, 5, 6
INSERT INTO products (category_id, name, price, stock, min_stock, image_url) VALUES
(1, '10cm Electric Sparklers', 25.00, 150, 20, ''),
(1, '15cm Color Sparklers', 45.00, 80, 20, ''),
(1, '30cm Green Sparklers', 75.00, 12, 15, ''), -- Low stock alert trigger
(2, 'Ground Chakkar Normal', 35.00, 200, 30, ''),
(2, 'Ground Chakkar Special', 60.00, 90, 25, ''),
(2, 'Ground Chakkar Deluxe', 100.00, 8, 10, ''), -- Low stock alert trigger
(3, 'Flower Pot Small', 40.00, 120, 20, ''),
(3, 'Flower Pot Special', 80.00, 70, 15, ''),
(3, 'Flower Pot Asima (Giant)', 180.00, 40, 10, ''),
(4, 'Lunik Rockets', 120.00, 50, 10, ''),
(4, 'Baby Rockets', 50.00, 110, 15, ''),
(5, 'Hydro Bomb (Standard)', 65.00, 95, 20, ''),
(5, 'King of Bombs (Loud)', 120.00, 5, 10, ''), -- Low stock alert trigger
(6, 'Super Diwali Gift Box (30 Items)', 450.00, 30, 5, ''),
(6, 'Royal Elite Gift Box (50 Items)', 850.00, 15, 5, '');

-- Seed Customers
INSERT INTO customers (name, phone, email, address) VALUES
('Rajesh Kumar', '9876543210', 'rajesh@gmail.com', '123, Main Street, Sivakasi, Tamil Nadu'),
('Suresh Melwani', '9123456789', 'suresh@hotmail.com', '45, Gandhi Road, Chennai, Tamil Nadu'),
('Ramesh Patel', '8765432109', 'ramesh@yahoo.com', '12, Ring Road, Madurai, Tamil Nadu');

-- Seed Workers
INSERT INTO workers (worker_id, name, phone, role, salary_type, salary_rate, aadhaar, status) VALUES
('WRK001', 'Anbazhagan P.', '9988776655', 'Packer', 'Daily', 450.00, '1234-5678-9012', 'Active'),
('WRK002', 'Muthu Selvam', '9876987611', 'Loader', 'Daily', 500.00, '9876-5432-1098', 'Active'),
('WRK003', 'Karthick R.', '9000111222', 'Supervisor', 'Monthly', 15000.00, '4567-8901-2345', 'Active');

-- Seed sample attendance for the last 5 days
-- Let's calculate dates for June 1st to June 5th, 2026
INSERT INTO attendance (worker_id, date, status) VALUES
(1, '2026-06-01', 'Present'),
(2, '2026-06-01', 'Present'),
(3, '2026-06-01', 'Present'),
(1, '2026-06-02', 'Present'),
(2, '2026-06-02', 'HalfDay'),
(3, '2026-06-02', 'Present'),
(1, '2026-06-03', 'Present'),
(2, '2026-06-03', 'Absent'),
(3, '2026-06-03', 'Present'),
(1, '2026-06-04', 'Present'),
(2, '2026-06-04', 'Present'),
(3, '2026-06-04', 'Present'),
(1, '2026-06-05', 'Present'),
(2, '2026-06-05', 'Present'),
(3, '2026-06-05', 'Present');
