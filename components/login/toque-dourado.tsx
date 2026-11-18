"use client";

import dynamic from "next/dynamic";
import { Component, useSyncExternalStore, type ReactNode } from "react";

const Cena = dynamic(() => import("./cena-dourada"), { ssr: false });

class Silencio extends Component<{ children: ReactNode }, { quieto: boolean }> {
  state = { quieto: false };

  static getDerivedStateFromError() {
    return { quieto: true };
  }

  render() {
    if (this.state.quieto) return null;
    return this.props.children;
  }
}

function aparelhoFraco() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const poucaMemoria = nav.deviceMemory !== undefined && nav.deviceMemory <= 2;
  const poucosNucleos = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;
  return poucaMemoria || poucosNucleos || Boolean(nav.connection?.saveData);
}

function cenaPermitida() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !aparelhoFraco();
}

export function ToqueDourado() {
  const mostrar = useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    cenaPermitida,
    () => false,
  );

  if (!mostrar) return null;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Silencio>
        <Cena />
      </Silencio>
    </div>
  );
}
