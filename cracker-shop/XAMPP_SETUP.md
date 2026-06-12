# SM Crackers Management System XAMPP Setup Guide

Since you are running XAMPP on Windows, follow these instructions to configure and run the full-stack system locally.

---

## 1. Setup Files in `htdocs`
1. Ensure your XAMPP installation is running, and the **Apache** and **MySQL** services are started in the XAMPP Control Panel.
2. Locate your project inside `E:\XAMPP\htdocs\smcrackers\cracker-shop\`.
3. If you want the backend to be served directly by Apache:
   * Keep the `backend` folder where it is.
   * In this structure, the REST API endpoints will be accessible at:
     `http://localhost/smcrackers/cracker-shop/backend/`

---

## 2. Import Database via phpMyAdmin
1. Open your web browser and go to:
   `http://localhost/phpmyadmin/`
2. Click on the **Databases** tab in the top menu.
3. In the **Create database** field:
   * Enter database name: `cracker_shop_db`
   * Select collation: `utf8mb4_unicode_ci`
   * Click **Create**.
4. Click on the newly created `cracker_shop_db` in the left sidebar.
5. Click the **Import** tab in the top menu.
6. Click **Choose File** and navigate to:
   `E:\XAMPP\htdocs\smcrackers\cracker-shop\database\schema.sql`
7. Click the **Import** button at the bottom of the page.
8. Repeat steps 5-7 to import `database/seed.sql` to populate sample data.

---

## 3. Verify connection configuration
1. Open `E:\XAMPP\htdocs\smcrackers\cracker-shop\backend\config\db.php` in your text editor.
2. Verify that the credentials match your local setup:
   ```php
   $host = 'localhost';
   $db   = 'cracker_shop_db';
   $user = 'root';
   $pass = ''; // Default XAMPP MySQL password is empty
   ```

---

## 4. Run the React Frontend
You have two options to run the frontend locally:

### Option A: Local Dev Server (Recommended for changes)
1. Open PowerShell/CMD and navigate to the frontend directory:
   ```powershell
   cd E:\XAMPP\htdocs\smcrackers\cracker-shop\frontend
   ```
2. Run npm development:
   ```powershell
   npm run dev
   ```
3. Open your browser to `http://localhost:3000`.

---

### Option B: Build and Serve via Apache
To run both backend and frontend on a single Apache port:
1. Open PowerShell/CMD and build the React frontend:
   ```powershell
   cd E:\XAMPP\htdocs\smcrackers\cracker-shop\frontend
   npm run build
   ```
2. This creates a compiled `dist` directory in `frontend/dist/`.
3. Move/Copy all files from `frontend/dist/` into a new folder:
   `E:\XAMPP\htdocs\smcrackers\cracker-shop\public_html`
4. Now, you can access the frontend in your browser via:
   `http://localhost/smcrackers/cracker-shop/public_html/`
   *(Ensure you update the VITE_API_URL in the .env before building if you run in this configuration).*
