/** @format */

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "@/shared/components/ui/Modal";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { formatDateInput } from "@/shared/utils";
import { pacientesApi } from "@/features/pacientes";

export function AdvertenciaPacienteIncompleto({
  paciente,
  alActualizarPaciente,
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formDatos, setFormDatos] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    telefono: "",
    fecha_nacimiento: "",
    domicilio: "",
  });

  useEffect(() => {
    if (paciente && modalAbierto) {
      setFormDatos({
        nombre: paciente.nombre || "",
        apellido: paciente.apellido || "",
        dni: paciente.dni || "",
        telefono: paciente.telefono || "",
        fecha_nacimiento: paciente.fecha_nacimiento
          ? formatDateInput(paciente.fecha_nacimiento)
          : "",
        domicilio: paciente.domicilio || "",
      });
    }
  }, [paciente, modalAbierto]);

  if (!paciente) return null;

  const camposFaltantes = [];
  if (!paciente.dni) camposFaltantes.push("DNI");
  if (!paciente.telefono) camposFaltantes.push("Teléfono");
  if (!paciente.fecha_nacimiento) camposFaltantes.push("Fecha de Nacimiento");
  if (!paciente.domicilio) camposFaltantes.push("Domicilio");

  if (camposFaltantes.length === 0) return null;

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormDatos((prev) => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await pacientesApi.actualizar(paciente.id_paciente, {
        nombre: formDatos.nombre.trim(),
        apellido: formDatos.apellido.trim(),
        dni: formDatos.dni?.trim() || null,
        telefono: formDatos.telefono?.trim() || null,
        fecha_nacimiento: formDatos.fecha_nacimiento || null,
        domicilio: formDatos.domicilio?.trim() || null,
        activo: paciente.activo !== undefined ? paciente.activo : true,
      });

      toast.success("Ficha del paciente completada con éxito.");
      setModalAbierto(false);

      if (alActualizarPaciente) {
        alActualizarPaciente();
      }
    } catch (error) {
      console.error("Error al completar el paciente:", error);
      manejarErrorApi(error, "No se pudieron guardar los datos del paciente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalAbierto(true);
        }}
        title={`Faltan datos: ${camposFaltantes.join(", ")}. Haz clic para completar.`}
        className="text-amber-500 hover:text-amber-600 transition-colors p-1 rounded-full hover:bg-amber-50 cursor-pointer flex items-center justify-center shrink-0"
      >
        <AlertCircle size={18} />
      </button>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={guardarCambios}
        title={`Completar Ficha: ${paciente.nombre} ${paciente.apellido}`}
      >
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-amber-600" />
          <span>
            Faltan completar: <strong>{camposFaltantes.join(", ")}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI {!paciente.dni && <span className="text-amber-600">*</span>}
            </label>
            <input
              type="text"
              name="dni"
              value={formDatos.dni}
              onChange={manejarCambio}
              placeholder="Ej: 40123456"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono{" "}
              {!paciente.telefono && <span className="text-amber-600">*</span>}
            </label>
            <input
              type="text"
              name="telefono"
              value={formDatos.telefono}
              onChange={manejarCambio}
              placeholder="Ej: 3511234567"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento{" "}
              {!paciente.fecha_nacimiento && (
                <span className="text-amber-600">*</span>
              )}
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formDatos.fecha_nacimiento}
              onChange={manejarCambio}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio{" "}
              {!paciente.domicilio && <span className="text-amber-600">*</span>}
            </label>
            <input
              type="text"
              name="domicilio"
              value={formDatos.domicilio}
              onChange={manejarCambio}
              placeholder="Ej: Av. Siempre Viva 742"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="border-t border-gray-200 my-2" />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-sm font-medium cursor-pointer"
            >
              {guardando ? "Guardando..." : "Guardar Datos"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
