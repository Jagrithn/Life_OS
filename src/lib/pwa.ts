import { useEffect, useState } from "react";

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    /* service worker unavailable (private mode, older browser) */
  });
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [pending, setPending] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBefore(e: Event) {
      e.preventDefault();
      setPending(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPending(null);
    }
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!pending) return;
    await pending.prompt();
    await pending.userChoice;
    setPending(null);
  };

  return { canInstall: pending !== null, install };
}
