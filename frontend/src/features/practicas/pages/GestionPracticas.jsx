/** @format */

import {
  Stethoscope,
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

import { FormularioCrearEditar } from "../components/FormulariosPractica";
import { formatearPracticaParaEditar } from "../utils/formatearPracticaParaEditar";
import {
  COLUMNAS_TABLA,
  ESTADO_INICIAL_PRACTICA,
} from "../constants/practicaConstants";
import { usePracticasActions } from "../hooks/usePracticasActions";
import practicasApi from "../services/practicas.api";

export function GestionPracticas() {
  const {
    datos: practicas,
    cargando,
    recargar,
    propsPaginacion,
    filtros,
    actualizarFiltro,
  } = usePaginationSearch("/practicas", {
    ordenPorDefecto: "id_practica",
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

  return (
    <PageLayout
      icono={<Stethoscope size={24} />}
      titulo="Prácticas Odontológicas"
      subtitulo="Catálogo de prestaciones, nomenclador y aranceles de referencia del consultorio."
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
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col">
        <TablaHeader
          busqueda={propsPaginacion.busqueda}
          setBusqueda={propsPaginacion.setBusqueda}
          placeholder="Buscar por código, nombre o especialidad..."
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
                <>
                  <button
                    onClick={() =>
                      abrirParaEditar(practica, formatearPracticaParaEditar)
                    }
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar práctica"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => toggleEstadoRapido(practica)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      practica.activo
                        ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={practica.activo ? "Desactivar" : "Reactivar"}
                  >
                    <Power size={16} />
                  </button>
                </>
              }
            />
          )}
          renderFila={(practica) => (
            <tr
              key={practica.id_practica}
              className={`hover:bg-teal-50/40 transition-colors ${
                !practica.activo ? "bg-slate-50/60 opacity-75" : ""
              }`}
            >
              <td className="px-5 py-3.5 text-teal-800/70 font-mono text-xs font-bold">
                #{practica.id_practica}
              </td>

              <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
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
                {Number(practica.precio_referencia || 0).toLocaleString("es-AR")}
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

              <td className="px-5 py-3.5 text-center">
                <div className="flex justify-center items-center gap-1">
                  <button
                    onClick={() =>
                      abrirParaEditar(practica, formatearPracticaParaEditar)
                    }
                    className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                    title="Editar práctica"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => toggleEstadoRapido(practica)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      practica.activo
                        ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={
                      practica.activo
                        ? "Desactivar práctica"
                        : "Reactivar práctica"
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
        guardarPractica={(e) => {
          e.preventDefault();
          guardarPractica(datosFormulario, editando, practicaSeleccionada);
        }}
      />
    </PageLayout>
  );
}

export default GestionPracticas;

