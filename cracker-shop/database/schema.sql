CREATE DATABASE IF NOT EXISTS cracker_shop_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cracker_shop_db;

-- 1. Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    last_login DATETIME DEFAULT NULL,
    current_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_username (username)
) ENGINE=InnoDB;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Products Table (Inventory tracking)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    image_url VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_name (name),
    INDEX idx_products_category (category_id)
) ENGINE=InnoDB;

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone)
) ENGINE=InnoDB;

-- 5. Orders/Invoices Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT DEFAULT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- GST rate (e.g. 18.00)
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- GST amount
    convenience_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('Cash', 'Card', 'UPI') NOT NULL DEFAULT 'Cash',
    status ENUM('Paid', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Paid',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_orders_invoice (invoice_no),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_date (created_at)
) ENGINE=InnoDB;

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- 7. Workers Table
CREATE TABLE IF NOT EXISTS workers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id VARCHAR(50) NOT NULL UNIQUE, -- Unique code like EMP001
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    role VARCHAR(100) NOT NULL,
    salary_type ENUM('Daily', 'Monthly') NOT NULL DEFAULT 'Daily',
    salary_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    aadhaar VARCHAR(20) NOT NULL,
    image_url VARCHAR(255) DEFAULT '',
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workers_code (worker_id)
) ENGINE=InnoDB;

-- 8. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'HalfDay') NOT NULL DEFAULT 'Present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_worker_date (worker_id, date),
    INDEX idx_attendance_date (date)
) ENGINE=InnoDB;

-- 9. Salaries Table
CREATE TABLE IF NOT EXISTS salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    worker_id INT NOT NULL,
    month INT NOT NULL, -- Numeric month (1-12)
    year INT NOT NULL,  -- Year (e.g. 2026)
    present_days DECIMAL(5, 1) NOT NULL DEFAULT 0.0,
    absent_days DECIMAL(5, 1) NOT NULL DEFAULT 0.0,
    salary_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Base calculated
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('Paid', 'Pending') NOT NULL DEFAULT 'Pending',
    payment_date DATETIME DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_worker_salary_period (worker_id, month, year)
) ENGINE=InnoDB;

-- 10. Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. LOGIN, ADD_PRODUCT, DELETE_INVOICE, DB_BACKUP
    details TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activity_logs_date (created_at)
) ENGINE=InnoDB;

-- 11. Database Backups Table
CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
