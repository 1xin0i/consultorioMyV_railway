/** @format */

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/shared/components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

export function ModalCambiarPassword({ isOpen, onClose }) {
  const { cambiarPassword } = useAuth();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const resetear = () => {
    setPasswordActual("");
    setPasswordNueva("");
    setConfirmarPassword("");
    setVerActual(false);
    setVerNueva(false);
    setVerConfirmar(false);
  };

  const handleClose = () => {
    if (enviando) return;
    resetear();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      toast.error("Completá todos los campos.");
      return;
    }

    if (passwordNueva.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      toast.error("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await cambiarPassword(passwordActual, passwordNueva, confirmarPassword);
      toast.success("Contraseña actualizada correctamente.");
      resetear();
      onClose?.();
    } catch (error) {
      manejarErrorApi(error, "No se pudo actualizar la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Cambiar contraseña"
      width="max-w-md"
    >
      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-slate-600">
        <div className="w-8 h-8 rounded-lg bg-[#2eb086]/15 text-[#2eb086] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <p className="leading-relaxed">
          Ingresá tu contraseña actual y elegí una nueva clave de al menos{" "}
          <span className="font-semibold text-slate-800">6 caracteres</span>.
        </p>
      </div>

      {/* Contraseña actual */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Contraseña actual
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <KeyRound size={16} />
          </span>
          <input
            type={verActual ? "text" : "password"}
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={enviando}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerActual((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            {verActual ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Nueva contraseña */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Nueva contraseña
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <KeyRound size={16} />
          </span>
          <input
            type={verNueva ? "text" : "password"}
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            disabled={enviando}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerNueva((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            {verNueva ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirmar nueva contraseña */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Confirmar nueva contraseña
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <KeyRound size={16} />
          </span>
          <input
            type={verConfirmar ? "text" : "password"}
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            placeholder="Repetí la nueva contraseña"
            autoComplete="new-password"
            disabled={enviando}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerConfirmar((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            {verConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-1">
        <button
          type="button"
          onClick={handleClose}
          disabled={enviando}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2eb086] hover:bg-[#259670] shadow-sm shadow-[#2eb086]/25 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
        >
          {enviando ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Actualizar contraseña</span>
          )}
        </button>
      </div>
    </Modal>
  );
}

export default ModalCambiarPassword;

