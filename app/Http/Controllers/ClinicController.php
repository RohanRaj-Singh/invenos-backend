<?php

namespace App\Http\Controllers;

use App\Domains\Clinic\DTOs\StoreConsultationData;
use App\Domains\Clinic\Services\ClinicService;
use App\Domains\Clinic\Services\ConsultationService;
use App\Domains\Products\Services\ProductService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicController extends Controller
{
    public function __construct(
        private readonly ClinicService $clinicService,
        private readonly ConsultationService $consultationService,
        private readonly ProductService $productService,
    ) {}

    /**
     * Patient list page.
     */
    public function index(): Response
    {
        $search = request('search', '');
        $patients = $this->clinicService->searchPatients(query: $search);
        $stats = $this->clinicService->stats();

        return Inertia::render('clinic/ClinicPage', [
            'patients' => $patients->items(),
            'stats' => $stats,
            'meta' => [
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
                'per_page' => $patients->perPage(),
                'total' => $patients->total(),
            ],
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Patient profile page — full medical history.
     */
    public function show(int $id): Response
    {
        $patient = $this->clinicService->getPatient($id);
        $consultations = $this->consultationService->patientConsultations($id);
        $prescriptions = $this->consultationService->patientPrescriptions($id);

        return Inertia::render('clinic/PatientProfile', [
            'patient' => $patient->toArray(),
            'consultations' => $consultations,
            'prescriptions' => $prescriptions,
        ]);
    }

    /**
     * New visit form page.
     */
    public function createVisit(int $patientId): Response
    {
        $patient = $this->clinicService->getPatient($patientId);
        $products = $this->productService->search(perPage: 999)->items();
        $categories = $this->productService->allCategories();

        return Inertia::render('clinic/NewVisit', [
            'patient' => $patient->toArray(),
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Visit detail page — full consultation + sale + prescription + images.
     */
    public function showVisit(int $id): Response
    {
        $consultation = $this->consultationService->get($id);
        return Inertia::render('clinic/VisitDetail', [
            'consultation' => $consultation->toArray(),
        ]);
    }

    /**
     * Store a new visit (consultation + sale + prescription).
     */
    public function storeVisit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer|exists:contacts,id',
            'diagnosis' => 'required|string|max:2000',
            'notes' => 'nullable|string|max:5000',
            'consultation_fee' => 'nullable|numeric|min:0',
            'date' => 'nullable|date',
            'medications' => 'nullable|array',
            'medications.*.product_id' => 'required_with:medications|integer|exists:products,id',
            'medications.*.selling_unit_id' => 'nullable|integer|exists:selling_units,id',
            'medications.*.packaging_quantity' => 'required_with:medications|numeric|min:0.01',
            'medications.*.base_unit_quantity' => 'required_with:medications|numeric|min:0.001',
            'medications.*.unit_price' => 'nullable|numeric|min:0',
            'medications.*.total' => 'nullable|numeric|min:0',
            'medications.*.packaging_name' => 'nullable|string|max:100',
            'medications.*.dosage' => 'nullable|string|max:100',
            'medications.*.frequency' => 'nullable|string|max:100',
            'medications.*.duration' => 'nullable|string|max:100',
            'medications.*.instructions' => 'nullable|string|max:2000',
            'payment_method' => 'nullable|string|max:50',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|string|in:paid,partial,unpaid',
        ]);

        try {
            $data = StoreConsultationData::fromRequest($validated);
            $consultation = $this->consultationService->create($data);

            return redirect()->route('clinic.patient', $data->patientId)
                ->with('success', 'Visit recorded successfully.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return redirect()->back()->with('error', 'Referenced record not found: ' . $e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Failed to save visit: ' . $e->getMessage());
        }
    }
}
