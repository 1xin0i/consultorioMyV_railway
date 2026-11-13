/** @format */

import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Download,
  KeyRound,
  Moon,
  Sun,
} from "lucide-react";
import { SidebarContext } from "@/shared/context/SidebarProvider";
import { NAV_LINKS } from "@/shared/constants/navigation";
import {
  useAuth,
  ModalCambiarPassword,
  ModalConfirmarLogout,
} from "@/features/auth";
import { useTheme } from "@/shared/context/ThemeContext";
import { ToothLogo } from "@/shared/components/layout/ToothLogo";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";

export function Sidebar() {
  const { expandido, alternarSidebar } = useContext(SidebarContext);
  const { usuario, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);

  const nombreUsuario = usuario?.nombre || "Administrador";
  const rolUsuario = usuario?.rol || "Odontología";
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  return (
    <>
      <aside
        className={`hidden md:flex flex-col justify-between bg-gradient-to-b from-[#0d1f33] to-[#112840] text-white h-screen sticky top-0 z-20 shrink-0 border-r border-white/5 shadow-xl transition-[width] duration-300 ease-in-out ${
          expandido ? "w-60" : "w-[74px]"
        }`}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-3.5 border-b border-white/10">
            <div
              className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${
                expandido ? "w-44 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <ToothLogo size={36} />
              <div className="flex flex-col leading-tight whitespace-nowrap">
                <span className="font-bold text-sm tracking-tight text-white">
                  Consultorio M&amp;V
                </span>
                <span className="text-[11px] font-medium text-[#3dd4a3]">
                  Gestión Odontológica
                </span>
              </div>
            </div>

            {!expandido && (
              <div className="mx-auto">
                <ToothLogo size={34} />
              </div>
            )}

            <button
              onClick={alternarSidebar}
              className={`p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer ${
                !expandido ? "hidden" : ""
              }`}
              title={expandido ? "Contraer menú" : "Expandir menú"}
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {!expandido && (
            <div className="flex justify-center pt-2 pb-1">
              <button
                onClick={alternarSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Expandir menú"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <nav className="p-2.5 space-y-1 mt-1">
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  title={!expandido ? link.label : ""}
                  className={({ isActive }) =>
                    `flex items-center ${
                      expandido ? "gap-3 px-3.5" : "justify-center px-0"
                    } py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-[#2eb086] text-white shadow-md shadow-[#2eb086]/25"
                        : "text-slate-300/85 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  <IconComponent size={19} className="shrink-0" />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                      expandido ? "w-36 opacity-100" : "w-0 opacity-0"
                    }`}
                  >
                    {link.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-2.5 border-t border-white/10 space-y-1.5">
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              title={!expandido ? "Instalar aplicación" : ""}
              className={`w-full flex items-center ${
                expandido ? "gap-3 px-3.5" : "justify-center px-0"
              } py-2 rounded-xl font-semibold text-xs bg-[#2eb086]/15 text-[#3dd4a3] border border-[#2eb086]/30 hover:bg-[#2eb086]/25 transition-colors cursor-pointer`}
            >
              <Download size={16} className="shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  expandido ? "w-36 opacity-100 text-left" : "w-0 opacity-0"
                }`}
              >
                Instalar App
              </span>
            </button>
          )}

          <div
            className={`flex items-center ${
              expandido ? "gap-2.5 px-2.5 py-2" : "justify-center py-1.5"
            } rounded-xl bg-white/5 border border-white/5`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#2eb086]/20 border border-[#2eb086]/40 flex items-center justify-center text-[#3dd4a3] font-bold text-xs shrink-0">
              {inicialUsuario}
            </div>
            <div
              className={`flex flex-col min-w-0 overflow-hidden transition-all duration-200 ${
                expandido ? "w-36 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <span className="text-xs font-semibold text-white truncate">
                {nombreUsuario}
              </span>
              <span className="text-[10px] text-slate-400 truncate capitalize">
                {rolUsuario}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            title={
              !expandido
                ? isDark
                  ? "Cambiar a Modo Claro"
                  : "Cambiar a Modo Oscuro"
                : ""
            }
            className={`w-full flex items-center ${
              expandido ? "gap-3 px-3.5" : "justify-center px-0"
            } py-2 rounded-xl font-medium text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer`}
          >
            {isDark ? (
              <Sun size={16} className="shrink-0 text-amber-300" />
            ) : (
              <Moon size={16} className="shrink-0 text-sky-300" />
            )}
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                expandido ? "w-36 opacity-100 text-left" : "w-0 opacity-0"
              }`}
            >
              {isDark ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalPasswordAbierto(true)}
            title={!expandido ? "Cambiar contraseña" : ""}
            className={`w-full flex items-center ${
              expandido ? "gap-3 px-3.5" : "justify-center px-0"
            } py-2 rounded-xl font-medium text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer`}
          >
            <KeyRound size={16} className="shrink-0 text-[#3dd4a3]" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                expandido ? "w-36 opacity-100 text-left" : "w-0 opacity-0"
              }`}
            >
              Cambiar contraseña
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalLogoutAbierto(true)}
            title={!expandido ? "Cerrar sesión" : ""}
            className={`w-full flex items-center ${
              expandido ? "gap-3 px-3.5" : "justify-center px-0"
            } py-2 rounded-xl font-medium text-xs text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer`}
          >
            <LogOut size={16} className="shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                expandido ? "w-36 opacity-100 text-left" : "w-0 opacity-0"
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <ModalCambiarPassword
        isOpen={modalPasswordAbierto}
        onClose={() => setModalPasswordAbierto(false)}
      />

      <ModalConfirmarLogout
        isOpen={modalLogoutAbierto}
        onClose={() => setModalLogoutAbierto(false)}
        onConfirm={() => {
          setModalLogoutAbierto(false);
          logout();
        }}
      />
    </>
  );
}

export default Sidebar;

