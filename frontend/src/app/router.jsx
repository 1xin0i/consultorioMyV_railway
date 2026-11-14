/** @format */

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/shared/components/layout/Layout";
import { Login, ProtectedRoute } from "@/features/auth";

// Helper para cargar named exports de forma diferida desde cada feature/index.js
const lazyNamed = (importFn, exportName) =>
  lazy(() => importFn().then((module) => ({ default: module[exportName] })));

// Vistas cargadas bajo demanda (generan chunks separados en el build)
const AgendaDiaria = lazyNamed(
  () => import("@/features/turnos"),
  "AgendaDiaria",
);
const GestionTurnos = lazyNamed(
  () => import("@/features/turnos"),
  "GestionTurnos",
);
const GestionPacientes = lazyNamed(
  () => import("@/features/pacientes"),
  "GestionPacientes",
);
const GestionObraSocial = lazyNamed(
  () => import("@/features/obrasSociales"),
  "GestionObraSocial",
);
const GestionPracticas = lazyNamed(
  () => import("@/features/practicas"),
  "GestionPracticas",
);
const GestionCategoriasGasto = lazyNamed(
  () => import("@/features/gastos"),
  "GestionCategoriasGasto",
);
const GestionCaja = lazyNamed(() => import("@/features/caja"), "GestionCaja");
const GestionHorarios = lazyNamed(
  () => import("@/features/configuracion"),
  "GestionHorarios",
);

// Indicador liviano mientras descarga la vista seleccionada
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px] text-sm text-slate-500">
      Cargando vista...
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Ruta pública de autenticación */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas dentro del Layout principal */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgendaDiaria />} />
          <Route path="turnos" element={<GestionTurnos />} />
          <Route path="pacientes" element={<GestionPacientes />} />
          <Route path="caja" element={<GestionCaja />} />
          <Route path="obras-sociales" element={<GestionObraSocial />} />
          <Route path="categorias-gastos" element={<GestionCategoriasGasto />} />
          <Route path="practicas" element={<GestionPracticas />} />
          <Route path="configuracion/horarios" element={<GestionHorarios />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
