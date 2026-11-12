/** @format */
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../../../../components/common/Modal";
import { formatDateTimeInput } from "../../../../utils";
import { calcularHoraFin } from "../../utils/calcularHoraFin";
import { useConfiguracion } from "../../../../context/ConfiguracionContext";

export function ModalReprogramarTurno({
  isOpen,
  modalReprogramarAbierto, // compatibilidad
  onClose,
  cerrarModal, // compatibilidad
  turno,
  turnoSeleccionado, // compatibilidad
  onConfirm,
  datosReprogramacion: datosExternos, // compatibilidad
  actualizarDatosReprogramacion, // compatibilidad
  procesarReprogramacionTurno, // compatibilidad
}) {
  const abierto = isOpen ?? modalReprogramarAbierto;
  const cerrar = onClose || cerrarModal;
  const turnoTarget = turno || turnoSeleccionado;
  const { validarTurnoHorario } = useConfiguracion();

  const [datosInternos, setDatosInternos] = useState({
    fecha_hora_inicio: "",
    duracion_minutos: 30,
    fecha_hora_fin: "",
    ignorarRestricciones: false,
  });

  useEffect(() => {
    if (abierto && turnoTarget) {
      if (datosExternos?.fecha_hora_inicio) {
        setDatosInternos({
          ignorarRestricciones: false,
          ...datosExternos,
        });
      } else {
        const inicio = formatDateTimeInput(turnoTarget.fecha_hora_inicio);
        const fin = formatDateTimeInput(turnoTarget.fecha_hora_fin);
        setDatosInternos({
          fecha_hora_inicio: inicio || "",
          duracion_minutos: turnoTarget.duracion_minutos || 30,
          fecha_hora_fin: fin || "",
          ignorarRestricciones: Boolean(turnoTarget.ignorarRestricciones),
        });
      }
    }
  }, [abierto, turnoTarget, datosExternos]);

  // Recalcular hora fin automáticamente al cambiar inicio o duración
  useEffect(() => {
    if (datosInternos.fecha_hora_inicio && datosInternos.duracion_minutos) {
      calcularHoraFin(datosInternos, (e) => {
        setDatosInternos((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      });
    }
  }, [datosInternos.fecha_hora_inicio, datosInternos.duracion_minutos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosInternos((prev) => ({ ...prev, [name]: value }));
    if (typeof actualizarDatosReprogramacion === "function") {
      actualizarDatosReprogramacion(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onConfirm === "function") {
      onConfirm(datosInternos, turnoTarget);
    } else if (typeof procesarReprogramacionTurno === "function") {
      procesarReprogramacionTurno(e);
    }
  };

  const datos = datosExternos?.fecha_hora_inicio ? datosExternos : datosInternos;

  const validacionHorario =
    datos?.fecha_hora_inicio && validarTurnoHorario
      ? validarTurnoHorario(datos.fecha_hora_inicio, datos.duracion_minutos)
      : null;

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        isOpen={abierto}
        onClose={cerrar}
        width="max-w-md"
        title={`Reprogramar Turno #${turnoTarget?.id_turno || ""}`}
      >
        <div className="flex flex-col gap-4">
          {/* Banner Ámbar de Excepción / Urgencia */}
          {validacionHorario && !validacionHorario.valido && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/70 rounded-xl text-amber-900 dark:text-amber-200 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">
                    ⚠️ Este horario está bloqueado (&quot;
                    {validacionHorario.motivo || validacionHorario.mensaje}
                    &quot;).
                  </span>{" "}
                  ¿Deseás reprogramarlo como turno excepcional / urgencia?
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none bg-white/85 dark:bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                <input
                  type="checkbox"
                  name="ignorarRestricciones"
                  checked={Boolean(datos.ignorarRestricciones)}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "ignorarRestricciones",
                        value: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Autorizar turno excepcional / urgencia
                </span>
              </label>
            </div>
          )}

          {/* Fecha y Hora de Inicio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nueva Fecha y Hora de Inicio *
            </label>
            <input
              type="datetime-local"
              name="fecha_hora_inicio"
              value={datos.fecha_hora_inicio || ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            />
          </div>

          {/* Duración (Minutos) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Duración (Minutos)
            </label>
            <select
              name="duracion_minutos"
              value={datos.duracion_minutos || 30}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos (1 hora)</option>
              <option value={90}>90 minutos (1h 30m)</option>
              <option value={120}>120 minutos (2 horas)</option>
              {![15, 30, 45, 60, 90, 120].includes(
                Number(datos.duracion_minutos),
              ) &&
                Boolean(datos.duracion_minutos) && (
                  <option value={datos.duracion_minutos}>
                    {datos.duracion_minutos} minutos
                  </option>
                )}
            </select>
          </div>

          {/* Fecha y Hora de Fin (Calculado) */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Nueva Fecha y Hora de Fin (Calculado automáticamente)
            </label>
            <input
              type="datetime-local"
              name="fecha_hora_fin"
              value={datos.fecha_hora_fin || ""}
              disabled
              className="w-full bg-gray-100 border border-gray-300 p-2 rounded-lg text-sm text-gray-600 cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 my-4" />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cerrar}
            className="px-4 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm font-semibold text-sm cursor-pointer"
          >
            Confirmar Reprogramación
          </button>
        </div>
      </Modal>
    </form>
  );
}

export default ModalReprogramarTurno;
