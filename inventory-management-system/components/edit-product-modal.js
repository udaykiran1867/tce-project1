"use client"

import { useMemo, useState } from "react"
import { useInventory } from "@/lib/inventory-context"
import { Plus, Minus, Trash2, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadProductImage } from "@/lib/storage"
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as TabsPrimitive from '@radix-ui/react-tabs'

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
function DialogHeader({ className, ...props }) { return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} /> }
function DialogTitle({ className, ...props }) { return <DialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} /> }
function DialogDescription({ className, ...props }) { return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} /> }

function Tabs({ className, ...props }) { return <TabsPrimitive.Root className={cn('flex flex-col', className)} {...props} /> }
function TabsList({ className, ...props }) { return <TabsPrimitive.List className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)} {...props} /> }
function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', className)}
      {...props}
    />
  )
}
function TabsContent({ className, ...props }) { return <TabsPrimitive.Content className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} {...props} /> }

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
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
  }
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 px-3',
  }
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:opacity-50', variants[variant], sizes[size], className)} {...props} />
}

export function EditProductModal({ product, open, onOpenChange }) {
  const { addPurchasedItems, markDefective, deleteProduct, updateProductDetails, products } = useInventory()

  const [purchaseQuantity, setPurchaseQuantity] = useState("")
  const [defectiveQuantity, setDefectiveQuantity] = useState("")
  const [defectRemarks, setDefectRemarks] = useState("")
  const [price, setPrice] = useState("")
  const [masterCount, setMasterCount] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const currentProduct = useMemo(() => {
    if (!product) return null
    const foundProduct = products.find((item) => item.id === product.id) || product
    // Update form fields when product changes
    setPrice(foundProduct.price?.toString() || "")
    setImageUrl(foundProduct.imageUrl || "")
    setImagePreview(foundProduct.imageUrl || "")
    setMasterCount(foundProduct.masterCount?.toString() || "")
    return foundProduct
  }, [product, products])

  if (!currentProduct) return null

  const availableCount = currentProduct.availability || 0
  const cannotMarkDefective = availableCount <= 0

  const handleAddPurchased = async () => {
    const quantity = parseInt(purchaseQuantity)
    if (quantity > 0) {
      const ok = await addPurchasedItems(currentProduct.id, quantity)
      if (ok) {
        setPurchaseQuantity("")
      }
    }
  }

  const handleMarkDefective = async () => {
    const quantity = parseInt(defectiveQuantity)
    const remarks = defectRemarks.trim()

    if (!remarks) {
      alert("Remarks are required for defective items")
      return
    }

    if (quantity > 0 && quantity <= (currentProduct.availability || 0)) {
      const ok = await markDefective(currentProduct.id, quantity, remarks)
      if (ok) {
        setDefectiveQuantity("")
        setDefectRemarks("")
      }
    }
  }

  const handleDelete = () => {
    deleteProduct(currentProduct.id)
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleUpdateProductDetails = async () => {
    if (price && isNaN(parseFloat(price))) {
      alert("Price must be a valid number")
      return
    }
    
    const newMasterCount = masterCount ? parseInt(masterCount) : null
    if (newMasterCount && newMasterCount <= 0) {
      alert("Master count must be greater than 0")
      return
    }
    
    // Calculate new availability based on master count change
    let newAvailability = currentProduct.availability
    if (newMasterCount && newMasterCount !== currentProduct.masterCount) {
      const difference = newMasterCount - (currentProduct.masterCount || 0)
      newAvailability = Math.max(0, (currentProduct.availability || 0) + difference)
    }
    
    const ok = await updateProductDetails(
      currentProduct.id,
      price ? parseFloat(price) : null,
      imageUrl || null,
      newMasterCount || currentProduct.masterCount,
      newAvailability
    )
    if (ok) {
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 2000)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const result = await uploadProductImage(file)
    
    if (result.success) {
      setImageUrl(result.url)
      setImagePreview(result.url)
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 2000)
    } else {
      alert(result.error || "Failed to upload image")
    }
    
    setUploading(false)
  }

  const handleClose = () => {
    setPurchaseQuantity("")
    setDefectiveQuantity("")
    setDefectRemarks("")
    setPrice("")
    setImageUrl("")
    setImagePreview("")
    setUploading(false)
    setShowDeleteConfirm(false)
    setUpdateSuccess(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Manage {currentProduct.name} - Master: {currentProduct.masterCount || 0}, Available: {currentProduct.availability || 0}
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>{currentProduct.name}</strong>? This action cannot be undone and will also remove all associated borrow/purchase records.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Permanently
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Tabs defaultValue="purchase" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="purchase">Add Purchased</TabsTrigger>
                <TabsTrigger value="defective">Mark Defective</TabsTrigger>
                <TabsTrigger value="details">Edit Details</TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseQty">Quantity to Add</Label>
                  <p className="text-xs text-muted-foreground">
                    Add newly purchased items to increase master count and availability
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="purchaseQty"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(e.target.value)}
                    />
                    <Button
                      onClick={handleAddPurchased}
                      disabled={!purchaseQuantity || parseInt(purchaseQuantity) <= 0}
                      style={{ backgroundColor: "oklch(24.571% 0.12604 288.685)" }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="defective" className="space-y-4 mt-4">
                {cannotMarkDefective && (
                  <div className="p-3 text-sm text-amber-700 bg-amber-100 rounded-md">
                    No available stock to mark as defective. Increase availability first.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="defectiveQty">Defective Quantity</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark items as defective to decrease availability (max: {availableCount})
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="defectiveQty"
                      type="number"
                      min="1"
                      max={availableCount || undefined}
                      placeholder="Enter quantity"
                      value={defectiveQuantity}
                      onChange={(e) => setDefectiveQuantity(e.target.value)}
                      disabled={cannotMarkDefective}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleMarkDefective}
                      disabled={
                        cannotMarkDefective ||
                        !defectiveQuantity ||
                        !defectRemarks.trim() ||
                        parseInt(defectiveQuantity) <= 0 ||
                        parseInt(defectiveQuantity) > availableCount
                      }
                      style={{ backgroundColor: "oklch(24.571% 0.12604 288.685)" }}
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Mark
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defectRemarks">Remarks *</Label>
                  <textarea
                    id="defectRemarks"
                    rows={3}
                    placeholder="Write defect remarks (e.g., Broken pin, not powering on)"
                    value={defectRemarks}
                    onChange={(e) => setDefectRemarks(e.target.value)}
                    disabled={cannotMarkDefective}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                {updateSuccess && (
                  <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
                    ✓ Product details updated successfully
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="masterCount">Master Count</Label>
                  <p className="text-xs text-muted-foreground">
                    Edit total quantity. Availability will auto-adjust by the difference.
                  </p>
                  <Input
                    id="masterCount"
                    type="number"
                    min="1"
                    placeholder="Enter master count"
                    value={masterCount}
                    onChange={(e) => setMasterCount(e.target.value)}
                  />
                  {masterCount && parseInt(masterCount) > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Current → New: {currentProduct.masterCount} → {masterCount}
                      <br />
                      Availability will be adjusted by {parseInt(masterCount) - (currentProduct.masterCount || 0)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detailPrice">Price (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Price per unit in your currency
                  </p>
                  <Input
                    id="detailPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 49.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detailImageUpload">Product Image (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload image from device or enter a URL
                  </p>

                  {/* File Upload Input */}
                  <div className="relative">
                    <input
                      id="detailImageUpload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="detailImageUpload"
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 cursor-pointer transition-colors',
                        uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
                      )}
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {uploading ? "Uploading..." : "Click to upload"}
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
                        className="max-h-32 max-w-full object-contain rounded"
                        onError={() => setImagePreview("")}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleUpdateProductDetails}
                  className="w-full"
                  style={{ backgroundColor: "oklch(24.571% 0.12604 288.685)" }}
                >
                  Save Details
                </Button>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
              <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
