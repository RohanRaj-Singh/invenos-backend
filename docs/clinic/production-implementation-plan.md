# Clinic Module — Production Implementation Plan

---

**Date:** 2026-07-28
**Status:** Architecture Design
**Principle:** Reuse existing Product/Inventory/Sales/SellingUnit architecture. No redesign. No duplication.

---

## Table of Contents

1. Module Dependency Diagram
2. Database Changes
3. API Changes
4. Prescription Medicines — Selling Unit Integration
5. Inventory Integration
6. Billing Integration
7. Prescription Image Implementation
8. Backend Implementation Plan
9. Frontend Wiring Plan
10. Step-by-Step Implementation Phases

---

## 1. Module Dependency Diagram

```
                           ┌─────────────────────┐
                           │       Contact       │
                           │  (patient role)     │
                           └──────────┬──────────┘
                                      │ 1:N
                                      ▼
┌─────────────────────────────────────────────────────────┐
│                      Consultation (Visit)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  id, patient_id, diagnosis, notes, fee, doctor_id  │  │
│  │  status (completed/scheduled/follow-up), date      │  │
│  │  sale_id — link to billing/inventory document       │  │
│  └──────────┬─────────────────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │ 1:1 (sale)
              │
              ├──────────────────────────────────┐
              │                                  │
              ▼                                  ▼
┌──────────────────────┐           ┌──────────────────────────┐
│    Prescription      │           │     Sale (existing)      │
│  (clinical record)   │           │  source='clinic'          │
│  id, consultation_id │           │  ┌─────────────────────┐ │
│  notes, refillable   │           │  │  SaleItem (existing) │ │
│  ┌────────────────┐  │           │  │  product_id         │ │
│  │PrescriptionItem │  │           │  │  selling_unit_id    │ │
│  │ (instructions)  │──┼──link────►│  │  quantity           │ │
│  │ dosage          │  │           │  │  unit_price         │ │
│  │ frequency       │  │           │  │  base_unit_qty      │ │
│  │ duration        │  │           │  └─────────────────────┘ │
│  │ instructions    │  │           │  ...subtotal, discount    │
│  │ notes           │  │           │  ...payment_status        │
│  │ sale_item_id ───┼──┘           │  ...financial_transaction │
│  └────────────────┘  │           └──────────────────────────┘
│  Images               │
│  ┌────────────────┐  │
│  │ Prescription   │  │
│  │ Image          │  │
│  └────────────────┘  │
└──────────────────────┘

           ▼
┌──────────────────────────────────────────────────────┐
│              EXISTING SYSTEMS (reused)                │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Product  │  │ Selling  │  │  InventoryService  │   │
│  │ (med)    │  │ Unit     │  │  (stock deduction)  │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Sale     │  │ Financial│  │  PaymentService    │   │
│  │ Service  │  │ Txn      │  │                    │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Key Design Decision: No Duplicate Structures

| Concept | Where It Lives | Why Not Duplicate |
|---------|---------------|-------------------|
| **Medicine** | Product (existing) | A medicine IS a product — same SKU, same base unit, same pricing |
| **Selling unit** | SellingUnit (existing) | Strip/Box/Capsule are selling units — shared across POS and clinic |
| **Inventory deduction** | InventoryTransaction (existing) | Stock is stock — same ledger whether sold at POS or prescribed |
| **Billing** | Sale + SaleItem (existing) | Clinic visits generate sales — same totals, discounts, payment tracking |
| **Payment** | FinancialTransaction (existing) | Money in/money out — same reconciliation |

---

## 2. Database Changes

### 2.1 New: `consultations` (replaces frontend `Visit`)

```sql
CREATE TABLE consultations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT UNSIGNED NOT NULL,
    doctor_id       BIGINT UNSIGNED NULL,
    visit_date      DATE NOT NULL,
    type            VARCHAR(100) DEFAULT 'General Consultation',
    diagnosis       TEXT NULL,
    notes           TEXT NULL,
    consultation_fee DECIMAL(12,0) DEFAULT 0,
    status          ENUM('completed','scheduled','follow-up') DEFAULT 'completed',
    sale_id         BIGINT UNSIGNED NULL,         -- FK → sales.id (existing)
    created_by      VARCHAR(255) NULL,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    INDEX (patient_id),
    INDEX (visit_date)
);
```

### 2.2 New: `prescriptions`

```sql
CREATE TABLE prescriptions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT UNSIGNED NOT NULL,
    patient_id      BIGINT UNSIGNED NOT NULL,
    notes           TEXT NULL,
    refillable      BOOLEAN DEFAULT FALSE,
    prescribed_by   VARCHAR(255) NULL,
    date            DATE NOT NULL,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,

    FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES contacts(id) ON DELETE CASCADE,
    INDEX (consultation_id),
    INDEX (patient_id)
);
```

### 2.3 New: `prescription_items`

This is the **clinical overlay** on top of a sale bill line item. It stores only what a `sale_item` doesn't know about: dosage, frequency, duration, and instructions. The product, selling unit, quantity, and pricing live on the linked `sale_item`.

```sql
CREATE TABLE prescription_items (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id     BIGINT UNSIGNED NOT NULL,
    sale_item_id        BIGINT UNSIGNED NOT NULL,          -- FK → sale_items(id)
    -- Clinical fields ONLY:
    dosage              VARCHAR(100) DEFAULT '1',
    frequency           VARCHAR(100) DEFAULT 'Once daily',
    duration            VARCHAR(100) DEFAULT '7 days',
    instructions        TEXT NULL,
    notes               TEXT NULL,
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP,

    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
    INDEX (prescription_id),
    INDEX (sale_item_id)
);
```

**Why this is better:**

| Concern | Lives In | Because |
|---------|----------|---------|
| **Product** | `sale_item.product_id` | Medicine IS a product. Same SKU, same inventory. |
| **Selling unit** | `sale_item.selling_unit_id` | Strip/Box/Capsule are selling units. Shared with POS. |
| **Quantity** | `sale_item.packaging_quantity` | "2 Strips" is the same quantity concept as POS. |
| **Base unit conversion** | `sale_item.base_unit_quantity` | Derived from the same selling unit. |
| **Price** | `sale_item.unit_price` | Pricing is a billing concern, not clinical. |
| **Inventory deduction** | `InventoryService` via sale creation | Same engine purchases and sales use. |
| **Dosage, frequency, duration** | `prescription_item` | The clinic's unique concern. Doesn't exist in POS. |
| **Instructions** | `prescription_item` | "Take with food" — clinical only. |

### 2.4 New: `prescription_images`

```sql
CREATE TABLE prescription_images (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id     BIGINT UNSIGNED NOT NULL,
    image_path          VARCHAR(255) NOT NULL,
    original_name       VARCHAR(255) NULL,
    mime_type           VARCHAR(50) NULL,
    size                INT UNSIGNED NULL,
    is_primary          BOOLEAN DEFAULT FALSE,
    uploaded_by         BIGINT UNSIGNED NULL,
    created_at          TIMESTAMP,

    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (prescription_id)
);
```

### 2.5 Existing Tables Used (No Changes)

| Table | How Clinic Uses It |
|-------|-------------------|
| `contacts` | Patient records via `roles: ['patient']` |
| `users` | Doctors via `role: 'doctor'` |
| `products` | Medicines |
| `selling_units` | Selling units for prescription items |
| `product_units` | Unit name registry |
| `sales` | Clinic billing (source='clinic') |
| `sale_items` | Clinic bill line items |
| `inventory_transactions` | Stock deduction when dispensed |
| `financial_transactions` | Payment records |

**No new columns on existing tables.** The clinic module extends via new tables only.

---

## 3. API Changes

### 3.1 New Routes

```
GET    /api/patients                  → PatientController@index
POST   /api/patients                  → PatientController@store
GET    /api/patients/{id}             → PatientController@show
PUT    /api/patients/{id}             → PatientController@update
DELETE /api/patients/{id}             → PatientController@destroy

