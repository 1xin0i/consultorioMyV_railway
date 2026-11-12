/** @format */

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import api from "../../../services/api";

export default function RecuperarPasswordModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1); // 1: Pedir usuario o correo, 2: Ingresar código y nueva contraseña, 3: Éxito
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const inputIdentificadorRef = useRef(null);
  const inputCodigoRef = useRef(null);
  const identificadorInputId = useId();
  const codigoInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  useEffect(() => {
    return () => {
      setPaso(1);
      setIdentificador("");
      setCodigo("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setError("");
      setCargando(false);
    };
  }, []);

  const handleClose = useCallback(() => {
    setPaso(1);
    setIdentificador("");
    setCodigo("");
    setNuevaPassword("");
    setConfirmarPassword("");
    setError("");
    setCargando(false);
    onClose?.();
  }, [onClose]);

  // Cierre con Escape y autofoco dinámico
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      if (paso === 1 && inputIdentificadorRef.current) {
        inputIdentificadorRef.current.focus();
      }
      if (paso === 2 && inputCodigoRef.current) {
        inputCodigoRef.current.focus();
      }
    }, 150);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, paso, handleClose]);

  if (!isOpen) return null;

  // Paso 1: Enviar solicitud de código (por usuario o correo electrónico)
  const handleSolicitarCodigo = async (e) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError("");

    const identLimpio = identificador.trim();
    if (!identLimpio) {
      setError("Por favor, ingresá tu usuario o correo electrónico.");
      return;
    }

    setCargando(true);

    try {
      await api.post("/auth/recuperar-password", {
        identificador: identLimpio,
        email: identLimpio,
      });
      setPaso(2);
      setError("");
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Error al solicitar recuperación. Intentá nuevamente.";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Restablecer contraseña con código de 6 dígitos
  const handleRestablecerPassword = async (e) => {
    if (e) e.preventDefault();
    if (cargando) return;
    setError("");

    if (codigo.length !== 6) {
      setError("El código debe tener exactamente 6 dígitos numéricos.");
      return;
    }

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
        "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.",
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const res = await api.post("/auth/restablecer-password", {
        codigo,
        nueva_contraseña: nuevaPassword,
      });

      // Limpiar ambos tokens de sesión (Access Token + Refresh Token)
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("usuario");

      const msgExito =
        res.data?.mensaje ||
        "Contraseña actualizada exitosamente. Iniciá sesión con tus nuevas credenciales.";

      if (onSuccess) {
        onSuccess(msgExito);
        handleClose();
        navigate("/login", { replace: true });
      } else {
        setPaso(3);
        setError("");
      }
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Código inválido o expirado. Verificá los 6 dígitos.";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado */}
        <header className="p-6 pb-4 relative border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-emerald-950/60 border border-teal-100 dark:border-emerald-800/60 flex items-center justify-center text-[#2eb086] shrink-0">
              {paso === 2 ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {paso === 2 ? "Código de Verificación" : "Recuperar Contraseña"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {paso === 2
                  ? "Ingresá el PIN de 6 dígitos recibido por correo"
                  : "Ingresá tu usuario o correo para recibir las instrucciones"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </header>

        {paso === 3 ? (
          /* Estado Éxito: Contraseña restablecida */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in duration-200">
              <CheckCircle2 size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ¡Contraseña Restablecida!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                Tu clave de acceso ha sido actualizada con éxito. Ya podés
                iniciar sesión con tus nuevas credenciales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSuccess?.(
                  "Contraseña actualizada exitosamente. Iniciá sesión con tus nuevas credenciales.",
                );
                handleClose();
                navigate("/login", { replace: true });
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2eb086] hover:bg-[#259370] active:scale-98 transition-all shadow-sm cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : paso === 2 ? (
          /* Paso 2: Ingresar PIN de 6 dígitos y nueva contraseña */
          <form
            onSubmit={handleRestablecerPassword}
            autoComplete="off"
            className="p-6 space-y-4"
          >
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-emerald-950/40 border border-teal-100 dark:border-emerald-800/60 text-teal-800 dark:text-emerald-300 text-xs font-medium leading-relaxed">
              Si los datos de <strong>{identificador}</strong> coinciden con una
              cuenta registrada, enviamos un código de 6 dígitos al correo
              asociado (válido por 15 minutos).
            </div>

            {/* Código de 6 dígitos */}
            <div className="space-y-1.5">
              <label
                htmlFor={codigoInputId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 text-center"
              >
                Código de 6 Dígitos
              </label>
              <div className="relative">
                <input
                  ref={inputCodigoRef}
                  id={codigoInputId}
                  name="codigo_recuperacion"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={codigo}
                  disabled={cargando}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCodigo(clean);
                    setError("");
                  }}
                  placeholder="000000"
                  className="w-full text-center font-mono text-2xl tracking-[0.25em] font-bold py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#0f766e] dark:text-emerald-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor={passwordInputId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Nueva Contraseña (mín. 8 caracteres, mayúscula, número y símbolo)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id={passwordInputId}
                  type={showPassword ? "text" : "password"}
                  value={nuevaPassword}
                  disabled={cargando}
                  onChange={(e) => {
                    setNuevaPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Ej: MiClave2026!"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor={confirmPasswordInputId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Confirmar Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  id={confirmPasswordInputId}
                  type={showPassword ? "text" : "password"}
                  value={confirmarPassword}
                  disabled={cargando}
                  onChange={(e) => {
                    setConfirmarPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Repetí la contraseña"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                cargando ||
                codigo.length !== 6 ||
                !nuevaPassword ||
                !confirmarPassword
              }
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2eb086] hover:bg-[#259370] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Restableciendo...</span>
                </>
              ) : (
                <span>Restablecer contraseña</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaso(1);
                setCodigo("");
                setNuevaPassword("");
                setConfirmarPassword("");
                setError("");
              }}
              disabled={cargando}
              className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer transition-colors pt-1"
            >
              ← Volver o ingresar otro usuario / correo
            </button>
          </form>
        ) : (
          /* Paso 1: Pedir Usuario o Correo Electrónico */
          <form
            onSubmit={handleSolicitarCodigo}
            autoComplete="off"
            className="p-6 space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor={identificadorInputId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Usuario o Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
                  <User size={16} />
                </span>
                <input
                  ref={inputIdentificadorRef}
                  id={identificadorInputId}
                  name="identificador_recovery_prevent_autofill"
                  type="text"
                  value={identificador}
                  disabled={cargando}
                  onChange={(e) => {
                    setIdentificador(e.target.value);
                    setError("");
                  }}
                  placeholder="Ej: admin o correo@ejemplo.com"
                  autoComplete="off"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base md:text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2eb086]/30 focus:border-[#2eb086] transition-all ${
                    cargando
                      ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
                      : ""
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || !identificador.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#2eb086] hover:bg-[#259370] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {cargando ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Enviar instrucciones</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={cargando}
              className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer transition-colors pt-1"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
