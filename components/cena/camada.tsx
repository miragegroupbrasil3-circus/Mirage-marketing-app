"use client";

import dynamic from "next/dynamic";

const Glitter = dynamic(() => import("./glitter"), { ssr: false });

export function CamadaCena() {
  return (
    <>
      <div className="holofotes" aria-hidden="true" />
      <Glitter />
    </>
  );
}
