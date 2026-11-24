/** @format */

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, X, KeyRound, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authApi from "../services/auth.api";

export function RecuperarPinModal({
  isOpen,
  onClose,
  onSuccess,
  usuarioActual,
}) {
  const { usuario: usuarioAuth } = useAuth();
  const [paso, setPaso] = useState(1); // 1: Validar Contraseña, 2: Nuevo PIN
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados para el paso 2
  const [nuevoPin, setNuevoPin] = useState("");
  const [confirmarPin, setConfirmarPin] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const emailUsuario =
    usuarioAuth?.email ||
    usuarioActual ||
    localStorage.getItem("usuario_email") ||
    "";

  if (!isOpen) return null;

  const handleCerrar = () => {
    setPaso(1);
    setPassword("");
    setNuevoPin("");
    setConfirmarPin("");
    setError("");
    setExito(false);
    onClose?.();
  };

  // Paso 1: Validar Contraseña Maestra
  const handleVerificarPassword = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await authApi.verificarPassword({
        contraseña: password,
        password: password,
      });
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Contraseña incorrecta.");
    } finally {
      setCargando(false);
    }
  };

  // Paso 2: Guardar Nuevo PIN
  const handleGuardarPin = async (e) => {
    e.preventDefault();
    setError("");

    if (nuevoPin.length !== 4 || !/^\d{4}$/.test(nuevoPin)) {
      setError("El PIN debe contener exactamente 4 dígitos numéricos.");
      return;
    }
    if (nuevoPin !== confirmarPin) {
      setError("Los códigos PIN no coinciden.");
      return;
    }

    setCargando(true);
    try {
      await authApi.recuperarPin({
        contraseña: password,
        nuevo_pin: nuevoPin,
      });

      setExito(true);
      setTimeout(() => {
        onSuccess?.(nuevoPin);
        handleCerrar();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al actualizar el PIN.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100">
        {/* Botón Cerrar (X) */}
        <button
          type="button"
          onClick={handleCerrar}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            {paso === 1 ? "Cambiar PIN" : "Nuevo PIN"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {paso === 1
              ? "Ingresá tu contraseña de cuenta para continuar"
              : "Definí tu nuevo código de 4 dígitos para desbloqueo rápido"}
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-red-600 dark:text-rose-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Notificación de Éxito */}
        {exito && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ¡PIN actualizado con éxito!
          </div>
        )}

        {/* PASO 1: VALIDACIÓN DE CONTRASEÑA */}
        {paso === 1 && (
          <form onSubmit={handleVerificarPassword} className="space-y-4">
            {emailUsuario && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    Email de la Cuenta
                  </label>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Equipo Registrado
                  </span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={emailUsuario}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-400 font-medium cursor-not-allowed select-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Contraseña de Cuenta
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña de cuenta"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] dark:focus:ring-[#5c8b8e]/60 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || !password}
              className="w-full mt-2 py-3 rounded-xl bg-[#5c8b8e] hover:bg-[#4d7578] dark:bg-[#4d7578] dark:hover:bg-[#3d5e61] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {cargando ? "Verificando..." : "Continuar"}
            </button>
          </form>
        )}

        {/* PASO 2: INGRESO DE NUEVO PIN */}
        {paso === 2 && !exito && (
          <form onSubmit={handleGuardarPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Nuevo PIN (4 dígitos)
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={nuevoPin}
                  onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] dark:focus:ring-[#5c8b8e]/60 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Confirmar Nuevo PIN
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmarPin}
                  onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 tracking-widest text-center text-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-800 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5c8b8e] dark:focus:ring-[#5c8b8e]/60 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando || nuevoPin.length !== 4 || confirmarPin.length !== 4}
              className="w-full mt-2 py-3 rounded-xl bg-[#5c8b8e] hover:bg-[#4d7578] dark:bg-[#4d7578] dark:hover:bg-[#3d5e61] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {cargando ? "Guardando..." : "Guardar nuevo PIN"}
            </button>
          </form>
        )}

        {/* Botón Cancelar */}
        <button
          type="button"
          onClick={handleCerrar}
          className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 pt-3 transition-colors block cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default RecuperarPinModal;
