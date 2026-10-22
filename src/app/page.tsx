"use client";

import React from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";

export default function Home() {
  return (
    <main className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#1c1511]">
      <iframe 
        src="/room/index.html" 
        className="w-full h-full border-none outline-none block"
        title="3D Room Portfolio"
      />

      {/* Floating Tools Quick Access Badge */}
      <Link
        href="/tools"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-white/20 hover:border-sky-400/50 backdrop-blur-xl text-slate-200 hover:text-white shadow-[0_4px_25px_rgba(0,0,0,0.6)] transition-all hover:scale-105 active:scale-95 group"
      >
        <span className="w-2 h-2 rounded-full bg-sky-400 group-hover:animate-ping" />
        <Wrench className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-semibold tracking-wide">Software & Tools</span>
      </Link>
    </main>
  );
}