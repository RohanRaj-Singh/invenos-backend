<?php

namespace Tests\Feature\Database;

use App\Models\Contact;
use App\Models\Sale;
use App\Models\PurchaseBill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_contact_with_multiple_roles(): void
    {
        $contact = Contact::create([
            'type' => 'person',
            'roles' => ['customer', 'supplier'],
            'name' => 'Test User',
            'phone' => '0300-1234567',
            'email' => 'test@example.com',
        ]);
        $this->assertContains('customer', $contact->roles);
        $this->assertContains('supplier', $contact->roles);
    }

    public function test_customer_scope(): void
    {
        Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C1', 'phone' => '0300-1111111']);
        Contact::create(['type' => 'person', 'roles' => ['supplier'], 'name' => 'S1', 'phone' => '0300-2222222']);
        $this->assertEquals(1, Contact::customers()->count());
    }

    public function test_contact_can_have_sales(): void
    {
        $contact = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C1', 'phone' => '0300-1111111']);
        Sale::create([
            'invoice_number' => 'INV-TEST-001', 'date' => now(),
            'customer_id' => $contact->id, 'subtotal' => 100,
            'grand_total' => 100, 'amount_paid' => 100, 'outstanding_balance' => 0,
            'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $this->assertEquals(1, $contact->sales()->count());
    }

    public function test_soft_delete_preserves_transactions(): void
    {
        $contact = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C1', 'phone' => '0300-1111111']);
        Sale::create([
            'invoice_number' => 'INV-TEST-002', 'date' => now(),
            'customer_id' => $contact->id, 'subtotal' => 100,
            'grand_total' => 100, 'amount_paid' => 100, 'outstanding_balance' => 0,
            'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $contact->delete();
        $this->assertSoftDeleted($contact);
        $this->assertEquals(1, Sale::count());
    }
}
