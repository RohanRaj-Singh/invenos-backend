interface BusinessHeaderProps {
  business: Record<string, any>
  receipt: Record<string, any>
  title: string
}

/** Business info from settings — section visibility controlled by receipt toggles */
export default function BusinessHeader({ business, receipt, title }: BusinessHeaderProps) {
  const r = receipt || {}
  const show = (key: string, def = true) => r[key] ?? def

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {show('show_business_logo') && business.business_logo && (
            <img src={business.business_logo} alt="" className="h-14 w-auto mt-1 object-contain shrink-0" />
          )}
          <div>
            {show('show_business_name') && (
              <h1 className="text-xl font-bold text-gray-900">{business.business_name || ''}</h1>
            )}
            {show('show_business_address') && business.address && (
              <p className="text-xs text-gray-500 mt-0.5">{business.address}</p>
            )}
            <div className="text-xs text-gray-500 mt-1 space-x-3">
              {show('show_phone') && business.phone && <span>{business.phone}</span>}
              {show('show_email') && business.email && <span>{business.email}</span>}
              {show('show_website') && business.website && <span>{business.website}</span>}
            </div>
            {show('show_tax_number') && business.tax_number && (
              <p className="text-xs text-gray-500 mt-1">NTN: {business.tax_number}</p>
            )}
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide shrink-0">{title}</h2>
      </div>
      <hr className="border-t-2 border-gray-800 mt-4" />
    </div>
  )
}
