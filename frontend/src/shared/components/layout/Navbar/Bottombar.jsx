/** @format */

import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MoreHorizontal,
  LogOut,
  X,
  Download,
  KeyRound,
  Moon,
  Sun,
} from "lucide-react";
import { NAV_LINKS } from "@/shared/constants/navigation";
import {
  useAuth,
  ModalCambiarPassword,
  ModalConfirmarLogout,
} from "@/features/auth";
import { useTheme } from "@/shared/context/ThemeContext";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";

const PRIMARY_LINKS = NAV_LINKS.slice(0, 4);
const MORE_LINKS = NAV_LINKS.slice(4);

export function Bottombar() {
  const [menuMasAbierto, setMenuMasAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [modalLogoutAbierto, setModalLogoutAbierto] = useState(false);
  const { logout, usuario } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePWAInstall();
  const location = useLocation();
  const menuRef = useRef(null);

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

  const estaEnRutaMas = MORE_LINKS.some((link) =>
    link.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(link.to),
  );

  return (
    <div ref={menuRef} className="md:hidden">
      {menuMasAbierto && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 transition-opacity"
          onClick={() => setMenuMasAbierto(false)}
        />
      )}

      {menuMasAbierto && (
        <div className="fixed bottom-16 left-3 right-3 bg-[#10243a] border border-white/10 rounded-2xl shadow-2xl z-40 p-3 text-white animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#2eb086]/20 border border-[#2eb086]/40 flex items-center justify-center text-[#3dd4a3] font-bold text-xs shrink-0">
                {(usuario?.nombre || "A").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate">
                {usuario?.nombre || "Usuario"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMenuMasAbierto(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {MORE_LINKS.map((link) => {
              const IconComponent = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuMasAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#2eb086] text-white shadow-sm"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <IconComponent size={17} className="shrink-0" />
                  <span className="truncate">{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  await promptInstall();
                  setMenuMasAbierto(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2eb086]/20 text-[#3dd4a3] border border-[#2eb086]/40 hover:bg-[#2eb086]/30 transition-colors cursor-pointer"
              >
                <Download size={16} />
                <span>Instalar aplicación en el teléfono</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-300" />
              ) : (
                <Moon size={16} className="text-sky-300" />
              )}
              <span>{isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuMasAbierto(false);
                setModalPasswordAbierto(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <KeyRound size={16} className="text-[#3dd4a3]" />
              <span>Cambiar contraseña</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuMasAbierto(false);
                setModalLogoutAbierto(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0d1f33] border-t border-white/10 flex items-center justify-around px-1 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {PRIMARY_LINKS.map((link) => {
          const IconComponent = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "text-[#3dd4a3]"
                    : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg transition-colors ${
                      isActive ? "bg-[#2eb086]/20" : ""
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
              ? "text-[#3dd4a3]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-colors ${
              menuMasAbierto || estaEnRutaMas ? "bg-[#2eb086]/20" : ""
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

