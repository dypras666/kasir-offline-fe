import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Layers, Search, ChevronDown, ChevronRight, Package } from "lucide-react"
import { useShowFilters } from "@/hooks/useShowFilters"
import { SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"

interface ProductUnit {
  id: number
  product_id: number
  name: string
  conversion: number
  price: number
  barcode: string | null
  prices?: { branch_id: number; price: number }[]
}

interface Product {
  id: number
  name: string
  sku: string
  units: ProductUnit[]
}

interface UnitMaster {
  id: number
  name: string
}

export function MultiSatuanPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [unitsMaster, setUnitsMaster] = useState<UnitMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showFilters, toggleFilters] = useShowFilters(true)

  // Dialog state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ product: Product; unit?: ProductUnit } | null>(null)
  const [form, setForm] = useState({ name: "", conversion: 1, price: 0, barcode: "" })

  const fetchData = async () => {
    try {
      const [resProds, resUnits]: any = await Promise.all([
        api.get("/products"),
        api.get("/units"),
      ])
      const allProducts: Product[] = resProds.data ?? resProds
      setProducts(allProducts)
      setUnitsMaster(resUnits.data ?? resUnits)
      
      // Auto expand products with units
      setExpanded(new Set(allProducts.filter((p) => p.units && p.units.length > 0).map((p) => p.id)))
    } catch (err: any) {
      console.error(err)
      if (err?.status === 401 || err?.response?.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Tampilkan hanya produk yang sudah punya multi-satuan
  // Filter pencarian tetap jalan di dalamnya
  const filtered = products.filter((p) => {
    if (!p.units || p.units.length === 0) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.units.some((u) => u.name.toLowerCase().includes(q))
    )
  })

  // Hitung jumlah produk yang sudah punya satuan (untuk header/summary)
  const withUnitsCount = products.filter((p) => p.units && p.units.length > 0).length
  const totalUnits = products.reduce((sum, p) => sum + (p.units?.length || 0), 0)

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    if (expanded.size === filtered.length) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(filtered.map((p) => p.id)))
    }
  }

  const handleAdd = (product: Product) => {
    setEditing({ product })
    setForm({ name: "", conversion: 1, price: 0, barcode: "" })
    setOpen(true)
  }

  const handleEdit = (product: Product, unit: ProductUnit) => {
    setEditing({ product, unit })
    setForm({
      name: unit.name,
      conversion: unit.conversion,
      price: unit.price,
      barcode: unit.barcode || "",
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      const product = editing.product
      // Rebuild units array: update existing or add new
      let updatedUnits = [...(product.units || [])]

      if (editing.unit) {
        // Edit existing unit
        updatedUnits = updatedUnits.map((u) =>
          u.id === editing.unit!.id
            ? { ...u, name: form.name, conversion: form.conversion, price: form.price, barcode: form.barcode || null }
            : u
        )
      } else {
        // Add new unit
        updatedUnits.push({
          id: 0,
          product_id: product.id,
          name: form.name,
          conversion: form.conversion,
          price: form.price,
          barcode: form.barcode || null,
        })
      }

      // Send update to product endpoint with units array
      await api.put(`/products/${product.id}`, {
        units: updatedUnits.map((u) => ({
          name: u.name,
          conversion: u.conversion,
          price: u.price || 0,
          barcode: u.barcode || null,
        })),
      })

      setOpen(false)
      setEditing(null)
      fetchData()
    } catch {
      toast.error("Gagal menyimpan")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi Satuan</h1>
          <p className="text-sm text-muted-foreground">
            Produk dengan konversi satuan (Lusin, Box, Pack, dll) — {withUnitsCount} produk, {totalUnits} satuan
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Filter</h3>
            <Button variant="ghost" size="sm" onClick={toggleFilters} className="h-8 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
            </Button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk atau satuan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={expandAll} className="h-9 text-xs">
                {expanded.size === filtered.length ? "Tutup Semua" : "Buka Semua"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Product list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-2 opacity-20" />
              {search ? "Tidak ada produk yang cocok" : "Tidak ada data produk"}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((product, idx) => {
                const isExpanded = expanded.has(product.id)
                return (
                  <div key={product.id}>
                    {/* Product row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(product.id)}
                    >
                      <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">
                        {idx + 1}
                      </span>
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm">{product.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {product.units?.length || 0} satuan
                      </span>
                    </div>

                    {/* Expanded unit table */}
                    {isExpanded && (
                      <div className="bg-muted/30 px-4 pb-3">
                        {product.units && product.units.length > 0 ? (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Satuan</TableHead>
                                    <TableHead className="text-xs">Isi (Konversi)</TableHead>
                                    <TableHead className="text-xs">Harga</TableHead>
                                    <TableHead className="text-xs">Barcode</TableHead>
                                    <TableHead className="text-xs text-right">Aksi</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.units.map((unit) => (
                                    <TableRow key={unit.id}>
                                      <TableCell className="text-sm font-medium">{unit.name}</TableCell>
                                      <TableCell className="text-sm">{unit.conversion} pcs</TableCell>
                                      <TableCell className="text-sm">
                                        {Number(unit.price) > 0
                                          ? `Rp ${Number(unit.price).toLocaleString()}`
                                          : "-"}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {unit.barcode || "-"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleEdit(product, unit)
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAdd(product)
                                }}
                              >
                                <Plus className="mr-1 h-3 w-3" /> Tambah Satuan
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            <p>Belum ada satuan untuk produk ini</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAdd(product)
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" /> Tambah Satuan
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.unit ? "Edit" : "Tambah"} Satuan — {editing?.product.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Satuan</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              >
                <option value="">Pilih...</option>
                {unitsMaster.map((um) => (
                  <option key={um.id} value={um.name}>
                    {um.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Konversi (ke Pcs)</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={form.conversion}
                  onChange={(e) => setForm({ ...form, conversion: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga (Opsional)</label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Barcode Satuan</label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Opsional"
              />
            </div>
            <Button type="submit" className="w-full">
              Simpan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
