import { usePage } from '@inertiajs/react'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductForm from './components/ProductForm'

export default function EditProductPage() {
  const { props } = usePage()
  const product = (props as any).product as Record<string, any> | null
  const categories = (props as any).categories || []

  if (!product) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          <Package className="size-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Product not found</h2>
          <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ProductForm
        mode="edit"
        categories={categories}
        product={product}
      />
    </div>
  )
}
