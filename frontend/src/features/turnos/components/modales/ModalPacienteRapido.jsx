/** @format */

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/shared/components/ui/Modal";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { pacientesApi } from "@/features/pacientes";

const ESTADO_INICIAL_PACIENTE_RAPIDO = {
  nombre: "",
  apellido: "",
  telefono: "",
  dni: "",
  fecha_nacimiento: "",
  domicilio: "",
};

export function ModalPacienteRapido({
  isOpen,
  onClose,
  setPacientes,
  onPacienteCreado,
}) {
  const [datos, setDatos] = useState(ESTADO_INICIAL_PACIENTE_RAPIDO);

  if (!isOpen) return null;

  const actualizarCampo = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPacienteRapido = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await pacientesApi.crear({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        telefono: datos.telefono.trim(),
        dni: datos.dni?.trim() || null,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        domicilio: datos.domicilio?.trim() || null,
      });

      const nuevoPaciente = respuesta.data.data || respuesta.data;
      const nuevoId = nuevoPaciente.id_paciente;

      if (setPacientes) {
        setPacientes((prev) => {
          const existe = prev.some((p) => p.id_paciente === nuevoId);
          return existe ? prev : [...prev, nuevoPaciente];
        });
      }

      onPacienteCreado?.(nuevoId);

      toast.success("Paciente creado correctamente");
      setDatos(ESTADO_INICIAL_PACIENTE_RAPIDO);
      onClose();
    } catch (error) {
      console.error("Error al crear paciente rápido:", error);
      manejarErrorApi(error, "No se pudo crear el paciente.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={guardarPacienteRapido}
      width="max-w-md"
      title="Crear Paciente Rápido"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Nombre <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            value={datos.nombre}
            onChange={actualizarCampo}
            required
            placeholder="Ej. Martín"
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Apellido <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="apellido"
            value={datos.apellido}
            onChange={actualizarCampo}
            required
            placeholder="Ej. Gómez"
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Teléfono <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            name="telefono"
            value={datos.telefono}
            onChange={actualizarCampo}
            required
            placeholder="Ej. 3514567890"
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            DNI (Opcional)
          </label>
          <input
            type="text"
            name="dni"
            value={datos.dni}
            onChange={actualizarCampo}
            placeholder="Ej. 38450123"
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Fecha de Nacimiento (Opcional)
          </label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={datos.fecha_nacimiento}
            onChange={actualizarCampo}
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Domicilio (Opcional)
          </label>
          <input
            type="text"
            name="domicilio"
            value={datos.domicilio}
            onChange={actualizarCampo}
            placeholder="Ej. Av. Colón 1234"
            className="w-full border border-gray-300 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb086]/50 focus:border-[#2eb086]"
          />
        </div>

        <div className="border-t border-gray-100 pt-3 mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#2eb086] hover:bg-[#259370] transition-all shadow-sm cursor-pointer"
          >
            Guardar Paciente
          </button>
        </div>
      </div>
    </Modal>
  );
}

