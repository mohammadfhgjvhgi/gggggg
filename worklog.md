---
Task ID: 1
Agent: Main Orchestrator
Task: Build complete Wedding Hall Management System with ESP32 Firebase control and customer billing

Work Log:
- Installed Firebase SDK, bcryptjs for auth
- Designed and pushed Prisma schema: User (roles), Customer, Booking, Payment, Setting models
- Built Firebase client config with RTDB types
- Built auth utilities: hash/verify password, JWT-like tokens, role permissions
- Created Zustand stores: auth-store (login/logout/checkAuth), app-store (page routing)
- Built 12 API routes with auth and permission checks:
  - auth: login, me, seed
  - customers: CRUD with search/pagination
  - bookings: CRUD with filters, payment tracking
  - payments: CRUD with summary stats
  - users: admin-only CRUD
  - settings: key-value store for Firebase config
- Built control-dashboard.tsx: real-time Firebase RTDB listeners for gate, door, seating, lights
- Built customer-management.tsx: full CRUD with search, pagination, dialogs
- Built booking-management.tsx: status filter tabs, customer filter, payment tracking per booking
- Built billing-management.tsx: summary cards, payment CRUD, filter by booking/status
- Built user-management.tsx: admin-only, role badges, active/inactive toggles, self-protection
- Built settings-panel.tsx: Firebase config, hall info, connection test
- Applied wedding dark gold theme (oklch colors), Arabic RTL layout, Noto Sans Arabic font
- Updated page.tsx: login screen, sidebar navigation, top bar, page routing
- Seeded admin user (admin@wedding.com / admin123)
- Verified: lint clean, API login works, dev server compiling

Stage Summary:
- Complete wedding hall management system
- Real-time ESP32 control via Firebase RTDB
- Customer billing with invoices and payment tracking
- 4-tier role-based permissions (admin/manager/employee/viewer)
- Arabic RTL dark theme with gold accents
- Login: admin@wedding.com / admin123
