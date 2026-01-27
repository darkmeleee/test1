"use client";

import { useContext } from "react";
import { ToastContext } from "~/components/Toast";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op toast function when context is not available (SSR)
    return {
      showToast: () => {},
    };
  }
  return context;
}
