/** @format */

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Navbar/Sidebar";
import { Bottombar } from "./Navbar/Bottombar";
import { useSidebar } from "../../context/SidebarProvider";
import toast, { Toaster, ToastBar } from "react-hot-toast";
import { X } from "lucide-react";
import ModalConfirmarLogout from "../auth/ModalConfirmarLogout";
import ModalCambiarPassword from "../auth/ModalCambiarPassword";

export default function Layout() {
  const { isOpen } = useSidebar();
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Sidebar PC */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Contenido principal */}
      <main
        className={`flex-1 w-full transition-all bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 duration-300 ${isOpen ? "md:pl-72.5" : "md:pl-20"}`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg",
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="flex items-center gap-2">
                  {icon}
                  <div className="text-xs sm:text-sm font-medium">{message}</div>
                  {t.type !== "loading" && (
                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-md transition-colors ml-2 cursor-pointer"
                      title="Cerrar notificación"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Outlet />
      </main>

      {/* Navegación móvil */}
      <div className="block md:hidden">
        <Bottombar />
      </div>

      {/* Modales globales de Autenticación / Sesión */}
      <ModalConfirmarLogout />
      <ModalCambiarPassword />
    </div>
  );
}
