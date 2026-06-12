# SM Crackers Management System Installation Guide

This document describes how to install and run the **SM Crackers Management System** ("cracker-shop") on your local computer or production server.

## Prerequisites
* **Backend Hosting**: PHP 8.0 or higher with PDO and fileinfo extensions enabled.
* **Database**: MySQL 5.7+ or MariaDB 10.3+.
* **Frontend Tools (Local Development)**: Node.js (v18+) and npm (v9+).

---

## 1. Database Setup
1. Open your MySQL database manager (like **phpMyAdmin** or MySQL CLI).
2. Create a new database named `cracker_shop_db`:
   ```sql
   CREATE DATABASE cracker_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the database schema from the `database/schema.sql` file:
   * **In phpMyAdmin**: Click the database name, go to **Import**, select `database/schema.sql`, and click **Go**.
   * **In MySQL CLI**: 
     ```bash
     mysql -u root -p cracker_shop_db < database/schema.sql
     ```
4. (Optional) Import seed data for default admin users and cracker products from the `database/seed.sql` file:
   ```bash
   mysql -u root -p cracker_shop_db < database/seed.sql
   ```

---

## 2. Backend PHP API Configuration
1. Open the file `backend/config/db.php` in a text editor.
2. Edit the database credentials to match your MySQL server configuration:
   ```php
   $host = 'localhost';      // Server host
   $db   = 'cracker_shop_db'; // Database name
   $user = 'root';            // Database username
   $pass = '';                // Database password
   ```
3. Verify that the server has write permissions for the `backend/uploads/` and `backend/backups/` directories (required for product image uploading and database backup utilities).
4. Run the PHP built-in server locally for testing or upload the `backend` folder directly to your web server:
   ```bash
   cd backend
   php -S localhost:8000
   ```

---

## 3. Frontend React Setup (Local Dev)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory to configure the backend API location (or skip it to use the default localhost fallback):
   ```env
   VITE_API_URL=http://localhost/smcrackers/cracker-shop/backend
   ```
4. Launch the local development server:
   ```bash
   npm run dev
   ```
   The application will launch on `http://localhost:3000`.

---

## 4. Default Logins
If you imported the `database/seed.sql` file, you can log in using these credentials:

| Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| **admin** | `password123` | **Admin** | Full access (System settings, Backups, Deletions) |
| **staff** | `staff123` | **Staff** | POS Billing, Catalog management, Attendance |