GET    /api/patients/{id}/visits      → ConsultationController@patientVisits
GET    /api/patients/{id}/prescriptions → PrescriptionController@patientPrescriptions

GET    /api/consultations             → ConsultationController@index
POST   /api/consultations             → ConsultationController@store  (creates visit + sale + txns)
GET    /api/consultations/{id}        → ConsultationController@show

GET    /api/prescriptions/{id}        → PrescriptionController@show
POST   /api/prescriptions             → PrescriptionController@store

POST   /api/prescriptions/{id}/images → PrescriptionImageController@store
GET    /api/prescriptions/{id}/images → PrescriptionImageController@index
DELETE /api/prescription-images/{id}  → PrescriptionImageController@destroy
GET    /api/prescription-images/{id}/download → PrescriptionImageController@download
```

### 3.2 Inertia Routes (Existing, Enhanced)

```php
// Current (replace closure with controller):
Route::get('/clinic', [ClinicController::class, 'index'])->name('clinic.index');
Route::get('/clinic/patient/{id}', [ClinicController::class, 'show'])->name('clinic.patient');
Route::get('/clinic/patient/{id}/visit', [ClinicController::class, 'createVisit'])->name('clinic.visit');

// New:
Route::post('/clinic/visits', [ClinicController::class, 'storeVisit'])->name('clinic.visits.store');
```

### 3.3 Key Endpoint: POST /api/consultations (The Core Transaction)

This is the most critical endpoint. It creates everything in one DB transaction:

```php
public function store(StoreConsultationRequest $request)
{
    DB::transaction(function () use ($request) {
        // 1. Create/verify patient exists (Contact with 'patient' role)
        // 2. Create the Sale (source='clinic')
        // 3. Create the Consultation (linked to Sale)
        // 4. Create Prescription(s) with items
        // 5. For each prescription item, create SaleItem (same data)
        // 6. Create FinancialTransaction if payment collected
        // 7. Return all created records
    });
}
```

---

## 4. Prescription Medicines — Selling Unit Integration

**This is the most important integration point.**

### 4.1 Current Problem

`AddMedicineDialog.tsx` currently reads `product.packaging` (the old `PackagingConfig[]`):

```typescript
const getSmallestPkg = (product: Product) =>
    product.packaging.length
        ? product.packaging.reduce((a, b) => a.quantity < b.quantity ? a : b)
        : null
