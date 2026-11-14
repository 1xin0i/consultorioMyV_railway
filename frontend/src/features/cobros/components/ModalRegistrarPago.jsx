/** @format */

import Modal from "@/shared/components/ui/Modal";
import InputFiltro from "@/shared/components/ui/InputFiltro";
import { formatDateTime } from "@/shared/utils";
import {
  Banknote,
  CreditCard,
  Landmark,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { useRegistrarPago } from "../hooks/useRegistrarPago";
import { ResumenPagoTurno } from "./ResumenPagoTurno";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

const obtenerIconoMedioPago = (nombre) => {
  const n = String(nombre || "").toLowerCase();
  if (n.includes("transfer")) return Landmark;
  if (n.includes("tarjeta") || n.includes("debito") || n.includes("credito"))
    return CreditCard;
  if (n.includes("mercado") || n.includes("wallet") || n.includes("billetera"))
    return Wallet;
  return Banknote;
};

export function ModalRegistrarPago({
  isOpen,
  onClose,
  turnoPreseleccionado = null,
  turnosAtendidos = [],
  onPagoExitoso,
}) {
  const {
    tipoIngreso,
    setTipoIngreso,
    turnoElegido,
    setTurnoElegido,
    turnosPendientesLista,
    cobrosPrevios,
    cargandoDetalle,
    enviando,
    montoAbonar,
    setMontoAbonar,
    medioPago,
    metodoPagoId,
    metodosPagoLista,
    seleccionarMetodoPago,
    fechaCobro,
    setFechaCobro,
    conceptoInformal,
    setConceptoInformal,
    observaciones,
    setObservaciones,
    resumenFinanciero,
    handleSubmit,
    nombrePaciente,
    practicasDelTurno,
  } = useRegistrarPago({
    isOpen,
    onClose,
    turnoPreseleccionado,
    turnosAtendidos,
    onPagoExitoso,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      width="max-w-2xl"
      title={
        turnoPreseleccionado
          ? `Registrar Cobro — Turno #${turnoPreseleccionado.id_turno}`
          : "Registrar Ingreso en Caja"
      }
    >
      <div className="flex flex-col gap-4">
        {/* Selector de origen solo cuando se abre desde Caja sin turno fijo */}
        {!turnoPreseleccionado && (
          <div className="flex bg-teal-50/80 p-1 rounded-xl border border-teal-200/70">
            <button
              type="button"
              onClick={() => setTipoIngreso("turno")}
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                tipoIngreso === "turno"
                  ? "bg-[#0d8266] text-white shadow-xs"
                  : "text-teal-900/70 hover:text-teal-950"
              }`}
            >
              Cobro de Turno Atendido
            </button>
            <button
              type="button"
              onClick={() => setTipoIngreso("informal")}
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                tipoIngreso === "informal"
                  ? "bg-[#0d8266] text-white shadow-xs"
                  : "text-teal-900/70 hover:text-teal-950"
              }`}
            >
              Otro ingreso
            </button>
          </div>
        )}

        {/* FLUJO A: COBRO DE TURNO */}
        {tipoIngreso === "turno" && (
          <>
            {!turnoPreseleccionado && (
              <div>
                <label className={LABEL_CLASS}>
                  Seleccionar Turno Atendido con Saldo Pendiente *
                </label>
                <InputFiltro
                  datos={turnosPendientesLista}
                  camposFiltrado={["id_turno", "nombre", "apellido", "dni"]}
                  formatoVisual={(t) => {
                    const pac = t.Paciente
                      ? `${t.Paciente.nombre} ${t.Paciente.apellido}`
                      : `Paciente #${t.id_paciente}`;
                    const saldo =
                      t.SolicitudCobro?.saldo_pendiente ?? t.precio_final ?? 0;
                    return `#${t.id_turno} - ${pac} (${formatDateTime(t.fecha_hora_inicio)}) — Saldo: $${Number(saldo).toLocaleString("es-AR")}`;
                  }}
                  placeholder="Buscar por paciente, DNI o N° de turno..."
                  alSeleccionar={(t) => setTurnoElegido(t)}
                  valorInicial={turnoElegido?.id_turno || ""}
                />
              </div>
            )}

            {turnoElegido && (
              <ResumenPagoTurno
                turnoElegido={turnoElegido}
                nombrePaciente={nombrePaciente}
                practicasDelTurno={practicasDelTurno}
                resumenFinanciero={resumenFinanciero}
                cobrosPrevios={cobrosPrevios}
                montoAbonar={montoAbonar}
                setMontoAbonar={setMontoAbonar}
                cargandoDetalle={cargandoDetalle}
              />
            )}
          </>
        )}

        {/* FLUJO B: INGRESO INFORMAL */}
        {tipoIngreso === "informal" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>
                Concepto del Ingreso *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Consulta particular rápida, venta de kit dental..."
                value={conceptoInformal}
                onChange={(e) => setConceptoInformal(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Monto Cobrado ($) *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#0d8266] font-extrabold text-base">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={montoAbonar}
                  onChange={(e) => setMontoAbonar(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 border border-teal-300 bg-teal-50/40 rounded-xl text-base font-black text-teal-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Campos comunes: Medio de pago, Fecha y Observaciones */}
        {(tipoIngreso === "informal" || turnoElegido) && (
          <>
            <div>
              <label className={LABEL_CLASS}>Medio de Pago *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {metodosPagoLista.map((mp) => {
                  const Icono = obtenerIconoMedioPago(mp.nombre);
                  const activo =
                    medioPago === mp.nombre || metodoPagoId === mp.id;
                  return (
                    <button
                      key={mp.id || mp.nombre}
                      type="button"
                      onClick={() => seleccionarMetodoPago(mp)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        activo
                          ? "bg-[#0d8266] text-white border-[#0d8266] shadow-xs"
                          : "bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-teal-50/50 hover:border-teal-200"
                      }`}
                    >
                      <Icono size={17} />
                      <span className="truncate text-xs">{mp.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={LABEL_CLASS}>Fecha del Cobro *</label>
                <input
                  type="date"
                  required
                  value={fechaCobro}
                  onChange={(e) => setFechaCobro(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Comprobante / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="N° de transferencia, nota adicional..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-teal-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={
            enviando ||
            (tipoIngreso === "turno" &&
              (!turnoElegido || resumenFinanciero.saldoPendienteActual <= 0))
          }
          className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer flex items-center gap-2"
        >
          <CheckCircle2 size={15} />
          <span>
            {enviando
              ? "Registrando..."
              : tipoIngreso === "informal"
                ? "Registrar Ingreso"
                : "Confirmar Cobro"}
          </span>
        </button>
      </div>
    </Modal>
  );
}

export default ModalRegistrarPago;
