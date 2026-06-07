import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/login"
import { DashboardPage } from "@/pages/dashboard"
import { HutangPage } from "@/pages/hutang/page"
import { PiutangPage } from "@/pages/piutang/page"
import { AsetPage } from "@/pages/aset/page"
import { LaporanPage } from "@/pages/laporan/page"

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kos-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
            <Route path="/hutang" element={<ProtectedLayout><HutangPage /></ProtectedLayout>} />
            <Route path="/piutang" element={<ProtectedLayout><PiutangPage /></ProtectedLayout>} />
            <Route path="/aset" element={<ProtectedLayout><AsetPage /></ProtectedLayout>} />
            <Route path="/laporan" element={<ProtectedLayout><LaporanPage /></ProtectedLayout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
