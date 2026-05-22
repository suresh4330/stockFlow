import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/auth";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Products } from "@/pages/Products";
import { StockTransactions } from "@/pages/StockTransactions";
import { SalesOrders } from "@/pages/SalesOrders";
import { PurchaseOrders } from "@/pages/PurchaseOrders";
import { Suppliers } from "@/pages/Suppliers";
import { Reports } from "@/pages/Reports";
import { DevOpsStatus } from "@/pages/DevOpsStatus";
import { NotFound } from "@/pages/NotFound";

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock" element={<StockTransactions />} />
          <Route path="/sales" element={<SalesOrders />} />
          <Route path="/purchases" element={<PurchaseOrders />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/devops" element={<DevOpsStatus />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

