/** @format */

import { useState, useEffect } from "react";
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/shared/components/ui/Modal";
import authApi from "../services/auth.api";
import { manejarErrorApi } from "@/shared/utils/errorHandler";

export function RecuperarPasswordModal({ isOpen, onClose, emailInicial = "" }) {
  const [paso, setPaso] = useState(1); // 1: pedir código, 2: ingresar código + nueva clave
  const [email, setEmail] = useState(emailInicial);
  const [codigo, setCodigo] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isOpen && emailInicial) {
      setEmail(emailInicial);
    }
  }, [isOpen, emailInicial]);

  const resetear = () => {
    setPaso(1);
    setCodigo("");
    setPasswordNueva("");
    setConfirmarPassword("");
    setVerNueva(false);
    setVerConfirmar(false);
  };

  const handleClose = () => {
    if (enviando) return;
    resetear();
    onClose?.();
  };

  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresá tu correo electrónico.");
      return;
    }

    setEnviando(true);
    try {
      const res = await authApi.recuperarPassword({
        email: email.trim(),
      });
      toast.success(
        res.data?.message ||
          "Si el correo está registrado, enviamos un código de 6 dígitos.",
      );
      setPaso(2);
    } catch (error) {
      manejarErrorApi(
        error,
        "No se pudo enviar el correo de recuperación. Verificá la configuración SMTP.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const handleRestablecer = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || codigo.trim().length !== 6) {
      toast.error("Ingresá el código de 6 dígitos que recibiste por correo.");
      return;
    }
    if (!passwordNueva || passwordNueva.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passwordNueva !== confirmarPassword) {
      toast.error("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const res = await authApi.restablecerPassword({
        email: email.trim(),
        codigo: codigo.trim(),
        passwordNueva,
        confirmarPassword,
      });
      toast.success(
        res.data?.message ||
          "Contraseña restablecida con éxito. Ya podés iniciar sesión.",
      );
      resetear();
      onClose?.();
    } catch (error) {
      manejarErrorApi(error, "No se pudo restablecer la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={paso === 1 ? handleSolicitarCodigo : handleRestablecer}
      title={
        paso === 1
          ? "Recuperar contraseña"
          : "Ingresar código de verificación"
      }
      width="max-w-md"
    >
      {paso === 1 ? (
        <>
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70 text-xs text-slate-600">
            <div className="w-8 h-8 rounded-lg bg-[#2eb086]/15 text-[#0d8266] flex items-center justify-center shrink-0 mt-0.5">
              <Mail size={17} />
            </div>
            <p className="leading-relaxed">
              Ingresá el correo electrónico de tu cuenta y te enviaremos un{" "}
              <span className="font-semibold text-slate-800">
                código de 6 dígitos
              </span>{" "}
              válido por 15 minutos para restablecer tu contraseña.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Correo electrónico registrado
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@consultoriomyv.com"
                autoComplete="email"
                disabled={enviando}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={() => setPaso(2)}
              disabled={enviando || !email.trim()}
              className="text-xs font-semibold text-[#0d8266] hover:underline disabled:opacity-40 cursor-pointer"
            >
              Ya tengo un código
            </button>

            <div className="flex items-center gap-2">
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
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar código</span>
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-slate-700">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert size={17} />
            </div>
            <p className="leading-relaxed">
              Revisá la bandeja de entrada de{" "}
              <span className="font-bold text-slate-900">{email}</span> e
              ingresá el código de 6 dígitos junto con tu nueva contraseña.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Código de 6 dígitos
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <KeyRound size={16} />
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) =>
                  setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                disabled={enviando}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-base font-bold tracking-[0.35em] text-slate-900 placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock size={16} />
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock size={16} />
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

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              onClick={() => setPaso(1)}
              disabled={enviando}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Cambiar correo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={enviando}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Guardar contraseña</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

export default RecuperarPasswordModal;
