/** @format */

import { Eye, Edit, UserCheck, UserX, MoreVertical } from "lucide-react";
import { MenuFlotantePortal } from "@/shared/components/ui/MenuFlotantePortal";

export function BotonAccionesPaciente({
  paciente,
  abrirParaVer,
  abrirParaEditar,
  abrirParaEliminar,
  formatearPacienteParaEditar,
}) {
  return (
    <MenuFlotantePortal
      ancho={192}
      trigger={({ abierto, toggleMenu }) => (
        <button
          type="button"
          onClick={toggleMenu}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            abierto
              ? "bg-teal-100 text-teal-900"
              : "text-slate-500 hover:text-teal-900 hover:bg-teal-50"
          }`}
          title="Acciones del paciente"
        >
          <MoreVertical size={18} />
        </button>
      )}
    >
      {({ cerrarMenu }) => (
        <div className="flex flex-col text-xs font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => {
              cerrarMenu();
              abrirParaVer(paciente);
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-teal-50/70 text-slate-700 hover:text-teal-900 transition-colors cursor-pointer text-left"
          >
            <Eye size={15} className="text-[#0d8266] shrink-0" />
            <span>Ver Ficha Clínica</span>
          </button>

          <button
            type="button"
            onClick={() => {
              cerrarMenu();
              abrirParaEditar(paciente, formatearPacienteParaEditar);
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-amber-50/80 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer text-left"
          >
            <Edit size={15} className="text-amber-600 shrink-0" />
            <span>Editar Datos</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              cerrarMenu();
              abrirParaEliminar(paciente);
            }}
            className={`flex items-center gap-2.5 px-3.5 py-2 transition-colors cursor-pointer text-left ${
              paciente.activo !== false
                ? "hover:bg-rose-50 text-rose-600"
                : "hover:bg-emerald-50 text-emerald-700"
            }`}
          >
            {paciente.activo !== false ? (
              <>
                <UserX size={15} className="shrink-0" />
                <span>Dar de Baja</span>
              </>
            ) : (
              <>
                <UserCheck size={15} className="shrink-0" />
                <span>Reactivar Paciente</span>
              </>
            )}
          </button>
        </div>
      )}
    </MenuFlotantePortal>
  );
}
