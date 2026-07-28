import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Receipt, Eye } from 'lucide-react'
import { SettingsLayout, SettingsSection, SettingsCard, SettingsRow, SettingsInput, SettingsToggle, SettingsSaveBar } from '../components/SettingsComponents'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ReceiptSettingsPage() {
  const { props } = usePage()
  const settings = (props as any).settings || {}
  const receipt = (settings.receipt || {}) as Record<string, any>
  const business = (settings.business || {}) as Record<string, any>

  const [draft, setDraft] = useState({ ...receipt })
  const origStr = JSON.stringify(receipt)
  const draftStr = JSON.stringify(draft)
  const hasChanges = draftStr !== origStr

  const set = (key: string, val: any) => setDraft({ ...draft, [key]: val })

  const save = () => {
    router.put('/settings', { receipt: draft }, {
      onSuccess: () => toast.success('Receipt settings saved'),
      onError: () => toast.error('Failed to save settings'),
    })
  }

  return (
    <SettingsLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-rose-600/20 to-rose-600/5 flex items-center justify-center shrink-0">
            <Receipt className="size-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Receipt Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Control what appears on printed Purchase Bills and Sale Invoices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">

            {/* ── Document Titles ── */}
            <SettingsSection title="Document Titles">
              <SettingsCard>
                <SettingsRow label="Purchase Bill Title" description="Heading on purchase printouts">
                  <SettingsInput value={draft.purchase_title || 'Purchase Bill'} onChange={(v) => set('purchase_title', v)} />
                </SettingsRow>
                <SettingsRow label="Sale Invoice Title" description="Heading on sale printouts">
                  <SettingsInput value={draft.sale_title || 'Sale Invoice'} onChange={(v) => set('sale_title', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Business Information Visibility ── */}
            <SettingsSection title="Business Information Visibility">
              <SettingsCard>
                <SettingsRow label="Business Logo">
                  <SettingsToggle enabled={!!draft.show_business_logo} onChange={(v) => set('show_business_logo', v)} />
                </SettingsRow>
                <SettingsRow label="Business Name">
                  <SettingsToggle enabled={!!draft.show_business_name} onChange={(v) => set('show_business_name', v)} />
                </SettingsRow>
                <SettingsRow label="Address">
                  <SettingsToggle enabled={!!draft.show_business_address} onChange={(v) => set('show_business_address', v)} />
                </SettingsRow>
                <SettingsRow label="Phone Number">
                  <SettingsToggle enabled={!!draft.show_phone} onChange={(v) => set('show_phone', v)} />
                </SettingsRow>
                <SettingsRow label="Email">
                  <SettingsToggle enabled={!!draft.show_email} onChange={(v) => set('show_email', v)} />
                </SettingsRow>
                <SettingsRow label="Website">
                  <SettingsToggle enabled={!!draft.show_website} onChange={(v) => set('show_website', v)} />
                </SettingsRow>
                <SettingsRow label="Tax Number / NTN">
                  <SettingsToggle enabled={!!draft.show_tax_number} onChange={(v) => set('show_tax_number', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Invoice Info Visibility ── */}
            <SettingsSection title="Invoice Information">
              <SettingsCard>
                <SettingsRow label="Invoice Number">
                  <SettingsToggle enabled={!!draft.show_invoice_number} onChange={(v) => set('show_invoice_number', v)} />
                </SettingsRow>
                <SettingsRow label="Date">
                  <SettingsToggle enabled={!!draft.show_date} onChange={(v) => set('show_date', v)} />
                </SettingsRow>
                <SettingsRow label="Payment Status Badge">
                  <SettingsToggle enabled={!!draft.show_payment_status} onChange={(v) => set('show_payment_status', v)} />
                </SettingsRow>
                <SettingsRow label="Payment Method">
                  <SettingsToggle enabled={!!draft.show_payment_method} onChange={(v) => set('show_payment_method', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Party Info Visibility ── */}
            <SettingsSection title="Customer / Supplier Information">
              <SettingsCard>
                <SettingsRow label="Name">
                  <SettingsToggle enabled={!!draft.show_party_name} onChange={(v) => set('show_party_name', v)} />
                </SettingsRow>
                <SettingsRow label="Phone Number">
                  <SettingsToggle enabled={!!draft.show_party_phone} onChange={(v) => set('show_party_phone', v)} />
                </SettingsRow>
                <SettingsRow label="Address">
                  <SettingsToggle enabled={!!draft.show_party_address} onChange={(v) => set('show_party_address', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Items Table ── */}
            <SettingsSection title="Items Table Columns">
              <SettingsCard>
                <SettingsRow label="Unit">
                  <SettingsToggle enabled={!!draft.show_item_unit} onChange={(v) => set('show_item_unit', v)} />
                </SettingsRow>
                <SettingsRow label="Discount Column">
                  <SettingsToggle enabled={!!draft.show_item_discount} onChange={(v) => set('show_item_discount', v)} />
                </SettingsRow>
                <SettingsRow label="SKU">
                  <SettingsToggle enabled={!!draft.show_item_sku} onChange={(v) => set('show_item_sku', v)} />
                </SettingsRow>
                <SettingsRow label="Barcode">
                  <SettingsToggle enabled={!!draft.show_item_barcode} onChange={(v) => set('show_item_barcode', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Totals ── */}
            <SettingsSection title="Totals Display">
              <SettingsCard>
                <SettingsRow label="Subtotal"><SettingsToggle enabled={!!draft.show_subtotal} onChange={(v) => set('show_subtotal', v)} /></SettingsRow>
                <SettingsRow label="Discount"><SettingsToggle enabled={!!draft.show_discount} onChange={(v) => set('show_discount', v)} /></SettingsRow>
                <SettingsRow label="Grand Total"><SettingsToggle enabled={!!draft.show_grand_total} onChange={(v) => set('show_grand_total', v)} /></SettingsRow>
                <SettingsRow label="Paid Amount"><SettingsToggle enabled={!!draft.show_paid} onChange={(v) => set('show_paid', v)} /></SettingsRow>
                <SettingsRow label="Remaining Balance"><SettingsToggle enabled={!!draft.show_remaining} onChange={(v) => set('show_remaining', v)} /></SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Footer ── */}
            <SettingsSection title="Footer">
              <SettingsCard>
                <SettingsRow label="Thank You Message" description="Short heading above the footer">
                  <input value={draft.header_text || ''} onChange={(e) => set('header_text', e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring" />
                </SettingsRow>
                <SettingsRow label="Footer Message" description="Multi-line. Displayed at the bottom of every invoice.">
                  <textarea value={draft.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring resize-none" placeholder="Goods once sold will not be taken back." />
                </SettingsRow>
                <SettingsRow label="Terms &amp; Conditions" description="Warranty, return policy, payment terms.">
                  <textarea value={draft.terms_conditions || ''} onChange={(e) => set('terms_conditions', e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring resize-none" placeholder="Optional — only shown when filled in." />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Signatures ── */}
            <SettingsSection title="Signature Section">
              <SettingsCard>
                <SettingsRow label="Customer Signature"><SettingsToggle enabled={!!draft.show_customer_signature} onChange={(v) => set('show_customer_signature', v)} /></SettingsRow>
                <SettingsRow label="Authorized Signature"><SettingsToggle enabled={!!draft.show_authorized_signature} onChange={(v) => set('show_authorized_signature', v)} /></SettingsRow>
                <SettingsRow label="Received By"><SettingsToggle enabled={!!draft.show_received_by} onChange={(v) => set('show_received_by', v)} /></SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* ── Print Options ── */}
            <SettingsSection title="Print Options">
              <SettingsCard>
                <SettingsRow label="Paper Size">
                  <select value={draft.paper_size || 'A4'} onChange={(e) => set('paper_size', e.target.value)}
                    className="w-32 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring">
                    <option value="A4">A4</option>
                    <option value="A5">A5</option>
                    <option value="58mm">58mm (Thermal)</option>
                    <option value="80mm">80mm (Thermal)</option>
                  </select>
                </SettingsRow>
                <SettingsRow label="Print Date on Document">
                  <SettingsToggle enabled={!!draft.show_print_date} onChange={(v) => set('show_print_date', v)} />
                </SettingsRow>
                <SettingsRow label="Page Numbers">
                  <SettingsToggle enabled={!!draft.show_page_numbers} onChange={(v) => set('show_page_numbers', v)} />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

          </div>

          {/* ── Live Preview ── */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="size-3.5" /> Preview
            </div>
            <div className={cn(
              'bg-white text-black rounded-lg shadow-sm border border-gray-200 p-4 font-mono text-[9px] leading-tight mx-auto',
              (draft.paper_size || 'A4') === '58mm' ? 'max-w-[180px]' : 'max-w-[260px]',
            )}>
              {/* Business Header */}
              <div className="text-center mb-2">
                {draft.show_business_logo && <div className="w-6 h-6 bg-gray-300 rounded mx-auto mb-1" />}
                {draft.show_business_name && <div className="font-bold text-[11px]">{business.business_name || 'Your Business'}</div>}
                {draft.show_business_address && <div className="text-gray-500">{business.address || '123 Street'}</div>}
                {draft.show_phone && <div className="text-gray-500">{business.phone || '+92-300-xxxxxxx'}</div>}
                {draft.show_email && <div className="text-gray-500">{business.email || 'info@example.com'}</div>}
              </div>
              <div className="border-t border-dashed border-gray-300 my-1.5" />

              {/* Title */}
              <div className="text-center font-bold mb-1">INVOICE</div>

              {/* Invoice Info */}
              {draft.show_invoice_number && <div className="flex justify-between text-gray-600"><span>Invoice #</span><span>INV-001</span></div>}
              {draft.show_date && <div className="flex justify-between text-gray-600"><span>Date</span><span>27 Jul 2026</span></div>}
              {draft.show_payment_status && <div className="flex justify-between"><span>Status</span><span className="text-emerald-600 font-semibold">Paid</span></div>}
              <div className="border-t border-dashed border-gray-300 my-1.5" />

              {/* Items */}
              <div className="flex justify-between font-semibold"><span>Item</span><span>Amount</span></div>
              <div className="flex justify-between text-gray-600"><span>Product 1</span><span>150</span></div>
              <div className="flex justify-between text-gray-600"><span>Product 2</span><span>250</span></div>
              <div className="border-t border-dashed border-gray-300 my-1.5" />

              {/* Totals */}
              {draft.show_subtotal && <div className="flex justify-between"><span>Subtotal</span><span>400</span></div>}
              {draft.show_discount && <div className="flex justify-between text-red-600"><span>Discount</span><span>-0</span></div>}
              {draft.show_grand_total && <div className="flex justify-between font-bold"><span>Total</span><span>400</span></div>}
              {draft.show_paid && <div className="flex justify-between"><span>Paid</span><span>400</span></div>}
              <div className="border-t border-dashed border-gray-300 my-1.5" />

              {/* Footer */}
              <div className="text-center text-gray-500">{draft.header_text || 'Thank you!'}</div>
              <div className="text-center text-gray-400 text-[8px] mt-1">{draft.footer_text || ''}</div>
              {draft.terms_conditions && <div className="text-center text-gray-400 text-[8px] mt-1">{draft.terms_conditions}</div>}

              {/* Signatures */}
              <div className="flex justify-between mt-3 text-gray-500 text-[8px]">
                {draft.show_customer_signature && <div>Customer: _________</div>}
                {draft.show_authorized_signature && <div>Authorized: _________</div>}
              </div>
              {draft.show_received_by && <div className="text-gray-500 text-[8px] mt-1">Received By: _________</div>}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Preview uses placeholder data. Actual invoices use real transaction data.</p>
          </div>
        </div>

        <SettingsSaveBar onSave={save} hasChanges={hasChanges} />
      </div>
    </SettingsLayout>
  )
}
