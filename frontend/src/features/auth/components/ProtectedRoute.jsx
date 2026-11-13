/** @format */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { estaAutenticado, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f4f7f9] gap-3">
        <div className="w-10 h-10 border-3 border-[#2eb086] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Verificando sesión...
        </p>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;

