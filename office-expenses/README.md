# 🏢 Office Expenses — Budget Tracker

A full-stack office expense tracker. The admin sets a monthly cash budget, and everyone on the team logs what they've spent. All expenses are visible to all.

## Features
- 🔐 Login / Register — first person to register becomes admin
- 💰 Admin sets monthly budget (e.g. ₹1,00,000 for June)
- 🧾 All employees add expenses with receipt upload
- 👀 Everyone sees all expenses + remaining budget
- 📊 Dashboard: budget bar, category pie chart, spend per person
- ✏️ Employees edit/delete their own; admin can delete anyone's
- ⚙️ Admin panel: set budget, promote/demote users, remove users

---

## Quick Start

### 1. Requirements
- Node.js 18+
- MongoDB (local or Atlas)

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your MongoDB URI
npm run dev
# ✅ Server on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# ✅ App on http://localhost:5173
```

### 4. First Run
1. Open http://localhost:5173
2. Click **Register** — the first account created is automatically the **Admin**
3. Everyone else registers normally and gets the **Employee** role
4. Admin goes to **Admin** → sets the monthly budget
5. Everyone starts logging expenses!

---

## .env Variables (backend)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/office_expenses
JWT_SECRET=some_long_random_string
JWT_EXPIRE=7d
```

## API Summary
| Route | Access | Description |
|-------|--------|-------------|
| POST /api/auth/register | Public | Register |
| POST /api/auth/login | Public | Login |
| GET /api/budget | All | Get budget + totals |
| POST /api/budget | Admin | Set/update budget |
| GET /api/expenses | All | List all expenses |
| POST /api/expenses | All | Add expense + receipt |
| PUT /api/expenses/:id | Owner/Admin | Edit |
| DELETE /api/expenses/:id | Owner/Admin | Delete |
| GET /api/admin/users | Admin | List users |
| PUT /api/admin/users/:id/role | Admin | Change role |
| DELETE /api/admin/users/:id | Admin | Remove user |
