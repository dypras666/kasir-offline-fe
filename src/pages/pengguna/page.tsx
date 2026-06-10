import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { userApi, type UserData, type RoleData } from "@/lib/api"
import { Plus, Pencil, Trash2, Loader2, Search, Users, Shield } from "lucide-react"
import { toast } from "sonner"

export function PenggunaPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editItem, setEditItem] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState("")

  const loadData = () => {
    setLoading(true)
    Promise.all([
      userApi.list(),
      userApi.roles(),
    ])
      .then(([u, r]) => {
        setUsers(u)
        setRoles(r)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const resetForm = () => {
    setEditItem(null)
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormRole("")
  }

  const openEdit = (u: UserData) => {
    setEditItem(u)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormPassword("")
    setFormRole(u.roles?.[0] || "")
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formRole) {
      toast.error("Pilih role terlebih dahulu")
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        const body: Record<string, string> = { name: formName, role: formRole }
        if (formPassword) body.password = formPassword
        await userApi.update(editItem.id, body)
      } else {
        await userApi.create({ name: formName, email: formEmail, password: formPassword, role: formRole })
      }
      setOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pengguna ini?")) return
    try {
      await userApi.delete(id)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground">{users.length} pengguna • {roles.length} role</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Pengguna" : "Tambah Pengguna"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" disabled={!!editItem} />
              </div>
              <div className="space-y-2">
                <Label>{editItem ? "Password Baru (kosongkan jika tidak diganti)" : "Password"}</Label>
                <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Min 6 karakter" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                    <option value="">Pilih role</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !formName || !formEmail || !formRole || (!editItem && !formPassword)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editItem ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pengguna..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        {u.roles?.map((r) => (
                          <Badge key={r} variant="secondary" className="mr-1">
                            {r}
                          </Badge>
                        )) || <Badge variant="outline">No role</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Belum ada pengguna
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {r.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                    {r.permissions.length === 0 && (
                      <p className="text-xs text-muted-foreground">Tidak ada permission</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
