/** @format */

import { useState } from "react";
import {
  Stethoscope,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Power,
  Ban,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import Tabla from "@/shared/components/ui/Tabla/Tabla";
import { BarraFiltros } from "@/shared/components/layout/BarraFiltro";
import TablaPaginacion from "@/shared/components/ui/Tabla/TablaPaginacion";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import PageLayout from "@/shared/components/layout/PageLayout";
import { usePaginationSearch } from "@/shared/hooks/usePaginationSearch";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import ModalConfirmarEliminarPermanente from "@/shared/components/ui/ModalConfirmarEliminarPermanente";

import { FormularioCrearEditar } from "../components/FormulariosPractica";
import { formatearPracticaParaEditar } from "../utils/formatearPracticaParaEditar";
import {
  COLUMNAS_TABLA,
  ESTADO_INICIAL_PRACTICA,
} from "../constants/practicaConstants";
import { usePracticasActions } from "../hooks/usePracticasActions";
import practicasApi from "../services/practicas.api";

const TABS_ESTADO_PRACTICAS = [
  {
    id: "",
    label: "Todas",
    dot: null,
    activeClass:
      "bg-white text-slate-900 dark:bg-white dark:text-slate-900 shadow-xs",
  },
  {
    id: "true",
    label: "Activas",
    dot: "bg-emerald-500",
    activeClass:
      "bg-[#e8f7f0] text-emerald-900 border border-emerald-300/80 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 shadow-2xs",
  },
  {
    id: "false",
    label: "Inactivas",
    dot: "bg-rose-500",
    activeClass:
      "bg-[#fff1f2] text-rose-900 border border-rose-300/80 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 shadow-2xs",
  },
];

export function GestionPracticas() {
  const {
    datos: practicas,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
  } = usePaginationSearch("/practicas", {
    ordenPorDefecto: "codigo_nomenclador",
    filtrosIniciales: { activo: "true" },
  });

  const {
    modalCrearEditar,
    editando,
    itemSeleccionado: practicaSeleccionada,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_PRACTICA);

  const { guardarPractica } = usePracticasActions(recargar, cerrarModal);

  const [practicaAEliminar, setPracticaAEliminar] = useState(null);
  const [eliminandoPermanente, setEliminandoPermanente] = useState(false);

  const toggleEstadoRapido = async (practica) => {
    try {
      await practicasApi.cambiarEstado(practica.id_practica);
      toast.success(
        practica.activo ? "Práctica desactivada" : "Práctica reactivada",
      );
      recargar();
    } catch (error) {
      manejarErrorApi(error, "No se pudo actualizar el estado.");
    }
  };

  const confirmarEliminacionPermanente = async () => {
    if (!practicaAEliminar) return;
    setEliminandoPermanente(true);
    try {
      await practicasApi.eliminarPermanente(practicaAEliminar.id_practica);
      toast.success("Práctica eliminada permanentemente");
      setPracticaAEliminar(null);
      recargar();
    } catch (error) {
      manejarErrorApi(error, "No se pudo eliminar la práctica.");
    } finally {
      setEliminandoPermanente(false);
    }
  };

  return (
    <PageLayout
      icono={<Stethoscope size={24} />}
      titulo="Gestión de Prácticas"
      subtitulo="Catálogo de prestaciones, nomenclador y aranceles de referencia del consultorio."
      onNuevo={() => abrirParaCrear()}
      accionesHeader={
        <button
          onClick={() => abrirParaCrear()}
          className="w-full sm:w-auto bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
        >
          <Plus size={18} />
          <span>Nueva Práctica</span>
        </button>
      }
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Barra de filtros y búsqueda */}
        <BarraFiltros
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          placeholder="Buscar por código, nombre o especialidad..."
          className="mb-0"
        >
          <div className="flex items-center bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/90 dark:border-slate-700 p-1 rounded-2xl overflow-x-auto shadow-2xs">
            {TABS_ESTADO_PRACTICAS.map((tab) => {
              const activo =
                String(filtros?.activo ?? "true") === String(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    actualizarFiltro("activo", tab.id);
                    actualizarFiltro("estadoFiltrado", tab.id);
                    propsPaginacion.irAPagina?.(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 select-none ${
                    activo
                      ? tab.activeClass
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {tab.dot && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`}
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </BarraFiltros>

        {/* Card exclusivo de la tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col">
          <Tabla
            columnas={COLUMNAS_TABLA}
            datos={practicas}
            cargando={cargando}
            ordenarPor={propsPaginacion.ordenarPor}
            direccion={propsPaginacion.direccion}
            manejarOrden={propsPaginacion.manejarOrden}
            mensajeVacio="No se encontraron prácticas registradas."
            renderTarjeta={(practica) => (
              <TarjetaRegistro
                key={practica.id_practica}
                inactivo={!practica.activo}
                titulo={practica.nombre_referencia}
                subtitulo={practica.nombre_nomenclador}
                badge={
                  <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                    {practica.codigo_nomenclador}
                  </span>
                }
                campos={[
                  {
                    etiqueta: "Especialidad",
                    valor: practica.especialidad || "General",
                  },
                  {
                    etiqueta: "Precio Ref.",
                    valor: `$ ${Number(practica.precio_referencia || 0).toLocaleString("es-AR")}`,
                  },
                ]}
                acciones={
                  practica.activo ? (
                    <>
                      <button
                        onClick={() =>
                          abrirParaEditar(practica, formatearPracticaParaEditar)
                        }
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Editar práctica"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => toggleEstadoRapido(practica)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Desactivar práctica"
                      >
                        <Ban size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleEstadoRapido(practica)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Reactivar práctica"
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => setPracticaAEliminar(practica)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Borrar permanentemente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )
                }
              />
            )}
            renderFila={(practica) => (
              <tr
                key={practica.id_practica}
                className={`hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  !practica.activo ? "bg-slate-50/60 opacity-75" : ""
                }`}
              >
                <td className="pl-7 sm:pl-8 pr-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                  <span className="bg-teal-50/80 border border-teal-200/80 px-2 py-0.5 rounded-md text-teal-900">
                    {practica.codigo_nomenclador}
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <div className="font-bold text-slate-900">
                    {practica.nombre_referencia}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {practica.nombre_nomenclador}
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/70">
                    {practica.especialidad || "General"}
                  </span>
                </td>

                <td className="px-5 py-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                  ${" "}
                  {Number(practica.precio_referencia || 0).toLocaleString(
                    "es-AR",
                  )}
                </td>

                <td className="px-5 py-3.5 text-center">
                  {practica.activo ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                      <CheckCircle2 size={13} />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">
                      <XCircle size={13} />
                      Inactiva
                    </span>
                  )}
                </td>

                <td className="pl-4 pr-7 sm:pr-8 py-3.5 text-center">
                  <div className="flex justify-center items-center gap-1">
                    {practica.activo ? (
                      <>
                        <button
                          onClick={() =>
                            abrirParaEditar(
                              practica,
                              formatearPracticaParaEditar,
                            )
                          }
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Editar práctica"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleEstadoRapido(practica)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Desactivar práctica"
                        >
                          <Ban size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleEstadoRapido(practica)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Reactivar práctica"
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => setPracticaAEliminar(practica)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Borrar permanentemente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />

          <TablaPaginacion {...propsPaginacion} />
        </div>
      </div>

      <FormularioCrearEditar
        modalAbierto={modalCrearEditar}
        cerrarModal={cerrarModal}
        editando={editando}
        datosFormulario={datosFormulario}
        actualizarDatos={actualizarDatos}
        guardarPractica={(e) => {
          e.preventDefault();
          guardarPractica(datosFormulario, editando, practicaSeleccionada);
        }}
      />

      <ModalConfirmarEliminarPermanente
        isOpen={Boolean(practicaAEliminar)}
        onClose={() => setPracticaAEliminar(null)}
        onConfirm={confirmarEliminacionPermanente}
        titulo="¿Eliminar práctica permanentemente?"
        nombreRegistro={
          practicaAEliminar?.nombre_referencia ||
          practicaAEliminar?.nombre_nomenclador
        }
        cargando={eliminandoPermanente}
      />
    </PageLayout>
  );
}

export default GestionPracticas;
