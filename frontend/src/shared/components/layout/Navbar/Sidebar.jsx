/** @format */

import { useContext, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

  const { pathname } = useLocation();
  const rutasConfig = [
    "/practicas",
    "/obras-sociales",
    "/categorias-gastos",
    "/configuracion/horarios",
  ];
  const [configAbierto, setConfigAbierto] = useState(() =>
    rutasConfig.some((ruta) => pathname.startsWith(ruta)),
  );

  console.log(usuario);
  const nombreUsuario = usuario?.nombre_usuario || "Administrador";
  const rolUsuario = usuario?.rol || "Odontología";
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  useEffect(() => {
    const esRutaConfig = rutasConfig.some((ruta) => pathname.startsWith(ruta));
    setConfigAbierto(esRutaConfig);
  }, [pathname]);

  return (
    <>
      <aside
        className={`hidden md:flex flex-col justify-between bg-[#3B7A94] text-white h-screen sticky top-0 z-20 shrink-0 border-r border-white/5 shadow-xl transition-[width] duration-300 ease-in-out ${
          expandido ? "w-68" : "w-[74px]"
        }`}
      >
        <div>
          {/* Cabecera con más margen lateral y altura */}
          <div className="flex items-center justify-between h-20 px-5 border-b border-white/10">
            <div
              className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${
                expandido ? "w-48 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <ToothLogo size={38} />
              <div className="flex flex-col leading-tight whitespace-nowrap">
                <span className="font-bold text-base tracking-tight text-white">
                  M&amp;V Turnos
                </span>
                <span className="text-[11px] font-medium text-white/75">
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
              className={`p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer ${
                !expandido ? "hidden" : ""
              }`}
              title={expandido ? "Contraer menú" : "Expandir menú"}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {!expandido && (
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={alternarSidebar}
                className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                title="Expandir menú"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Navegación con más aire lateral (px-4) y separación entre ítems (space-y-2) */}
          <nav className="px-4 py-5 space-y-2">
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;

              // Caso 1: Ítem con submenú desplegable (Configuración)
              if (link.children) {
                const hayHijoActivo = link.children.some((child) =>
                  pathname.startsWith(child.to),
                );

                return (
                  <div key={link.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!expandido) alternarSidebar();
                        setConfigAbierto((prev) => !prev);
                      }}
                      title={!expandido ? link.label : ""}
                      className={`w-full flex items-center ${
                        expandido
                          ? "justify-between px-4"
                          : "justify-center px-0"
                      } py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                        hayHijoActivo
                          ? "bg-white/15 text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <IconComponent size={19} className="shrink-0" />
                        <span
                          className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                            expandido
                              ? "w-32 opacity-100 text-left"
                              : "w-0 opacity-0"
                          }`}
                        >
                          {link.label}
                        </span>
                      </div>

                      {expandido && (
                        <ChevronDown
                          size={16}
                          className={`shrink-0 transition-transform duration-200 ${
                            configAbierto ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Subitems desplegables */}
                    {expandido && configAbierto && (
                      <div className="ml-4 pl-3 border-l border-white/15 space-y-1 pt-1">
                        {link.children.map((sublink) => {
                          const SubIcon = sublink.icon;
                          return (
                            <NavLink
                              key={sublink.to}
                              to={sublink.to}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                                  isActive
                                    ? "bg-[#6295a9] text-white shadow-sm"
                                    : "text-white/75 hover:bg-white/10 hover:text-white"
                                }`
                              }
                            >
                              <SubIcon size={16} className="shrink-0" />
                              <span className="truncate">{sublink.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Caso 2: Ítem normal
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  title={!expandido ? link.label : ""}
                  onClick={() => setConfigAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center ${
                      expandido ? "gap-3.5 px-4" : "justify-center px-0"
                    } py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-[#6295a9] text-white shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <IconComponent size={19} className="shrink-0" />
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                      expandido ? "w-40 opacity-100" : "w-0 opacity-0"
                    }`}
                  >
                    {link.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Pie de usuario: una sola línea divisoria y mayor padding (px-5 py-4) */}
        <div className="px-5 py-4 bg-[#2d6177] space-y-3">
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
              expandido
                ? "justify-between gap-2"
                : "flex-col justify-center gap-2"
            }`}
          >
            {/* Izquierda: Avatar circular + Nombre y Rol */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {inicialUsuario}
              </div>

              {expandido && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate leading-tight">
                    {nombreUsuario}
                  </span>
                  <span className="text-[11px] text-[#5eead4] truncate capitalize leading-tight">
                    {rolUsuario}
                  </span>
                </div>
              )}
            </div>

            {/* Derecha: Botones de acción con gap-2 */}
            <div
              className={`flex items-center ${
                expandido ? " shrink-0" : "flex-col gap-1.5 mt-1"
              }`}
            >
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"
                }
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                {isDark ? (
                  <Sun size={15} className="text-amber-300" />
                ) : (
                  <Moon size={15} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalPasswordAbierto(true)}
                title="Cambiar contraseña"
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <KeyRound size={15} />
              </button>

              <button
                type="button"
                onClick={() => setModalLogoutAbierto(true)}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
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
