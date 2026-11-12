/** @format */
import { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function ModalCambiarPassword() {
  const {
    usuario,
    modalPasswordAbierto,
    cerrarModalPassword,
    cambiarPassword,
  } = useAuth();

  const [email, setEmail] = useState(usuario?.email || "");
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (modalPasswordAbierto) {
      setEmail(usuario?.email || "");
    }
  }, [modalPasswordAbierto, usuario?.email]);

  if (!modalPasswordAbierto) return null;

  const limpiarYSalir = () => {
    setPasswordActual("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setError("");
    setCargando(false);
    cerrarModalPassword();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordActual) {
      setError("Por favor, ingresá tu contraseña actual para confirmar los cambios.");
      return;
    }

    const emailLimpio = email.trim();
    if (emailLimpio && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setError("Por favor, ingresá un formato de correo electrónico válido.");
      return;
    }

    const cambioEmail = emailLimpio !== (usuario?.email || "");
    const cambioPassword = Boolean(nuevaPassword);

    if (!cambioEmail && !cambioPassword) {
      setError(
        "Ingresá una nueva contraseña o modificá tu correo de recuperación.",
      );
      return;
    }

    if (cambioPassword) {
      if (nuevaPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (
        !/[A-Z]/.test(nuevaPassword) ||
        !/[a-z]/.test(nuevaPassword) ||
        !/[0-9]/.test(nuevaPassword) ||
        !/[^A-Za-z0-9]/.test(nuevaPassword)
      ) {
        setError(
          "La nueva contraseña debe incluir mayúscula, minúscula, número y carácter especial.",
        );
        return;
      }

      if (nuevaPassword !== confirmarPassword) {
        setError("Las nuevas contraseñas no coinciden.");
        return;
      }
    }

    setCargando(true);
    try {
      const res = await cambiarPassword(
        passwordActual,
        nuevaPassword,
        emailLimpio,
      );
      toast.success(
        res?.mensaje || "¡Datos de cuenta actualizados exitosamente!",
      );
      limpiarYSalir();
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "No se pudieron actualizar los datos. Verificá tu contraseña actual.";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      isOpen={modalPasswordAbierto}
      onClose={limpiarYSalir}
      title="Credenciales y Correo de Recuperación"
      width="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
        <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 rounded-xl text-teal-800 dark:text-teal-300 text-xs font-medium">
          <KeyRound size={16} className="text-[#2eb086] shrink-0" />
          <span>
            Configurá tu correo opcional de recuperación o actualizá tu clave
            de acceso.
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs font-medium animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Correo Electrónico Opcional */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
            Correo Electrónico de Recuperación{" "}
            <span className="text-gray-400 dark:text-slate-400 font-normal">
              (opcional)
            </span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 dark:text-slate-500">
              <Mail size={15} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={cargando}
              placeholder="ejemplo@consultoriomyv.com"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
            />
          </div>
        </div>

        {/* Contraseña Actual */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
            Contraseña Actual{" "}
            <span className="text-rose-500 font-extrabold">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 dark:text-slate-500">
              <Lock size={15} />
            </span>
            <input
              type={showActual ? "text" : "password"}
              value={passwordActual}
              onChange={(e) => {
                setPasswordActual(e.target.value);
                setError("");
              }}
              disabled={cargando}
              required
              placeholder="Ingresá tu clave actual para confirmar"
              className="w-full pl-9 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
            />
            <button
              type="button"
              onClick={() => setShowActual(!showActual)}
              className="absolute right-3 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              {showActual ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Nueva Contraseña */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
            Nueva Contraseña{" "}
            <span className="text-gray-400 dark:text-slate-400 font-normal">
              (mín. 8 caracteres, mayúscula, número y símbolo)
            </span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-400 dark:text-slate-500">
              <Lock size={15} />
            </span>
            <input
              type={showNueva ? "text" : "password"}
              value={nuevaPassword}
              onChange={(e) => {
                setNuevaPassword(e.target.value);
                setError("");
              }}
              disabled={cargando}
              placeholder="Dejá en blanco si solo actualizás el correo"
              className="w-full pl-9 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
            />
            <button
              type="button"
              onClick={() => setShowNueva(!showNueva)}
              className="absolute right-3 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              {showNueva ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirmar Nueva Contraseña */}
        {nuevaPassword && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
              Confirmar Nueva Contraseña{" "}
              <span className="text-rose-500 font-extrabold">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400 dark:text-slate-500">
                <Lock size={15} />
              </span>
              <input
                type={showConfirmar ? "text" : "password"}
                value={confirmarPassword}
                onChange={(e) => {
                  setConfirmarPassword(e.target.value);
                  setError("");
                }}
                disabled={cargando}
                required={Boolean(nuevaPassword)}
                placeholder="Repetí la nueva clave"
                className="w-full pl-9 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/40 focus:border-[#2eb086]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={limpiarYSalir}
            disabled={cargando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2eb086] hover:bg-[#259370] shadow-sm transition-colors cursor-pointer"
          >
            {cargando ? (
              <Loader2 size={15} className="animate-spin text-white" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            <span>{cargando ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
