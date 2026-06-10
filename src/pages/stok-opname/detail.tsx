import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, FileDown, FileText, ClipboardList, Package, TrendingUp, TrendingDown } from "lucide-react"
import { formatMultiSatuan } from "@/lib/multi-unit"
import { formatDateTime } from "@/lib/date"


const BASE = import.meta.env.VITE_API_URL || ""
const TOKEN = () => localStorage.getItem("token")

interface StokOpnameItem {
  id: number
  product_id: number
  unit_id: number | null
  stok_sistem: number
  stok_fisik: number
  selisih: number
  product?: { 
    id: number; 
    name: string; 
    sku: string; 
    barcode: string;
    unit?: { id: number; name: string };
    units?: { id: number; name: string; conversion: number }[];
  }
  unit?: { id: number; name: string }
}

interface StokOpname {
  id: number
  kode_so: string
  tanggal: string
  warehouse?: { id: number; name: string }
  keterangan: string | null
  status: string
  created_by?: number
  creator?: { id: number; name: string }
  items: StokOpnameItem[]
}

export function StokOpnameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StokOpname | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res: any = await api.get(`/stok-opnames/${id}`)
        setData(res.data ?? res)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    })()
  }, [id])

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="p-6 text-center text-muted-foreground">Data tidak ditemukan</div>
  )

  const totalItems = data.items.length
  const totalStokSistem = data.items.reduce((a, i) => a + Number(i.stok_sistem), 0)
  const totalStokFisik = data.items.reduce((a, i) => a + Number(i.stok_fisik), 0)
  const totalSurplus = data.items.filter(i => Number(i.selisih) > 0).reduce((a, i) => a + Number(i.selisih), 0)
  const totalDeficit = data.items.filter(i => Number(i.selisih) < 0).reduce((a, i) => a + Math.abs(Number(i.selisih)), 0)

  const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePdf = () => {
    const token = TOKEN()
    const url = `${BASE}/api/v1/stok-opnames/${id}/pdf`
    // Open in new tab with auth header — use fetch + blob for download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = `StokOpname-${data.kode_so}.pdf`
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
      .catch(() => {
        // Fallback: open in new tab
        window.open(url, "_blank")
      })
  }

  const handleExportExcel = () => {
    const headers = ["No", "SKU", "Nama Produk", "Stok Sistem", "Stok Fisik", "Selisih", "Status"]
    const rows = data.items.map((item, idx) => [
      idx + 1,
      item.product?.sku ?? "",
      item.product?.name ?? "",
      item.stok_sistem,
      item.stok_fisik,
      item.selisih,
      item.selisih > 0 ? "Surplus" : item.selisih < 0 ? "Defisit" : "Aman"
    ])
    const footer = [
      [],
      `Total Item,${totalItems}`,
      `Total Stok Sistem,${totalStokSistem}`,
      `Total Stok Fisik,${totalStokFisik}`,
      `Total Surplus,${totalSurplus}`,
      `Total Defisit,${totalDeficit}`,
    ]
    const csvContent = [
      `Rekap Stok Opname: ${data.kode_so}`,
      `Tanggal: ${formatDateTime(data.tanggal)}`,
      `Gudang: ${data.warehouse?.name ?? "-"}`,
      `Status: ${data.status === "completed" ? "Selesai" : "Draft"}`,
      "",
      headers.join(","),
      ...rows.map(r => r.join(",")),
      ...footer,
    ].join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `StokOpname-${data.kode_so}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/stok-opname")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.kode_so}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(data.tanggal)} &middot; {data.warehouse?.name ?? "-"}
              &middot; {data.status === "completed" ? "✓ Selesai" : "Draft"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={handlePdf}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stok Sistem</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fmt(totalStokSistem)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">+{fmt(totalSurplus)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Defisit</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">-{fmt(totalDeficit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Keterangan */}
      {data.keterangan && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Keterangan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.keterangan}</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="text-center w-28">Stok Sistem</TableHead>
                <TableHead className="text-center w-28">Stok Fisik</TableHead>
                <TableHead className="text-center w-28">Selisih</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{item.product?.sku ?? "-"}</TableCell>
                  <TableCell className="font-medium">{item.product?.name ?? "Produk #" + item.product_id}</TableCell>
                  <TableCell className="text-center">
                    <div className="font-mono">{item.stok_sistem}</div>
                    {item.product?.units && item.product.units.length > 0 && (
                      <div className="text-[10px] text-blue-600 font-medium">
                        {formatMultiSatuan(
                          Number(item.stok_sistem),
                          item.product.units.map((u: any) => ({ name: u.name || u.unit_name, conversion: Number(u.conversion) })),
                          item.product.unit?.name || "pcs"
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-mono">{item.stok_fisik}</div>
                    {item.product?.units && item.product.units.length > 0 && (
                      <div className="text-[10px] text-blue-600 font-medium">
                        {formatMultiSatuan(
                          Number(item.stok_fisik),
                          item.product.units.map((u: any) => ({ name: u.name || u.unit_name, conversion: Number(u.conversion) })),
                          item.product.unit?.name || "pcs"
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={`text-center font-bold ${
                    Number(item.selisih) > 0 ? "text-emerald-600" : Number(item.selisih) < 0 ? "text-red-600" : ""
                  }`}>
                    <div className="font-mono">
                      {Number(item.selisih) > 0 ? `+${fmt(Number(item.selisih))}` : fmt(Number(item.selisih))}
                    </div>
                    {item.product?.units && item.product.units.length > 0 && Number(item.selisih) !== 0 && (
                      <div className="text-[10px] font-medium">
                        {Number(item.selisih) > 0 ? "+" : ""}
                        {formatMultiSatuan(
                          Math.abs(Number(item.selisih)),
                          item.product.units.map((u: any) => ({ name: u.name || u.unit_name, conversion: Number(u.conversion) })),
                          item.product.unit?.name || "pcs"
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {Number(item.selisih) > 0 ? (
                      <Badge className="bg-emerald-500 text-white">Surplus</Badge>
                    ) : Number(item.selisih) < 0 ? (
                      <Badge variant="destructive">Defisit</Badge>
                    ) : (
                      <Badge variant="outline">Aman</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
