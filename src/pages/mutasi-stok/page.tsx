import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Plus } from "lucide-react"

interface StockTransfer {
  id: number
  status: string
  transfer_date: string
  from_warehouse: { name: string }
  to_warehouse: { name: string }
}

export function MutasiStokPage() {
  const [data, setData] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res: any = await api.get("/stock-transfers")
      setData(res.data ?? res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mutasi Stok</h1>
          <p className="text-sm text-muted-foreground">Transfer barang antar gudang atau cabang</p>
        </div>
        <Button onClick={() => alert("Form Mutasi Sedang Dibangun")}>
          <Plus className="mr-2 h-4 w-4" /> Buat Transfer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tgl Transfer</TableHead>
                <TableHead>Dari Gudang</TableHead>
                <TableHead>Ke Gudang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><ArrowLeftRight className="h-12 w-12 mx-auto mb-2 opacity-20" />Belum ada data mutasi</TableCell></TableRow>
              ) : data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.transfer_date}</TableCell>
                  <TableCell className="font-medium">{item.from_warehouse?.name}</TableCell>
                  <TableCell className="font-medium">{item.to_warehouse?.name}</TableCell>
                  <TableCell>
                    {item.status === 'completed' ? 
                      <Badge className="bg-emerald-500">Diterima</Badge> : 
                      item.status === 'shipped' ?
                      <Badge className="bg-amber-500">Dikirim</Badge> :
                      <Badge variant="outline">Draft</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Detail</Button>
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
