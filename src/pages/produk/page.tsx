import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Package, Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, Warehouse, Copy, DollarSign, Layers } from "lucide-react"
import { toast } from "sonner"
import { formatMultiSatuan } from "@/lib/multi-unit"

interface UnitBranchPrice {
  branch_id: number
  price: number
}

interface UnitWarehousePrice {
  warehouse_id: number
  price: number
}

interface ProductUnit {
  id?: number
  name: string
  conversion: number
  price: number
  barcode?: string
  prices?: UnitBranchPrice[]
  warehouse_prices?: UnitWarehousePrice[]
}

interface ProductPrice {
  id?: number
  branch_id?: number
  warehouse_id?: number
  price: number
}

interface Unit {
  id: number
  name: string
}

interface Branch {
  id: number
  name: string
  type: string
  code: string
}

interface Warehouse {
  id: number
  name: string
  is_pusat: boolean
}

interface ProductStock {
  id?: number
  branch_id?: number
  warehouse_id?: number
  stock: number
}

interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  barcode: string | null
  unit_id?: number
  units?: ProductUnit[]
  prices?: ProductPrice[]
  stocks?: ProductStock[]
}

export function ProdukPage() {
  const [data, setData] = useState<Product[]>([])
  const [unitsMaster, setUnitsMaster] = useState<Unit[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showBranchPrices, setShowBranchPrices] = useState(false)
  const [showWarehousePrices, setShowWarehousePrices] = useState(false)
  const [showBranchStocks, setShowBranchStocks] = useState(false)
  const [showWarehouseStocks, setShowWarehouseStocks] = useState(false)
  const [expandedUnitBranchPrices, setExpandedUnitBranchPrices] = useState<Record<number, boolean>>({})
  const [expandedUnitWarehousePrices, setExpandedUnitWarehousePrices] = useState<Record<number, boolean>>({})
  const [formData, setFormData] = useState({ 
    name: "", 
    sku: "", 
    price: 0, 
    stock: 0, 
    barcode: "",
    unit_id: undefined as number | undefined,
    units: [] as ProductUnit[],
    prices: [] as ProductPrice[],
    stocks: [] as ProductStock[]
  })

  const fetchData = async () => {
    try {
      const [resProd, resUnit, resBranch, resWarehouse]: any = await Promise.all([
        api.get("/products"),
        api.get("/units"),
        api.get("/branches"),
        api.get("/warehouses")
      ])
      setData(resProd.data ?? resProd)
      setUnitsMaster(resUnit.data ?? resUnit)
      setBranches(resBranch.data ?? resBranch)
      setWarehouses(resWarehouse.data ?? resWarehouse)
    } catch (err: any) {
      console.error(err)
      if (err.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // === Harga Cabang (produk level) ===
  const updatePrice = (branchId: number, value: number) => {
    const idx = formData.prices.findIndex(p => p.branch_id === branchId)
    const prices = [...formData.prices]
    if (idx >= 0) {
      prices[idx] = { ...prices[idx], price: value }
    } else {
      prices.push({ branch_id: branchId, price: value })
    }
    setFormData({ ...formData, prices })
  }

  const getBranchPrice = (branchId: number) => {
    return formData.prices.find(p => p.branch_id === branchId)?.price || 0
  }

  // === Harga Gudang (produk level) ===
  const updateWarehousePrice = (warehouseId: number, value: number) => {
    const idx = formData.prices.findIndex(p => p.warehouse_id === warehouseId)
    const prices = [...formData.prices]
    if (idx >= 0) {
      prices[idx] = { ...prices[idx], price: value }
    } else {
      prices.push({ warehouse_id: warehouseId, price: value })
    }
    setFormData({ ...formData, prices })
  }

  const getWarehousePrice = (warehouseId: number) => {
    return formData.prices.find(p => p.warehouse_id === warehouseId)?.price || 0
  }

  // === Stok Cabang ===
  const updateBranchStock = (branchId: number, value: number) => {
    const idx = formData.stocks.findIndex(s => s.branch_id === branchId)
    const stocks = [...formData.stocks]
    if (idx >= 0) {
      stocks[idx] = { ...stocks[idx], stock: value }
    } else {
      stocks.push({ branch_id: branchId, stock: value })
    }
    setFormData({ ...formData, stocks })
  }

  const getBranchStock = (branchId: number) => {
    return formData.stocks.find(s => s.branch_id === branchId)?.stock || 0
  }

  // === Stok Gudang ===
  const updateWarehouseStock = (warehouseId: number, value: number) => {
    const idx = formData.stocks.findIndex(s => s.warehouse_id === warehouseId)
    const stocks = [...formData.stocks]
    if (idx >= 0) {
      stocks[idx] = { ...stocks[idx], stock: value }
    } else {
      stocks.push({ warehouse_id: warehouseId, stock: value })
    }
    setFormData({ ...formData, stocks })
  }

  const getWarehouseStock = (warehouseId: number) => {
    return formData.stocks.find(s => s.warehouse_id === warehouseId)?.stock || 0
  }

  // === Harga Cabang (multi satuan level) ===
  const updateUnitBranchPrice = (unitIdx: number, branchId: number, value: number) => {
    const units = [...formData.units]
    const unit = { ...units[unitIdx] }
    const prices = [...(unit.prices || [])]
    const idx = prices.findIndex(p => p.branch_id === branchId)
    if (idx >= 0) {
      if (value > 0) {
        prices[idx] = { ...prices[idx], price: value }
      } else {
        prices.splice(idx, 1)
      }
    } else if (value > 0) {
      prices.push({ branch_id: branchId, price: value })
    }
    unit.prices = prices
    units[unitIdx] = unit
    setFormData({ ...formData, units })
  }

  const getUnitBranchPrice = (unit: ProductUnit, branchId: number) => {
    return unit.prices?.find(p => p.branch_id === branchId)?.price || 0
  }

  // === Harga Gudang (multi satuan level) ===
  const updateUnitWarehousePrice = (unitIdx: number, warehouseId: number, value: number) => {
    const units = [...formData.units]
    const unit = { ...units[unitIdx] }
    const prices = [...(unit.warehouse_prices || [])]
    const idx = prices.findIndex(p => p.warehouse_id === warehouseId)
    if (idx >= 0) {
      if (value > 0) {
        prices[idx] = { ...prices[idx], price: value }
      } else {
        prices.splice(idx, 1)
      }
    } else if (value > 0) {
      prices.push({ warehouse_id: warehouseId, price: value })
    }
    unit.warehouse_prices = prices
    units[unitIdx] = unit
    setFormData({ ...formData, units })
  }

  const getUnitWarehousePrice = (unit: ProductUnit, warehouseId: number) => {
    return unit.warehouse_prices?.find(p => p.warehouse_id === warehouseId)?.price || 0
  }

  // === Apply all / helpers ===
  const applyBranchPriceToAllBranches = () => {
    if (formData.price > 0) {
      // Remove existing warehouse prices, set all branch prices
      const existing = formData.prices.filter(p => p.warehouse_id)
      setFormData({
        ...formData,
        prices: [...existing, ...branches.map(b => ({ branch_id: b.id, price: formData.price }))]
      })
    } else {
      toast.error("Isi Harga Default dulu")
    }
  }

  const applyWarehousePriceToAllWarehouses = () => {
    if (formData.price > 0) {
      const existing = formData.prices.filter(p => p.branch_id)
      setFormData({
        ...formData,
        prices: [...existing, ...warehouses.map(w => ({ warehouse_id: w.id, price: formData.price }))]
      })
    } else {
      toast.error("Isi Harga Default dulu")
    }
  }

  const applyUnitPriceToAllBranches = (unitIdx: number) => {
    const units = [...formData.units]
    const unit = { ...units[unitIdx] }
    const basePrice = unit.price
    unit.prices = basePrice > 0
      ? branches.map(b => ({ branch_id: b.id, price: basePrice }))
      : []
    units[unitIdx] = unit
    setFormData({ ...formData, units })
  }

  const applyUnitPriceToAllWarehouses = (unitIdx: number) => {
    const units = [...formData.units]
    const unit = { ...units[unitIdx] }
    const basePrice = unit.price
    unit.warehouse_prices = basePrice > 0
      ? warehouses.map(w => ({ warehouse_id: w.id, price: basePrice }))
      : []
    units[unitIdx] = unit
    setFormData({ ...formData, units })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        prices: formData.prices.filter(p => p.price > 0),
        stocks: formData.stocks.filter(s => s.stock >= 0),
        units: formData.units.map(u => ({
          ...u,
          prices: u.prices?.filter(p => p.price > 0) || [],
          warehouse_prices: u.warehouse_prices?.filter(p => p.price > 0) || []
        }))
      }
      if (editing) {
        await api.put(`/products/${editing.id}`, payload)
      } else {
        await api.post("/products", payload)
      }
      setOpen(false)
      setEditing(null)
      setFormData({ name: "", sku: "", price: 0, stock: 0, barcode: "", unit_id: undefined, units: [], prices: [], stocks: [] })
      fetchData()
    } catch {
      toast.error("Gagal menyimpan data")
    }
  }

  const handleEdit = (item: Product) => {
    setEditing(item)
    setFormData({ 
      name: item.name, 
      sku: item.sku, 
      price: Number(item.price), 
      stock: item.stock, 
      barcode: item.barcode || "",
      unit_id: item.unit_id || undefined,
      units: item.units?.map(u => ({
        ...u,
        prices: (u as any).prices?.map((p: any) => ({ branch_id: p.branch_id, price: Number(p.price) })) || [],
        warehouse_prices: (u as any).warehouse_prices?.map((p: any) => ({ warehouse_id: p.warehouse_id, price: Number(p.price) })) || []
      })) || [],
      prices: item.prices?.length ? item.prices : [],
      stocks: item.stocks?.length ? item.stocks.map(s => ({ ...s, stock: Number(s.stock) })) : []
    })
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return
    try {
      await api.delete(`/products/${id}`)
      fetchData()
    } catch {
      toast.error("Gagal menghapus")
    }
  }

  // Count total columns for colSpan
  const totalCols = 6 + (branches.length * 2) + (warehouses.length * 2)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Data Produk</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setFormData({ name: "", sku: "", price: 0, stock: 0, barcode: "", unit_id: undefined, units: [], prices: [], stocks: [] }) }}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Produk</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Produk</label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Barcode</label>
                  <Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Harga Default</label>
                  <Input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stok Awal</label>
                  <Input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                </div>
              </div>

              {/* Satuan Utama */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Satuan Utama</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.unit_id ?? ""} onChange={e => setFormData({ ...formData, unit_id: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">Pilih...</option>
                  {unitsMaster.map(um => (
                    <option key={um.id} value={um.id}>{um.name}</option>
                  ))}
                </select>
              </div>

              {/* Multi Satuan */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Multi Satuan</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, units: [...formData.units, { name: "", conversion: 1, price: 0 }] })}>
                    <Plus className="mr-1 h-3 w-3" /> Tambah Satuan
                  </Button>
                </div>
                {formData.units.length === 0 && (
                  <p className="text-xs text-muted-foreground">Belum ada satuan tambahan (hanya satuan utama)</p>
                )}
                {formData.units.map((u, i) => {
                  const unitBranchPriceCount = u.prices?.filter(p => p.price > 0).length || 0
                  const unitWarehousePriceCount = u.warehouse_prices?.filter(p => p.price > 0).length || 0
                  return (
                    <div key={i} className="space-y-2 rounded-md border p-3">
                      {/* Baris utama multi satuan */}
                      <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-2 items-end">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Pilih Satuan</label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={u.name} onChange={(e) => {
                            const units = [...formData.units]
                            units[i] = { ...units[i], name: e.target.value }
                            setFormData({ ...formData, units })
                          }}>
                            <option value="">Pilih...</option>
                            {unitsMaster.map(um => (
                              <option key={um.id} value={um.name}>{um.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">1 = ... pcs</label>
                          <Input type="number" placeholder="12" value={u.conversion || ""} onChange={e => {
                            const units = [...formData.units]
                            units[i] = { ...units[i], conversion: Number(e.target.value) }
                            setFormData({ ...formData, units })
                          }} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Harga</label>
                          <Input type="number" placeholder="0" value={u.price || ""} onChange={e => {
                            const units = [...formData.units]
                            units[i] = { ...units[i], price: Number(e.target.value) }
                            setFormData({ ...formData, units })
                          }} className="h-9" />
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0 h-9 w-9" onClick={() => {
                            const units = formData.units.filter((_, j) => j !== i)
                            setFormData({ ...formData, units })
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Harga per Cabang untuk multi satuan */}
                      <div className="border-t pt-2 mt-1">
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs hover:bg-transparent flex items-center gap-1 text-muted-foreground"
                            onClick={() => setExpandedUnitBranchPrices({ ...expandedUnitBranchPrices, [i]: !expandedUnitBranchPrices[i] })}
                          >
                            {expandedUnitBranchPrices[i] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <Building2 className="h-3 w-3" />
                            Harga per Cabang
                            {unitBranchPriceCount > 0 && (
                              <span className="text-[10px] text-muted-foreground">({unitBranchPriceCount} diset)</span>
                            )}
                          </Button>
                          {u.price > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-xs text-blue-500 hover:text-blue-600 hover:bg-transparent flex items-center gap-1"
                              onClick={() => applyUnitPriceToAllBranches(i)}
                            >
                              <Copy className="h-3 w-3" />
                              Terapkan ke Semua Cabang
                            </Button>
                          )}
                        </div>
                        {expandedUnitBranchPrices[i] && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {branches.map(branch => (
                              <div key={branch.id} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium shrink-0">{branch.code}</span>
                                <div className="relative flex-1 max-w-[140px]">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Rp</span>
                                  <Input
                                    type="number"
                                    placeholder={String(u.price || 0)}
                                    value={getUnitBranchPrice(u, branch.id) || ""}
                                    onChange={e => updateUnitBranchPrice(i, branch.id, Number(e.target.value))}
                                    className="pl-7 h-7 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Harga per Gudang untuk multi satuan */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs hover:bg-transparent flex items-center gap-1 text-muted-foreground"
                            onClick={() => setExpandedUnitWarehousePrices({ ...expandedUnitWarehousePrices, [i]: !expandedUnitWarehousePrices[i] })}
                          >
                            {expandedUnitWarehousePrices[i] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <Warehouse className="h-3 w-3" />
                            Harga per Gudang
                            {unitWarehousePriceCount > 0 && (
                              <span className="text-[10px] text-muted-foreground">({unitWarehousePriceCount} diset)</span>
                            )}
                          </Button>
                          {u.price > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto text-xs text-blue-500 hover:text-blue-600 hover:bg-transparent flex items-center gap-1"
                              onClick={() => applyUnitPriceToAllWarehouses(i)}
                            >
                              <Copy className="h-3 w-3" />
                              Terapkan ke Semua Gudang
                            </Button>
                          )}
                        </div>
                        {expandedUnitWarehousePrices[i] && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {warehouses.map(wh => (
                              <div key={wh.id} className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium shrink-0">{wh.name}</span>
                                <div className="relative flex-1 max-w-[140px]">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Rp</span>
                                  <Input
                                    type="number"
                                    placeholder={String(u.price || 0)}
                                    value={getUnitWarehousePrice(u, wh.id) || ""}
                                    onChange={e => updateUnitWarehousePrice(i, wh.id, Number(e.target.value))}
                                    className="pl-7 h-7 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Harga Default per Cabang */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm hover:bg-transparent flex items-center gap-1" onClick={() => setShowBranchPrices(!showBranchPrices)}>
                    {showBranchPrices ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Building2 className="h-4 w-4" />
                    Harga Default per Cabang
                    <span className="text-xs text-muted-foreground font-normal">({formData.prices.filter(p => p.branch_id && p.price > 0).length} diset)</span>
                  </Button>
                  {formData.price > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-xs text-blue-500 hover:text-blue-600 hover:bg-transparent flex items-center gap-1"
                      onClick={applyBranchPriceToAllBranches}
                    >
                      <Copy className="h-3 w-3" />
                      Terapkan {formData.price} ke Semua Cabang
                    </Button>
                  )}
                </div>
                {showBranchPrices && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Kosongkan jika harga sama dengan harga default</p>
                    {branches.map(branch => (
                      <div key={branch.id} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                        <div>
                          <label className="text-xs font-medium">{branch.name}</label>
                          <p className="text-[10px] text-muted-foreground">{branch.code}</p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                          <Input
                            type="number"
                            placeholder={String(formData.price || 0)}
                            value={getBranchPrice(branch.id) || ""}
                            onChange={e => updatePrice(branch.id, Number(e.target.value))}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Harga Default per Gudang */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm hover:bg-transparent flex items-center gap-1" onClick={() => setShowWarehousePrices(!showWarehousePrices)}>
                    {showWarehousePrices ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Warehouse className="h-4 w-4" />
                    Harga Default per Gudang
                    <span className="text-xs text-muted-foreground font-normal">({formData.prices.filter(p => p.warehouse_id && p.price > 0).length} diset)</span>
                  </Button>
                  {formData.price > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-xs text-blue-500 hover:text-blue-600 hover:bg-transparent flex items-center gap-1"
                      onClick={applyWarehousePriceToAllWarehouses}
                    >
                      <Copy className="h-3 w-3" />
                      Terapkan {formData.price} ke Semua Gudang
                    </Button>
                  )}
                </div>
                {showWarehousePrices && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Kosongkan jika harga sama dengan harga default</p>
                    {warehouses.map(wh => (
                      <div key={wh.id} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                        <div>
                          <label className="text-xs font-medium">{wh.name}</label>
                          <p className="text-[10px] text-muted-foreground">{wh.is_pusat ? "Pusat" : "Cabang"}</p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                          <Input
                            type="number"
                            placeholder={String(formData.price || 0)}
                            value={getWarehousePrice(wh.id) || ""}
                            onChange={e => updateWarehousePrice(wh.id, Number(e.target.value))}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        <strong>Catatan:</strong> Harga default dipakai jika harga gudang tidak diset.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stok Default per Cabang */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm hover:bg-transparent flex items-center gap-1" onClick={() => setShowBranchStocks(!showBranchStocks)}>
                    {showBranchStocks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Building2 className="h-4 w-4" />
                    Stok per Cabang
                    <span className="text-xs text-muted-foreground font-normal">({formData.stocks.filter(s => s.branch_id && s.stock >= 0).length} diset)</span>
                  </Button>
                </div>
                {showBranchStocks && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Kosongkan jika stok sama dengan stok default</p>
                    {branches.map(branch => (
                      <div key={branch.id} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                        <div>
                          <label className="text-xs font-medium">{branch.name}</label>
                          <p className="text-[10px] text-muted-foreground">{branch.code}</p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Qty</span>
                          <Input
                            type="number"
                            placeholder={String(formData.stock || 0)}
                            value={getBranchStock(branch.id) || ""}
                            onChange={e => updateBranchStock(branch.id, Number(e.target.value))}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stok Default per Gudang */}
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Button type="button" variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm hover:bg-transparent flex items-center gap-1" onClick={() => setShowWarehouseStocks(!showWarehouseStocks)}>
                    {showWarehouseStocks ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Warehouse className="h-4 w-4" />
                    Stok per Gudang
                    <span className="text-xs text-muted-foreground font-normal">({formData.stocks.filter(s => s.warehouse_id && s.stock >= 0).length} diset)</span>
                  </Button>
                </div>
                {showWarehouseStocks && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Kosongkan jika stok sama dengan stok default</p>
                    {warehouses.map(wh => (
                      <div key={wh.id} className="grid grid-cols-[1fr_1.5fr] gap-3 items-center">
                        <div>
                          <label className="text-xs font-medium">{wh.name}</label>
                          <p className="text-[10px] text-muted-foreground">{wh.is_pusat ? "Pusat" : "Cabang"}</p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Qty</span>
                          <Input
                            type="number"
                            placeholder={String(formData.stock || 0)}
                            value={getWarehouseStock(wh.id) || ""}
                            onChange={e => updateWarehouseStock(wh.id, Number(e.target.value))}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Produk</p>
              <p className="text-xl font-bold">{loading ? '-' : data.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Layers className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Stok</p>
              <p className="text-xl font-bold">{loading ? '-' : data.reduce((s, p) => s + Number(p.stock || 0), 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Nilai Stok</p>
              <p className="text-xl font-bold">{loading ? '-' : `Rp ${data.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.price || 0)), 0).toLocaleString('id-ID')}`}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rata Harga</p>
              <p className="text-xl font-bold">{loading || data.length === 0 ? '-' : `Rp ${Math.round(data.reduce((s, p) => s + Number(p.price || 0), 0) / data.length).toLocaleString('id-ID')}`}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Harga Default</TableHead>
                  <TableHead colSpan={branches.length} className="bg-muted/50 text-center text-xs">Harga per Cabang</TableHead>
                  <TableHead colSpan={warehouses.length} className="bg-muted/30 text-center text-xs">Harga per Gudang</TableHead>
                  <TableHead colSpan={branches.length} className="bg-green-50 dark:bg-green-950/30 text-center text-xs">Stok per Cabang</TableHead>
                  <TableHead colSpan={warehouses.length} className="bg-teal-50 dark:bg-teal-950/30 text-center text-xs">Stok per Gudang</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                <TableRow>
                  {/* empty cells for row headers */}
                  <TableHead className="w-10" />
                  <TableHead className="hidden" aria-hidden />
                  <TableHead className="hidden" aria-hidden />
                  <TableHead className="hidden" aria-hidden />
                  <TableHead className="hidden" aria-hidden />
                  <TableHead className="hidden" aria-hidden />
                  {branches.map(b => (
                    <TableHead key={b.id} className="text-xs whitespace-nowrap text-center">{b.code}</TableHead>
                  ))}
                  {warehouses.map(w => (
                    <TableHead key={w.id} className="text-xs whitespace-nowrap text-center">{w.name.replace("Gudang ", "G.")}</TableHead>
                  ))}
                  {branches.map(b => (
                    <TableHead key={`sb-${b.id}`} className="text-xs whitespace-nowrap text-center">{b.code}</TableHead>
                  ))}
                  {warehouses.map(w => (
                    <TableHead key={`sw-${w.id}`} className="text-xs whitespace-nowrap text-center">{w.name.replace("Gudang ", "G.")}</TableHead>
                  ))}
                  <TableHead className="hidden" aria-hidden />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={totalCols} className="text-center">Loading...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={totalCols} className="text-center">Belum ada data</TableCell></TableRow>
                ) : data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{data.indexOf(item) + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.units && item.units.length > 0
                        ? item.units.map(u => u.name).join(", ")
                        : (<span className="italic">—</span>)
                      }
                    </TableCell>
                    <TableCell className="font-mono text-xs">{formatMultiSatuan(item.stock, item.units, "Pcs")}</TableCell>
                    <TableCell>Rp {Number(item.price).toLocaleString()}</TableCell>
                    {branches.map(b => {
                      const bp = item.prices?.find(p => p.branch_id === b.id)
                      return (
                        <TableCell key={b.id} className="text-xs text-center">
                          {bp ? `Rp ${Number(bp.price).toLocaleString()}` : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                    {warehouses.map(w => {
                      const wp = item.prices?.find(p => p.warehouse_id === w.id)
                      return (
                        <TableCell key={w.id} className="text-xs text-center">
                          {wp ? `Rp ${Number(wp.price).toLocaleString()}` : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                    {branches.map(b => {
                      const bs = item.stocks?.find(s => s.branch_id === b.id)
                      return (
                        <TableCell key={`sb-${b.id}`} className="text-xs text-center font-mono">
                          {bs ? formatMultiSatuan(Number(bs.stock), item.units, "Pcs") : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                    {warehouses.map(w => {
                      const ws = item.stocks?.find(s => s.warehouse_id === w.id)
                      return (
                        <TableCell key={`sw-${w.id}`} className="text-xs text-center font-mono">
                          {ws ? formatMultiSatuan(Number(ws.stock), item.units, "Pcs") : (
                            <span className="text-muted-foreground italic">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
