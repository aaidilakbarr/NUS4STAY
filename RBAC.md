# Role-Based Access Control (RBAC)

## Overview

NUS4STAY implements a Role-Based Access Control (RBAC) system to restrict access to application features based on user roles.

The system currently supports three roles:

- Guest
- Admin
- Manager

Each authenticated user has exactly one role stored in the `profiles` table.

---

# Roles

## 1. Guest

A guest is an end user who books hotels or villas.

### Permissions

- Register account
- Login / Logout
- View properties
- Search hotels & villas
- View property details
- Create booking
- Upload payment proof
- View own booking history
- Manage own profile

### Restrictions

Guests cannot:

- Manage properties
- Manage rooms
- View other users' bookings
- Verify payments
- Access admin dashboard
- Access manager dashboard

---

## 2. Admin

Admin is responsible for daily operational management of the booking system.

### Property Management

- Create property
- Update property
- Delete property

### Room Management

- Create room
- Update room
- Delete room

### Booking Management

- View all bookings
- Confirm booking
- Reject booking
- Update booking status

Booking status flow:

Pending
→ Waiting Payment
→ Confirmed
→ Checked In
→ Checked Out

### Payment Management

- View uploaded payment proofs
- Verify payment
- Reject payment

### User Management

- View all users
- Update user role (optional)
- Manage guest accounts

---

## 3. Manager

Manager is responsible for monitoring business performance.

Managers do not perform operational tasks.

### Dashboard

- Total bookings
- Total revenue
- Occupancy rate
- Monthly booking statistics

### Reports

- Export booking reports
- Export revenue reports

### Analytics

- Most booked properties
- Revenue trends
- Booking trends

### Restrictions

Managers cannot:

- Edit properties
- Verify payments
- Create bookings
- Delete users

---

# Permission Matrix

| Feature | Guest | Admin | Manager |
|----------|:-----:|:-----:|:------:|
| Register | ✅ | ❌ | ❌ |
| Login | ✅ | ✅ | ✅ |
| View Properties | ✅ | ✅ | ✅ |
| Search Property | ✅ | ✅ | ✅ |
| Property Detail | ✅ | ✅ | ✅ |
| Create Booking | ✅ | ❌ | ❌ |
| Upload Payment Proof | ✅ | ❌ | ❌ |
| View Own Booking History | ✅ | ❌ | ❌ |
| View All Bookings | ❌ | ✅ | ✅ |
| Manage Properties | ❌ | ✅ | Read Only |
| Manage Rooms | ❌ | ✅ | Read Only |
| Verify Payments | ❌ | ✅ | Read Only |
| Update Booking Status | ❌ | ✅ | Read Only |
| Dashboard | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ✅ | ❌ |

---

# Route Authorization

## Public Routes

Accessible without authentication.

- /
- /properties
- /property/:id
- /login
- /register

---

## Guest Routes

Authentication required.

- /booking
- /booking/history
- /profile

Allowed Roles:

- Guest

---

## Admin Routes

Authentication required.

- /admin/dashboard
- /admin/properties
- /admin/rooms
- /admin/bookings
- /admin/payments
- /admin/users

Allowed Roles:

- Admin

---

## Manager Routes

Authentication required.

- /manager/dashboard
- /manager/reports
- /manager/analytics

Allowed Roles:

- Manager

---

# Database

The user role is stored in the `profiles` table.

```sql
id uuid PRIMARY KEY REFERENCES auth.users(id)

full_name text

phone text

role text DEFAULT 'guest'

created_at timestamptz
```

Example:

```json
{
    "id": "...",
    "full_name": "John Doe",
    "role": "guest"
}
```

---

# Authentication Flow

```text
User Login
      │
      ▼
Supabase Authentication
      │
      ▼
Retrieve Session
      │
      ▼
Load Profile
      │
      ▼
Read User Role
      │
      ▼
Authorize Route
      │
      ▼
Render Allowed Pages
```

---

# Authorization Flow

```text
Guest
│
├── Browse Property
├── Booking
├── Payment Proof
└── Booking History

Admin
│
├── Dashboard
├── Properties
├── Rooms
├── Bookings
├── Payments
└── Users

Manager
│
├── Dashboard
├── Reports
└── Analytics
```

---

# Implementation Notes

The frontend should:

- Store the authenticated session using Supabase Auth.
- Load the user's profile after authentication.
- Store both `user` and `profile` inside the Auth Context.
- Protect routes using a reusable `RoleGuard` component.
- Never rely solely on frontend role checks; all sensitive data access must also be enforced with Supabase Row Level Security (RLS).

Example:

```jsx
<RoleGuard roles={["admin"]}>
    <AdminDashboard />
</RoleGuard>
```

```jsx
<RoleGuard roles={["manager"]}>
    <ManagerDashboard />
</RoleGuard>
```

```jsx
<RoleGuard roles={["guest"]}>
    <BookingPage />
</RoleGuard>
```

No major architectural changes are required to support additional roles.