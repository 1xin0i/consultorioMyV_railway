/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, Settings, ChevronDown, LogOut, Download, KeyRound } from "lucide-react";
import { useSidebar } from "../../../context/SidebarProvider";
import { useAuth } from "../../../context/AuthContext";
import ToothLogo from "../ToothLogo";
import { NAV_ITEMS, CONFIG_ITEMS } from "../../../constants/navigation";
import { usePWAInstall } from "../../../hooks/usePWAInstall";

export const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const { usuario, solicitarLogout, abrirModalPassword } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();

  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-50 bg-[#3B7A94] text-white shadow-xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        !isOpen ? "w-20" : "w-72"
      }`}
      aria-label="Menú de navegación principal"
    >
      {/* Cabecera */}
      <div
        className={`flex items-center border-b border-white/15 min-h-21.25 transition-all duration-300 ${
          !isOpen
            ? "flex-col justify-center gap-4 py-4"
            : "justify-between px-5 py-6.5"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 min-w-10 rounded-full bg-white shadow-sm overflow-hidden shrink-0">
            <ToothLogo size={32} />
          </div>

          {isOpen && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-lg font-bold text-white leading-tight">
                M&V Turnos
              </span>
              <span className="text-xs font-medium text-white/70">
                Gestión Odontológica
              </span>
            </div>
          )}
        </div>

        {/* Botón Adaptado para Colapsar/Expandir */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex items-center justify-center w-9 h-9 min-w-9 rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 active:scale-95 shrink-0 cursor-pointer"
          aria-label={!isOpen ? "Expandir menú" : "Colapsar menú"}
        >
          <PanelLeftClose
            size={18}
            className={`transition-transform duration-300 ${!isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 min-h-12 rounded-xl text-[15px] font-semibold transition-all duration-200 whitespace-nowrap border-l-4 ${
                isActive
                  ? "bg-white/20 text-white border-white shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white border-transparent"
              }`
            }
          >
            <Icon size={22} className="shrink-0" />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {/* ─── DROPDOWN DE CONFIGURACIÓN / MAESTROS ─── */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="w-full flex items-center justify-between px-4 py-3 min-h-12 rounded-xl text-[15px] font-semibold transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white border-l-4 border-transparent cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <Settings size={22} className="shrink-0" />
              {isOpen && <span>Configuración</span>}
            </div>
            {isOpen && (
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 text-white/70 ${
                  dropdownAbierto ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {/* Menú desplegable integrado debajo */}
          {dropdownAbierto && isOpen && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-white/20 flex flex-col gap-1">
              {CONFIG_ITEMS.map(({ to, label, Icon: ItemIcon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDropdownAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <ItemIcon size={18} className="shrink-0 text-white/70" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Botón A2HS Promoción de Instalación */}
        {isInstallable && (
          <div className="mt-auto px-1 pt-2">
            {isOpen ? (
              <button
                type="button"
                onClick={promptInstall}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-emerald-200 bg-white/10 hover:bg-emerald-500/25 hover:text-white transition-all shadow-xs cursor-pointer"
              >
                <Download size={18} className="shrink-0 text-emerald-300" />
                <span className="truncate">Instalar aplicación</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={promptInstall}
                title="Instalar aplicación"
                className="w-full flex justify-center py-2.5 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Download size={20} />
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Footer con Usuario y Cerrar Sesión */}
      <div className="p-3 border-t border-white/15 bg-[#2c6177] flex items-center justify-between">
        {isOpen ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {usuario?.nombre_usuario
                  ? usuario.nombre_usuario.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate capitalize">
                  {usuario?.nombre_usuario || "Usuario"}
                </span>
                <span className="text-[10px] text-emerald-300 font-medium capitalize">
                  {usuario?.rol || "Consultorio"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={abrirModalPassword}
                title="Cambiar contraseña"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Cambiar contraseña"
              >
                <KeyRound size={16} />
              </button>
              <button
                type="button"
                onClick={solicitarLogout}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg text-white/70 hover:text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={abrirModalPassword}
              title="Cambiar contraseña"
              className="w-full flex justify-center py-1 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Cambiar contraseña"
            >
              <KeyRound size={18} />
            </button>
            <button
              type="button"
              onClick={solicitarLogout}
              title="Cerrar sesión"
              className="w-full flex justify-center py-1 text-white/70 hover:text-rose-200 transition-colors cursor-pointer"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
