import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Formations from "./pages/Formations";
import Participants from "./pages/Participants";
import Formateurs from "./pages/Formateurs";
import Referentiels from "./pages/Referentiels";
import UsersManagement from "./pages/UsersManagement";
import Statistiques from "./pages/Statistiques";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="formations" element={<ProtectedRoute allowedRoles={['administrateur', 'simple_utilisateur']}><Formations /></ProtectedRoute>} />
        <Route path="participants" element={<ProtectedRoute allowedRoles={['administrateur', 'simple_utilisateur']}><Participants /></ProtectedRoute>} />
        <Route path="formateurs" element={<ProtectedRoute allowedRoles={['administrateur', 'simple_utilisateur']}><Formateurs /></ProtectedRoute>} />
        <Route path="referentiels" element={<ProtectedRoute allowedRoles={['administrateur']}><Referentiels /></ProtectedRoute>} />
        <Route path="utilisateurs" element={<ProtectedRoute allowedRoles={['administrateur']}><UsersManagement /></ProtectedRoute>} />
        <Route path="statistiques" element={<ProtectedRoute allowedRoles={['administrateur', 'responsable']}><Statistiques /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
