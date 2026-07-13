# NUS4STAY Backend & Supabase Planning

## 1. Tujuan
Menjelaskan rencana migrasi NUS4STAY dari frontend mock/localStorage menjadi aplikasi dengan Supabase sebagai backend, database, auth, RBAC, dan direct payment.

## 2. Arsitektur Target
- React + Vite frontend
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Supabase Edge Functions
- Payment Gateway untuk direct payment

## 3. Modul Utama
- Property listing
- Room detail
- Booking checkout
- Direct payment
- Booking history
- Invoice PDF
- Admin/Owner dashboard
- RBAC

## 4. Database Schema
### destinations
### properties
### rooms
### bookings
### payments
### profiles
### roles / user_roles

## 5. RBAC
### customer :
### owner
### admin


## 6. Payment Flow
1. User checkout
2. Frontend call Edge Function
3. Edge Function create booking
4. Edge Function create transaction to payment gateway
5. Frontend redirect/open payment
6. Payment gateway sends webhook
7. Edge Function verifies webhook
8. Database updates payment + booking status

## 7. Supabase RLS Strategy
- Public read properties and rooms
- Customer read own bookings
- Owner read bookings from owned properties
- Admin manage all data
- Payment status only updated by Edge Function

## 8. API / Function Design
- create-booking-payment
- payment-webhook
- admin-update-booking
- owner-manage-property

## 9. Frontend Refactor Plan
Keep existing `db.js` function interface:
- getDestinations
- getProperties
- getPropertyById
- getBookingHistory
- getBookingById
- createBooking
- updateBookingStatus

Then replace implementation with Supabase queries.

## 10. Implementation Phases
### Phase 1: Supabase database
### Phase 2: Supabase client integration
### Phase 3: Auth + profiles
### Phase 4: RBAC + RLS
### Phase 5: Direct payment
### Phase 6: Admin/owner dashboard
### Phase 7: Hardening & deployment