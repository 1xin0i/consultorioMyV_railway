/** @format */

import { Plus } from "lucide-react";
import Header from "@/shared/components/ui/Header";

export function PageLayout({
  icono,
  titulo,
  subtitulo,
  badge,
  alerta,
  accionesHeader,
  botonAccion,
  onNuevo,
  botonFlotanteMobile,
  containerClassName = "overflow-y-auto",
  children,
}) {
  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-[#f9fbfd] dark:bg-slate-950 overflow-hidden relative">
      {/* Header a lo largo de extremo a extremo con el texto más pequeño */}
      <Header
        icono={icono}
        titulo={titulo}
        subtitulo={subtitulo}
        badge={badge}
        alerta={alerta}
        botonAccion={accionesHeader || botonAccion}
      />

      {/* Contenedor del contenido sobre fondo #f9fbfd */}
      <div
        className={`flex-1 w-full min-h-0 px-3 sm:px-5 md:px-6 pt-5 sm:pt-6 md:pt-7 pb-4 sm:pb-6 text-slate-900 dark:text-slate-100 flex flex-col ${containerClassName}`}
      >
        {children}
      </div>

      {/* Botón flotante para mobile (más pequeño y con z-20 para quedar bajo el portal del menú Más) */}
      {botonFlotanteMobile}

      {!botonFlotanteMobile && onNuevo && (
        <button
          type="button"
          onClick={onNuevo}
          aria-label={`Agregar en ${titulo || "pantalla"}`}
          title={`Agregar en ${titulo || "pantalla"}`}
          className="sm:hidden fixed bottom-20 right-4 z-20 w-11 h-11 rounded-full bg-[#0d8266] hover:bg-[#09664f] active:scale-95 text-white shadow-lg shadow-teal-950/20 flex items-center justify-center transition-transform cursor-pointer"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

export default PageLayout;