```

This uses the **deprecated** `packaging` field. The new architecture stores selling units in `sellingUnits`.

### 4.2 Fix: Use Selling Units

Replace the packaging read with selling units:

```typescript
const getSmallestPkg = (product: Product) =>
    product.sellingUnits.length
        ? product.sellingUnits.reduce((a, b) => a.quantity < b.quantity ? a : b)
        : null
```

The selling units for a product are now the materialized result of the derivation engine. They include:
- Derived units (from product_packaging)
- Custom units (manually added)

### 4.3 What the Doctor Sees

The UI stays the same — the doctor searches products, selects one, and sees available selling units:

```
┌────────────────────────────────────────┐
│  Paracetamol 500mg                     │
│  SKU: PAR-001 · Medicine               │
│                                        │
│  Selling Units:                        │
│  ┌──────────────────────────────────┐  │
│  │ [Box @ Rs. 500] [Strip @ Rs. 50] │  │
│  │ [Capsule @ Rs. 5]                │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Quantity:  [─] 2 [+] × Strip         │
│                                        │
│  Dosage: [1 tablet]                    │
│  Freq:   [Twice daily]                 │
│  Dur:    [7 days]                      │
└────────────────────────────────────────┘
```

### 4.4 Data Sent to Backend

```json
{
    "patient_id": 1,
    "diagnosis": "Seasonal allergies",
    "notes": "Patient responding well",
    "consultation_fee": 2000,
    "sale_items": [
        {
            "product_id": 5,
            "selling_unit_id": 12,
            "packaging_quantity": 2,
            "unit_price": 50,
            "total": 100,
            "dosage": "1 tablet",
            "frequency": "Twice daily",
            "duration": "7 days",
            "instructions": "After food"
        }
    ],
    "payment": {
        "method": "cash",
        "amount": 2100,
        "status": "paid"
    }
}
```

### 4.5 Backend Processing

```php
// 1. The sale_items array is converted to SaleItemData DTOs
//    (identical structure to POS sale items)
$saleData = CreateSaleData::fromRequest([
    'source' => 'clinic',
    'items' => $request->sale_items->map(fn($i) => [
        'product_id' => $i['product_id'],
        'selling_unit_id' => $i['selling_unit_id'],
        'quantity' => $i['packaging_quantity'],
        'unit_price' => $i['unit_price'],
    ]),
    // ...
]);

