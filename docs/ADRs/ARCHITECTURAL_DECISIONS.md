# Invenos POS — Architectural Decision Records

This document captures every significant architectural decision made during the design and evolution of Invenos POS, along with the rationale, alternatives considered, and consequences.

---

## ADR-001: Contacts as Unified CRM Entity

**Date:** 2026-07-23
**Status:** Accepted

### Context
The system needs to track customers, suppliers, patients, and potentially doctors, employees, and other party types. The initial approach could model these as separate entities.

### Decision
Use a single `Contact` model with a `roles` JSON column. Customer, Supplier, Patient, etc. are business roles, not separate entities.

### Alternatives Considered
- **Separate Customer/Supplier tables**: Duplicates logic, breaks when a contact has both roles
- **Role pivot table**: Normalized but over-engineered for MVP, adds JOINs for every role check
- **Role enum column**: Can't hold multiple roles per contact

### Consequences
- One table, one model, one set of relationships
- Adding a new role (Doctor, Employee) requires zero schema changes
- Transaction tables use expressive FK names (`customer_id`, `supplier_id`) while all pointing to `contacts.id`
- Querying by role uses `JSON_CONTAINS(roles, '"customer"')` — performant with MySQL JSON indexes

---

## ADR-002: Inertia.js over Separate API (for now)

**Date:** 2026-07-25
**Status:** Accepted

### Context
The frontend was built as a standalone React SPA. The Laravel backend could either serve as a JSON API (with separate React SPA) or use Inertia.js to merge frontend and backend.

### Decision
Use Inertia.js + React. The Laravel backend owns routing, authentication, and authorization. React renders pages via Inertia props.

### Consequences
- No CORS configuration needed
- No API token management during development
- Pages receive typed props directly from controllers
- The service layer is designed to be reusable: the same service can serve an Inertia controller and a future API controller
- If a standalone API is needed later, controllers are created that call the same services

---

## ADR-003: Selective Repositories (no generic repository pattern)

**Date:** 2026-07-25
**Status:** Accepted

### Context
There is a common debate in Laravel projects about whether to use repositories for all data access.

### Decision
Use repositories only where queries become sufficiently complex (e.g., Reports, filtered Sales lists). For simple CRUD (e.g., Contacts, Products, Categories), use Eloquent directly in Services.

### Consequences
- Less boilerplate for simple operations
- Complex queries remain testable via repository interfaces
- No `BaseRepository` or generic pattern that adds indirection without value

---

## ADR-004: Feature-Based Domain Organization

**Date:** 2026-07-25
**Status:** Accepted

### Context
Laravel conventions place all models in `app/Models`, all controllers in `app/Http/Controllers`, etc. This works for small applications but becomes difficult to navigate as the codebase grows.

### Decision
Organize business logic into `app/Domains/{Module}/` directories. Each domain contains its own `Services/`, `DTOs/`, `Actions/`, `Policies/`, `Enums/`, and `ValueObjects/`. Controllers remain in `app/Http/Controllers` but are thin — they delegate to domain services.

### Consequences
- Co-location: all code related to Sales lives under `Domains/Sales/`
- Easy to find and change business logic
- Controllers stay thin (validation + response)
- Services become the reusable backbone, consumable by controllers, API routes, and Artisan commands

---

## ADR-005: Service Layer Contains Business Logic

**Date:** 2026-07-25
**Status:** Accepted

### Context
Business logic can live in controllers (fat controllers), models (fat models), or a dedicated service layer.

### Decision
All business logic lives in Service classes. Controllers handle HTTP concerns only (validation via Form Requests, response via Inertia/Resources). Models handle Eloquent relationships and scopes only.

### Consequences
- Controllers are testable independently of business logic
- Services are reusable across Inertia and future API controllers
- Business logic is not coupled to HTTP concerns
- Services never return Inertia/JSON responses — they return domain results

---

## ADR-006: BusinessContext for Multi-Tenancy Readiness

**Date:** 2026-07-25
**Status:** Accepted

### Context
The application is currently single-tenant. However, a SaaS edition (Invenos Cloud) could be built in the future where a single installation serves multiple businesses.

### Decision
Introduce a `BusinessContext` singleton that resolves the current business. Currently always returns the single business. Every service constructor accepts it.

