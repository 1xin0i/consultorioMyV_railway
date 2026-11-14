/** @format */

import { useState } from "react";
import {
  Building2,
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

import { FormularioCrearEditar } from "../components/FormularioObraSocial";
import { formatearObraSocialParaEditar } from "../utils/formatearObraSocialParaEditar";
import { useObraSocialActions } from "../hooks/useObraSocialActions";
import obrasSocialesApi from "../services/obrasSociales.api";

const COLUMNAS_TABLA = [
  { etiqueta: "Obra Social", campo: "nombre", ordenable: true },
  { etiqueta: "Estado", campo: "activo", ordenable: false, centrado: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

const ESTADO_INICIAL_OBRA_SOCIAL = {
  nombre: "",
  activo: true,
};

const TABS_ESTADO_OBRAS_SOCIALES = [
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

export function GestionObraSocial() {
  const {
    datos: obrasSociales,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
  } = usePaginationSearch("/obras-sociales", {
    ordenPorDefecto: "nombre",
    filtrosIniciales: { activo: "true" },
  });

  const {
    modalCrearEditar,
    editando,
    itemSeleccionado: obraSocialSeleccionada,
    datosFormulario,
    abrirParaCrear,
    abrirParaEditar,
    cerrarModal,
    actualizarDatos,
  } = useCRUDModal(ESTADO_INICIAL_OBRA_SOCIAL);

  const { guardarObraSocial } = useObraSocialActions(recargar, cerrarModal);

  const [obraSocialAEliminar, setObraSocialAEliminar] = useState(null);
  const [eliminandoPermanente, setEliminandoPermanente] = useState(false);

  const toggleEstadoRapido = async (os) => {
    try {
      await obrasSocialesApi.cambiarEstado(os.id_obra_social, !os.activo);
      toast.success(
        os.activo ? "Obra social desactivada" : "Obra social reactivada",
      );
      recargar();
    } catch (error) {
      manejarErrorApi(error, "No se pudo actualizar el estado.");
    }
  };

  const confirmarEliminacionPermanente = async () => {
    if (!obraSocialAEliminar) return;
    setEliminandoPermanente(true);
    try {
      await obrasSocialesApi.eliminarPermanente(
        obraSocialAEliminar.id_obra_social,
      );
      toast.success("Obra social eliminada permanentemente");
      setObraSocialAEliminar(null);
      recargar();
    } catch (error) {
      manejarErrorApi(error, "No se pudo eliminar la obra social.");
    } finally {
      setEliminandoPermanente(false);
    }
  };

  return (
    <PageLayout
      icono={<Building2 size={24} />}
      titulo="Gestión de Obras Sociales"
      subtitulo="Catálogo de coberturas médicas y mutuales con las que opera el consultorio."
      onNuevo={() => abrirParaCrear()}
      accionesHeader={
        <button
          onClick={() => abrirParaCrear()}
          className="w-full sm:w-auto bg-[#0d8266] hover:bg-[#09664f] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-xs sm:text-sm cursor-pointer active:scale-95"
        >
          <Plus size={18} />
          <span>Nueva Obra Social</span>
        </button>
      }
    >
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Barra de filtros y búsqueda */}
        <BarraFiltros
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          placeholder="Buscar por nombre de la obra social..."
          className="mb-0"
        >
          <div className="flex items-center bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/90 dark:border-slate-700 p-1 rounded-2xl overflow-x-auto shadow-2xs">
            {TABS_ESTADO_OBRAS_SOCIALES.map((tab) => {
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
            datos={obrasSociales}
            cargando={cargando}
            ordenarPor={propsPaginacion.ordenarPor}
            direccion={propsPaginacion.direccion}
            manejarOrden={propsPaginacion.manejarOrden}
            mensajeVacio="No se encontraron obras sociales registradas."
            renderTarjeta={(os) => (
              <TarjetaRegistro
                key={os.id_obra_social}
                inactivo={!os.activo}
                titulo={os.nombre}
                subtitulo={`ID #${os.id_obra_social}`}
                badge={
                  os.activo ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 size={11} /> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <XCircle size={11} /> Inactiva
                    </span>
                  )
                }
                acciones={
                  os.activo ? (
                    <>
                      <button
                        onClick={() =>
                          abrirParaEditar(os, formatearObraSocialParaEditar)
                        }
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Editar obra social"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => toggleEstadoRapido(os)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Desactivar obra social"
                      >
                        <Ban size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleEstadoRapido(os)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Reactivar obra social"
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => setObraSocialAEliminar(os)}
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
            renderFila={(os) => (
              <tr
                key={os.id_obra_social}
                className={`hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  !os.activo ? "bg-slate-50/60 opacity-75" : ""
                }`}
              >
                <td className="pl-7 sm:pl-8 pr-4 py-3.5 font-bold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={16} className="text-[#0d8266] shrink-0" />
                    <span>{os.nombre}</span>
                  </div>
                </td>

                <td className="px-5 py-3.5 text-center">
                  {os.activo ? (
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
                    {os.activo ? (
                      <>
                        <button
                          onClick={() =>
                            abrirParaEditar(os, formatearObraSocialParaEditar)
                          }
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Editar obra social"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => toggleEstadoRapido(os)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Desactivar obra social"
                        >
                          <Ban size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleEstadoRapido(os)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Reactivar obra social"
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => setObraSocialAEliminar(os)}
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
        guardarObraSocial={(e) => {
          e.preventDefault();
          guardarObraSocial(datosFormulario, editando, obraSocialSeleccionada);
        }}
      />

      <ModalConfirmarEliminarPermanente
        isOpen={Boolean(obraSocialAEliminar)}
        onClose={() => setObraSocialAEliminar(null)}
        onConfirm={confirmarEliminacionPermanente}
        titulo="¿Eliminar obra social permanentemente?"
        nombreRegistro={obraSocialAEliminar?.nombre}
        cargando={eliminandoPermanente}
      />
    </PageLayout>
  );
}

export default GestionObraSocial;
