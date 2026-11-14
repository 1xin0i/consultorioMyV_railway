/** @format */

import { useState, useEffect } from "react";
import Modal from "@/shared/components/ui/Modal";
import { formatDate, formatDateTime } from "@/shared/utils";
import { calcularEdad } from "../utils/calcularEdad";
import { obtenerObrasSocialesPaciente } from "../utils/formatearPacienteParaEditar";
import { turnosApi } from "@/features/turnos";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Building2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Stethoscope,
  FileText,
} from "lucide-react";

const BADGE_ESTADO_TURNO = {
  Programado: "bg-amber-50 text-amber-800 border-amber-200",
  Atendido: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Cancelado: "bg-rose-50 text-rose-700 border-rose-200",
  Inasistente: "bg-slate-100 text-slate-600 border-slate-300",
};

export function VistaPaciente({
  isOpen,
  onClose,
  paciente,
  abrirParaEditar,
  formatearPacienteParaEditar,
}) {
  const [pestanaActiva, setPestanaActiva] = useState("datos");
  const [historialTurnos, setHistorialTurnos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const idPaciente = paciente?.id_paciente;

  useEffect(() => {
    if (isOpen) {
      setPestanaActiva("datos");
    }
  }, [isOpen, idPaciente]);

  useEffect(() => {
    if (isOpen && idPaciente) {
      setCargandoHistorial(true);
      turnosApi
        .obtenerPorPaciente(idPaciente)
        .then((res) => {
          setHistorialTurnos(res.data?.data || []);
        })
        .catch((err) => {
          console.error("Error al obtener historial de turnos del paciente:", err);
          setHistorialTurnos([]);
        })
        .finally(() => {
          setCargandoHistorial(false);
        });
    }
  }, [isOpen, idPaciente]);

  if (!paciente) return null;

  const obrasSociales = obtenerObrasSocialesPaciente(paciente);
  const totalAtendidos = historialTurnos.filter(
    (t) => t.EstadoTurno?.estado === "Atendido" || t.id_estado === 2,
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-3xl"
      title={`Datos del paciente — ${paciente.nombre} ${paciente.apellido}`}
    >
      {/* Cabecera resumida del paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-teal-50/60 p-4 rounded-2xl border border-teal-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0d8266] text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-sm">
            {paciente.nombre?.[0]?.toUpperCase()}
            {paciente.apellido?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900">
                {paciente.nombre} {paciente.apellido}
              </h3>
              {paciente.activo !== false ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 size={11} /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  <XCircle size={11} /> Inactivo
                </span>
              )}
            </div>
            <p className="text-xs text-teal-900/80 font-medium mt-0.5">
              DNI:{" "}
              <strong className="font-bold">
                {paciente.dni || "Sin especificar"}
              </strong>{" "}
              · Edad:{" "}
              <strong className="font-bold">
                {paciente.fecha_nacimiento
                  ? `${calcularEdad(paciente.fecha_nacimiento)} años`
                  : "S/D"}
              </strong>
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex bg-white/90 p-1 rounded-xl border border-teal-200/80 self-start sm:self-center shadow-2xs">
          <button
            type="button"
            onClick={() => setPestanaActiva("datos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              pestanaActiva === "datos"
                ? "bg-[#0d8266] text-white shadow-2xs"
                : "text-teal-900/70 hover:text-teal-950"
            }`}
          >
            <User size={14} />
            <span>Datos</span>
          </button>
          <button
            type="button"
            onClick={() => setPestanaActiva("historial")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              pestanaActiva === "historial"
                ? "bg-[#0d8266] text-white shadow-2xs"
                : "text-teal-900/70 hover:text-teal-950"
            }`}
          >
            <ClipboardList size={14} />
            <span>Historial de turnos</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                pestanaActiva === "historial"
                  ? "bg-white/20 text-white"
                  : "bg-teal-100 text-teal-900"
              }`}
            >
              {historialTurnos.length}
            </span>
          </button>
        </div>
      </div>

      {/* CONTENIDO PESTAÑA 1: DATOS PERSONALES Y COBERTURA */}
      {pestanaActiva === "datos" && (
        <div className="flex flex-col gap-4 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-3 p-3.5 bg-teal-50/40 rounded-xl border border-teal-100">
              <Phone size={18} className="text-[#0d8266] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-teal-800/70 uppercase tracking-wider">
                  Teléfono de Contacto
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {paciente.telefono || "No registrado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-teal-50/40 rounded-xl border border-teal-100">
              <Calendar size={18} className="text-[#0d8266] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-teal-800/70 uppercase tracking-wider">
                  Fecha de Nacimiento
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {paciente.fecha_nacimiento
                    ? formatDate(paciente.fecha_nacimiento)
                    : "No registrada"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 sm:col-span-2">
              <MapPin size={18} className="text-[#0d8266] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-teal-800/70 uppercase tracking-wider">
                  Domicilio Particular
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {paciente.domicilio || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          {/* Obras Sociales */}
          <div className="border-t border-teal-100 pt-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Building2 size={17} className="text-[#0d8266]" />
              <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                Cobertura Médica / Obras Sociales
              </h4>
            </div>

            {obrasSociales.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-teal-50/30 p-3 rounded-xl border border-dashed border-teal-200">
                Sin obras sociales registradas (Atención Particular).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {obrasSociales.map((os, idx) => {
                  const nombreOS =
                    os.nombre || os.ObraSocial?.nombre || "Obra Social";
                  const nroAfiliado =
                    os.PacientesPorObrasSociales?.nro_afiliado ||
                    os.nro_afiliado ||
                    "Sin nro.";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-teal-50/60 border border-teal-200/80"
                    >
                      <span className="font-bold text-teal-950 text-xs">
                        {nombreOS}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-teal-800 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200">
                        Afiliado: {nroAfiliado}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: Historial de turnos Y ATENCIONES */}
      {pestanaActiva === "historial" && (
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-teal-50/50 px-3.5 py-2.5 rounded-xl border border-teal-100">
            <span>
              Total de turnos registrados:{" "}
              <strong className="text-teal-950 font-extrabold">
                {historialTurnos.length}
              </strong>
            </span>
            <span>
              Atenciones completadas:{" "}
              <strong className="text-[#0d8266] font-extrabold">
                {totalAtendidos}
              </strong>
            </span>
          </div>

          {cargandoHistorial ? (
            <div className="space-y-2.5 py-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 bg-teal-50/50 rounded-xl animate-pulse border border-teal-100"
                />
              ))}
            </div>
          ) : historialTurnos.length === 0 ? (
            <div className="text-center py-8 bg-teal-50/20 rounded-xl border border-dashed border-teal-200">
              <AlertCircle size={28} className="mx-auto text-teal-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">
                El paciente aún no registra turnos ni atenciones previas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {historialTurnos.map((turno) => {
                const estadoNombre = turno.EstadoTurno?.estado || "Programado";
                const claseBadge =
                  BADGE_ESTADO_TURNO[estadoNombre] ||
                  "bg-slate-100 text-slate-700 border-slate-200";
                const practicas = turno.PracticaTurnos || [];
                const cobro = turno.SolicitudCobro;

                return (
                  <div
                    key={turno.id_turno}
                    className="p-3.5 rounded-xl border border-teal-100 bg-white hover:border-teal-300 transition-all shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-teal-700">
                          #{turno.id_turno}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                          <Clock size={13} className="text-[#0d8266]" />
                          {formatDateTime(turno.fecha_hora_inicio)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {Number(turno.precio_final) > 0 && (
                          <span className="text-xs font-extrabold text-slate-900 bg-teal-50/70 px-2.5 py-0.5 rounded-lg border border-teal-200/80">
                            ${" "}
                            {Number(turno.precio_final).toLocaleString("es-AR")}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${claseBadge}`}
                        >
                          {estadoNombre === "Inasistente"
                            ? "Inasistido"
                            : estadoNombre}
                        </span>
                      </div>
                    </div>

                    {/* Prácticas realizadas en el turno */}
                    {practicas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {practicas.map((pt, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-50 text-[#0d8266] border border-teal-200 px-2 py-0.5 rounded-lg"
                          >
                            <Stethoscope size={11} />
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
                    )}

                    {/* Notas clínicas / diagnóstico */}
                    {turno.notas_consulta && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                        <FileText
                          size={13}
                          className="text-teal-600 mt-0.5 shrink-0"
                        />
                        <span className="leading-relaxed">
                          {turno.notas_consulta}
                        </span>
                      </div>
                    )}

                    {/* Estado de cobro si fue atendido */}
                    {cobro && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-teal-50">
                        <span>
                          Estado de cuenta:{" "}
                          <strong
                            className={
                              Number(cobro.saldo_pendiente) > 0
                                ? "text-amber-700 font-bold"
                                : "text-emerald-700 font-bold"
                            }
                          >
                            {Number(cobro.saldo_pendiente) > 0
                              ? `Saldo pendiente: $ ${Number(cobro.saldo_pendiente).toLocaleString("es-AR")}`
                              : "Saldado"}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-teal-100 my-4" />

      <div className="flex justify-between items-center gap-2.5">
        {abrirParaEditar && (
          <button
            type="button"
            onClick={() => {
              onClose();
              abrirParaEditar(paciente, formatearPacienteParaEditar);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <Edit size={15} />
            <span>Editar Datos</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="ml-auto px-5 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}

export default VistaPaciente;
