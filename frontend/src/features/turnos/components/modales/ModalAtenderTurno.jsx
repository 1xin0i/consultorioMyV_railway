/** @format */
import { useState, useEffect, useCallback } from "react";
import Modal from "../../../../components/common/Modal";
import { Plus, X, CheckSquare } from "lucide-react";
import InputFiltro from "../../../../components/common/InputFiltro";
import api from "../../../../services/api";
import toast from "react-hot-toast";

const ESTADO_INICIAL_ATENCION = { notas_consulta: "", precio_final: 0, practicas: [] };

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

  // Inicializar formulario al abrir
  useEffect(() => {
    if (abierto && turnoTarget) {
      if (!datosExternos) {
        setDatosInternos({
          notas_consulta: turnoTarget.notas_consulta || "",
          precio_final: 0,
          practicas: [],
        });
      }
    }
  }, [abierto, turnoTarget, datosExternos]);

  const datosAtencion = datosExternos || datosInternos;
  const pacientesObrasSociales = osExternas || obrasSocialesInternas;

  const calcularTotal = useCallback(
    (practicas) => {
      return practicas.reduce((total, item) => {
        if (item.id_practica) {
          const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
          if (encontrada) return total + Number(encontrada.precio_referencia || 0);
        }
        return total;
      }, 0);
    },
    [practicasLista]
  );

  const agregarPractica = () => {
    if (typeof fnAgregarExt === "function") {
      fnAgregarExt();
      return;
    }
    setDatosInternos((prev) => ({
      ...prev,
      practicas: [...prev.practicas, { id_practica: "", id_obra_social: "" }],
    }));
  };

  const actualizarDatos = (campo, valor) => {
    if (typeof fnActualizarDatosExt === "function") {
      fnActualizarDatosExt(campo, valor);
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
          toast.error("Esta práctica ya fue seleccionada en este turno", { id: "error-practica-duplicada" });
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
        precio_final: campo === "id_practica" ? calcularTotal(practicasActualizadas) : prev.precio_final,
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

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        isOpen={abierto}
        onClose={cerrar}
        width="max-w-2xl"
        title={`Atender Turno #${turnoTarget?.id_turno || ""}${nombrePaciente ? ` - ${nombrePaciente}` : ""}`}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="w-full flex flex-col gap-1.5">
              <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Precio Base Calculado (Suma de Prácticas)
              </label>
              <div className="relative flex items-center max-w-xs">
                <span className="absolute left-3.5 text-emerald-700 font-bold text-sm">$</span>
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

          {/* Sección de Prácticas Realizadas */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-[#2eb086]" />
                <h3 className="text-sm font-bold text-gray-800">Prácticas Realizadas y Cobertura</h3>
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
              <p className="text-xs text-gray-400 italic">
                No se han agregado prácticas todavía. Haga clic en &quot;Agregar Práctica&quot; para registrar los procedimientos.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {datosAtencion.practicas.map((practicaItem, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200"
                  >
                    <InputFiltro
                      datos={practicasLista}
                      camposFiltrado={[
                        "codigo_nomenclador",
                        "nombre_nomenclador",
                        "nombre_referencia",
                        "especialidad",
                      ]}
                      formatoVisual={(p) =>
                        `${p.nombre_referencia} ($ ${Number(p.precio_referencia).toLocaleString("es-AR")})`
                      }
                      placeholder="Busca una practica..."
                      alSeleccionar={(p) => actualizarPractica(index, "id_practica", p?.id_practica || "")}
                      valorInicial={practicaItem.id_practica || ""}
                    />

                    <InputFiltro
                      datos={pacientesObrasSociales}
                      camposFiltrado={["nombre"]}
                      formatoVisual={(rel) =>
                        `${rel.ObraSocial?.nombre || `Obra Social #${rel.id_obra_social}`} ${
                          rel.nro_afiliado ? `(Afiliado: ${rel.nro_afiliado})` : ""
                        }`
                      }
                      placeholder="Busca una obra social..."
                      alSeleccionar={(os) =>
                        actualizarPractica(index, "id_obra_social", os?.id_obra_social || "")
                      }
                      valorInicial={practicaItem.id_obra_social || ""}
                    />

                    <button
                      type="button"
                      onClick={() => eliminarPractica(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors self-end sm:self-center cursor-pointer"
                      title="Eliminar práctica"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
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
                actualizarDatos("notas_consulta", e.target.value === "" ? "" : e.target.value)
              }
              placeholder="Detalles sobre la atención, indicaciones médicas..."
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
  );
}

export default ModalAtenderTurno;