// 2. SaleService handles everything:
//    - Creates Sale + SaleItems
//    - Deducts inventory (via InventoryService)
//    - Records financial transaction
$sale = $this->saleService->create($saleData);

// 3. Prescription stores ONLY clinical instructions,
//    linked to each sale_item:
foreach ($request->sale_items as $i => $item) {
    $saleItem = $sale->items()->skip($i)->first();
    $prescriptionItem = PrescriptionItem::create([
        'sale_item_id' => $saleItem->id,
        'dosage' => $item['dosage'],
        'frequency' => $item['frequency'],
        'duration' => $item['duration'],
        'instructions' => $item['instructions'],
    ]);
}
```

---

## 5. Inventory Integration

### 6.1 Principle

> Prescribing does NOT deduct inventory. The sale does.

When the consultation is saved:
1. `SaleService::create()` creates the Sale + SaleItems
2. `SaleService` calls `InventoryService::applyMovement()` — stock deducted
3. `InventoryService` creates the inventory transaction + updates running balance

The clinic module does NOT call inventory directly. It delegates entirely to `SaleService`.

### 6.2 Inventory Transaction Type

The `SaleService` creates inventory transactions with `type: 'sale'` — same as POS sales. No need for a separate `'consumption'` type. The `source` field on the Sale (`'clinic'` vs `'pos'`) provides the distinction for reporting.

### 6.3 No Dispense Step Needed

Since the inventory deduction happens at sale creation time (same as POS), there's no separate "dispense" action required. The pharmacist's workflow is:

1. Doctor completes consultation → Sale created → inventory deducted
2. Pharmacist views the sale → sees what needs to be dispensed
3. Pharmacist dispenses physically → no system action needed

If a partial-dispense workflow is needed later, it can use the existing sale structure (partial fulfillment = separate sale).

### 6.4 Three-Unit Model Compliance

| Step | Unit | System |
|------|------|--------|
| **Doctor prescribes** | Selling unit (Strip) | UI selects `selling_unit_id` |
| **SaleService converts** | Base unit conversion | `baseQty = packagingQuantity × sellingUnit.quantity` |
| **Inventory deducted** | Base units | `InventoryService::applyMovement()` |
| **Stock ledger** | Base units | `InventoryTransaction.quantity` |

---

## 6. Billing Integration

### 7.1 Current Flow (Preserve)

The existing `NewVisit.tsx` creates:
1. A `Sale` record (`source: 'clinic'`)
2. A `FinancialTransaction` for payment

This flow is correct and will be preserved.

### 7.2 What Changes

| Aspect | Current (Mock) | Production |
|--------|---------------|------------|
| **Sale creation** | Pushes to in-memory `allSales` array | Calls `SaleService::create()` |
| **Sale items** | Direct CartItem construction | Uses `SaleItemData` DTO |
| **Financial transaction** | Calls `addTransaction()` | Calls `FinancialService` |
| **Inventory** | Never deducted | Deducted by `SaleService` at creation |
| **Prescription -> Sale link** | No link | `consultation.sale_id` FK |

### 7.3 Sale Creation During Consultation

The `POST /api/consultations` endpoint:
1. Converts prescription medicines into `SaleItemData` array (same structure as POS items)
2. Calls `SaleService::create()` with `source: 'clinic'`
   - Creates Sale + SaleItems
   - Deducts inventory via `InventoryService`
   - Records financial transaction
3. Creates Consultation linked to Sale
4. Creates Prescription with clinical instructions linked to each `sale_item`

This reuses existing `SaleService`, `InventoryService`, and `FinancialService` — no new billing or inventory code.

### 7.4 Consultation Fee as a Sale Item

The consultation fee becomes a separate line item on the sale:

```json
{
    "sale_items": [
        {
            "product_id": 5,
            "selling_unit_id": 12,
            "packaging_quantity": 2,
            "unit_price": 50,
            "total": 100
        },
        {
            "name": "Consultation Fee",
            "unit_price": 2000,
            "quantity": 1,
            "total": 2000
        }
    ]
}
```

The consultation fee line item has `product_id: null` and `selling_unit_id: null` — it's a service charge, not an inventory item. `SaleService` already handles service-only items (no inventory deduction for items without a product).

---

## 7. Prescription Image Implementation

### 7.1 Storage

```
storage/app/prescriptions/{consultation_id}/{prescription_id}/{uuid}.{ext}
```

**No Spatie Media Library.** Simple Laravel filesystem:

```php
// config/filesystems.php
'prescriptions' => [
    'driver' => 'local',
    'root' => storage_path('app/prescriptions'),
    'url' => '/storage/prescriptions',
],
```

### 7.2 Upload Endpoints

```php
POST /api/prescriptions/{id}/images
  Request: multipart/form-data
    - image: file (jpeg, png, webp, pdf, max 10MB)
  Response: { id, image_url, thumbnail_url, is_primary }

