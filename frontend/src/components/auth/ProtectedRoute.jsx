/** @format */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const { isAuthenticated, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 size={36} className="animate-spin text-[#2eb086]" />
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          Verificando sesión...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login preservando la ubicación original intentada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

