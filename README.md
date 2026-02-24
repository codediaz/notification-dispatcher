# Notification Dispatcher

Multi-channel notification dispatcher for scheduling and delivering reminders, confirmations, and alerts (WhatsApp, email, and future channels).

## Purpose

`notification-dispatcher` is a backend service focused only on **message delivery orchestration**.

It is **not** the business-domain API (it does not manage runners, clubs, routes, events, etc.).
Instead, it receives **notification intents** from other services (e.g. `runflow-api`) and handles:

- scheduling
- channel dispatching (WhatsApp, email, etc.)
- delivery tracking
- retries
- webhook ingestion
- consent checks (opt-in / opt-out)

## Project Context

This service is part of a larger architecture:

- **runflow-api** → business domain (runners, clubs, events, RSVPs, routes)
- **notification-dispatcher** → message dispatch infrastructure (notifications only)

### Example Flow

1. `runflow-api` detects an event reminder should be sent.
2. `runflow-api` creates a notification request in `notification-dispatcher`.
3. `notification-dispatcher` stores the request as a queued/scheduled job.
4. A worker processes pending jobs and sends via a provider (WhatsApp/email).
5. Provider webhooks update delivery status (`sent`, `delivered`, `failed`, etc.).

## Design Principles

- **Channel-agnostic** (WhatsApp first, email next, more later)
- **Tenant-aware** (multi-tenant ready, even if starting with one tenant)
- **Idempotent** (avoid duplicate sends)
- **Observable** (track requests, deliveries, webhook events)
- **Secure by default** (separate public vs internal routes)
- **Minimal business knowledge** (no runner/event domain logic here)

## What This Service SHOULD Handle

- Notification requests (message intents)
- Recipients (generic contacts, not domain-specific entities)
- Consents (opt-in/opt-out by channel)
- Templates (logical template keys and provider mappings)
- Delivery attempts and statuses
- Provider webhooks
- Retry policies (later)
- Scheduling/queue processing (worker)

## What This Service SHOULD NOT Handle

- Runner profiles
- Clubs/teams
- Events/training sessions business logic
- Routes/maps
- RSVP business rules
- UI/frontend concerns

These belong to `runflow-api` (or another domain service).

## API Route Conventions

- `/public/*` → public endpoints (e.g. provider webhooks)
- `/internal/*` → protected endpoints used by trusted services (e.g. `runflow-api`)
- `/health`, `/version` → service diagnostics

## Security Expectations (Initial Phase)

- HTTPS (via Cloud Run / reverse proxy)
- API key auth for `/internal/*`
- Webhook verification for `/public/webhooks/*`
- Secrets stored in Secret Manager (not in code)
- Basic rate limiting and payload validation
- Mask sensitive data in logs

## Initial Scope (MVP)

This repository starts as a **backend scaffold** and will incrementally implement:

1. Hono + TypeScript API scaffold
2. Modular architecture (routes, modules, workers, middleware, db)
3. Health/version endpoints
4. Internal notification request endpoint
5. Worker processing queued notifications
6. Provider abstraction (mock first, WhatsApp later)
7. Webhook ingestion and delivery status updates
8. Postgres persistence
9. Docker + docker-compose for local development

## Suggested Core Concepts (High-Level Data Model)

> Final schema may evolve, but these are the core concepts.

- `tenants`
- `recipients`
- `recipient_consents`
- `templates`
- `notification_requests`
- `notification_deliveries`
- `webhook_events`
- `api_clients` (for internal auth)

## Tech Direction (Planned)

- **Runtime/API:** Hono + TypeScript
- **Database:** Postgres
- **Validation:** Zod
- **Infra (initial):** Docker / docker-compose
- **Deployment (later):** GCP Cloud Run
- **Secrets (later):** GCP Secret Manager

## Notes for AI Agents / Contributors

When generating code for this project, please follow these constraints:

1. **Do not add business-domain models** (runners, clubs, event logic).
2. Keep the service **notification-focused** and **channel-agnostic**.
3. Prefer **modular code** over tightly coupled route handlers.
4. Keep public and internal routes clearly separated.
5. Do not implement provider-specific logic unless explicitly requested.
6. Favor idempotency and traceability in notification processing.
7. Do not expose internal worker execution via public HTTP endpoints unless explicitly requested.
8. Use Postgres-friendly patterns (indexes, unique constraints for idempotency).
9. Keep implementations simple and production-minded (avoid overengineering).


## License

MIT 