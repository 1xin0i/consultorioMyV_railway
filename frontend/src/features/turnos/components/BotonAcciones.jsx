/** @format */

import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  CalendarClock,
  MoreVertical,
  UserX,
  Banknote,
  Eye,
} from "lucide-react";
import { MenuFlotantePortal } from "@/shared/components/ui/MenuFlotantePortal";

export function BotonAcciones({
  turno,
  abrirParaVer,
  abrirParaAtender,
  abrirParaReprogramar,
  abrirParaCancelar,
  abrirParaInasistente,
  abrirParaEditar,
  abrirParaEliminar,
  abrirParaCobrar,
  formatearTurnoParaReprogramar,
}) {
  const idEstado = Number(turno.id_estado || turno.EstadoTurno?.id_estado);
  const estadoNombre = turno.EstadoTurno?.estado;

  const esProgramado = idEstado === 1 || estadoNombre === "Programado";
  const esAtendido = idEstado === 2 || estadoNombre === "Atendido";

  const solicitudCobro = turno.SolicitudCobro || turno.Cobro;
  const tieneSaldoPendiente =
    esAtendido &&
    (!solicitudCobro ||
      (solicitudCobro.estado !== "saldado" &&
        Number(
          solicitudCobro.saldo_pendiente ?? turno.precio_final ?? 0,
        ) > 0));

  return (
    <MenuFlotantePortal
      ancho={212}
      trigger={({ abierto, toggleMenu }) => (
        <button
          type="button"
          onClick={toggleMenu}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            abierto
              ? "bg-teal-100 text-teal-900 dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-500 hover:text-teal-900 hover:bg-teal-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          }`}
          title="Más acciones"
        >
          <MoreVertical size={18} />
        </button>
      )}
    >
      {({ cerrarMenu }) => (
        <div className="flex flex-col text-xs font-semibold text-slate-700 dark:text-slate-200">
          {abrirParaVer && (
            <button
              type="button"
              onClick={() => {
                cerrarMenu();
                abrirParaVer(turno);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-teal-50/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
            >
              <Eye size={15} className="text-[#0d8266] shrink-0" />
              <span>Ver Detalle</span>
            </button>
          )}

          {esProgramado && (
            <>
              <button
                type="button"
                onClick={() => {
                  cerrarMenu();
                  abrirParaAtender(turno);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer text-left"
              >
                <CheckCircle size={15} className="shrink-0" />
                <span>Marcar Atendido</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cerrarMenu();
                  abrirParaReprogramar(turno, formatearTurnoParaReprogramar);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-sky-700 dark:text-sky-300 transition-colors cursor-pointer text-left"
              >
                <CalendarClock size={15} className="shrink-0" />
                <span>Reprogramar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cerrarMenu();
                  abrirParaInasistente(turno);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer text-left"
              >
                <UserX size={15} className="shrink-0" />
                <span>Marcar Inasistido</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cerrarMenu();
                  abrirParaCancelar(turno);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-left"
              >
                <XCircle size={15} className="shrink-0" />
                <span>Cancelar Turno</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            </>
          )}

          {tieneSaldoPendiente && abrirParaCobrar && (
            <>
              <button
                type="button"
                onClick={() => {
                  cerrarMenu();
                  abrirParaCobrar(turno);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[#0d8266] dark:text-emerald-300 font-bold transition-colors cursor-pointer text-left"
              >
                <Banknote size={15} className="shrink-0" />
                <span>Registrar Pago</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              cerrarMenu();
              abrirParaEditar(turno);
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-800 transition-colors cursor-pointer text-left"
          >
            <Edit size={15} className="text-amber-600 shrink-0" />
            <span>Editar Turno</span>
          </button>

          <button
            type="button"
            onClick={() => {
              cerrarMenu();
              abrirParaEliminar(turno);
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-left"
          >
            <Trash2 size={15} className="shrink-0" />
            <span>Eliminar Turno</span>
          </button>
        </div>
      )}
    </MenuFlotantePortal>
  );
}
