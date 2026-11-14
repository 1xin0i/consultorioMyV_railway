/** @format */

import { useState, useEffect } from "react";
import Modal from "@/shared/components/ui/Modal";
import InputFiltro from "@/shared/components/ui/InputFiltro";
import { formatDateTime } from "@/shared/utils";
import { AlertTriangle, Stethoscope } from "lucide-react";
import { turnosApi } from "@/features/turnos";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  turnosAtendidos = [],
  datosFormulario,
  actualizarDatos,
  guardarCobro,
}) {
  const [practicasDelTurno, setPracticasDelTurno] = useState([]);

  const esInformal = datosFormulario?.tipo_ingreso === "informal";
  const idTurnoActual = datosFormulario?.id_turno;

  useEffect(() => {
    if (!modalAbierto || !idTurnoActual || esInformal) {
      setPracticasDelTurno([]);
      return;
    }

    const turnoEnLista = turnosAtendidos.find(
      (t) => Number(t.id_turno) === Number(idTurnoActual),
    );

    if (turnoEnLista?.PracticaTurnos?.length > 0) {
      setPracticasDelTurno(turnoEnLista.PracticaTurnos);
    } else {
      turnosApi
        .obtenerPracticasConDetalle(idTurnoActual)
        .then((res) => setPracticasDelTurno(res.data?.data || []))
        .catch(() => setPracticasDelTurno([]));
    }
  }, [modalAbierto, idTurnoActual, esInformal, turnosAtendidos]);

  const alSeleccionarTurno = (turno) => {
    const saldoSugerido =
      turno?.SolicitudCobro?.saldo_pendiente ?? turno?.precio_final ?? "";

    actualizarDatos({
      id_turno: turno?.id_turno || "",
      monto_pagado: saldoSugerido,
    });
  };

  return (
    <Modal
      isOpen={modalAbierto}
      onClose={cerrarModal}
      onSubmit={guardarCobro}
      width="max-w-lg"
      title={editando ? "Editar Cobro" : "Registrar Ingreso en Caja"}
    >
      <div className="flex flex-col gap-4">
        {/* Selector de tipo de ingreso (Turno vs Informal) */}
        {!editando && (
          <div className="flex bg-teal-50/70 p-1 rounded-xl border border-teal-100">
            <button
              type="button"
              onClick={() =>
                actualizarDatos({
                  tipo_ingreso: "turno",
                  concepto_informal: "",
                })
              }
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !esInformal
                  ? "bg-[#0d8266] text-white shadow-2xs"
                  : "text-teal-900/70 hover:text-teal-950"
              }`}
            >
              Asociado a un Turno
            </button>
            <button
              type="button"
              onClick={() =>
                actualizarDatos({
                  tipo_ingreso: "informal",
                  id_turno: "",
                })
              }
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                esInformal
                  ? "bg-[#0d8266] text-white shadow-2xs"
                  : "text-teal-900/70 hover:text-teal-950"
              }`}
            >
              Otro ingreso
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {!esInformal ? (
            <div className="col-span-1 md:col-span-2">
              <label className={LABEL_CLASS}>Turno Atendido *</label>
              <InputFiltro
                datos={turnosAtendidos}
                deshabilitado={editando}
                camposFiltrado={["id_turno", "nombre", "apellido", "dni"]}
                formatoVisual={(t) => {
                  const pac = t.Paciente
                    ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
                    : `Paciente #${t.id_paciente}`;
                  const saldo =
                    t.SolicitudCobro?.saldo_pendiente ?? t.precio_final ?? 0;
                  return `#${t.id_turno} - ${pac} (${formatDateTime(t.fecha_hora_inicio)}) - Saldo: $${Number(saldo).toLocaleString("es-AR")}`;
                }}
                placeholder="Buscar turno por paciente o número..."
                alSeleccionar={alSeleccionarTurno}
                valorInicial={datosFormulario?.id_turno || ""}
              />

              {/* Prácticas realizadas en ese turno */}
              {practicasDelTurno.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-teal-50/50 border border-teal-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1.5">
                    Prácticas realizadas en el turno:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {practicasDelTurno.map((pt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-white text-[#0d8266] border border-teal-200 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        <Stethoscope size={12} />
                        <span>
                          {pt.Practica?.nombre_referencia ||
                            pt.Practica?.nombre_nomenclador ||
                            "Práctica"}
                        </span>
                        {pt.ObraSocial?.nombre && (
                          <span className="text-teal-700/80 font-medium">
                            ({pt.ObraSocial.nombre})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="col-span-1 md:col-span-2">
              <label className={LABEL_CLASS}>
                Concepto del Ingreso *
              </label>
              <input
                type="text"
                name="concepto_informal"
                required={esInformal}
                placeholder="Ej. Consulta particular rápida, venta de kit de higiene..."
                value={datosFormulario?.concepto_informal || ""}
                onChange={actualizarDatos}
                className={INPUT_CLASS}
              />
            </div>
          )}

          <div>
            <label className={LABEL_CLASS}>Monto Cobrado ($) *</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-[#0d8266] font-extrabold text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="monto_pagado"
                required
                placeholder="0.00"
                value={datosFormulario?.monto_pagado || ""}
                onChange={actualizarDatos}
                className="w-full pl-8 pr-3 py-2.5 border border-teal-200 bg-teal-50/40 rounded-xl text-sm font-extrabold text-teal-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Medio de Pago *</label>
            <select
              name="medio_pago"
              required
              value={datosFormulario?.medio_pago || "Efectivo"}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className={LABEL_CLASS}>Fecha del Cobro *</label>
            <input
              type="date"
              name="fecha_cobro"
              required
              value={datosFormulario?.fecha_cobro || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className={LABEL_CLASS}>Observaciones Adicionales</label>
            <textarea
              name="observaciones"
              rows={2}
              placeholder="Comprobante, nota sobre el pago..."
              value={datosFormulario?.observaciones || ""}
              onChange={actualizarDatos}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-teal-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer"
        >
          {editando ? "Guardar Cambios" : "Registrar Cobro"}
        </button>
      </div>
    </Modal>
  );
}

export function FormularioEliminar({
  modalEliminar,
  cerrarModal,
  cobroSeleccionado,
  ejecutarEliminacion,
}) {
  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Anular Cobro"
      variant="danger"
    >
      <div className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle size={20} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            ¿Confirmas la anulación de este cobro?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se eliminará el ingreso por{" "}
            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-extrabold">
              ${" "}
              {Number(
                cobroSeleccionado?.monto_pagado ||
                  cobroSeleccionado?.monto ||
                  0,
              ).toLocaleString("es-AR")}
            </span>{" "}
            y el saldo volverá a quedar pendiente en la cuenta del turno.
          </p>
        </div>
      </div>

      <div className="border-t border-rose-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold text-xs transition-colors shadow-sm shadow-rose-500/30 cursor-pointer"
        >
          Sí, Anular Cobro
        </button>
      </div>
    </Modal>
  );
}
