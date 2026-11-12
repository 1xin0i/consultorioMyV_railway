/** @format */

import { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import { calcularEdad } from "../utils/calcularEdad";
import { formatFechaTabla, formatSoloHora } from "../../../utils/index";
import {
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  Banknote,
  AlertCircle,
  CalendarCheck,
  CalendarClock,
} from "lucide-react";

export function VistaPaciente({ isOpen, onClose, paciente }) {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados de Filtros y Acordeón
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 'todos' | 'atendidos' | 'programados'
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [acordeonAbiertoId, setAcordeonAbiertoId] = useState(null);

  // Paginación interna de turnos del paciente
  const [paginaActual, setPaginaActual] = useState(1);
  const TURNOS_POR_PAGINA = 5;

  const cargarFichaYTurnosPaciente = useCallback(async (idPaciente) => {
    setCargando(true);
    try {
      const res = await api.get(`/turnos/paciente/${idPaciente}`);
      const lista = res.data.data || [];
      setTurnos(lista);
    } catch (error) {
      console.error("Error al cargar la historia del paciente:", error);
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && paciente?.id_paciente) {
      cargarFichaYTurnosPaciente(paciente.id_paciente);
    }
  }, [isOpen, paciente, cargarFichaYTurnosPaciente]);

  // Cálculo de la edad
  const edadCalculada = useMemo(
    () => calcularEdad(paciente?.fecha_nacimiento),
    [paciente?.fecha_nacimiento],
  );

  // Cálculos de saldo total pendiente y resumen
  const resumenFinanciero = useMemo(() => {
    let totalAcordado = 0;
    let totalPagado = 0;

    turnos.forEach((t) => {
      const solicitud = t.SolicitudCobro || t.Cobro;
      if (solicitud) {
        const montoAcordado = Number(
          solicitud.monto_total ?? solicitud.monto_a_cobrar ?? t.precio_final ?? 0,
        );
        const pagado =
          solicitud.ya_cobrado !== undefined
            ? Number(solicitud.ya_cobrado) || 0
            : (solicitud.Cobros || []).reduce(
                (acc, c) => acc + (Number(c.monto) || 0),
                0,
              );
        totalAcordado += montoAcordado;
        totalPagado += pagado;
      }
    });

    const saldoPendienteTotal = Math.max(0, totalAcordado - totalPagado);

    return {
      totalAcordado,
      totalPagado,
      saldoPendienteTotal,
      alDia: saldoPendienteTotal === 0,
    };
  }, [turnos]);

  // Filtrado de Turnos
  const turnosFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      const estado = t.EstadoTurno?.estado || "";

      // Filtro por Estado (Atendidos vs Programados)
      if (filtroEstado === "atendidos" && estado !== "Atendido") return false;
      if (filtroEstado === "programados" && estado !== "Programado") return false;

      // Filtro de pendientes de cobro
      if (soloPendientes) {
        const solicitud = t.SolicitudCobro || t.Cobro;
        if (!solicitud) return true; // Si no tiene solicitud generada, está pendiente
        const montoTotal = Number(
          solicitud.monto_total ?? solicitud.monto_a_cobrar ?? 0,
        );
        const pagado =
          solicitud.ya_cobrado !== undefined
            ? Number(solicitud.ya_cobrado) || 0
            : (solicitud.Cobros || []).reduce(
                (acc, c) => acc + (Number(c.monto) || 0),
                0,
              );
        const saldo =
          solicitud.saldo_pendiente !== undefined
            ? Number(solicitud.saldo_pendiente) || 0
            : Math.max(0, montoTotal - pagado);
        if (saldo <= 0) return false;
      }

      // Búsqueda por texto (fecha, notas o estado)
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase();
        const fecha = formatFechaTabla(t.fecha_hora_inicio).toLowerCase();
        const notas = (t.notas_consulta || "").toLowerCase();
        const estadoNorm = (t.EstadoTurno?.estado || "").toLowerCase();
        return (
          fecha.includes(query) ||
          notas.includes(query) ||
          estadoNorm.includes(query)
        );
      }

      return true;
    });
  }, [turnos, filtroEstado, soloPendientes, busqueda]);

  // Paginación
  const totalPaginas =
    Math.ceil(turnosFiltrados.length / TURNOS_POR_PAGINA) || 1;
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * TURNOS_POR_PAGINA;
    return turnosFiltrados.slice(inicio, inicio + TURNOS_POR_PAGINA);
  }, [turnosFiltrados, paginaActual]);

  const toggleAcordeon = (idTurno) => {
    setAcordeonAbiertoId(acordeonAbiertoId === idTurno ? null : idTurno);
  };

  if (!paciente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-3xl"
      title={`Ficha Clinica y Cuenta Corriente`}
    >
      <div className="flex flex-col gap-4 text-sm">
        {/* ─── TARJETA PRINCIPAL DEL PACIENTE ─── */}
        <div className="bg-gradient-to-br from-gray-50 to-[#e8f7f1]/30 dark:from-slate-900 dark:to-teal-950/20 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200/60 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2eb086] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                {paciente.nombre?.charAt(0)}
                {paciente.apellido?.charAt(0)}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-800 dark:text-slate-100 leading-tight">
                  {paciente.apellido}, {paciente.nombre}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                  <span>DNI: {paciente.dni || "S/D"}</span>
                  <span>•</span>
                  <span>Tel: {paciente.telefono || "S/D"}</span>
                </div>
              </div>
            </div>

            {/* EDAD DESTACADA Y FECHA DE NACIMIENTO */}
            <div className="text-left sm:text-right bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 block tracking-wider">
                Edad del Paciente
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-[#2eb086]">
                  {edadCalculada !== null ? `${edadCalculada} años` : "S/D"}
                </span>
                {paciente.fecha_nacimiento && (
                  <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
                    ({formatFechaTabla(paciente.fecha_nacimiento)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* INDICADORES FINANCIEROS (RESUMEN DE CUENTA) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block">
                Total Turnos
              </span>
              <span className="text-sm font-black text-gray-800 dark:text-slate-200">
                {turnos.length} registrados
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block">
                Saldo Pendiente
              </span>
              <span
                className={`text-sm font-black ${
                  resumenFinanciero.saldoPendienteTotal > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                $
                {resumenFinanciero.saldoPendienteTotal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block">
                  Estado Cuenta
                </span>
                <span
                  className={`text-xs font-bold ${
                    resumenFinanciero.alDia
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {resumenFinanciero.alDia ? "Al Día" : "Con Deuda"}
                </span>
              </div>
              <span
                className={`p-1.5 rounded-lg text-xs font-bold ${
                  resumenFinanciero.alDia
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                }`}
              >
                {resumenFinanciero.alDia ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ─── FILTROS DE ESTADO: TODOS, ATENDIDOS, PROGRAMADOS ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 min-h-[36px]">
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("todos");
              setPaginaActual(1);
            }}
            className={`px-3.5 py-1.5 min-h-[32px] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center justify-center ${
              filtroEstado === "todos"
                ? "bg-[#2eb086] text-white shadow-2xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            Todos ({turnos.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("atendidos");
              setPaginaActual(1);
            }}
            className={`px-3.5 py-1.5 min-h-[32px] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 ${
              filtroEstado === "atendidos"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60"
            }`}
          >
            <CalendarCheck size={14} />
            <span>Atendidos ({turnos.filter((t) => t.EstadoTurno?.estado === "Atendido").length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstado("programados");
              setPaginaActual(1);
            }}
            className={`px-3.5 py-1.5 min-h-[32px] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 ${
              filtroEstado === "programados"
                ? "bg-sky-600 text-white shadow-2xs"
                : "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/60 dark:border-sky-800/60"
            }`}
          >
            <CalendarClock size={14} />
            <span>Programados ({turnos.filter((t) => t.EstadoTurno?.estado === "Programado").length})</span>
          </button>
        </div>

        {/* ─── BARRA DE BÚSQUEDA Y FILTROS DE TURNOS ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 dark:bg-slate-900 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shrink-0">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por fecha, notas o estado del turno..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-[#2eb086]/40 focus:outline-none"
            />
          </div>

          {/* CHECKBOX MOSTRAR SOLO PENDIENTES */}
          <label className="flex items-center gap-2 cursor-pointer select-none bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => {
                setSoloPendientes(e.target.checked);
                setPaginaActual(1);
              }}
              className="w-4 h-4 text-[#2eb086] rounded border-gray-300 focus:ring-[#2eb086]"
            />
            <span>Solo Impagos / Parciales</span>
          </label>
        </div>

        {/* ─── HISTORIAL DE TURNOS Y COBROS (ACORDEÓN) ─── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Historial de Atenciones ({turnosFiltrados.length})
            </span>
          </div>

          {cargando ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 italic py-6 text-center">
              Cargando turnos e historial del paciente...
            </p>
          ) : turnosPaginados.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
              <p className="text-xs text-gray-400 dark:text-slate-500 italic">
                {soloPendientes || busqueda
                  ? "No se encontraron turnos que coincidan con el filtro aplicado."
                  : "El paciente aún no registra turnos ni atenciones."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {turnosPaginados.map((t) => {
                const solicitud = t.SolicitudCobro || t.Cobro;
                const totalAcordado = Number(
                  solicitud?.monto_total ?? solicitud?.monto_a_cobrar ?? t.precio_final ?? 0,
                );
                const totalPagado =
                  solicitud?.ya_cobrado !== undefined
                    ? Number(solicitud.ya_cobrado) || 0
                    : (solicitud?.Cobros || []).reduce(
                        (acc, c) => acc + (Number(c.monto) || 0),
                        0,
                      );
                const saldoRestante =
                  solicitud?.saldo_pendiente !== undefined
                    ? Math.max(0, Number(solicitud.saldo_pendiente) || 0)
                    : Math.max(0, totalAcordado - totalPagado);

                const esDesplegado = acordeonAbiertoId === t.id_turno;

                // Estado de pago
                let estadoCobroLabel = "Sin Cobro";
                let estadoCobroColor = "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700";

                if (solicitud) {
                  if (saldoRestante === 0 && totalAcordado > 0) {
                    estadoCobroLabel = "Pagado";
                    estadoCobroColor =
                      "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
                  } else if (totalPagado > 0) {
                    estadoCobroLabel = `Falta $${saldoRestante.toLocaleString("es-AR")}`;
                    estadoCobroColor =
                      "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
                  } else {
                    estadoCobroLabel = `Pendiente $${saldoRestante.toLocaleString("es-AR")}`;
                    estadoCobroColor =
                      "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
                  }
                }

                return (
                  <div
                    key={t.id_turno}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
                  >
                    {/* CABECERA DEL ACORDEÓN */}
                    <div
                      onClick={() => toggleAcordeon(t.id_turno)}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[#2eb086] shrink-0">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 dark:text-slate-100 text-xs sm:text-sm">
                              {formatFechaTabla(t.fecha_hora_inicio)}
                            </span>
                            <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
                              {formatSoloHora(t.fecha_hora_inicio)} hs
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium block">
                            Estado Turno:{" "}
                            <strong>
                              {t.EstadoTurno?.estado || "Programado"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCobroColor}`}
                        >
                          {estadoCobroLabel}
                        </span>

                        <button
                          type="button"
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          {esDesplegado ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONTENIDO DESPLEGABLE DEL ACORDEÓN */}
                    {esDesplegado && (
                      <div className="p-3.5 bg-gray-50/60 dark:bg-slate-950/40 border-t border-gray-100 dark:border-slate-800 text-xs space-y-3 animate-in fade-in duration-150">
                        {/* NOTAS Y PRÁCTICAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">
                              Notas del Turno
                            </span>
                            <p className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 italic">
                              {t.notas_consulta ||
                                "Sin observaciones registradas."}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1">
                              Resumen de Cobro
                            </span>
                            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">
                                  Monto Total:
                                </span>
                                <span className="font-bold text-gray-800 dark:text-slate-100">
                                  ${totalAcordado.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-slate-400">Abonado:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ${totalPagado.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-gray-100 dark:border-slate-800 pt-1">
                                <span className="font-bold text-gray-700 dark:text-slate-300">
                                  Saldo Restante:
                                </span>
                                <span
                                  className={`font-bold ${saldoRestante > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                                >
                                  ${saldoRestante.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* TRATAMIENTOS / PRÁCTICAS */}
                        {t.PracticaTurnos && t.PracticaTurnos.length > 0 && (
                          <div className="border-t border-gray-100 dark:border-slate-800 pt-2">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase block mb-1.5">
                              Tratamientos Realizados
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {t.PracticaTurnos.map((pt, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-semibold text-gray-800 dark:text-slate-100">
                                      {pt.Practica?.nombre_referencia ||
                                        pt.Practica?.nombre_nomenclador ||
                                        `Práctica #${pt.id_practica}`}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {pt.ObraSocial?.nombre || "Particular"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* INDICADOR DE SALDO PENDIENTE */}
                        {saldoRestante > 0 && (
                          <div className="flex justify-end pt-1">
                            <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1.5 rounded-xl font-bold text-xs">
                              <Banknote size={14} className="text-amber-600 dark:text-amber-400" />
                              <span>Saldo pendiente de cobro: ${saldoRestante.toFixed(2)}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGINACIÓN DE LA FICHA */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 shrink-0">
              <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual((p) => p - 1)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </Modal>
  );
}
