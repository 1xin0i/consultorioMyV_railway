/** @format */

import { useState, useEffect, useCallback } from "react";

/**
 * Hook para controlar la experiencia de instalación A2HS (Add to Home Screen)
 */
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Detectar si ya está en modo standalone
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isStandaloneNavigator = window.navigator.standalone === true;
      setIsInstalled(isStandaloneMedia || isStandaloneNavigator);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    // Detectar iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIOSPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return { outcome: "ios_guide" };
    }

    if (!deferredPrompt) {
      return { outcome: "unavailable" };
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return { outcome };
    } catch (err) {
      console.warn("[PWA] Error al disparar prompt de instalación:", err);
      return { outcome: "error" };
    }
  }, [deferredPrompt, isIOS]);

  const closeIOSPrompt = useCallback(() => {
    setShowIOSPrompt(false);
  }, []);

  return {
    isInstallable: !isInstalled && (Boolean(deferredPrompt) || isIOS),
    isInstalled,
    isIOS,
    showIOSPrompt,
    promptInstall,
    closeIOSPrompt,
  };
};

export default usePWAInstall;
