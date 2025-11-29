import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Members from "./pages/Members";
import Upload from "./pages/Upload";
import Reports from "./pages/Reports";
import Payments from "./pages/Payments";
import Wallets from "./pages/Wallets";
import MonthlyDeductions from "./pages/MonthlyDeductions";
import WithdrawalRequests from "./pages/WithdrawalRequests";
import MemberPortal from "./pages/MemberPortal";
import GroupPolicySettings from "./pages/GroupPolicySettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/members" element={<Members />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/deductions" element={<MonthlyDeductions />} />
              <Route path="/withdrawals" element={<WithdrawalRequests />} />
              <Route path="/member-portal" element={<MemberPortal />} />
              <Route path="/group-policy" element={<GroupPolicySettings />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/payments" element={<Payments />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
