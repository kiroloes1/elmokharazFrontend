import React, { useEffect, useState } from "react";
import { Download, ChevronLeft, X } from "lucide-react";

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // هل التطبيق متثبت بالفعل؟
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsInstalled(standalone);

    // Chrome / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();

      setDeferredPrompt(e);

      // إظهار النافذة
      setShowInstall(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    // لو التطبيق اتثبت
    window.addEventListener("appinstalled", () => {
      setShowInstall(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    console.log("Install result:", outcome);

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (isInstalled || !showInstall) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[#3b3b3d] text-white shadow-2xl">

        {/* Header */}
        <div className="relative px-6 py-7 text-center">
          <button
            onClick={() => setShowInstall(false)}
            className="absolute left-4 top-4 rounded-full p-2 text-gray-300 hover:bg-white/10"
          >
            <X size={22} />
          </button>

          <h2 className="text-2xl font-normal">
            تثبيت وإنشاء اختصار
          </h2>
        </div>

        {/* Install */}
        <button
          onClick={handleInstall}
          className="flex w-full items-center gap-4 border-t border-white/10 bg-[#333335] px-6 py-5 text-right transition hover:bg-[#444446]"
        >
          <div className="flex-1">
            <div className="text-xl font-normal">
              تثبيت التطبيق
            </div>

            <div className="mt-1 text-sm text-gray-300">
              تثبيت التطبيق على الجهاز
            </div>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-black">
            <Download size={28} />
          </div>

          <ChevronLeft size={30} className="text-white" />
        </button>

        {/* Shortcut */}
        <div className="flex w-full items-center gap-4 border-t border-white/10 bg-[#333335] px-6 py-5 text-right">
          <div className="flex-1">
            <div className="text-xl font-normal">
              إنشاء اختصار
            </div>

            <div className="mt-1 text-sm text-gray-300">
              يتم فتح الاختصارات في متصفح Chrome
            </div>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-black">
            🔗
          </div>

          <ChevronLeft size={30} className="text-white" />
        </div>

      </div>
    </div>
  );
};

export default InstallApp;