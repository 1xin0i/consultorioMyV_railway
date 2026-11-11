/** @format */
import { useState, useEffect, useCallback } from "react";
import Modal from "../../../../components/common/Modal";
import { Plus, X, CheckSquare, Sparkles } from "lucide-react";
import InputFiltro from "../../../../components/common/InputFiltro";
import api from "../../../../services/api";
import toast from "react-hot-toast";
import { ModalOdontograma } from "../odontograma/ModalOdontograma";
import { formatearResumenDientes } from "../../constants/odontogramaConstants";

function ToothIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2C8.5 2 6 4 6 7c0 2.5 1 5 1.5 8 .5 3 1.5 5 2.5 5s2-2 2-4c0-1 .5-2 1-2s1 1 1 2c0 2 1 4 2 4s2-2 2.5-5c.5-3 1.5-5.5 1.5-8 0-3-2.5-5-6-5z" />
    </svg>
  );
}

const ESTADO_INICIAL_ATENCION = {
  notas_consulta: "",
  precio_final: 0,
  practicas: [],
};

export function ModalAtenderTurno({
  isOpen,
  modalAtenderAbierto, // compatibilidad
  onClose,
  cerrarModal, // compatibilidad
  turno,
  turnoSeleccionado, // compatibilidad
  practicasLista = [],
  onConfirm,
  // Props heredadas para compatibilidad retroactiva:
  datosAtencion: datosExternos,
  pacientesObrasSociales: osExternas,
  agregarPracticaAtencion: fnAgregarExt,
  actualizarPracticaAtencion: fnActualizarExt,
  actualizarDatosAtencion: fnActualizarDatosExt,
  eliminarPracticaAtencion: fnEliminarExt,
  procesarAtencionTurno: fnSubmitExt,
}) {
  const abierto = isOpen ?? modalAtenderAbierto;
  const cerrar = onClose || cerrarModal;
  const turnoTarget = turno || turnoSeleccionado;

  // Estado interno
  const [datosInternos, setDatosInternos] = useState(ESTADO_INICIAL_ATENCION);
  const [obrasSocialesInternas, setObrasSocialesInternas] = useState([]);

  // Estado para el modal de odontograma
  const [indiceOdontogramaActivo, setIndiceOdontogramaActivo] = useState(null);

  // Cargar obras sociales del paciente al abrir modal si no vienen por props
  useEffect(() => {
    if (abierto && turnoTarget?.id_paciente && !osExternas) {
      api
        .get(`/pacientes-por-obras-sociales/${turnoTarget.id_paciente}`)
        .then((res) => {
          setObrasSocialesInternas(res.data.data || []);
        })
        .catch((err) => {
          console.warn("Aviso al cargar obras sociales del paciente:", err);
          setObrasSocialesInternas([]);
        });
    }
  }, [abierto, turnoTarget, osExternas]);

  const calcularTotal = useCallback(
    (practicas) => {
      return practicas.reduce((total, item) => {
        if (item.id_practica) {
          const encontrada = practicasLista.find(
            (p) => Number(p.id_practica) === Number(item.id_practica)
          );
          if (encontrada) return total + Number(encontrada.precio_referencia || 0);
        }
        return total;
      }, 0);
    },
    [practicasLista]
  );

  // Inicializar formulario al abrir y precargar prácticas del turno (si ya tenía programadas)
  useEffect(() => {
    if (abierto && turnoTarget) {
      if (!datosExternos) {
        // Extraer prácticas asociadas si ya vienen en el objeto
        const fuentesPracticas =
          turnoTarget.PracticaTurnos || turnoTarget.practicas || [];

        const practicasPrevias = fuentesPracticas.map((pt) => ({
          id_practica: pt.id_practica || pt,
          id_obra_social: pt.id_obra_social || "",
          dientes: pt.dientes
            ? pt.dientes.map((d) => (typeof d === "object" ? d.numero_fdi : d))
            : [],
        }));

        setDatosInternos({
          notas_consulta: turnoTarget.notas_consulta || "",
          precio_final:
            practicasPrevias.length > 0
              ? calcularTotal(practicasPrevias)
              : Number(turnoTarget.precio_final) || 0,
          practicas: practicasPrevias,
        });

        // Si no vinieron incrustadas pero tiene id_turno, intentar cargarlas de la API
        if (practicasPrevias.length === 0 && turnoTarget.id_turno) {
          api
            .get(`/practicas-turnos/${turnoTarget.id_turno}`)
            .then((res) => {
              const lista = res.data.data || [];
              if (lista.length > 0) {
                const formateadas = lista.map((pt) => ({
                  id_practica: pt.id_practica,
                  id_obra_social: pt.id_obra_social || "",
                  dientes: pt.dientes
                    ? pt.dientes.map((d) => (typeof d === "object" ? d.numero_fdi : d))
                    : [],
                }));
                setDatosInternos((prev) => ({
                  ...prev,
                  practicas: formateadas,
                  precio_final:
                    prev.precio_final > 0 ? prev.precio_final : calcularTotal(formateadas),
                }));
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [abierto, turnoTarget, datosExternos, calcularTotal]);

  const datosAtencion = datosExternos || datosInternos;
  const pacientesObrasSociales = osExternas || obrasSocialesInternas;

  const agregarPractica = () => {
    if (typeof fnAgregarExt === "function") {
      fnAgregarExt();
      return;
    }
    setDatosInternos((prev) => ({
      ...prev,
      practicas: [
        ...prev.practicas,
        { id_practica: "", id_obra_social: "", dientes: [] },
      ],
    }));
  };

  const actualizarDatos = (campo, valor) => {
    if (typeof fnActualDatosExt === "function") {
      fnActualDatosExt(campo, valor);
      return;
    }
    setDatosInternos((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarPractica = (index, campo, valor) => {
    if (typeof fnActualizarExt === "function") {
      fnActualizarExt(index, campo, valor);
      return;
    }
    setDatosInternos((prev) => {
      if (campo === "id_practica" && valor) {
        const yaExiste = prev.practicas.some(
          (p, i) => i !== index && String(p.id_practica) === String(valor)
        );
        if (yaExiste) {
          toast.error("Esta práctica ya fue seleccionada en este turno", {
            id: "error-practica-duplicada",
          });
          return prev;
        }
      }

      const practicasActualizadas = [...prev.practicas];
      practicasActualizadas[index] = {
        ...practicasActualizadas[index],
        [campo]: valor,
      };

      return {
        ...prev,
        practicas: practicasActualizadas,
        precio_final:
          campo === "id_practica"
            ? calcularTotal(practicasActualizadas)
            : prev.precio_final,
      };
    });
  };

  const eliminarPractica = (index) => {
    if (typeof fnEliminarExt === "function") {
      fnEliminarExt(index);
      return;
    }
    setDatosInternos((prev) => {
      const practicasActualizadas = prev.practicas.filter((_, i) => i !== index);
      return {
        ...prev,
        practicas: practicasActualizadas,
        precio_final: calcularTotal(practicasActualizadas),
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onConfirm === "function") {
      onConfirm(datosAtencion, turnoTarget);
    } else if (typeof fnSubmitExt === "function") {
      fnSubmitExt(e);
    }
  };

  const nombrePaciente = turnoTarget?.Paciente
    ? `${turnoTarget.Paciente.nombre} ${turnoTarget.Paciente.apellido}`.trim()
    : "";

  const practicaActivaParaOdontograma =
    indiceOdontogramaActivo !== null
      ? datosAtencion.practicas[indiceOdontogramaActivo]
      : null;

  const infoPracticaActiva = practicaActivaParaOdontograma?.id_practica
    ? practicasLista.find(
        (p) =>
          Number(p.id_practica) ===
          Number(practicaActivaParaOdontograma.id_practica)
      )
    : null;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Modal
          isOpen={abierto}
          onClose={cerrar}
          width="max-w-3xl"
          title={`Atender Turno #${turnoTarget?.id_turno || ""}${
            nombrePaciente ? ` - ${nombrePaciente}` : ""
          }`}
        >
          <div className="flex flex-col gap-4">
            {/* Precio Base Calculado */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="w-full flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Precio Final de la Atención (Calculado / Modificable)
                </label>
                <div className="relative flex items-center max-w-xs">
                  <span className="absolute left-3.5 text-emerald-700 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={datosAtencion.precio_final}
                    onChange={(e) =>
                      actualizarDatos(
                        "precio_final",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="0.00"
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-emerald-300/80 rounded-xl text-emerald-950 font-bold text-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Prácticas Realizadas y Cobertura */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-[#2eb086]" />
                  <h3 className="text-sm font-bold text-gray-800">
                    Prácticas Realizadas, Piezas y Cobertura
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={agregarPractica}
                  className="flex items-center gap-1 text-xs font-semibold text-[#2eb086] hover:text-[#259370] bg-[#e8f7f1] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Agregar Práctica</span>
                </button>
              </div>

              {datosAtencion.practicas.length === 0 ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                  No se han agregado prácticas todavía. Hacé clic en &quot;Agregar
                  Práctica&quot; para registrar los procedimientos y asociar los
                  dientes afectados.
                </p>
              ) : (
                <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
                  {datosAtencion.practicas.map((practicaItem, index) => {
                    const cantDientes = practicaItem.dientes?.length || 0;
                    const resumenDientes = formatearResumenDientes(
                      practicaItem.dientes
                    );

                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-2.5 bg-gray-50 p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-2xs transition-all hover:border-gray-300"
                      >
                        {/* Fila 1: Práctica y Obra Social */}
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <div className="flex-1 w-full">
                            <InputFiltro
                              datos={practicasLista}
                              camposFiltrado={[
                                "codigo_nomenclador",
                                "nombre_nomenclador",
                                "nombre_referencia",
                                "especialidad",
                              ]}
                              formatoVisual={(p) =>
                                `${p.nombre_referencia} ($ ${Number(
                                  p.precio_referencia
                                ).toLocaleString("es-AR")})`
                              }
                              placeholder="Buscar práctica realizada..."
                              alSeleccionar={(p) =>
                                actualizarPractica(
                                  index,
                                  "id_practica",
                                  p?.id_practica || ""
                                )
                              }
                              valorInicial={practicaItem.id_practica || ""}
                            />
                          </div>

                          <div className="flex-1 w-full">
                            <InputFiltro
                              datos={pacientesObrasSociales}
                              camposFiltrado={["nombre"]}
                              formatoVisual={(rel) =>
                                `${
                                  rel.ObraSocial?.nombre ||
                                  `Obra Social #${rel.id_obra_social}`
                                } ${
                                  rel.nro_afiliado
                                    ? `(Afiliado: ${rel.nro_afiliado})`
                                    : ""
                                }`
                              }
                              placeholder="Obra social (Opcional - Particular)..."
                              alSeleccionar={(os) =>
                                actualizarPractica(
                                  index,
                                  "id_obra_social",
                                  os?.id_obra_social || ""
                                )
                              }
                              valorInicial={practicaItem.id_obra_social || ""}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarPractica(index)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-200 transition-colors self-end sm:self-center cursor-pointer"
                            title="Eliminar práctica"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Fila 2: Botón Seleccionar piezas y Badge Odontograma */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/70 text-xs">
                          <button
                            type="button"
                            onClick={() => setIndiceOdontogramaActivo(index)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                              cantDientes > 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                                : "bg-white text-slate-600 border-dashed border-slate-300 hover:border-[#2eb086] hover:text-[#2eb086] hover:bg-emerald-50/30"
                            }`}
                          >
                            <ToothIcon
                              size={14}
                              className={
                                cantDientes > 0
                                  ? "text-[#2eb086]"
                                  : "text-slate-400"
                              }
                            />
                            <span>
                              {cantDientes > 0
                                ? "Modificar piezas dentales"
                                : "Seleccionar piezas dentales (FDI)"}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-[11px] text-gray-400 uppercase font-semibold hidden sm:inline">
                              Piezas:
                            </span>
                            <span
                              className={`truncate max-w-[220px] sm:max-w-[320px] px-2 py-0.5 rounded-lg text-xs font-semibold border ${
                                cantDientes > 0
                                  ? "bg-white text-emerald-700 border-emerald-200 shadow-2xs"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                              title={resumenDientes}
                            >
                              {resumenDientes}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notas de la Consulta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Notas de la Consulta / Diagnóstico
              </label>
              <textarea
                rows={3}
                value={datosAtencion.notas_consulta}
                onChange={(e) =>
                  actualizarDatos(
                    "notas_consulta",
                    e.target.value === "" ? "" : e.target.value
                  )
                }
                placeholder="Detalles sobre la atención, diagnóstico, indicaciones médicas..."
                className="w-full border border-gray-300 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 my-5" />

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
              Finalizar y Marcar Atendido
            </button>
          </div>
        </Modal>
      </form>

      {/* Modal Odontograma Interactivo para la práctica seleccionada */}
      {indiceOdontogramaActivo !== null && (
        <ModalOdontograma
          isOpen={indiceOdontogramaActivo !== null}
          onClose={() => setIndiceOdontogramaActivo(null)}
          tituloPractica={
            infoPracticaActiva?.nombre_referencia ||
            `Práctica #${
              practicaActivaParaOdontograma?.id_practica ||
              indiceOdontogramaActivo + 1
            }`
          }
          initialTeeth={practicaActivaParaOdontograma?.dientes || []}
          onConfirm={(nuevosDientes) => {
            actualizarPractica(indiceOdontogramaActivo, "dientes", nuevosDientes);
          }}
        />
      )}
    </>
  );
}

export default ModalAtenderTurno;
