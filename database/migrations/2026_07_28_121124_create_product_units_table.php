<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_units', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        // Seed default units — canonical unit name registry.
        // No measurement_type column; that belongs in application-layer logic.
        $units = [
            // Count units
            'Piece', 'Capsule', 'Tablet', 'Bottle', 'Box', 'Carton',
            'Strip', 'Sachet', 'Packet', 'Roll', 'Sheet', 'Tray',
            'Pouch', 'Vial', 'Ampoule', 'Bag', 'Tub', 'Can', 'Jar',
            // Weight
            'Kilogram (kg)', 'Gram (g)', 'Milligram (mg)',
            // Volume
            'Litre (L)', 'Millilitre (ml)',
            // Length
            'Meter', 'Centimetre (cm)',
        ];

        foreach ($units as $name) {
            DB::table('product_units')->insert([
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_units');
    }
};
