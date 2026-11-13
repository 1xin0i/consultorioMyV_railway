/** @format */

import toast from "react-hot-toast";

export const manejarErrorApi = (
  error,
  mensajePorDefecto = "Ocurrió un error al procesar la solicitud.",
) => {
  let mensajeMostrar = mensajePorDefecto;

  if (error.response && error.response.data) {
    const data = error.response.data;

    // 1. Si el backend devuelve un array de errores (ej: express-validator o zod)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      mensajeMostrar = data.errors[0].msg || data.errors[0].message || data.errors[0];
    }
    // 2. Si el backend devuelve el mensaje en la propiedad 'error' o 'message' o 'mensaje'
    else if (typeof data.error === "string") {
      mensajeMostrar = data.error;
    } else if (typeof data.message === "string") {
      mensajeMostrar = data.message;
    } else if (typeof data.mensaje === "string") {
      mensajeMostrar = data.mensaje;
    }
    // 3. Si devuelve directamente un string plano
    else if (typeof data === "string") {
      mensajeMostrar = data;
    }
  } else if (error.request) {
    // La petición fue hecha pero no se recibió respuesta (ej: servidor caído)
    mensajeMostrar = "No se pudo conectar con el servidor. Verifica tu conexión.";
  }

  toast.error(mensajeMostrar);
};

