import { usePage } from '@inertiajs/react'
import ProductForm from './components/ProductForm'

interface CategoryItem {
  id: number
  name: string
}

interface BackendProduct {
  id: number
  name: string
  sku: string
  category: CategoryItem | null
  [key: string]: any
}

export default function ProductFormPage() {
  const { props } = usePage()
  const { categories, product, generated_sku } = props as any

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ProductForm
        categories={categories as CategoryItem[]}
        product={product as BackendProduct | undefined}
        generatedSku={generated_sku as string | undefined}
      />
    </div>
  )
}
