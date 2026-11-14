/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Wallet,
  CalendarClock,
  CalendarDays,
  Users,
  MoreHorizontal,
  LogOut,
  X,
  Download,
  KeyRound,
  Moon,
  Sun,
  ClipboardCheck,
  Building2,
  Tag,
  Settings,
} from "lucide-react";
import {
  useAuth,
  ModalCambiarPassword,
  ModalConfirmarLogout,
} from "@/features/auth";
import { useTheme } from "@/shared/context/ThemeContext";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";

// Orden requerido: Cobros, Turnos, Agenda, Pacientes, Más
const BOTTOMBAR_LINKS = [
  { to: "/caja", label: "Movimientos", icon: Wallet },
  { to: "/turnos", label: "Turnos", icon: CalendarClock },
  { to: "/", label: "Agenda", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
];

// Páginas de Configuración para mostrar directamente en "Más"
const PAGINAS_CONFIG = [
  { to: "/practicas", label: "Prácticas", icon: ClipboardCheck },
  { to: "/obras-sociales", label: "Obras Sociales", icon: Building2 },
  { to: "/categorias-gastos", label: "Categorías Egreso", icon: Tag },
  { to: "/configuracion/horarios", label: "Horarios y disponibilidad", icon: Settings },
];

export function Bottombar() {
  const [menuMasAbierto, setMenuMasAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const { logout, usuario } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePWAInstall();
  const location = useLocation();
  const menuRef = useRef(null);

  const nombreUsuario = usuario?.nombre || usuario?.nombre_usuario || "Usuario";
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  useEffect(() => {
    setMenuMasAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuMasAbierto(false);
      }
    };
    if (menuMasAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuMasAbierto]);

  const estaEnRutaMas = PAGINAS_CONFIG.some((link) =>
    location.pathname.startsWith(link.to),
  );

  return (
    <div ref={menuRef} className="md:hidden">
      {/* Backdrop con z-50 para superponerse por encima del botón flotante (+) */}
      {menuMasAbierto && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setMenuMasAbierto(false)}
        />
      )}

      {/* Menú flotante / Portal de "Más" con z-[60] */}
      {menuMasAbierto && (
        <div className="fixed bottom-20 left-3 right-3 max-w-sm mx-auto bg-[#3B7A94] dark:bg-slate-900 border border-white/15 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] p-3.5 text-white animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Cabecera: [M] Nombre                 (🌙)  (X) */}
          <div className="flex items-center justify-between px-1 pb-3 mb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {inicialUsuario}
              </div>
              <span className="text-sm font-bold text-white truncate max-w-[160px]">
                {nombreUsuario}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"
                }
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Alternar modo oscuro"
              >
                {isDark ? (
                  <Sun size={17} className="text-amber-300" />
                ) : (
                  <Moon size={17} className="text-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMenuMasAbierto(false)}
                title="Cerrar menú"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Páginas que antes estaban bajo Configuración: mostradas directamente */}
          <div className="grid grid-cols-2 gap-2">
            {PAGINAS_CONFIG.map((link) => {
              const IconComponent = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuMasAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? "bg-[#0d8266] text-white font-bold shadow-md ring-1.5 ring-emerald-300/40"
                        : "bg-white/10 text-white/90 font-semibold hover:bg-white/20 hover:text-white"
                    }`
                  }
                >
                  <IconComponent size={16} className="shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          {isInstallable && (
            <button
              type="button"
              onClick={async () => {
                await promptInstall();
                setMenuMasAbierto(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <Download size={15} />
              <span>Instalar aplicación en el teléfono</span>
            </button>
          )}

          {/* Cambiar contraseña y Cerrar sesión separados por una línea */}
          <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuMasAbierto(false);
                setModalPasswordAbierto(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/15 transition-colors cursor-pointer text-left"
            >
              <KeyRound size={16} className="text-[#a5f3fc] shrink-0" />
              <span>Cambiar contraseña</span>
            </button>

            <div className="border-t border-white/10 my-0.5" />

            <button
              type="button"
              onClick={() => {
                setMenuMasAbierto(false);
                setModalLogoutAbierto(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-100 border border-rose-400/25 hover:bg-rose-500/30 hover:text-white transition-colors cursor-pointer text-left shadow-2xs"
            >
              <LogOut size={16} className="text-rose-300 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de navegación inferior: mismo color y estilo que la sidebar (#3B7A94) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#3B7A94] dark:bg-slate-900 border-t border-white/15 dark:border-slate-800 flex items-center justify-around px-1 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-white">
        {BOTTOMBAR_LINKS.map((link) => {
          const IconComponent = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-150 ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? "bg-white/20 shadow-xs" : ""
                    }`}
                  >
                    <IconComponent size={19} strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  <span className="text-[10px] font-semibold leading-tight mt-0.5 truncate max-w-[64px]">
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuMasAbierto((prev) => !prev)}
          className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-150 cursor-pointer ${
            menuMasAbierto || estaEnRutaMas
              ? "text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-colors ${
              menuMasAbierto || estaEnRutaMas ? "bg-white/20 shadow-xs" : ""
            }`}
          >
            <MoreHorizontal size={19} />
          </div>
          <span className="text-[10px] font-semibold leading-tight mt-0.5">
            Más
          </span>
        </button>
      </nav>

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
    </div>
  );
}

export default Bottombar;
