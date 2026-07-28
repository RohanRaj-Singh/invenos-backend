import { usePage } from '@inertiajs/react'
import ProductFormComponent from './components/ProductForm'

/**
 * Legacy page wrapper — kept for backward compatibility.
 * Use AddProduct for creating and EditProduct for editing instead.
 */
export default function ProductFormPage() {
  const { props } = usePage()
  const categories = (props as any).categories || []
  const product = (props as any).product as Record<string, any> | null
  const generatedSku = (props as any).generated_sku as string | undefined

  return (
    <ProductFormComponent
      mode={product ? 'edit' : 'create'}
      categories={categories}
      product={product}
      generatedSku={generatedSku}
    />
  )
}
