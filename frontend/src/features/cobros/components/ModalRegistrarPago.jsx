/** @format */

import { useState, useEffect } from "react";
import Modal from "../../../components/common/Modal";
import api from "../../../services/api";
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function ModalRegistrarPago({
  isOpen,
  onClose,
  item = null,
  turno = null,
  onSuccess,
}) {
  const [montoACobrar, setMontoACobrar] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Datos normalizados del cobro/turno
  const [montoTotal, setMontoTotal] = useState(0);
  const [yaCobrado, setYaCobrado] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [pacienteInfo, setPacienteInfo] = useState(null);
  const [idTurno, setIdTurno] = useState(null);
  const [idCuota, setIdCuota] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg("");
    setMetodoPago("Efectivo");

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
      setIdTurno(item.id_turno || null);
      setIdCuota(item.id_cuota || null);
      return;
    }

    // Caso 2: Se pasó un turno directo (ej. desde GestionTurnos)
    if (turno) {
      const totalTurno = Number(turno.precio_final) || 0;
      setIdTurno(turno.id_turno);
      setPacienteInfo(turno.Paciente || null);

      // Consultar si ya tiene un cobro previo registrado
      api
        .get(`/cobros/${turno.id_turno}/cobros`)
        .then((res) => {
          const cobro = res.data?.data;
          if (cobro && cobro.Cuotas && cobro.Cuotas.length > 0) {
            const totalCobro = Number(cobro.monto_a_cobrar) || totalTurno;
            const cobradoCuotas = cobro.Cuotas.reduce(
              (acc, q) => acc + (Number(q.monto_cobrado) || 0),
              0
            );
            const saldo = Math.max(0, totalCobro - cobradoCuotas);
            const cuotaPendiente = cobro.Cuotas.find(
              (q) => q.estado !== "Pagada"
            );

            setMontoTotal(totalCobro);
            setYaCobrado(cobradoCuotas);
            setSaldoPendiente(saldo);
            setMontoACobrar(saldo > 0 ? saldo.toString() : "");
            setIdCuota(cuotaPendiente?.id_cuota || null);
          } else {
            setMontoTotal(totalTurno);
            setYaCobrado(0);
            setSaldoPendiente(totalTurno);
            setMontoACobrar(totalTurno > 0 ? totalTurno.toString() : "");
            setIdCuota(null);
          }
        })
        .catch(() => {
          // Si no tiene cobro previo, inicializar con el precio del turno
          setMontoTotal(totalTurno);
          setYaCobrado(0);
          setSaldoPendiente(totalTurno);
          setMontoACobrar(totalTurno > 0 ? totalTurno.toString() : "");
          setIdCuota(null);
        });
    }
  }, [isOpen, item, turno]);

  const montoNum = Number(montoACobrar) || 0;
  const esSaldoTotal = Math.abs(montoNum - saldoPendiente) < 0.01;
  const esParcial = montoNum > 0 && montoNum < saldoPendiente;
  const saldoRestanteTrasPago = Math.max(0, saldoPendiente - montoNum);
  const esInvalido =
    montoNum <= 0 || montoNum > saldoPendiente + 0.01 || isNaN(montoNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esInvalido) {
      setErrorMsg(
        montoNum > saldoPendiente
          ? "El monto a cobrar no puede superar el saldo pendiente."
          : "Ingresa un monto válido mayor a 0."
      );
      return;
    }

    setCargando(true);
    setErrorMsg("");

    try {
      await api.post("/cobros/registrar-pago", {
        id_turno: idTurno,
        id_cuota: idCuota,
        monto_a_cobrar: montoNum,
        metodo_pago: metodoPago,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error al registrar el cobro:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Ocurrió un error al intentar registrar el cobro."
      );
    } finally {
      setCargando(false);
    }
  };

  const nombrePaciente = pacienteInfo
    ? `${pacienteInfo.apellido || ""}, ${pacienteInfo.nombre || ""}`.trim()
    : "Paciente";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Cobro"
      subtitle={nombrePaciente !== "Paciente" ? `Paciente: ${nombrePaciente}` : null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RESUMEN FINANCIERO */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total
            </span>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">
              ${montoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
              ${saldoPendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* INPUT: MONTO A COBRAR */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Monto que querés cobrar <span className="text-rose-500">*</span>
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
              placeholder="0,00"
              required
              autoFocus
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
            />
          </div>

          {/* INDICADOR EN TIEMPO REAL */}
          <div className="mt-2">
            {esSaldoTotal && montoNum > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-lg px-2.5 py-1.5">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Quedará completamente saldado</span>
              </div>
            )}

            {esParcial && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg px-2.5 py-1.5">
                <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
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
                <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>El monto ingresado supera el saldo pendiente.</span>
              </div>
            )}
          </div>
        </div>

        {/* SELECT: MÉTODO DE PAGO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Método de Pago <span className="text-rose-500">*</span>
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all cursor-pointer"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Otro">Otro</option>
          </select>
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
            disabled={cargando || esInvalido}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2eb086] hover:bg-[#259370] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Banknote size={15} />
            <span>{cargando ? "Registrando..." : "Confirmar Cobro"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
