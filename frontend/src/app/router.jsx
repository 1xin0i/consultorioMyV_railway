/** @format */

import { Routes, Route } from "react-router-dom";
import { Layout } from "@/shared/components/layout/Layout";
import { Login, ProtectedRoute } from "@/features/auth";
import { AgendaDiaria, GestionTurnos } from "@/features/turnos";
import { GestionPacientes } from "@/features/pacientes";
import { GestionObraSocial } from "@/features/obrasSociales";
import { GestionPracticas } from "@/features/practicas";
import { GestionCaja } from "@/features/caja";
import { GestionHorarios } from "@/features/configuracion";

export function AppRouter() {
  return (
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
        <Route path="practicas" element={<GestionPracticas />} />
        <Route path="configuracion/horarios" element={<GestionHorarios />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;

