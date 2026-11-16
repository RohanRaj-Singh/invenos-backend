import { usePage } from '@inertiajs/react'
import ProductForm from './components/ProductForm'

export default function CreateProductPage() {
  const { props } = usePage()
  const categories = (props as any).categories || []
  const generatedSku = (props as any).generated_sku as string | undefined

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProductForm
        mode="create"
        categories={categories}
        generatedSku={generatedSku}
        initialSetupFormula={Boolean((props as any).setup_formula)}
        canViewCost={Boolean((props as any).can_view_cost)}
      />
    </div>
  )
}
