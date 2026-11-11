/** @format */

// * IMPORTACION DE RECURSOS DE REACT
import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// * IMPORTACION DE CONTEXTS
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarProvider";
import { ConfiguracionProvider } from "./context/ConfiguracionContext";

// * COMPONENTES DE SEGURIDAD Y AUTENTICACIÓN
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./features/auth/Login";

// * IMPORTACION DE COMPONENTES DE NEGOCIO
import Layout from "./components/layout/Layout";
import AgendaDiaria from "./features/turnos/AgendaDiaria";
import GestionTurnos from "./features/turnos/GestionTurnos";
import GestionPacientes from "./features/pacientes/GestionPacientes";
import GestionObrasSociales from "./features/obrasSociales/GestionObraSocial";
import GestionPracticas from "./features/practicas/GestionPracticas";
import GestionHorarios from "./features/configuracion/GestionHorarios";
import GestionCaja from "./features/caja/GestionCaja";
import ReloadPrompt from "./components/pwa/ReloadPrompt";

// * DEFINICION DE RUTAS
const router = createBrowserRouter([
  // Ruta pública de autenticación
  {
    path: "/login",
    element: <Login />,
  },

  // Rutas protegidas mediante verificación de token
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { path: "", element: <AgendaDiaria /> },
          { path: "pacientes", element: <GestionPacientes /> },
          { path: "turnos", element: <GestionTurnos /> },
          { path: "caja", element: <GestionCaja /> },
          {
            path: "configuracion",
            children: [
              { path: "horarios", element: <GestionHorarios /> },
              { path: "obras-sociales", element: <GestionObrasSociales /> },
              { path: "practicas", element: <GestionPracticas /> },
            ],
          },
        ],
      },
    ],
  },

  // Redirección por defecto ante rutas desconocidas
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

// * CREACION DEL APP
function App() {
  // * useEffect QUE CARGA SPLASHSCREEN
  useEffect(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      const timer = setTimeout(() => {
        splash.classList.add("oculto");
        setTimeout(() => splash.remove(), 400);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <ConfiguracionProvider>
          <SidebarProvider>
            <RouterProvider router={router} />
            <ReloadPrompt />
          </SidebarProvider>
        </ConfiguracionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
