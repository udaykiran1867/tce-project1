"use client"

import { Package, Edit, Database, Image, Eye } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from "lucide-react"

function Dialog({ children, ...props }) { return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root> }
function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content className={cn('fixed top-1/2 left-1/2 z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background border rounded-lg p-6 shadow-lg', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function ProductCard({ product, onEdit, onOpenRecords }) {
  const [showImageModal, setShowImageModal] = useState(false)
  
  const availabilityPercentage =
    product.masterCount > 0
      ? Math.round(((product.availability || 0) / product.masterCount) * 100)
      : 0

  const getAvailabilityColor = () => {
    if (availabilityPercentage >= 70) return "bg-green-500"
    if (availabilityPercentage >= 30) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div
      className="flex flex-col rounded-lg border bg-card shadow-sm"
      style={{ border: "2px solid oklch(24.571% 0.12604 288.685)" }}
    >
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <h3 className="font-semibold leading-none tracking-tight text-lg line-clamp-1">{product.name}</h3>
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border text-foreground shrink-0">
            {availabilityPercentage}% available
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 flex-1 space-y-4">
        {product.imageUrl && (
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Master Count</p>
            <p className="text-2xl font-semibold">{product.masterCount || 0}</p>
            <p className="text-xs text-muted-foreground">Total quantity owned</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Availability</p>
            <p className="text-2xl font-semibold">{product.availability || 0}</p>
            <p className="text-xs text-muted-foreground">Usable quantity</p>
          </div>
        </div>

        {product.price && (
          <div className="space-y-1 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Price</p>
            <p className="text-xl font-semibold">₹{parseFloat(product.price).toFixed(2)}</p>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Stock Level</span>
            <span>
              {product.availability || 0} / {product.masterCount || 0}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getAvailabilityColor()}`}
              style={{ width: `${availabilityPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center p-6 pt-0 gap-2 flex-wrap">
        {product.imageUrl && (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 h-9 px-4 py-2 border bg-background hover:bg-accent hover:text-accent-foreground"
            onClick={() => setShowImageModal(true)}
            title="View product image"
          >
            <Eye className="w-4 h-4" />
            View Image
          </button>
        )}
        <button
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 h-9 px-4 py-2 border bg-background hover:bg-accent hover:text-accent-foreground"
          onClick={() => onEdit(product)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={() => onOpenRecords(product)}
        >
          <Database className="w-4 h-4 mr-2" />
          Records
        </button>
      </div>

      {/* Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <DialogPrimitive.Title className="text-lg font-semibold">{product.name}</DialogPrimitive.Title>
            {product.imageUrl && (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full max-h-96 object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
