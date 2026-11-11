/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Settings, ChevronUp, LogOut, Download, KeyRound, Sun, Moon } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { NAV_ITEMS, CONFIG_ITEMS } from "../../../constants/navigation";
import { usePWAInstall } from "../../../hooks/usePWAInstall";

export const Bottombar = () => {
  const location = useLocation();
  const { logout, usuario, solicitarLogout, abrirModalPassword } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const configContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        configContainerRef.current &&
        !configContainerRef.current.contains(event.target)
      ) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkIsActive = (itemTo) => {
    const currentPath = location.pathname;
    if (!itemTo) return false;
    if (itemTo === "/") {
      return (
        currentPath === "/" ||
        currentPath.startsWith("/agenda") ||
        currentPath.startsWith("/atencion")
      );
    }
    return currentPath.startsWith(itemTo);
  };

  const isConfigActive =
    location.pathname.startsWith("/configuracion") ||
    location.pathname.startsWith("/obras-sociales") ||
    location.pathname.startsWith("/practicas");

  // Orden para la barra inferior: Caja, Turnos, Agenda (centro destacado), Pacientes
  const itemsOrdenados = [
    NAV_ITEMS.find((item) => item.to === "/caja"),
    NAV_ITEMS.find((item) => item.to === "/turnos"),
    NAV_ITEMS.find((item) => item.to === "/"),
    NAV_ITEMS.find((item) => item.to === "/pacientes"),
  ].filter(Boolean);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#3B7A94] dark:bg-[#162a35] border-t border-white/15 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] min-h-16 safe-area-bottom">
      <div ref={configContainerRef} className="relative">
        {/* DROPDOWN CONFIGURACIÓN Y SESIÓN */}
        {dropdownAbierto && (
          <div className="absolute bottom-full mb-2 right-2 z-60 w-56 bg-[#3B7A94] dark:bg-[#162a35] border border-white/20 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {usuario && (
              <div className="px-3 py-2 text-xs border-b border-white/10 mb-1 flex items-center justify-between">
                <span className="font-bold text-white truncate capitalize">
                  {usuario.nombre_usuario || "Usuario"}
                </span>
                <span className="text-[10px] text-emerald-300 font-medium capitalize">
                  {usuario.rol || "Consultorio"}
                </span>
              </div>
            )}

            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
              Configuración
            </div>

            {CONFIG_ITEMS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setDropdownAbierto(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={16} className="shrink-0 text-white/80" />
                <span>{label}</span>
              </NavLink>
            ))}

            {/* Alternador de Modo Oscuro / Claro en Móvil */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors w-full text-left cursor-pointer border-t border-white/10"
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Sun size={16} className="shrink-0 text-amber-300" />
                ) : (
                  <Moon size={16} className="shrink-0 text-sky-200" />
                )}
                <span>{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/80">
                {isDark ? "Oscuro" : "Claro"}
              </span>
            </button>

            {isInstallable && (
              <button
                type="button"
                onClick={() => {
                  setDropdownAbierto(false);
                  promptInstall();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-colors w-full text-left cursor-pointer border-t border-white/10"
              >
                <Download size={16} className="shrink-0 text-emerald-300" />
                <span>Instalar aplicación</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDropdownAbierto(false);
                abrirModalPassword();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-colors w-full text-left cursor-pointer border-t border-white/10"
            >
              <KeyRound size={16} className="shrink-0 text-emerald-300" />
              <span>Cambiar contraseña</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDropdownAbierto(false);
                solicitarLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-colors w-full text-left cursor-pointer border-t border-white/10 mt-1 pt-2"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}

        {/* BARRA INFERIOR */}
        <nav
          className="w-full px-2 py-1.5 flex items-center justify-around"
          aria-label="Navegación inferior móvil M&V"
        >
          {itemsOrdenados.map(({ to, labelCorto, label, IconMobile, Icon }) => {
            const FinalIcon = IconMobile || Icon;
            const esPrincipal = to === "/";
            const activo = checkIsActive(to);

            if (esPrincipal) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  onClick={() => setDropdownAbierto(false)}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
                    activo
                      ? "bg-white/25 text-white shadow-md font-bold"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <FinalIcon size={22} className="text-white" />
                  <span className="text-[10px] font-bold leading-tight mt-1">
                    {labelCorto}
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={to}
                to={to}
                aria-label={label}
                onClick={() => setDropdownAbierto(false)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 ${
                  activo
                    ? "bg-white/20 text-white shadow-sm font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <FinalIcon size={20} />
                <span className="text-[10px] font-medium leading-tight mt-1">
                  {labelCorto}
                </span>
              </NavLink>
            );
          })}

          {/* Botón Configuración */}
          <button
            type="button"
            onClick={() => setDropdownAbierto((prev) => !prev)}
            aria-label="Configuración"
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-95 cursor-pointer ${
              isConfigActive || dropdownAbierto
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings size={20} />
              <ChevronUp
                size={10}
                className={`absolute -bottom-1 -right-1 transition-transform duration-200 ${dropdownAbierto ? "rotate-180" : ""}`}
              />
            </div>
            <span className="text-[10px] font-medium leading-tight mt-1">
              Config
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Bottombar;
