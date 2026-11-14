/** @format */

import { useState } from "react";
import Modal from "@/shared/components/ui/Modal";
import InputFiltro from "@/shared/components/ui/InputFiltro";
import { AlertTriangle, Plus, Tag } from "lucide-react";
import gastosApi from "../services/gastos.api";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

const LABEL_CLASS =
  "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";
const INPUT_CLASS =
  "w-full border border-teal-100 bg-slate-50/60 p-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-2xs";

export function FormularioCrearEditar({
  modalAbierto,
  cerrarModal,
  editando,
  categorias = [],
  setCategorias,
  datosFormulario,
  actualizarDatos,
  guardarGasto,
}) {
  const [modalCatAbierto, setModalCatAbierto] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: "",
    descripcion: "",
  });

  const handleCrearCategoriaRapida = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.nombre.trim()) {
      toast.error("El nombre de la categoría es obligatorio.");
      return;
    }

    try {
      const res = await gastosApi.crearCategoria({
        nombre: nuevaCategoria.nombre.trim(),
        descripcion: nuevaCategoria.descripcion.trim() || null,
      });

      const creada = res.data.data || res.data;
      if (setCategorias) {
        setCategorias((prev) => [...prev, creada]);
      }

      actualizarDatos({
        target: { name: "id_categoria", value: creada.id_categoria },
      });

      toast.success("Categoría creada correctamente");
      setNuevaCategoria({ nombre: "", descripcion: "" });
      setModalCatAbierto(false);
    } catch (error) {
      manejarErrorApi(error, "No se pudo crear la categoría.");
    }
  };

  return (
    <>
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarGasto}
        width="max-w-lg"
        title={editando ? "Editar Egreso" : "Registrar Nuevo Egreso"}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL_CLASS}>Categoría de Egreso *</label>
                <button
                  type="button"
                  onClick={() => setModalCatAbierto(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0d8266] hover:text-[#09664f] bg-teal-50 hover:bg-teal-100/80 border border-teal-200/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Nueva Categoría</span>
                </button>
              </div>
              <InputFiltro
                datos={categorias}
                camposFiltrado={["nombre", "descripcion"]}
                formatoVisual={(cat) => cat.nombre}
                placeholder="Buscar o seleccionar categoría..."
                alSeleccionar={(cat) => {
                  const val = cat?.id_categoria_gasto || cat?.id_categoria || "";
                  actualizarDatos({
                    target: {
                      name: "id_categoria",
                      value: val,
                    },
                  });
                  actualizarDatos({
                    target: {
                      name: "id_categoria_gasto",
                      value: val,
                    },
                  });
                }}
                valorInicial={
                  datosFormulario?.id_categoria_gasto ||
                  datosFormulario?.id_categoria ||
                  ""
                }
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Monto ($) *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-rose-700 font-extrabold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="monto"
                  required
                  placeholder="0.00"
                  value={datosFormulario?.monto || ""}
                  onChange={actualizarDatos}
                  className="w-full pl-8 pr-3 py-2.5 border border-rose-200 bg-rose-50/40 rounded-xl text-sm font-extrabold text-rose-950 focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Fecha del Egreso *</label>
              <input
                type="date"
                name="fecha_gasto"
                required
                value={datosFormulario?.fecha_gasto || ""}
                onChange={actualizarDatos}
                className={INPUT_CLASS}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={LABEL_CLASS}>Detalle / Concepto</label>
              <textarea
                name="detalle"
                rows={3}
                placeholder="Ej. Compra de insumos descartables, pago de servicio..."
                value={datosFormulario?.detalle ?? datosFormulario?.concepto ?? ""}
                onChange={(e) => {
                  actualizarDatos({
                    target: { name: "detalle", value: e.target.value },
                  });
                  actualizarDatos({
                    target: { name: "concepto", value: e.target.value },
                  });
                }}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-teal-100 my-4" />

        <div className="flex justify-end items-center gap-2.5">
          <button
            type="button"
            onClick={cerrarModal}
            className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] font-bold text-xs transition-all shadow-sm shadow-teal-900/20 cursor-pointer"
          >
            {editando ? "Guardar Cambios" : "Registrar Egreso"}
          </button>
        </div>
      </Modal>

      {modalCatAbierto && (
        <Modal
          isOpen={modalCatAbierto}
          onClose={() => setModalCatAbierto(false)}
          onSubmit={handleCrearCategoriaRapida}
          width="max-w-md"
          title="Nueva Categoría de Egreso"
        >
          <div className="flex flex-col gap-3.5">
            <div>
              <label className={LABEL_CLASS}>Nombre de la Categoría *</label>
              <div className="relative flex items-center">
                <Tag
                  size={15}
                  className="absolute left-3.5 text-teal-600/70 pointer-events-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Ej. Insumos Odontológicos, Servicios, Limpieza..."
                  value={nuevaCategoria.nombre}
                  onChange={(e) =>
                    setNuevaCategoria((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="w-full pl-9.5 pr-3 py-2.5 border border-teal-100 bg-slate-50/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Descripción (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Breve descripción..."
                value={nuevaCategoria.descripcion}
                onChange={(e) =>
                  setNuevaCategoria((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                className={INPUT_CLASS}
              />
            </div>

            <div className="border-t border-teal-100 pt-3 mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalCatAbierto(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#0d8266] hover:bg-[#09664f] transition-all shadow-sm cursor-pointer"
              >
                Guardar Categoría
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function FormularioEliminar({
  modalEliminar,
  cerrarModal,
  gastoSeleccionado,
  ejecutarEliminacion,
}) {
  return (
    <Modal
      isOpen={modalEliminar}
      onClose={cerrarModal}
      width="max-w-md"
      title="Eliminar Egreso"
      variant="danger"
    >
      <div className="bg-gradient-to-br from-rose-50/80 to-rose-100/30 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
          <AlertTriangle size={20} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-bold text-slate-900">
            ¿Estás seguro de eliminar este egreso?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Se eliminará el registro de{" "}
            <strong className="text-slate-900 font-bold">
              {gastoSeleccionado?.CategoriaGasto?.nombre || "Egreso"}
            </strong>{" "}
            por un monto de{" "}
            <span className="inline-flex px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-extrabold">
              $ {Number(gastoSeleccionado?.monto || 0).toLocaleString("es-AR")}
            </span>
            .
          </p>
        </div>
      </div>

      <div className="border-t border-rose-100 my-4" />

      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={cerrarModal}
          className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={ejecutarEliminacion}
          className="px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold text-xs transition-colors shadow-sm shadow-rose-500/30 cursor-pointer"
        >
          Sí, Eliminar
        </button>
      </div>
    </Modal>
  );
}
