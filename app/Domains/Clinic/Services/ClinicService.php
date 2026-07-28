<?php

namespace App\Domains\Clinic\Services;

use App\Models\Contact;
use App\Models\Consultation;

/**
 * General clinic operations — patient lookup, stats, etc.
 */
class ClinicService
{
    public function searchPatients(string $query = '', int $perPage = 25)
    {
        $q = Contact::whereJsonContains('roles', 'patient')
            ->withCount('consultations');

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            });
        }

        return $q->orderBy('name')
                 ->paginate($perPage);
    }

    public function getPatient(int $id): Contact
    {
        return Contact::withCount('consultations')
            ->whereJsonContains('roles', 'patient')
            ->findOrFail($id);
    }

    public function getPatientsList(): array
    {
        return Contact::whereJsonContains('roles', 'patient')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    public function stats(): array
    {
        $total = Contact::whereJsonContains('roles', 'patient')->count();
        $thisWeek = Consultation::whereBetween('visit_date', [
            now()->startOfWeek()->format('Y-m-d'),
            now()->endOfWeek()->format('Y-m-d'),
        ])->count();

        return [
            'total_patients' => $total,
            'this_week_visits' => $thisWeek,
        ];
    }
}
