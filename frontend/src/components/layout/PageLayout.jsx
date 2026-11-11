import { Plus } from "lucide-react";

export default function PageLayout({ children, onAdd }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Contenido principal de la página con padding inferior adaptado al bottombar móvil (h-16) y al botón FAB */}
      <main className="flex-1 w-full pb-28 md:pb-8 bg-slate-50 dark:bg-slate-950">{children}</main>

      {/* Botón flotante condicional (FAB) posicionado holgadamente arriba del bottom bar y sin solapar la paginación */}
      {onAdd && (
        <button
          onClick={onAdd}
          className="fixed sm:hidden right-4 bottom-20 z-40 bg-[#2eb086] hover:bg-[#259370] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none cursor-pointer"
          aria-label="Crear nuevo registro"
        >
          <span className="text-2xl font-light leading-none">
            <Plus size={22} />
          </span>
        </button>
      )}
    </div>
  );
}
