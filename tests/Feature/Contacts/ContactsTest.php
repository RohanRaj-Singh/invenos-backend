<?php

namespace Tests\Feature\Contacts;

use App\Domains\Contacts\DTOs\CreateContactData;
use App\Domains\Contacts\Services\ContactService;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactsTest extends TestCase
{
    use RefreshDatabase;

    private ContactService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ContactService::class);
    }

    public function test_can_create_contact(): void
    {
        $data = CreateContactData::fromRequest([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Muhammad Ali',
            'phone' => '0300-1234567',
        ]);

        $contact = $this->service->create($data);

        $this->assertDatabaseHas('contacts', ['name' => 'Muhammad Ali']);
        $this->assertEquals('person', $contact->type);
        $this->assertContains('customer', $contact->roles);
    }

    public function test_can_create_contact_with_multiple_roles(): void
    {
        $data = CreateContactData::fromRequest([
            'type' => 'organization',
            'roles' => ['customer', 'supplier'],
            'name' => 'ABC Trading',
            'company_name' => 'ABC Trading Co.',
            'phone' => '042-35761234',
        ]);

        $contact = $this->service->create($data);

        $this->assertContains('customer', $contact->roles);
        $this->assertContains('supplier', $contact->roles);
        $this->assertEquals('organization', $contact->type);
    }

    public function test_can_search_contacts(): void
    {
        Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'Ahmed Khan', 'phone' => '0300-1111111']);
        Contact::create(['type' => 'person', 'roles' => ['supplier'], 'name' => 'Ali Store', 'phone' => '0300-2222222']);

        $results = $this->service->search(query: 'Ahmed');
        $this->assertEquals(1, $results->total());
    }

    public function test_can_filter_by_role(): void
    {
        Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'Customer A', 'phone' => '0300-1111111']);
        Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'Supplier B', 'phone' => '0300-2222222']);

        $customers = $this->service->search(role: 'customer');
        $suppliers = $this->service->search(role: 'supplier');

        $this->assertEquals(1, $customers->total());
        $this->assertEquals(1, $suppliers->total());
    }

    public function test_can_update_contact(): void
    {
        $contact = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'Old Name', 'phone' => '0300-1111111']);

        $updated = $this->service->update($contact->id, ['name' => 'New Name']);

        $this->assertEquals('New Name', $updated->name);
        $this->assertDatabaseHas('contacts', ['name' => 'New Name']);
        $this->assertDatabaseMissing('contacts', ['name' => 'Old Name']);
    }

    public function test_can_delete_contact(): void
    {
        $contact = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'To Delete', 'phone' => '0300-1111111']);

        $this->service->delete($contact->id);

        $this->assertSoftDeleted($contact);
    }

    public function test_can_update_roles(): void
    {
        $contact = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'Role Test', 'phone' => '0300-1111111']);

        $updated = $this->service->updateRoles($contact->id, ['customer', 'supplier']);

        $this->assertContains('customer', $updated->roles);
        $this->assertContains('supplier', $updated->roles);
    }

    public function test_http_create_endpoint(): void
    {
        $response = $this->post('/contacts', [
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'HTTP Customer',
            'phone' => '0300-9999999',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('contacts', ['name' => 'HTTP Customer']);
    }

    public function test_http_list_endpoint(): void
    {
        Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'List Test', 'phone' => '0300-1111111']);

        $response = $this->get('/contacts?role=customer');

        $response->assertInertia(fn ($page) => $page->component('contacts/ContactsList'));
    }
}