DELETE /api/prescription-images/{id}
  Response: 204

GET /api/prescription-images/{id}/download
  Response: File download with original filename
```

### 7.3 Frontend Components

| Component | Purpose | Reuse |
|-----------|---------|-------|
| `ImageDropZone.tsx` | Drag & drop + click upload | New component |
| `ImageViewer.tsx` | Fullscreen preview with zoom/nav | New component |

### 7.4 Upload States

| State | UX |
|-------|-----|
| **Empty** | Drop zone with upload prompt |
| **Dragging** | Highlighted drop zone |
| **Uploading** | Progress indicator |
| **Success** | Thumbnail preview |
| **Error** | Error message + retry button |
| **Multiple** | Gallery of thumbnails |

---

## 8. Backend Implementation Plan

### 8.1 Services (Reuse Existing)

| Service | Role | New/Existing |
|---------|------|-------------|
| `ContactService` | Create/find patients | Existing |
| `ProductService` | Search medicines | Existing |
| `SaleService` | Create clinic sales | Existing |
| `InventoryService` | Deduct stock on dispense | Existing |
| `FinancialService` | Record payments | Existing |
| `ConsultationService` | Create consultations | **New** |

### 8.2 ConsultationService (New)

```php
class ConsultationService
{
    public function create(StoreConsultationData $data): Consultation
    {
        return DB::transaction(function () use ($data) {
            // ───────────────────────────────────────────────────
            // 1. BILLING / INVENTORY DOCUMENT — Create the Sale
            //    Reuses SaleService — identical to POS workflow.
            // ───────────────────────────────────────────────────
            $sale = $this->saleService->create($data->toSaleData());

            // ───────────────────────────────────────────────────
            // 2. CLINICAL RECORD — Create the Consultation
            // ───────────────────────────────────────────────────
            $consultation = Consultation::create([
                'patient_id' => $data->patientId,
                'doctor_id' => $data->doctorId ?? auth()->id(),
                'visit_date' => $data->date,
                'diagnosis' => $data->diagnosis,
                'notes' => $data->notes,
                'consultation_fee' => $data->consultationFee,
                'status' => 'completed',
                'sale_id' => $sale->id,
                'created_by' => auth()->user()->name,
            ]);

            // ───────────────────────────────────────────────────
            // 3. CLINICAL DOCUMENT — Create the Prescription
            //    Stores ONLY clinical data. Links to sale_items.
            // ───────────────────────────────────────────────────
            foreach ($data->prescriptions as $rxData) {
                $prescription = $consultation->prescriptions()->create([
                    'patient_id' => $data->patientId,
                    'notes' => $rxData->notes,
                    'prescribed_by' => auth()->user()->name,
                    'date' => $data->date,
                ]);

                // Link each instruction to its sale line item
                foreach ($rxData->instructions as $i => $instruction) {
                    $saleItem = $sale->items()->skip($i)->first();

                    $prescription->items()->create([
                        'sale_item_id' => $saleItem->id,
                        'dosage' => $instruction->dosage,
                        'frequency' => $instruction->frequency,
                        'duration' => $instruction->duration,
                        'instructions' => $instruction->instructions,
                        'notes' => $instruction->notes,
                    ]);
                }
            }

            // ───────────────────────────────────────────────────
            // 4. FINANCIAL — Record payment if collected
            // ───────────────────────────────────────────────────
            if ($data->amountPaid > 0) {
                $this->financialService->recordPayment(
                    sale: $sale,
                    amount: $data->amountPaid,
                    method: $data->paymentMethod,
                    createdBy: auth()->user()->name,
                );
            }

            return $consultation->load('prescriptions.items.saleItem', 'sale.items');
        });
    }
}