### Consequences
- Zero code changes needed to introduce multi-tenancy — only `BusinessContext::current()` changes
- Services are naturally scoped to a business
- No singleton assumptions scattered throughout the codebase

---

## ADR-007: Three-Unit Model for Products (Base Unit / Selling Unit / Purchase Unit)

**Date:** 2026-07-23
**Status:** Accepted

### Context
Products can be bought in different quantities than they're sold. For example, a pharmacy buys Paracetamol by the carton (1000 tablets) but sells by the strip (10 tablets).

### Decision
Model each product with three unit concepts:
- **Base Unit**: The atomic tracking unit (tablet, gram, piece) — inventory is always in base units
- **Selling Unit**: How customers buy (strip, box, single) — with sale price per unit
- **Purchase Config**: How the business buys (carton, bag) — with cost per unit

### Consequences
- Inventory is always measured in base units (single source of truth)
- POS automatically handles unit conversion
- Purchase cost and sale price are independently configurable
- Margins can be calculated per selling unit

---

## ADR-008: EventBus for Cross-Module Reactivity (Frontend Only)

**Date:** 2026-07-23
**Status:** Accepted (Temporary)

### Context
The frontend prototype needs cross-module communication (e.g., a new sale updates Dashboard stats). Without a backend, this must happen client-side.

### Decision
Use a lightweight EventBus (`src/application/event-bus.ts`) for frontend event-driven reactivity. This is temporary — in the Laravel backend, events will fire server-side and Inertia will re-render affected components.

### Consequences
- Enables real-time dashboard updates in the prototype
- Will be replaced module-by-module during backend wiring
- The frontend listens for events; the backend will dispatch them

---

## ADR-009: JSON Roles for Contact over Pivot Table

**Date:** 2026-07-23
**Status:** Accepted

### Context
Contacts need to hold one or more business roles (customer, supplier, patient). Future roles may include doctor, employee, transporter.

### Decision
Store roles as a JSON array on the `contacts` table.

### Alternatives Considered
- **Pivot table** (`contact_role_user`): Normalized but requires migrations for new roles, JOINs for every query
- **Enum column**: Can only hold one role per contact

### Consequences
- Zero schema changes for new roles
- Simple queries: `WHERE JSON_CONTAINS(roles, '"customer"')`
- If role-specific attributes emerge (e.g., credit limit for customers only), a `contact_role_data` pivot can be added later

---

## ADR-010: Incremental Mock Store Replacement

**Date:** 2026-07-25
**Status:** Accepted

### Context
The frontend prototype depends on in-memory mock stores (`src/data/sales.ts`, `src/data/inventory.ts`, etc.). These cannot be removed all at once.

### Decision
Replace mock stores one module at a time. When a module is wired to the backend:
1. Create the Laravel service
2. Create the API endpoints
3. Replace the mock store import with an API client
4. Remove the mock data file

### Consequences
- The prototype continues to work during transition
- Each module is fully verified before moving to the next
- No big-bang rewrite risk
- Clear completion criteria: "Mock store X is no longer imported"

---

## ADR-011: Strategy Pattern for Transaction Types

**Date:** 2026-07-23
**Status:** Provisional

### Context
Sales, purchases, sale returns, and purchase returns follow the same general flow (validate → compute → persist → emit) but differ in how they affect inventory and finances. On the frontend, the strategy pattern was essential for independent pluggability. On the backend, a simpler `TransactionService` should be attempted first.

### Decision
Provisional — begin with a single `TransactionService` handling all transaction types via conditional logic. Extract into strategies only if the backend complexity clearly justifies it.

### Consequences
- Simpler start: one service, one file, straightforward control flow
- Strategy extraction remains possible if needed later
- Avoids premature abstraction of a pattern that may not be needed server-side

---

## ADR-012: Feature Flags and Permission Model Over Roles

**Date:** 2026-07-23
**Status:** Accepted

### Context
The MVP supports only two roles (Admin, Salesman). Future roles (Manager, Accountant, Cashier) may have overlapping but distinct permissions.

### Decision
Use action-based permissions (Spatie) rather than role-based gating. Roles exist but are just convenient groups of permissions. The permission set is granular enough to express "can edit sales but not delete them."

### Consequences
- Fine-grained control without creating a new role for every combination
- Admin role has full access; all other users are explicitly permitted
- The frontend `PermissionSet` mirrors the backend Spatie structure
- UI automatically hides actions the user cannot perform
