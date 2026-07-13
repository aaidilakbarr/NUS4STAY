# PostgreSQL RPC Functions

## create_booking()

Responsibilities

- Validate room exists
- Validate room status
- Validate dates
- Check overlapping bookings
- Create booking
- Return booking id

---

## upload_payment_proof()

Responsibilities

- Save payment proof URL
- Update updated_at

---

## approve_payment()

Responsibilities

Update

payment_status = paid

booking_status = confirmed

---

## reject_payment()

Responsibilities

Update

payment_status = rejected

booking_status remains pending_payment

---

## expire_booking()

Responsibilities

Find

booking_status = pending_payment

AND

expires_at < NOW()

Update

booking_status = expired