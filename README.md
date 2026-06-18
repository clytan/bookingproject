# Bus Booking App

Full-stack bus booking application with separate user and admin interfaces.

## Project Structure

```
bookingproject/
├── user-frontend/      # Next.js 14 — landing & booking flow (port 3000)
├── admin-frontend/     # Next.js 14 — admin dashboard       (port 3001)
├── api/                # PHP 7+ backend (served by XAMPP Apache)
│   ├── config/
│   │   ├── db.php      # MySQL connection (PDO)
│   │   └── jwt.php     # JWT helpers (HS256, no deps)
│   ├── admin/
│   │   ├── login.php   # POST → returns JWT
│   │   ├── me.php      # GET  → current admin (auth required)
│   │   └── seed.php    # One-time: creates default admin
│   ├── helpers.php
│   ├── index.php       # API root
│   └── .htaccess
└── database/
    └── schema.sql      # Run this in phpMyAdmin to create tables
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + React 18
- **Backend:** PHP 7+ (vanilla, no framework, no composer)
- **DB:** MySQL via phpMyAdmin (local XAMPP, production GoDaddy)
- **Auth:** JWT (HS256) stored in browser localStorage

## Local Setup (XAMPP)

### 1. Create the database

1. Start **XAMPP** → run **Apache** and **MySQL**.
2. Open **phpMyAdmin**: http://localhost/phpmyadmin
3. Go to **SQL** tab → paste contents of `database/schema.sql` → **Go**.
   This creates `busgo_db` with all tables and sample routes/buses.

### 2. Seed the default admin

Visit once in your browser:
**http://localhost/bookingproject/api/admin/seed.php**

You should see:
```
✅ Default admin created.
   Username: admin
   Password: admin123
```

After this works, **delete `api/admin/seed.php`** for safety.

### 3. Start the admin frontend

```bash
cd admin-frontend
npm install      # if you haven't already
npm run dev
```
Open http://localhost:3001 → you'll be redirected to `/login`.
Sign in with `admin / admin123`.

### 4. (Optional) Start the user frontend

```bash
cd user-frontend
npm install
npm run dev
```
Open http://localhost:3000

## API Endpoints (implemented so far)

| Method | URL | Description |
|--------|-----|-------------|
| GET    | `/api/`                 | Lists endpoints |
| POST   | `/api/admin/login.php`  | `{username, password}` → `{token, admin}` |
| GET    | `/api/admin/me.php`     | Header: `Authorization: Bearer <token>` |

## Going to Production (GoDaddy shared hosting)

When you're ready to deploy:

1. **Static-export** the Next.js apps:
   ```bash
   cd admin-frontend
   # add output: 'export' to next.config.mjs
   npm run build
   # → static files in admin-frontend/out/
   ```
2. Upload via FTP / cPanel File Manager:
   - `user-frontend/out/*`  → `public_html/`
   - `admin-frontend/out/*` → `public_html/admin/`
   - `api/*`                → `public_html/api/`
3. In phpMyAdmin on GoDaddy, run `database/schema.sql`.
4. Update `api/config/db.php` with your GoDaddy MySQL credentials.
5. Update `JWT_SECRET` in `api/config/jwt.php` to a long random string.
6. Visit `your-domain.com/api/admin/seed.php` once, then delete that file.

## Roadmap

- [x] Folder structure
- [x] User landing page (UI)
- [x] Admin dashboard page (UI)
- [x] MySQL schema
- [x] PHP API + JWT auth
- [x] Admin login page + auth guard
- [ ] Bus management (CRUD)
- [ ] Route + schedule management
- [ ] User registration + login
- [ ] Booking flow (search → seat select → pay)
- [ ] Payment gateway integration
- [ ] Reports & analytics
