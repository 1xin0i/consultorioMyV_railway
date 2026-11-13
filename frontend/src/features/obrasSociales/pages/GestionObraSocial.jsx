/** @format */

import {
  Building2,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Power,
} from "lucide-react";
import toast from "react-hot-toast";

import Tabla from "@/shared/components/ui/Tabla/Tabla";
import TablaHeader from "@/shared/components/ui/Tabla/TablaHeader";
import TablaPaginacion from "@/shared/components/ui/Tabla/TablaPaginacion";
import TarjetaRegistro from "@/shared/components/ui/Tabla/TarjetaRegistro";
import PageLayout from "@/shared/components/layout/PageLayout";
import { usePaginationSearch } from "@/shared/hooks/usePaginationSearch";
import { useCRUDModal } from "@/shared/hooks/useCRUDModal";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

import { FormularioCrearEditar } from "../components/FormularioObraSocial";
import { formatearObraSocialParaEditar } from "../utils/formatearObraSocialParaEditar";
import { useObraSocialActions } from "../hooks/useObraSocialActions";
import obrasSocialesApi from "../services/obrasSociales.api";

const COLUMNAS_TABLA = [
  { etiqueta: "ID", campo: "id_obra_social", ordenable: true },
  { etiqueta: "Obra Social", campo: "nombre", ordenable: true },
  { etiqueta: "Estado", campo: "activo", ordenable: false, centrado: true },
  { etiqueta: "Acciones", campo: null, ordenable: false, centrado: true },
];

const ESTADO_INICIAL_OBRA_SOCIAL = {
  nombre: "",
  activo: true,
};

export function GestionObraSocial() {
  const {
    datos: obrasSociales,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
  } = usePaginationSearch("/obras-sociales", {
    ordenPorDefecto: "id_obra_social",
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

  return (
    <PageLayout
      icono={<Building2 size={24} />}
      titulo="Obras Sociales"
      subtitulo="Catálogo de coberturas médicas y mutuales con las que opera el consultorio."
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
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col">
        <TablaHeader
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          placeholder="Buscar por nombre de la obra social..."
        >
          <div className="flex bg-teal-50/70 p-1 rounded-xl border border-teal-100 w-full sm:w-auto">
            {[
              { id: "true", label: "Activas" },
              { id: "false", label: "Inactivas" },
              { id: "", label: "Todas" },
            ].map((tab) => {
              const activo = (filtros?.activo ?? "true") === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => actualizarFiltro("activo", tab.id)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activo
                      ? "bg-[#0d8266] text-white shadow-2xs"
                      : "text-teal-800/70 hover:text-teal-950"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </TablaHeader>

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
                <>
                  <button
                    onClick={() =>
                      abrirParaEditar(os, formatearObraSocialParaEditar)
                    }
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar obra social"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => toggleEstadoRapido(os)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      os.activo
                        ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={os.activo ? "Desactivar" : "Reactivar"}
                  >
                    <Power size={16} />
                  </button>
                </>
              }
            />
          )}
          renderFila={(os) => (
            <tr
              key={os.id_obra_social}
              className={`hover:bg-teal-50/40 transition-colors ${
                !os.activo ? "bg-slate-50/60 opacity-75" : ""
              }`}
            >
              <td className="px-5 py-3.5 text-teal-800/70 font-mono text-xs font-bold">
                #{os.id_obra_social}
              </td>

              <td className="px-5 py-3.5 font-bold text-slate-900">
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

              <td className="px-5 py-3.5 text-center">
                <div className="flex justify-center items-center gap-1">
                  <button
                    onClick={() =>
                      abrirParaEditar(os, formatearObraSocialParaEditar)
                    }
                    className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar obra social"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => toggleEstadoRapido(os)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      os.activo
                        ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={
                      os.activo
                        ? "Desactivar obra social"
                        : "Reactivar obra social"
                    }
                  >
                    <Power size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />

        <TablaPaginacion {...propsPaginacion} />
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
    </PageLayout>
  );
}

export default GestionObraSocial;