// Data flow for one prescribed medicine:
// "2 Strips of Paracetamol, Twice daily, 7 days"
//
//   SaleService::create()
//     ├── SaleItem: { product_id: 5, selling_unit_id: 12,
//     │                packaging_quantity: 2, base_quantity: 20,
//     │                unit_price: 50, total: 100 }
//     ├── InventoryService: deducts 20 base units
//     └── FinancialTransaction: records payment
//
//   PrescriptionItem: { sale_item_id: 42, dosage: "1 tablet",
//                        frequency: "Twice daily", duration: "7 days",
//                        instructions: "After food" }
```

### 8.3 Controllers (New)

| Controller | Methods | Purpose |
|-----------|---------|---------|
| `ClinicController` | `index`, `show`, `createVisit`, `storeVisit` | Inertia page rendering |
| `ConsultationController` | `index`, `store`, `show` | API for consultations |
| `PrescriptionController` | `store`, `show`, `patientPrescriptions` | API for prescriptions |
| `PrescriptionImageController` | `store`, `index`, `destroy`, `download` | Image management |
| `PrescriptionItemController` | `dispense` | Inventory deduction |

### 8.4 DTOs (New)

```php
class StoreConsultationData
{
    public function __construct(
        public readonly int $patientId,
        public readonly string $diagnosis,
        public readonly string $notes,
        public readonly float $consultationFee,
        public readonly array $prescriptions,     // array of PrescriptionData
        public readonly string $paymentMethod,
        public readonly float $amountPaid,
        public readonly string $paymentStatus,
        ...
    ) {}

    public function toSaleData(): CreateSaleData { ... }
}
```

---

## 9. Frontend Wiring Plan

### 9.1 Minimal Changes — Swap Data Sources Only

| Component | Change | Impact |
|-----------|--------|--------|
| **ClinicPage** | Replace `mockPatients` with Inertia `patients` prop | Low — swap data source |
| **PatientProfile** | Replace `mockPatients/Visits/Prescriptions` with props | Low — swap data source |
| **NewVisit** | Replace `addPatient/Visit/Prescription` with `router.post()` | Medium — restructure submit |
| **AddMedicineDialog** | Replace `product.packaging` with `product.sellingUnits` | Low — field swap |
| **PrescriptionsList** | Add image thumbnail + click-to-viewer | Low — additive |
| **VisitsTimeline** | Unchanged | None |

### 9.2 AddMedicineDialog: The Critical Change

**Current:**
```typescript
import { mockProducts } from '@/data/inventory'
const getSmallestPkg = (product: Product) => product.packaging.length
    ? product.packaging.reduce((a, b) => a.quantity < b.quantity ? a : b)
    : null
```

**Changed to:**
```typescript
// Products come as Inertia page props
const products = (usePage().props as any).products || []

const getSmallestPkg = (product: Product) => product.sellingUnits.length
    ? product.sellingUnits.reduce((a, b) => a.quantity < b.quantity ? a : b)
    : null
