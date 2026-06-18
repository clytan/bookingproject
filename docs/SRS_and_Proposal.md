# COKALO — Software Requirements Specification & Commercial Proposal

**Project:** COKALO Travel Booking Platform
**Modules:** Hotels · Water Activities · Bus (3rd-party API integration)
**Prepared by:** Codersdek
**Tagline:** *Explore. Discover. Celebrate.*
**Document version:** 1.0
**Date:** 2026-05-21

---

## 1. Executive Summary

COKALO is a consumer travel platform that lets travellers discover and book three product lines on a single site:

1. **Hotels** — search, filter, and book rooms across cities.
2. **Water Activities** — discover water-sport operators ("companies") and book one or more activities in a single transaction.
3. **Bus tickets** — search routes, view schedules, and book seats. Inventory and fulfilment delivered through a third-party bus aggregator API (e.g. RedBus / ITS / equivalent).

The platform comprises:

* **Customer web app** (public)
* **Admin panel** (platform operator's internal team)
* **Hotel manager portal** (each hotel runs their own listings & bookings)
* **Activity operator portal** (each water-sports company runs their own activities & bookings)
* **REST API backend** (PHP + MySQL)

This document captures the agreed scope, deliverables, timeline, quote, and commercial terms for the 3-month development engagement.

---

## 2. Project Scope

### 2.1 In Scope

| Area | Description |
|---|---|
| **Hotels module** | Full booking pipeline — discovery, detail page, availability check, booking, manager portal, admin oversight. |
| **Water Activities module** | Full booking pipeline incl. multi-activity cart, operator portal, admin oversight. |
| **Bus module** | Customer-facing search → seat selection → booking → ticket. Inventory & fulfilment via **one** third-party bus API (provider mutually selected at kickoff). |
| **User authentication** | Email + OTP (login + signup), optional password fallback. |
| **Admin panel** | Property/operator CRUD, listings management, bookings oversight, reports/analytics for hotels & activities. |
| **Manager portals** | Independent dashboards for hotel managers and water-sport operators to manage their listings, slots/rooms, bookings, and walk-in entries. |
| **Advanced dashboards** | Sensible, role-specific dashboards for users, managers, operators, and admin. "Advanced" here means well-designed and useful — not BI / data-science depth. See Section 7.5 for the exact list of widgets included and Section 2.2 #14 for what is **not** considered part of "advanced". |
| **GST module** | Configurable GST rate, per-booking tax calculation, GST shown on invoice and admin reports. |
| **Commission module** | Per-vendor commission percentage (different rates per hotel / per operator / for bus aggregator). Platform splits gross / commission / net at booking time. Vendor and admin can view their split. See Section 7.4. |
| **Responsive UI** | Desktop + mobile web (no native iOS/Android app). |
| **Email notifications** | OTP, booking confirmation, status updates. SMTP via Codersdek's mail server or client-supplied SMTP. |
| **Deployment** | One round of deployment to client's chosen hosting (cPanel / shared host / VPS). India region. |
| **Vendor-specific API modifications (during build window only)** | If a **hotel**, a **water-sports operator**, or the chosen **bus aggregator** has their own API / PMS / back-office that requires custom integration to onboard, those modifications **are included — but only during the active 3-month build window**. Once the project goes live and the M4 milestone is signed off, any such API integration or modification becomes a paid change-request. See Section 2.2 #2 and Section 14. |
| **Manual hotels / operators use the COKALO portals** | Hotels and water-sports operators without their own API/back-office systems are onboarded through the **Hotel Manager portal** and **Activity Operator portal** built into COKALO. Their staff log in and manage rooms / slots / bookings using the platform's standard flows. No custom dashboards, no per-vendor branding, no bespoke flows. |

### 2.2 Out of Scope (explicitly excluded)

1. **Native mobile apps** (iOS / Android).
2. **Post-launch custom modifications for individual hotels, operators, or bus carriers.** During the active 3-month build window (Section 11), custom integrations / modifications required to onboard a specific hotel's PMS, an operator's existing back-office, or the chosen bus aggregator are **included**. **After the M4 sign-off**, all such requests — including newly-onboarded hotels/operators that bring their own APIs — are paid change-requests billed at Codersdek's hourly rate. The platform itself remains a single-tenant codebase; per-property branding, white-labelling, or bespoke booking flows for any single vendor are not part of the base build.
3. **Bus operator panel.** Bus inventory is consumed entirely from the third-party API. There is no fleet / route / schedule management UI for bus operators on COKALO.
4. **Multiple bus API integrations.** One provider only. Switching providers, supporting fallback providers, or aggregating multiple APIs is out of scope.
5. **Third-party service costs.** Codersdek's fee covers development only. The following are **billed separately** and paid for by the client:
   - Bus aggregator API subscription & per-booking fees (RedBus, ITS, etc.)
   - Payment-gateway fees (Razorpay / Stripe / etc.)
   - SMS / WhatsApp messaging fees
   - SMTP / transactional-email service fees (if not using cPanel mailbox)
   - Hosting, domain, SSL certificate
   - Map / geocoding API usage (if added)
6. **Payment-gateway integration** beyond a single provider (e.g. Razorpay). Multiple gateways or wallet-by-wallet integrations are out of scope.
7. **Indian market only.** The platform is built for the Indian market — INR currency, IST timezone, Indian phone-number formats, Indian GST tax structure, Indian payment gateway. International support (multi-currency, multi-timezone, foreign payment methods, VAT/sales-tax, non-Indian addresses) is **not** in scope.
8. **Multi-language / i18n.** English only.
9. **Multi-currency.** INR only.
10. **SEO content writing, copywriting, and stock photography.** Client supplies hotel/activity images and descriptive text.
11. **Server administration after handover.** One-time deployment is included; ongoing DevOps and server upkeep is not.
12. **Source-code modifications after final sign-off.** Bug fixes related to the delivered scope are covered for **30 days post-launch**. New features or scope changes after that period are change-requests, billed separately.
13. **Post-delivery maintenance / AMC.** Ongoing maintenance, support, monitoring, server patching, security updates, third-party API change handling, performance tuning, periodic enhancements, and small feature additions after the 30-day bug-fix window are **explicitly out of scope** of this quote and are **billed separately** under a maintenance agreement (AMC) or per change-request. See Section 15.5.
14. **Enterprise-grade analytics / BI.** "Advanced dashboards" in this SRS means the curated widget set listed in Section 7.5 (revenue trends, occupancy, source mix, top performers, etc.). The following are **not** part of "advanced" and are out of scope: custom report builders, ad-hoc SQL, data-warehouse / OLAP cube, cohort and funnel analytics, predictive models, real-time streaming dashboards, drill-down BI tools, export to BI platforms (Tableau/Power BI/Looker).

---

## 3. System Architecture

```
                        ┌────────────────────────────┐
                        │     Customer Web App       │
                        │  (Next.js, public users)   │
                        └────────────┬───────────────┘
                                     │ REST/JSON
       ┌─────────────────────────────┼──────────────────────────────┐
       │                             │                              │
       ▼                             ▼                              ▼
┌─────────────┐              ┌──────────────┐               ┌─────────────────┐
│ Admin Panel │              │ Manager App  │               │ Operator App    │
│   (Next.js) │              │ Hotel staff  │               │ Water-sport co. │
└──────┬──────┘              └──────┬───────┘               └──────────┬──────┘
       │                             │                                  │
       └──────────────┬──────────────┴──────────────────────────────────┘
                      ▼
            ┌─────────────────────┐               ┌────────────────────────┐
            │  PHP REST API       │◄────────────► │  Bus Aggregator API    │
            │  (Hotel/Activity/   │   server-to-  │  (3rd-party — RedBus,  │
            │   Bus, Auth, OTP)   │     server    │   ITS, etc.)           │
            └──────────┬──────────┘               └────────────────────────┘
                       │
                       ▼
                 ┌──────────────┐
                 │  MySQL       │
                 └──────────────┘
```

### 3.1 Components

| Component | Responsibility |
|---|---|
| **Customer Web App** | Browse hotels/activities/buses, book, manage own bookings, login (email OTP / password). |
| **Admin Panel** | CRUD for hotels, activities, operators, bookings oversight, reports. |
| **Hotel Manager App** | Per-hotel dashboard — manage rooms, view/manage bookings, walk-ins. |
| **Activity Operator App** | Per-operator dashboard — manage activities and slots across cities, view/manage bookings, walk-ins. |
| **PHP REST API** | Authoritative source for all data; JWT-secured endpoints; pluggable mailer (PHPMailer + SMTP). |
| **MySQL DB** | Single relational DB (`busgo_db`). |
| **Bus Aggregator API** | External provider for bus inventory, seat layout, hold, ticket. Specifics depend on the selected provider's contract. |

---

## 4. Module 1 — Hotels

### 4.1 Customer-facing requirements

| ID | Requirement |
|----|-------------|
| H-C01 | Hotels listing page filterable by city, price range, star rating, guest rating, property type (Hotel / Resort / Service Apartment / Independent House / Villa / Guest House / Hostel / Boutique / Apartment), guest capacity, and amenities. |
| H-C02 | Hotel detail page with image, description, address, amenities, list of bookable rooms. |
| H-C03 | Date-range availability check (check-in / check-out / guests). |
| H-C04 | Single-room booking flow with instant confirmation and booking code. |
| H-C05 | Email confirmation after successful booking. |
| H-C06 | "My Bookings" page — view all current and past hotel bookings, cancel where allowed. |

### 4.2 Hotel Manager portal

| ID | Requirement |
|----|-------------|
| H-M01 | Login (separate JWT realm). |
| H-M02 | Dashboard with today's check-ins, check-outs, current guests, month bookings, month revenue. |
| H-M03 | Edit own hotel profile (name, city, address, description, image, amenities). Star rating and guest rating are admin-managed only. |
| H-M04 | Rooms CRUD — create, edit, disable, delete room types (room type, price/night, capacity, total units, image, amenities). |
| H-M05 | Bookings list with status filter and source filter (website vs walk-in). |
| H-M06 | Create walk-in booking on behalf of a guest (room, date range, guest details). |
| H-M07 | Confirm or cancel pending bookings. |
| H-M08 | Reports — month-by-month revenue trend, source mix, revenue by room type. |

### 4.3 Admin oversight (hotels)

| ID | Requirement |
|----|-------------|
| H-A01 | Hotels list with stats (rooms, bookings, status). |
| H-A02 | Hotels CRUD including star/guest rating fields. |
| H-A03 | Flat list of all rooms across all hotels with hotel filter. |
| H-A04 | Flat list of all hotel bookings. |
| H-A05 | Disable a hotel (hides from public site but preserves data). |
| H-A06 | Reports — platform-wide hotel revenue & bookings. |

---

## 5. Module 2 — Water Activities

### 5.1 Customer-facing requirements

| ID | Requirement |
|----|-------------|
| A-C01 | "Companies" listing — water-sports operators with city/category filters. |
| A-C02 | Operator (company) landing page — header with brand, then activities grouped by city; option to filter highlighted activities by the user's search category. |
| A-C03 | Activity detail — description, includes, difficulty, duration, slot options. |
| A-C04 | Date + persons input shared across the cart. |
| A-C05 | Multi-activity cart — add multiple slots from one operator; remove items; live total. |
| A-C06 | Transactional checkout — all cart items booked in a single atomic call. If any single slot is unavailable, the entire cart rolls back. |
| A-C07 | Booking confirmation page listing each booking code. |
| A-C08 | "My Bookings" includes water-activity bookings, with cancel where allowed. |

### 5.2 Activity Operator portal

| ID | Requirement |
|----|-------------|
| A-O01 | Login (separate JWT realm). |
| A-O02 | Dashboard — activity count, today's bookings, today's persons, upcoming bookings, monthly revenue. |
| A-O03 | "My Activities" — list of all activities owned by the operator. |
| A-O04 | Activity CRUD — create, edit, disable, delete activities (name, city, category, difficulty, duration, image, includes). |
| A-O05 | Slot management within each activity — slot label, departure time, duration, price/person, max persons, image. |
| A-O06 | Bookings list with activity / status / source filters. |
| A-O07 | Walk-in booking — pick activity → pick slot → enter guest details. |
| A-O08 | Confirm / cancel pending bookings. |

### 5.3 Admin oversight (activities)

| ID | Requirement |
|----|-------------|
| A-A01 | Activities list with operator + stats. |
| A-A02 | Activities CRUD; optional assignment to an operator (unassigned activities are admin-managed). |
| A-A03 | Flat list of all slots across all activities with activity filter. |
| A-A04 | Flat list of all activity bookings. |
| A-A05 | Operators CRUD — create, edit, disable, delete operator accounts. |
| A-A06 | Reports — platform-wide revenue, top activities, source mix. |

---

## 6. Module 3 — Bus (3rd-party API integration)

> **Important constraint:** This module's feature set is **constrained by the capabilities of the selected third-party bus API provider**. What this document promises is the **integration of features the chosen provider exposes** — not a wishlist of features the API may not support. The exact provider (RedBus, ITS Mobisoft, AbhiBus, etc.) is to be jointly selected at project kickoff.

### 6.1 Customer-facing requirements (subject to API)

| ID | Requirement |
|----|-------------|
| B-C01 | Bus search page — origin city, destination city, journey date, optional return date. |
| B-C02 | Results list with operator, bus type, departure / arrival times, duration, fare, available seats. |
| B-C03 | Filters (subject to API data) — bus type, departure time window, operator, price range. |
| B-C04 | Seat-selection page — interactive seat map from the API, lower/upper deck where applicable. |
| B-C05 | Passenger details + boarding point selection. |
| B-C06 | Payment via single integrated payment gateway. |
| B-C07 | Ticket confirmation — PNR / booking code, e-ticket displayed and emailed. |
| B-C08 | "My Bookings" — view bus tickets, with cancel (where the API supports it). |

### 6.2 Admin oversight (bus)

| ID | Requirement |
|----|-------------|
| B-A01 | Bus bookings list — all bookings made through the platform with status, PNR, customer details. |
| B-A02 | Reconcile booking status against the provider (manual refresh button). |
| B-A03 | Basic reports — bookings count and revenue by month. |

### 6.3 Out of scope (bus module)

* No bus operator panel.
* No internal fleet / route / schedule / seat-layout management.
* No support for offline / non-API operators.
* No multi-aggregator fallback or routing.
* Refunds, chargebacks, dispute resolution follow the **provider's** rules and timeline; COKALO does not warrant outcomes beyond what the API returns.

---

## 7. Common / Cross-Cutting Features

### 7.1 Authentication

| ID | Requirement |
|----|-------------|
| AUTH-01 | Email + OTP signup (single flow). Optional password set during signup. |
| AUTH-02 | Email + OTP login (default). Email + password login (optional fallback for users who set a password). |
| AUTH-03 | 6-digit OTP, 5-minute expiry, max 5 attempts per code, 60-second resend cooldown, max 3 requests per email per 10 minutes. |
| AUTH-04 | OTP delivery via SMTP (PHPMailer). |
| AUTH-05 | Separate JWT realms for users, admins, hotel managers, activity operators. |

### 7.2 Notifications

| ID | Requirement |
|----|-------------|
| N-01 | OTP email (verification). |
| N-02 | Booking confirmation email (per booking). |
| N-03 | Booking cancellation email (when cancelled by user or operator/manager). |

### 7.3 Branding & UI

| ID | Requirement |
|----|-------------|
| UI-01 | Single brand identity — COKALO logo, purple/blue colour palette, Playfair + Inter typography. |
| UI-02 | Responsive across desktop, tablet, mobile breakpoints. |
| UI-03 | Tested on latest Chrome, Edge, Safari, Firefox. |

### 7.4 Commission & GST module

| ID | Requirement |
|----|-------------|
| FIN-01 | **Per-vendor commission rate.** Admin can configure a commission percentage per hotel and per water-sports operator (default fallback if not set). For bus bookings, a flat platform-level commission rate is configured. |
| FIN-02 | **Booking split.** At booking creation, the system records: gross amount, commission (%) and amount, GST (%) and amount, vendor net. All four are stored on the booking row so reports always reconcile. |
| FIN-03 | **GST rate.** Admin can configure a single GST rate (or per-category rate — Hotels, Activities, Bus). GST is calculated and shown on every customer invoice and operator/manager statement. Default split (CGST+SGST vs IGST) follows a configurable rule based on the billing address. |
| FIN-04 | **Customer invoice.** Booking confirmation email and downloadable PDF invoice show: line item, base amount, GST breakdown (CGST/SGST/IGST), total. Includes the configured GSTIN of the platform. |
| FIN-05 | **Vendor statement.** Each hotel manager / activity operator can view a statement of their bookings — gross, commission deducted, GST collected on their behalf, net payable. Month and date-range filters. |
| FIN-06 | **Admin reconciliation.** Admin sees a roll-up — total gross, total commission earned, total GST collected, total net payable to each vendor — for a chosen period. Export to CSV. |
| FIN-07 | **Bus commission.** Where the third-party bus API exposes the commission/markup, the platform records the API-reported figure. Where the API doesn't expose it, the platform's configured flat-rate applies. |

> **Out of scope (FIN):** automated payouts to vendors (Razorpay X / banking integration), TDS withholding, e-invoicing on GSTN, ITC reconciliation, GST return filing (GSTR-1 / GSTR-3B). The platform produces reports that a CA / accountant can use — it does not file returns. (See Section 2.2 #14.)

### 7.5 Dashboards — scope of "advanced"

What "advanced dashboards" includes (per role):

| Role | Widgets included |
|---|---|
| **Customer** | "My bookings" with status pills (upcoming / completed / cancelled), grouped by module (hotels / activities / bus), cancel button where allowed. |
| **Hotel manager** | Today's check-ins / check-outs / current guests / month bookings / month revenue. Upcoming bookings table. Revenue trend (last 6 months). Source mix (website vs walk-in). Revenue by room type. |
| **Activity operator** | Activity count, today's bookings, today's persons, upcoming total, monthly revenue, monthly bookings. Upcoming bookings table (across all activities). |
| **Admin** | Platform-wide gross / commission / net / GST collected for current period. Top 5 hotels and top 5 activities by revenue. Monthly trend (6 months). Source mix. Operator-wise commission roll-up. |

What "advanced" does **not** mean (out of scope, billed separately if needed later):

* Custom report builders and ad-hoc query interfaces
* Drill-down BI / OLAP / pivot tables
* Cohort analysis, funnel analytics, retention curves
* Predictive / ML forecasting
* Real-time live-streaming dashboards
* Native exports to Power BI / Tableau / Looker / Google Data Studio
* Per-tenant white-labelled dashboards
* Vendor-side mobile app for the dashboard

---

## 8. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | **Performance** — public list pages render under 2 seconds on standard broadband and a database with ≤ 10,000 records per table. |
| NFR-02 | **Concurrency** — atomic multi-booking checkout must be safe against parallel cart submissions (row-level locking inside DB transaction). |
| NFR-03 | **Security** — all admin / manager / operator endpoints behind JWT auth; passwords stored as bcrypt hashes; OTPs single-use with expiry; CORS allowlist restricted to known portal origins; SQL via parameterised PDO. |
| NFR-04 | **Logging** — server errors logged to PHP error log; SMTP failures surfaced via API errors. |
| NFR-05 | **Rate limiting** — OTP requests rate-limited per email. |
| NFR-06 | **Browser support** — last 2 versions of Chrome, Edge, Safari, Firefox. |
| NFR-07 | **Backup** — client is responsible for periodic DB backups post-handover. |

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Customer / Admin / Manager / Operator frontends | Next.js 14 (React), JavaScript, CSS modules |
| API / Backend | PHP 8.x, PDO + MySQL |
| Mail | PHPMailer 6.x over SMTP |
| Authentication | Custom HS256 JWT |
| Database | MySQL 8.x / MariaDB 10.x |
| Hosting target | XAMPP for dev; cPanel-based shared host or Linux VPS for production |

---

## 10. Deliverables

At the end of the engagement, Codersdek will deliver:

1. **Source code** for all four frontends and the PHP backend, via a private Git repository (or zipped on request).
2. **Database schema** as a single SQL file plus migration scripts.
3. **One-page deployment guide** covering server requirements, env-file values, and seed steps.
4. **Admin / manager / operator credentials** for the production deployment.
5. **30-day post-launch bug-fix support** — issues directly attributable to the delivered scope.

---

## 11. Project Timeline & Milestones

**Duration:** ~12 weeks from project kickoff — **10 May 2026 → 31 July 2026**.
**Working assumption:** kickoff = day 0; week = 7 calendar days.

| Milestone | Week | Target date | Deliverables | Payment release |
|---|---|---|---|---|
| **M0 — Kickoff** | 0 | 10 May 2026 | Signed proposal, requirements walkthrough, branding assets received, third-party bus provider selected. | INR 50,000 advance |
| **M1 — 25%** | 3 | 31 May 2026 | Hotels module customer + manager portals live in staging. Auth + OTP working end-to-end. Brand + design system applied. | INR 50,000 |
| **M2 — 50%** | 6 | 21 Jun 2026 | Water Activities module live in staging — customer + operator portals + admin oversight. Multi-activity cart + transactional checkout working. | INR 50,000 |
| **M3 — 75%** | 9 | 12 Jul 2026 | Bus module integrated with chosen 3rd-party API — customer search, seat selection, payment, confirmation. Admin reconcile screen. | INR 50,000 |
| **M4 — 100%** | 12 | 31 Jul 2026 | Production deployment, smoke-tested. Bug-fix sprint completed. Handover documents delivered. Project signed off. | INR 50,000 |

**Schedule risk note:** any delay caused by pending client inputs (logo, copy, content, API credentials, sandbox approvals, payment-gateway KYC, etc.) shifts the timeline day-for-day. Approval delays beyond 5 working days on any milestone are treated as a client-side hold.

---

## 12. Acceptance Criteria

Each milestone is deemed accepted when:

1. The features listed against that milestone are demoable on the staging environment.
2. The client (or nominee) signs off within **5 working days** of the demo email. Silence beyond 5 working days will be treated as deemed acceptance for the purposes of payment release.
3. Show-stopper bugs — defined as security flaws or features that simply do not work — are excluded from deemed acceptance and must be fixed before the milestone closes.

Final acceptance at M4 requires:

* Successful production deployment with all flows demonstrably working against the live database.
* Admin / manager / operator credentials handed over.
* No open show-stopper bugs.

---

## 13. Assumptions

1. Client provides all hotel/activity content (descriptions, images, amenities) by the start of M1.
2. Client provides bus-API provider credentials and any required KYC approvals by the start of M3. Without these, the bus module cannot be integrated and the M3 milestone slips on a day-for-day basis.
3. Client provides payment-gateway test + live credentials by the start of M3.
4. Client provides domain, hosting account, SSL certificate, and DNS access by the start of M4.
5. The platform runs as a single-tenant codebase. Branding is single-brand (COKALO).
6. Communication will be via a single point of contact on the client side; ad-hoc requests from third parties will be redirected through that contact.
7. Scope changes after sign-off (i.e. anything not explicitly listed in Section 4–Section 7) are change-requests and are billed separately at Codersdek's hourly rate.

---

## 14. Change Requests

* Requests for new features beyond Section 4–Section 7 will be scoped, estimated, and quoted as a written change-request before any work begins.
* Approved change-requests adjust the timeline and may extend the final delivery date.
* Cosmetic / minor edits (copy tweaks, small CSS adjustments) during active development are absorbed at Codersdek's discretion and don't require a formal change-request.

---

## 15. Commercial Proposal

### 15.1 Quote

| Item | Amount (INR) |
|---|---|
| Development of COKALO platform — 3 modules (Hotels + Water Activities + Bus 3rd-party integration) including admin panel, two manager portals, customer web app, REST API, database, deployment, 30-day post-launch bug fixes | **INR 2,50,000** |
| **Total** | **INR 2,50,000** |

> *All figures are in Indian Rupees. GST extra at applicable rate if the client requires a GST invoice.*

### 15.2 What is **not** included in the quote

* Bus aggregator API subscription / per-booking commissions
* Payment-gateway transaction fees
* SMS / WhatsApp / transactional-email fees
* Hosting, domain, SSL
* Map / geocoding API usage
* Content writing, photography, marketing
* Any third-party plugin / library license fees beyond open-source dependencies already in use

The client pays these directly to the respective service providers. Codersdek will guide setup but does not absorb usage costs.

### 15.3 Payment Schedule

Five equal instalments of **INR 50,000 each**, releasing against milestone acceptance per Section 11.

| # | Trigger | Amount |
|---|---|---|
| 1 | Signed proposal — kickoff advance | INR 50,000 |
| 2 | M1 acceptance (25%) | INR 50,000 |
| 3 | M2 acceptance (50%) | INR 50,000 |
| 4 | M3 acceptance (75%) | INR 50,000 |
| 5 | M4 acceptance — final go-live (100%) | INR 50,000 |
| | **Total** | **INR 2,50,000** |

### 15.4 Payment Terms

1. Each milestone invoice is payable within **5 working days** of acceptance.
2. Late payment beyond 10 working days pauses further development; the timeline shifts day-for-day until payment is received.
3. Payment via NEFT / IMPS / UPI to Codersdek's designated bank account (details on invoice).
4. The advance payment is non-refundable once kickoff has occurred (i.e. requirements walkthrough completed and assets transferred).
5. Source code and credentials are released to the client **only after the final invoice is settled.**
6. Any third-party service costs incurred for testing during development (sandbox SMTP, sandbox payment gateway, etc.) are billed at actuals against receipts, separate from the project fee.

### 15.5 Post-launch Support

* **30 days** of bug-fix support included from the go-live date. "Bug" means a feature listed in this SRS that does not work as specified.
* **All other post-delivery work is billed separately.** This includes — without limitation — new features, scope additions, third-party API changes (RedBus / payment gateway / SMTP / etc. publishing breaking changes), server administration, performance tuning, security patching, periodic enhancements, onboarding new hotels / operators that require any custom API integration, version upgrades of Node / PHP / MySQL / Next.js, plugin or library updates, content moderation, customer support, marketing collateral, and any feature requests originating from individual hotels / operators or end users.
* These can be engaged either as **one-off change-requests** (quoted on demand) or under a **separate Annual Maintenance Contract (AMC)** with monthly retainer hours. AMC terms are outside the scope of this proposal and are negotiated as a separate agreement at the end of the 30-day bug-fix window.

### 15.6 Validity

This proposal is valid for **15 days** from the document date.

---

## 16. Sign-off

The signatures below indicate agreement to:

* the scope defined in Section 2 through Section 7;
* the exclusions listed in Section 2.2 and Section 6.3;
* the timeline and acceptance process in Section 11–Section 12;
* the commercial terms in Section 15.

| For the Client | For Codersdek |
|---|---|
| Name: ________________________ | Name: ________________________ |
| Title: ________________________ | Title: ________________________ |
| Signature: ____________________ | Signature: ____________________ |
| Date: _________________________ | Date: _________________________ |

---

### Appendix A — Glossary

| Term | Meaning |
|---|---|
| **Operator** | A water-sports company that owns and runs one or more activities on COKALO. |
| **Manager** | A hotel staff account with rights to one specific hotel. |
| **Admin** | A COKALO platform staff account with full oversight. |
| **Slot** | A specific time-of-day departure for a water activity (e.g. "Morning Trip @ 9 AM"). |
| **Walk-in booking** | A booking entered into the system by a manager/operator on behalf of a guest who isn't using the website. |
| **Property type** | Categorisation of a hotel — Hotel, Resort, Service Apartment, Villa, Guest House, etc. |
| **PNR** | Passenger Name Record — the bus aggregator's unique booking reference. |

### Appendix B — Document Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-21 | Codersdek | Initial release for client review and sign-off. |
| 1.1 | 2026-05-24 | Codersdek | Section 11 milestones anchored to fixed dates (M0 = 10 May 2026, M4 = 31 Jul 2026). |
