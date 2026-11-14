/** @format */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { manejarErrorApi } from "@/shared/utils/errorHandler";
import { ESTADO_INICIAL_PACIENTE } from "../constants/pacienteConstants";
import { useObrasSocialesCatalogo } from "../hooks/useObrasSocialesCatalogo";
import pacientesApi from "../services/pacientes.api";
import { FormularioCrearEditar } from "./FormulariosPaciente";

export function ModalCrearPaciente({
  isOpen,
  onClose,
  setPacientes,
  onPacienteCreado,
  desdeTurno = false,
}) {
  const [datosFormulario, setDatosFormulario] = useState(
    ESTADO_INICIAL_PACIENTE,
  );
  const [, setGuardando] = useState(false);
  const { obrasSocialesCatalogo } = useObrasSocialesCatalogo();

  useEffect(() => {
    if (isOpen) {
      setDatosFormulario(ESTADO_INICIAL_PACIENTE);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actualizarDatos = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const agregarObraSocial = () => {
    setDatosFormulario((prev) => ({
      ...prev,
      obras_sociales: [
        ...(prev.obras_sociales || []),
        { id_obra_social: "", nro_afiliado: "" },
      ],
    }));
  };

  const actualizarObraSocial = (index, campo, valor) => {
    setDatosFormulario((prev) => {
      const nuevasOS = [...(prev.obras_sociales || [])];
      nuevasOS[index][campo] = valor;
      return { ...prev, obras_sociales: nuevasOS };
    });
  };

  const eliminarObraSocial = (index) => {
    setDatosFormulario((prev) => ({
      ...prev,
      obras_sociales: (prev.obras_sociales || []).filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const guardarPaciente = async (e) => {
    e.preventDefault();

    if (!datosFormulario.nombre?.trim() || !datosFormulario.apellido?.trim()) {
      toast.error("El nombre y el apellido son obligatorios.");
      return;
    }

    if (!datosFormulario.telefono?.trim()) {
      toast.error("El teléfono es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const payloadPaciente = {
        nombre: datosFormulario.nombre.trim(),
        apellido: datosFormulario.apellido.trim(),
        telefono: datosFormulario.telefono.trim(),
        dni: datosFormulario.dni?.trim() || null,
        fecha_nacimiento: datosFormulario.fecha_nacimiento || null,
        domicilio: datosFormulario.domicilio?.trim() || null,
        activo: true,
      };

      const res = await pacientesApi.crear(payloadPaciente);
      const nuevoPaciente = res.data.data || res.data;
      const nuevoId = nuevoPaciente.id_paciente;

      // Guardar obras sociales si se agregaron
      const listaOS = datosFormulario.obras_sociales || [];
      const obrasCreadas = [];
      for (const os of listaOS) {
        if (!os.id_obra_social) continue;
        const resRel = await pacientesApi.crearRelacionObraSocial({
          id_paciente: Number(nuevoId),
          id_obra_social: Number(os.id_obra_social),
          nro_afiliado: os.nro_afiliado?.trim() || "S/N",
        });
        const relData = resRel.data?.data || resRel.data || {};
        const catOS = obrasSocialesCatalogo?.find(
          (c) => Number(c.id_obra_social) === Number(os.id_obra_social),
        );
        obrasCreadas.push({
          ...relData,
          id_relacion: relData.id_paciente_obra_social,
          id_paciente_obra_social: relData.id_paciente_obra_social,
          id_obra_social: Number(os.id_obra_social),
          nombre: catOS?.nombre || "Obra Social",
          nro_afiliado: os.nro_afiliado?.trim() || "S/N",
          ObraSocial: catOS || {
            id_obra_social: Number(os.id_obra_social),
            nombre: "Obra Social",
          },
        });
      }

      const pacienteCompleto = {
        ...nuevoPaciente,
        PacienteObraSocials: obrasCreadas,
        ObraSocials: obrasCreadas,
        PacientesPorObrasSociales: obrasCreadas,
        obras_sociales: obrasCreadas,
      };

      if (setPacientes) {
        setPacientes((prev) => {
          const existe = prev.some((p) => p.id_paciente === nuevoId);
          return existe ? prev : [...prev, pacienteCompleto];
        });
      }

      onPacienteCreado?.(pacienteCompleto);
      toast.success("Paciente registrado correctamente");
      onClose();
    } catch (error) {
      console.error("Error al registrar paciente:", error);
      manejarErrorApi(error, "No se pudo registrar el paciente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <FormularioCrearEditar
      modalAbierto={isOpen}
      cerrarModal={onClose}
      editando={false}
      obrasSocialesCatalogo={obrasSocialesCatalogo}
      datosFormulario={datosFormulario}
      actualizarDatos={actualizarDatos}
      agregarObraSocial={agregarObraSocial}
      actualizarObraSocial={actualizarObraSocial}
      eliminarObraSocial={eliminarObraSocial}
      guardarPaciente={guardarPaciente}
      desdeTurno={desdeTurno}
    />
  );
}

export default ModalCrearPaciente;
