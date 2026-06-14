import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PurchasingPage } from "@/pages/purchasing/page"
import { ProdukPage } from "@/pages/produk/page"
import { SatuanPage } from "@/pages/satuan/page"
import { MultiSatuanPage } from "@/pages/multi-satuan/page"
import { StokPage } from "@/pages/stok/page"
import { StokOpnamePage } from "@/pages/stok-opname/page"
import { StokOpnameDetailPage } from "@/pages/stok-opname/detail"
import { MutasiStokPage } from "@/pages/mutasi-stok/page"
import { MutasiStokDetailPage } from "@/pages/mutasi-stok/detail"
import { LostInventoryPage } from "@/pages/lost-inventory/page"
import { SaleReturnPage } from "@/pages/sale-return/page"
import { SupplierPage } from "@/pages/supplier/page"
import { CustomerPage } from "@/pages/pelanggan/page"
import { GudangPage } from "@/pages/gudang/page"
import { CabangPage } from "@/pages/cabang/page"
import { AkunPage } from "@/pages/akun/page"
import { PenggunaPage } from "@/pages/pengguna/page"
import { MetodePembayaranPage } from "@/pages/metode-pembayaran/page"
import { HutangPage } from "@/pages/hutang/page"
import { PiutangPage } from "@/pages/piutang/page"
import { AsetPage } from "@/pages/aset/page"
import { AsetDetailPage } from "@/pages/aset/detail"
import { AkuntansiPage } from "@/pages/akuntansi/page"
import { LaporanPage } from "@/pages/laporan/page"
import { DashboardPage } from "@/pages/dashboard"
import { LoginPage } from "@/pages/login"

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/hutang" element={<ProtectedRoute><AppLayout><HutangPage /></AppLayout></ProtectedRoute>} />
            <Route path="/piutang" element={<ProtectedRoute><AppLayout><PiutangPage /></AppLayout></ProtectedRoute>} />
            <Route path="/aset" element={<ProtectedRoute><AppLayout><AsetPage /></AppLayout></ProtectedRoute>} />
            <Route path="/aset/:id" element={<ProtectedRoute><AppLayout><AsetDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/akuntansi" element={<ProtectedRoute><AppLayout><AkuntansiPage /></AppLayout></ProtectedRoute>} />
            <Route path="/laporan" element={<ProtectedRoute><AppLayout><LaporanPage /></AppLayout></ProtectedRoute>} />
            <Route path="/produk" element={<ProtectedRoute><AppLayout><ProdukPage /></AppLayout></ProtectedRoute>} />
            <Route path="/satuan" element={<ProtectedRoute><AppLayout><SatuanPage /></AppLayout></ProtectedRoute>} />
            <Route path="/multi-satuan" element={<ProtectedRoute><AppLayout><MultiSatuanPage /></AppLayout></ProtectedRoute>} />
            <Route path="/stok" element={<ProtectedRoute><AppLayout><StokPage /></AppLayout></ProtectedRoute>} />
            <Route path="/purchasing" element={<ProtectedRoute><AppLayout><PurchasingPage /></AppLayout></ProtectedRoute>} />
            <Route path="/purchasing/:id" element={<ProtectedRoute><AppLayout><PurchasingPage /></AppLayout></ProtectedRoute>} />
            <Route path="/stok-opname" element={<ProtectedRoute><AppLayout><StokOpnamePage /></AppLayout></ProtectedRoute>} />
            <Route path="/stok-opname/:id" element={<ProtectedRoute><AppLayout><StokOpnameDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/mutasi-stok" element={<ProtectedRoute><AppLayout><MutasiStokPage /></AppLayout></ProtectedRoute>} />
            <Route path="/mutasi-stok/:id" element={<ProtectedRoute><AppLayout><MutasiStokDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/lost-inventory" element={<ProtectedRoute><AppLayout><LostInventoryPage /></AppLayout></ProtectedRoute>} />
            <Route path="/sale-return" element={<ProtectedRoute><AppLayout><SaleReturnPage /></AppLayout></ProtectedRoute>} />
            <Route path="/supplier" element={<ProtectedRoute><AppLayout><SupplierPage /></AppLayout></ProtectedRoute>} />
            <Route path="/pelanggan" element={<ProtectedRoute><AppLayout><CustomerPage /></AppLayout></ProtectedRoute>} />
            <Route path="/gudang" element={<ProtectedRoute><AppLayout><GudangPage /></AppLayout></ProtectedRoute>} />
            <Route path="/cabang" element={<ProtectedRoute><AppLayout><CabangPage /></AppLayout></ProtectedRoute>} />
            <Route path="/akun" element={<ProtectedRoute><AppLayout><AkunPage /></AppLayout></ProtectedRoute>} />
            <Route path="/pengguna" element={<ProtectedRoute><AppLayout><PenggunaPage /></AppLayout></ProtectedRoute>} />
            <Route path="/metode-pembayaran" element={<ProtectedRoute><AppLayout><MetodePembayaranPage /></AppLayout></ProtectedRoute>} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
