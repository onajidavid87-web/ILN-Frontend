"use client";

import { Toaster } from "sonner";
import { TOAST_AUTO_DISMISS_MS, TOAST_MAX_VISIBLE, TOAST_POSITION } from "@/lib/toast-config";

export default function AppToaster() {
  return (
    <Toaster
      position={TOAST_POSITION}
      visibleToasts={TOAST_MAX_VISIBLE}
      duration={TOAST_AUTO_DISMISS_MS}
      closeButton
      richColors
      expand={false}
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
