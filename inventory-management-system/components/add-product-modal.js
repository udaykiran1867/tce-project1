"use client"

import React, { useState } from "react"
import { useInventory } from "@/lib/inventory-context"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadProductImage } from "@/lib/storage"
import * as DialogPrimitive from '@radix-ui/react-dialog'

function Dialog({ children, ...props }) { return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root> }
function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content className={cn('fixed top-1/2 left-1/2 z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background border rounded-lg p-4 shadow-lg', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
function DialogHeader({ className, ...props }) { return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} /> }
function DialogTitle({ className, ...props }) { return <DialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} /> }
function DialogDescription({ className, ...props }) { return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} /> }
function DialogFooter({ className, ...props }) { return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4', className)} {...props} /> }

function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
}

function Input({ className, type, ...props }) {
  return <input type={type} className={cn('h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm border-input focus-visible:ring-2 focus-visible:ring-ring', className)} {...props} />
}

function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3',
  }
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50', variants[variant], sizes[size], className)} {...props} />
}

export function AddProductModal({ open, onOpenChange }) {
  const { addProduct } = useInventory()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [masterCount, setMasterCount] = useState("")
  const [availability, setAvailability] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setName("")
    setMasterCount("")
    setAvailability("")
    setPrice("")
    setImageUrl("")
    setImagePreview("")
    setUploading(false)
    setError("")
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    const result = await uploadProductImage(file)
    
    if (result.success) {
      setImageUrl(result.url)
      setImagePreview(result.url)
      toast({
        title: "Image Uploaded",
        description: "Product image has been uploaded successfully.",
      })
    } else {
      setError(result.error || "Failed to upload image")
    }
    
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter a product name")
      return
    }

    const master = parseInt(masterCount)
    const available = parseInt(availability)

    if (isNaN(master) || master <= 0) {
      setError("Master count must be a positive number")
      return
    }

    if (isNaN(available) || available < 0) {
      setError("Availability must be a non-negative number")
      return
    }

    if (available > master) {
      setError("Availability cannot exceed master count")
      return
    }

    if (price && isNaN(parseFloat(price))) {
      setError("Price must be a valid number")
      return
    }

    const success = await addProduct(name.trim(), master, available, price ? parseFloat(price) : null, imageUrl || null)
    
    if (!success) {
      setError("Failed to add product. Please try again.")
      return
    }

    toast({
      title: "Product Added",
      description: `${name.trim()} has been added to inventory successfully.`,
    })

    resetForm()
    onOpenChange(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSetAvailabilityToMasterCount = () => {
    const master = parseInt(masterCount)
    if (!isNaN(master) && master > 0) {
      setAvailability(masterCount)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details of the new product to add to inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g., Arduino Uno"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="masterCount">Master Count</Label>
            <p className="text-xs text-muted-foreground">
              Total quantity owned (includes all items, even those currently borrowed)
            </p>
            <Input
              id="masterCount"
              type="number"
              min="1"
              placeholder="e.g., 50"
              value={masterCount}
              onChange={(e) => setMasterCount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="availability">Availability</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSetAvailabilityToMasterCount}
                className="text-xs h-auto px-2 py-1"
              >
                Same as Master Count
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Usable quantity currently in stock (cannot exceed master count)
            </p>
            <Input
              id="availability"
              type="number"
              min="0"
              max={masterCount ? parseInt(masterCount) : undefined}
              placeholder="e.g., 45"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Price per unit in your currency
            </p>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g., 49.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUpload">Product Image (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Upload image from device or enter a URL
            </p>
            
            {/* File Upload Input */}
            <div className="relative">
              <input
                id="imageUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="imageUpload"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 cursor-pointer transition-colors',
                  uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
                )}
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Click to upload or drag image"}
                </span>
              </label>
            </div>

            <div className="relative">
              <Input
                type="url"
                placeholder="Or paste image URL here"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  if (e.target.value) {
                    setImagePreview(e.target.value)
                  } else {
                    setImagePreview("")
                  }
                }}
                disabled={uploading}
              />
            </div>

            {imagePreview && (
              <div className="mt-2 p-2 bg-muted rounded-md border border-border">
                <div className="mb-2 text-xs text-muted-foreground">Preview:</div>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-24 max-w-full object-contain rounded"
                  onError={() => setImagePreview("")}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