```

The packaging selector in the dialog (lines 207-227) stays the same — it's already a button group showing unit names and prices. It just reads from `sellingUnits` instead of `packaging`.

### 9.3 NewVisit: From Mock to Real

**Current:**
```typescript
import { addVisit, addPrescription } from '@/data/clinic'
// ... creates objects, pushes to arrays ...
```

**Changed to:**
```typescript
router.post('/clinic/visits', {
    patient_id: patient.id,
    diagnosis,
    notes,
    consultation_fee: consultationAmount,
    sale_items: selectedMeds.map(m => ({
        product_id: m.productId,
        selling_unit_id: m.sellingUnitId,
        packaging_quantity: m.packagingQuantity,
        unit_price: m.unitPrice,
        total: m.total,
        // Clinical fields travel alongside but end up on prescription_item:
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.notes,
    })),
    payment_method: paymentMethod,
    amount_paid: amountPaid,
    payment_status: /* computed */,
}, {
    onSuccess: () => { /* show completion dialog */ },
    onError: (errs) => { toast.error(...) },
})
```

---

## 10. Step-by-Step Implementation Phases

### Phase 1: Database Foundation (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 1.1 | Create `consultations` migration | `database/migrations/` | None |
| 1.2 | Create `prescriptions` migration | `database/migrations/` | 1.1 |
| 1.3 | Create `prescription_items` migration | `database/migrations/` | 1.2 |
| 1.4 | Create `prescription_images` migration | `database/migrations/` | 1.2 |
| 1.5 | Run all migrations + verify | — | 1.1-1.4 |

### Phase 2: Models + Services (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 2.1 | Create `Consultation` model | `app/Models/Consultation.php` | 1.1 |
| 2.2 | Create `Prescription` model | `app/Models/Prescription.php` | 1.2 |
| 2.3 | Create `PrescriptionItem` model | `app/Models/PrescriptionItem.php` | 1.3 |
| 2.4 | Create `PrescriptionImage` model | `app/Models/PrescriptionImage.php` | 1.4 |
| 2.5 | Add `consultations()`, `prescriptions()` to Contact | `app/Models/Contact.php` | 2.1 |
| 2.6 | Create `ConsultationService` | `app/Domains/Clinic/Services/` | 2.1-2.4 |
| 2.7 | Create DTOs | `app/Domains/Clinic/DTOs/` | 2.6 |
| 2.8 | Fix `ClinicService` namespace + add methods | `app/Domains/Clinic/Services/ClinicService.php` | 2.6 |

### Phase 3: Controllers + Routes (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 3.1 | Create `ClinicController` (Inertia pages) | `app/Http/Controllers/ClinicController.php` | 2.6 |
| 3.2 | Create `PrescriptionImageController` | `app/Http/Controllers/` | 2.4 |
| 3.3 | Update routes (replace closures with controller) | `routes/web.php` | 3.1 |
| 3.4 | Register image API routes | `routes/web.php` or `routes/api.php` | 3.2 |
| 3.5 | Validation requests | `app/Http/Requests/Clinic/` | — |

### Phase 4: Frontend Wiring (Estimated: 1-2 sessions)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 4.1 | Wire ClinicPage to Inertia props | `ClinicPage.tsx` | 3.1 |
| 4.2 | Wire PatientProfile to Inertia props | `PatientProfile.tsx` | 3.1 |
| 4.3 | Update AddMedicineDialog — use `sellingUnits` | `AddMedicineDialog.tsx` | — |
| 4.4 | Restructure NewVisit submission to use `router.post` | `NewVisit.tsx` | 3.3 |
| 4.5 | Add `sale_items` data to completion dialog | `NewVisit.tsx` | 4.4 |

### Phase 5: Prescription Images (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 5.1 | Configure `prescriptions` filesystem disk | `config/filesystems.php` | — |
| 5.2 | Create `ImageDropZone` component | `resources/js/components/ui/` | — |
| 5.3 | Create `ImageViewer` component | `resources/js/components/ui/` | — |
| 5.4 | Integrate upload into `AddMedicineDialog` | `AddMedicineDialog.tsx` | 5.2 |
| 5.5 | Add thumbnail to `PrescriptionsList` | `PrescriptionsList.tsx` | 5.3 |
| 5.6 | Wire `POST /api/prescriptions/{id}/images` | frontend API call | 3.4 |

### Phase 6: Dispense + Inventory (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 6.1 | Create `PrescriptionItemController::dispense` | `app/Http/Controllers/` | 2.3, InventoryService |
| 6.2 | Add dispense button to prescription UI | Clinic frontend | 6.1 |
| 6.3 | Create inventory transaction on dispense | reuse `InventoryService` | 6.1 |

### Phase 7: Profile + Doctor Support (Estimated: 1 session)

| Step | Task | File(s) | Dependencies |
|------|------|---------|-------------|
| 7.1 | Set up patient data in ContactController | `ContactController.php` | — |
| 7.2 | Add `role: 'doctor'` user management | Users/Settings | — |
| 7.3 | Wire patient list from real contacts | `ClinicPage.tsx` | 7.1 |

### Phase 8: Testing + Polish (Estimated: 1 session)

| Step | Task | Dependencies |
|------|------|-------------|
| 8.1 | Test consultation creation end-to-end | Phase 4 |
| 8.2 | Test prescription item → inventory deduction | Phase 6 |
| 8.3 | Test prescription image upload/display | Phase 5 |
| 8.4 | Test billing and payment flow | Phase 4 |
| 8.5 | Verify all existing products/selling units work | — |
| 8.6 | Rollback check: data integrity on failure | — |

---

## Architecture Compliance Checklist

| Principle | Status | How |
|-----------|--------|-----|
| ✅ **No duplicate product logic** | Compliant | Product lives on `sale_item.product_id`, not on prescription |
| ✅ **No duplicate selling unit logic** | Compliant | Selling unit lives on `sale_item.selling_unit_id` |
| ✅ **No duplicate inventory system** | Compliant | Deduction by existing `SaleService` → `InventoryService` |
| ✅ **No duplicate billing system** | Compliant | Clinic sales use existing `SaleService::create()` with `source: 'clinic'` |
| ✅ **No duplicate payment system** | Compliant | Payments via existing `FinancialService` |
| ✅ **Prescription is purely clinical** | Compliant | Only dosage, frequency, duration, instructions — no product/price data |
| ✅ **Existing UI preserved** | Compliant | Only data sources swapped; layout unchanged |
| ✅ **Existing products work** | Compliant | Medicines are regular products with selling units, shared with POS |
| ✅ **Backward compatible** | Compliant | New tables only, no existing schema changes |
| ✅ **Rollback safe** | Compliant | Drop 4 new tables, no data loss on existing systems |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Prescription content** | Clinical only (dosage, frequency, duration, instructions, images) | Product, selling unit, quantity, pricing all live on `sale_item`. Prescription is a clinical overlay, not an inventory structure. |
| **Prescription → Sale link** | Via `prescription_item.sale_item_id` FK | Each clinical instruction points to its corresponding sale line item. No duplicate product/selling unit data. |
| **Inventory deduction** | At sale creation (by `SaleService`) | Same as POS. No separate dispense step needed. The `source: 'clinic'` field provides reporting distinction. |
| **Inventory transaction type** | `'sale'` (same as POS) | No need for `'consumption'` type. The `sale.source` field distinguishes clinic from POS. |
| **Sale source** | `'clinic'` | Existing `Sale.source` enum already includes `'clinic'`. No schema change needed. |
| **Selling unit snapshot** | On `sale_item.base_unit_quantity` | Same pattern used by POS. Prescription doesn't need it — it delegates to the sale. |
| **Doctor identity** | `users` with `role: 'doctor'` | Reuses existing User model. No new Doctor model needed. |
| **Patient identity** | `contacts` with `roles: ['patient']` | Reuses existing Contact model. No new Patient model. |
| **Image library** | None (raw Laravel filesystem) | Avoids Spatie Media Library overhead. Simple file storage. |
| **API style** | Inertia for pages, simple POST for data | Consistent with existing app architecture. |
