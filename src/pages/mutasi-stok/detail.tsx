import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, CheckCircle, XCircle, ArrowLeftRight, Package } from "lucide-react"

interface TransferItem {
  id: number
  qty: number
  product?: { name: string; sku: string }
  unit?: { name: string }
}

interface StockTransfer {
  id: number
  status: string
  transfer_date: string
  from_warehouse?: { name: string }
  to_warehouse?: { name: string }
  from_branch?: { name: string }
  to_branch?: { name: string }
  items: TransferItem[]
}

export function MutasiStokDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StockTransfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const fetchData = async () => {
    try {
      const res: any = await api.get(`/stock-transfers/${id}`)
      setData(res.data ?? res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const handleComplete = async () => {
    if (!confirm("Konfirmasi terima barang? Stok asal akan berkurang & stok tujuan bertambah.")) return
    setActing(true)
    try {
      await api.post(`/stock-transfers/${id}/complete`)
      fetchData()
    } catch (err: any) { alert(err?.message || err) }
    finally { setActing(false) }
  }

  const handleCancel = async () => {
    if (!confirm("Batalkan transfer ini?")) return
    setActing(true)
    try {
      await api.post(`/stock-transfers/${id}/cancel`)
      fetchData()
    } catch (err: any) { alert(err?.message || err) }
    finally { setActing(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (!data) return <div className="p-6 text-center text-muted-foreground">Data tidak ditemukan</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/mutasi-stok")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transfer #{data.id}</h1>
            <p className="text-sm text-muted-foreground">{data.transfer_date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {data.status === "pending" && (
            <>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleCancel} disabled={acting}>
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Batalkan
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleComplete} disabled={acting}>
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Terima Barang
              </Button>
            </>
          )}
          {data.status === "completed" && (
            <Badge className="bg-emerald-500 text-white px-3 py-1.5 h-10 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Selesai
            </Badge>
          )}
          {data.status === "cancelled" && (
            <Badge variant="destructive" className="px-3 py-1.5 h-10 flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Dibatalkan
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daftar Barang Transfer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.product?.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{item.product?.sku}</div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-lg">{item.qty}</TableCell>
                    <TableCell>{item.unit?.name ?? "Pcs"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Rute Transfer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Dari</div>
                  <div className="font-semibold">
                    {data.from_warehouse?.name || data.from_branch?.name || "-"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {data.from_warehouse ? "Gudang" : data.from_branch ? "Cabang" : ""}
                  </div>
                </div>
              </div>
              <div className="flex justify-center py-1">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Ke</div>
                  <div className="font-semibold">
                    {data.to_warehouse?.name || data.to_branch?.name || "-"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {data.to_warehouse ? "Gudang" : data.to_branch ? "Cabang" : ""}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
