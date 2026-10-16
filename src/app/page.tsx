"use client";

import React from "react";

export default function Home() {
  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#1c1511]">
      <iframe 
        src="/room/index.html" 
        className="w-full h-full border-none outline-none block"
        title="3D Room Portfolio"
      />
    </main>
  );
}
