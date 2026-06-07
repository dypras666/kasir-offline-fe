import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function HutangPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Hutang</h1>
        <p className="text-sm text-muted-foreground mt-1">Modul Hutang — coming soon</p>
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Hutang</CardTitle>
          <CardDescription>Halaman ini sedang dalam pengembangan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fitur hutang akan tersedia di rilis berikutnya.</p>
        </CardContent>
      </Card>
    </div>
  )
}
