"use client";

import { useEffect } from "react";

export default function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    };

    apply();

    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) {
        apply();
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
