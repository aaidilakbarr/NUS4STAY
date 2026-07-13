# Security

## Frontend

React must never write directly into the bookings table.

All booking creation must use PostgreSQL RPC.

---

## RLS

Guests

Can

- Read their own bookings
- Create bookings through RPC
- Upload payment proof

Cannot

- Update booking status
- Approve payments
- View other bookings

---

Admins

Can

- View all bookings
- Verify payments
- Update booking status

---

Managers

Can

- Read reports
- Read bookings
- Read payment information

Managers cannot modify bookings.

---

## Validation

Every booking request must validate

- Room exists
- Room active
- Valid check-in
- Valid check-out
- No overlap
- Authenticated user