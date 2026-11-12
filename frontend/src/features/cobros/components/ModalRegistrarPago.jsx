/** @format */

import { useState, useEffect, useCallback } from "react";
import Modal from "../../../components/common/Modal";
import InputFiltro from "../../../components/common/InputFiltro";
import api from "../../../services/api";
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";

const formatearFechaHora = (fechaIso) => {
  if (!fechaIso) return null;
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return null;
  const dia = d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} · ${hora} hs`;
};

export default function ModalRegistrarPago({
  isOpen,
  onClose,
  item = null,
  turno = null,
  turnosLista = null,
  onSuccess,
  onVerTurno = null,
}) {
  const [montoACobrar, setMontoACobrar] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Datos normalizados de la solicitud de cobro / turno
  const [montoTotal, setMontoTotal] = useState(0);
  const [yaCobrado, setYaCobrado] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [idTurno, setIdTurno] = useState(null);
  const [solicitudCobroId, setSolicitudCobroId] = useState(null);

  // Datos de contexto del turno (para mostrar la ficha completa)
  const [fechaTurno, setFechaTurno] = useState(null);
  const [conceptoTurno, setConceptoTurno] = useState(null);
  const [notasTurno, setNotasTurno] = useState(null);
  const [turnoRaw, setTurnoRaw] = useState(null);

  // Selector interactivo de turnos (cuando no se pasa item ni turno inicial)
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [turnoSeleccionadoObj, setTurnoSeleccionadoObj] = useState(null);

  const mostrarSelectorTurno = !item && !turno;

  // Carga y calcula datos financieros para un turno seleccionado
  const cargarDatosTurno = useCallback(async (t) => {
    if (!t) {
      setTurnoSeleccionadoObj(null);
      setIdTurno(null);
      setPacienteInfo(null);
      setMontoTotal(0);
      setYaCobrado(0);
      setSaldoPendiente(0);
      setMontoACobrar("");
      setSolicitudCobroId(null);
      setFechaTurno(null);
      setConceptoTurno(null);
      setNotasTurno(null);
      setTurnoRaw(null);
      return;
    }

    setTurnoSeleccionadoObj(t);
    const idT = t.id_turno ?? t.turno_id;
    setIdTurno(idT);
    const pac = t.Paciente || t.paciente || null;
    setPacienteInfo(pac);

    setFechaTurno(
      t.fecha_hora_inicio || t.fecha || t.raw?.fecha_hora_inicio || null,
    );
    setConceptoTurno(
      t.concepto ||
        t.PracticaTurnos?.map((pt) => pt.Practica?.nombre_referencia)
          .filter(Boolean)
          .join(", ") ||
        t.notas_consulta ||
        null,
    );
    setNotasTurno(t.notas_consulta || t.raw?.notas_consulta || null);
    setTurnoRaw(t.raw || t);

    // Si el turno ya contiene saldo precalculado (ej. cuotasPendientes de caja)
    if (t.solicitud_cobro_id && t.saldo_pendiente !== undefined) {
      const tot = Number(t.monto_total ?? t.precio_final) || 0;
      const cob = Number(t.ya_cobrado) || 0;
      const sal = Number(t.saldo_pendiente);
      setMontoTotal(tot);
      setYaCobrado(cob);
      setSaldoPendiente(sal);
      setMontoACobrar(sal > 0 ? sal.toString() : "");
      setSolicitudCobroId(t.solicitud_cobro_id);
      return;
    }

    const totalTurno = Number(t.precio_final ?? t.monto_total) || 0;

    try {
      const res = await api.get(`/cobros/${idT}/cobros`);
      const raw = res.data?.data;
      const solicitud = Array.isArray(raw) ? raw[0] : raw;

      if (solicitud) {
        const totalSolicitud =
          Number(solicitud.monto_total ?? solicitud.monto_a_cobrar) ||
          totalTurno;
        const cobrosList = solicitud.Cobros || [];
        const cobradoSuma =
          solicitud.ya_cobrado !== undefined
            ? Number(solicitud.ya_cobrado)
            : cobrosList.reduce(
                (acc, c) => acc + (Number(c.monto ?? c.monto_cobrado) || 0),
                0,
              );
        const saldo = Math.max(0, totalSolicitud - cobradoSuma);

        setMontoTotal(totalSolicitud);
        setYaCobrado(cobradoSuma);
        setSaldoPendiente(saldo);
        setMontoACobrar(saldo > 0 ? saldo.toString() : "");
        setSolicitudCobroId(
          solicitud.id ?? solicitud.id_solicitud_cobro ?? null,
        );
      } else {
        setMontoTotal(totalTurno);
        setYaCobrado(0);
        setSaldoPendiente(totalTurno);
        setMontoACobrar(totalTurno > 0 ? totalTurno.toString() : "");
        setSolicitudCobroId(null);
      }
    } catch {
      setMontoTotal(totalTurno);
      setYaCobrado(0);
      setSaldoPendiente(totalTurno);
      setMontoACobrar(totalTurno > 0 ? totalTurno.toString() : "");
      setSolicitudCobroId(null);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg("");
    setMetodoPago("Efectivo");
    setObservaciones("");
    setTurnoSeleccionadoObj(null);

    // Caso 1: Se pasó un item precalculado (ej. desde VistaPendientes)
    if (item) {
      const total = Number(item.monto_total) || 0;
      const cobrado = Number(item.ya_cobrado) || 0;
      const saldo =
        item.saldo_pendiente !== undefined
          ? Number(item.saldo_pendiente)
          : Math.max(0, total - cobrado);

      setMontoTotal(total);
      setYaCobrado(cobrado);
      setSaldoPendiente(saldo);
      setMontoACobrar(saldo > 0 ? saldo.toString() : "");
      setPacienteInfo(item.paciente || item.Paciente || null);
      setIdTurno(item.id_turno ?? item.turno_id ?? null);
      setSolicitudCobroId(
        item.solicitud_cobro_id ??
          item.id_solicitud_cobro ??
          item.id_cobro ??
          null,
      );
      setFechaTurno(item.fecha || item.raw?.fecha_hora_inicio || null);
      setConceptoTurno(
        item.concepto ||
          item.raw?.PracticaTurnos?.map((pt) => pt.Practica?.nombre_referencia)
            .filter(Boolean)
            .join(", ") ||
          null,
      );
      setNotasTurno(item.raw?.notas_consulta || null);
      setTurnoRaw(item.raw || null);
      return;
    }

    // Caso 2: Se pasó un turno directo (ej. desde GestionTurnos o AgendaDiaria)
    if (turno) {
      cargarDatosTurno(turno);
      return;
    }

    // Caso 3: Modo genérico sin turno previo -> inicializar lista de selección
    setMontoTotal(0);
    setYaCobrado(0);
    setSaldoPendiente(0);
    setMontoACobrar("");
    setPacienteInfo(null);
    setIdTurno(null);
    setSolicitudCobroId(null);
    setFechaTurno(null);
    setConceptoTurno(null);
    setNotasTurno(null);
    setTurnoRaw(null);

    if (Array.isArray(turnosLista) && turnosLista.length > 0) {
      setTurnosDisponibles(turnosLista);
    } else {
      setCargandoTurnos(true);
      api
        .get("/turnos/atendidos")
        .then((res) => {
          const lista = res.data?.data || res.data || [];
          setTurnosDisponibles(lista);
        })
        .catch((err) => {
          console.error("Error al cargar turnos atendidos:", err);
          setTurnosDisponibles([]);
        })
        .finally(() => {
          setCargandoTurnos(false);
        });
    }
  }, [isOpen, item, turno, turnosLista, cargarDatosTurno]);

  const montoNum = Number(montoACobrar) || 0;
  const esSaldoTotal = Math.abs(montoNum - saldoPendiente) < 0.01;
  const esParcial = montoNum > 0 && montoNum < saldoPendiente;
  const saldoRestanteTrasPago = Math.max(0, saldoPendiente - montoNum);
  const esInvalido =
    !idTurno ||
    montoNum <= 0 ||
    montoNum > saldoPendiente + 0.01 ||
    isNaN(montoNum);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idTurno) {
      setErrorMsg("Debes seleccionar un turno para registrar el cobro.");
      return;
    }

    if (esInvalido) {
      setErrorMsg(
        montoNum > saldoPendiente
          ? "El monto a cobrar no puede superar el saldo pendiente."
          : "Ingresa un monto válido mayor a 0.",
      );
      return;
    }

    setCargando(true);
    setErrorMsg("");

    try {
      await api.post("/cobros/registrar-pago", {
        solicitud_cobro_id: solicitudCobroId,
        id_turno: idTurno,
        monto: montoNum,
        monto_a_cobrar: montoNum,
        metodo_pago: metodoPago,
        observaciones: observaciones.trim() || null,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error al registrar el cobro:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Ocurrió un error al intentar registrar el cobro.",
      );
    } finally {
      setCargando(false);
    }
  };

  const nombrePaciente = pacienteInfo
    ? `${pacienteInfo.apellido || ""}, ${pacienteInfo.nombre || ""}`.trim()
    : null;

  const subtituloModal = [
    nombrePaciente ? `Paciente: ${nombrePaciente}` : null,
    idTurno ? `Turno #${idTurno}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Cobro"
      subtitle={
        subtituloModal ||
        (mostrarSelectorTurno
          ? "Selecciona un turno para registrar su pago"
          : null)
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SELECTOR INTERACTIVO DE TURNO (cuando se abre desde 'Registrar Cobro') */}
        {mostrarSelectorTurno && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Seleccionar Turno Atendido{" "}
              <span className="text-rose-500">*</span>
            </label>

            {cargandoTurnos ? (
              <div className="py-2.5 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500">
                Cargando turnos atendidos pendientes...
              </div>
            ) : turnosDisponibles.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center justify-between">
                <span>No hay turnos atendidos pendientes de cobro.</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md font-bold">
                  Al día
                </span>
              </div>
            ) : (
              <InputFiltro
                datos={turnosDisponibles}
                campoId="id_turno"
                camposFiltrado={[
                  "id_turno",
                  "Paciente.nombre",
                  "Paciente.apellido",
                  "Paciente.dni",
                  "paciente.nombre",
                  "paciente.apellido",
                  "paciente.dni",
                ]}
                formatoVisual={(t) => {
                  const pac = t.Paciente || t.paciente;
                  const nom = pac
                    ? `${pac.apellido || ""}, ${pac.nombre || ""}`.trim()
                    : "Sin Paciente";
                  const dni = pac?.dni ? ` · DNI: ${pac.dni}` : "";
                  const precio = Number(
                    t.precio_final ?? t.monto_total ?? 0,
                  ).toLocaleString("es-AR");
                  return `Turno #${t.id_turno} - ${nom}${dni} ($${precio})`;
                }}
                placeholder="Buscar por paciente, DNI o ID de turno..."
                valorInicial={idTurno || ""}
                alSeleccionar={(t) => {
                  cargarDatosTurno(t);
                }}
              />
            )}
          </div>
        )}

        {/* FICHA DETALLADA DEL TURNO */}
        {idTurno && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col gap-2 animate-in fade-in duration-150">
            {/* Encabezado de la Ficha: Paciente y Badge Turno */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {pacienteInfo?.nombre
                    ? pacienteInfo.nombre[0].toUpperCase()
                    : "P"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                    {nombrePaciente || "Paciente"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {pacienteInfo?.dni ? `DNI ${pacienteInfo.dni}` : ""}
                    {pacienteInfo?.telefono
                      ? ` · Tel: ${pacienteInfo.telefono}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  Turno #{idTurno}
                </span>
                {onVerTurno && (
                  <button
                    type="button"
                    onClick={() =>
                      onVerTurno(
                        turnoRaw || {
                          id_turno: idTurno,
                          Paciente: pacienteInfo,
                        },
                      )
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Ver ficha completa del turno"
                  >
                    <Eye size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Fecha y Tratamiento / Concepto */}
            {(fechaTurno || conceptoTurno) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60 text-xs">
                {fechaTurno && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Calendar size={13} className="text-[#2eb086] shrink-0" />
                    <span className="font-medium truncate">
                      {formatearFechaHora(fechaTurno)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notas de la consulta (si existen) */}
            {notasTurno && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                <span className="font-semibold not-italic text-slate-600 dark:text-slate-300">
                  Nota:{" "}
                </span>
                {notasTurno}
              </div>
            )}
          </div>
        )}

        {/* RESUMEN FINANCIERO */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total
            </span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">
              $
              {montoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ya Cobrado
            </span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
              ${yaCobrado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Saldo Pendiente
            </span>
            <span className="text-sm font-black text-amber-800 dark:text-amber-300 mt-0.5">
              $
              {saldoPendiente.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* ESTADO SI YA ESTÁ SALDADO */}
        {idTurno && saldoPendiente <= 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Este turno ya no posee saldo pendiente por cobrar.</span>
          </div>
        )}

        {/* INPUT: MONTO A COBRAR */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Monto cobrado <span className="text-rose-500">*</span>
            </label>
            {!esSaldoTotal && saldoPendiente > 0 && (
              <button
                type="button"
                onClick={() => setMontoACobrar(saldoPendiente.toString())}
                className="text-[11px] font-semibold text-[#2eb086] hover:underline cursor-pointer"
              >
                Cobrar total (${saldoPendiente.toLocaleString("es-AR")})
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm">
              $
            </div>
            <input
              type="number"
              step="any"
              min="0.01"
              max={saldoPendiente}
              value={montoACobrar}
              onChange={(e) => setMontoACobrar(e.target.value)}
              placeholder={!idTurno ? "Primero selecciona un turno" : "0,00"}
              disabled={!idTurno || saldoPendiente <= 0}
              required
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* INDICADOR EN TIEMPO REAL */}
          {idTurno && saldoPendiente > 0 && (
            <div className="mt-2">
              {esSaldoTotal && montoNum > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-lg px-2.5 py-1.5">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span>Quedará completamente saldado</span>
                </div>
              )}

              {esParcial && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-2.5 py-1.5">
                  <Clock
                    size={14}
                    className="text-amber-600 dark:text-amber-400 shrink-0"
                  />
                  <span>
                    Pago parcial. Restará por cobrar:{" "}
                    <strong>
                      $
                      {saldoRestanteTrasPago.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </span>
                </div>
              )}

              {montoNum > saldoPendiente + 0.01 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg px-2.5 py-1.5">
                  <ShieldAlert
                    size={14}
                    className="text-rose-600 dark:text-rose-400 shrink-0"
                  />
                  <span>El monto ingresado supera el saldo pendiente.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SELECT: MÉTODO DE PAGO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Método de Pago <span className="text-rose-500">*</span>
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            disabled={!idTurno || saldoPendiente <= 0}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* INPUT: OBSERVACIONES */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Observaciones (Opcional)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={!idTurno || saldoPendiente <= 0}
            placeholder="Ej: Entrega inicial, Cancela saldo..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={cargando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando || esInvalido || saldoPendiente <= 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Banknote size={15} />
            <span>
              {cargando
                ? "Registrando..."
                : !idTurno
                  ? "Seleccionar Turno"
                  : "Confirmar Cobro"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
