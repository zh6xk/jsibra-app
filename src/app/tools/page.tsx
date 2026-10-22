"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Cpu,
  Zap,
  FileCode,
  ShieldCheck,
  ChevronLeft,
  Copy,
  Check,
  Sparkles,
  MousePointer,
  Scissors,
  Smartphone,
  Layers,
  FileText
} from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  tagline: string;
  version: string;
  category: string;
  categoryColor: string;
  description: string;
  stats: { label: string; value: string }[];
  features: string[];
  primaryDownloadUrl?: string;
  primaryDownloadLabel?: string;
  githubUrl?: string;
  docsUrl?: string;
  featured?: boolean;
}

const TOOLS_DATA: ToolItem[] = [
  {
    id: "radial-tool",
    name: "Radial Tool Pro",
    tagline: "Native Win32 Context Menu & Workflow Accelerator",
    version: "v1.9",
    category: "Windows Desktop",
    categoryColor: "border-sky-500/30 text-sky-400 bg-sky-500/10",
    description:
      "Aplikasi radial menu ultra-ringan berbasis C++ murni yang dipicu lewat tombol samping mouse (M4/M5). Menggunakan gestur Hold-Aim-Release, multi-layer scrolling, auto-trim memory management, engine konversi gambar, PDF merge, serta PDF split & unmerge langsung di Windows Explorer.",
    stats: [
      { label: "RAM Footprint", value: "~2 MB" },
      { label: "Binary Size", value: "1.1 MB" },
      { label: "CPU at Idle", value: "0.0%" },
      { label: "Tech Stack", value: "Native C++" },
    ],
    features: [
      "Hold-Aim-Release: Tahan tombol mouse, arahkan ke sektor, lepas untuk aksi instan.",
      "Multi-Page Layering: Scroll mouse wheel untuk switch antara Media Tools & Web Launcher.",
      "PDF Split & Unmerge: Pecah PDF gabungan kembali menjadi lembaran gambar JPG murni.",
      "Native Desktop Settings: GUI konfigurasi sektor dan URL custom tersimpan permanen.",
      "Zero Overhead: Window per-pixel alpha transparan tanpa Chromium/Electron.",
    ],
    primaryDownloadUrl: "https://jsibra.me/downloads/RadialTool.exe",
    primaryDownloadLabel: "Download RadialTool.exe (v1.9)",
    githubUrl: "https://github.com/zh6xk/radial-tool",
    docsUrl: "https://jsibra.me/downloads/RADIAL_TOOL_DOSSIER.md",
    featured: true,
  },
  {
    id: "ae-preset-manager",
    name: "AE Preset & Anchor Bridge",
    tagline: "Automated Motion Graphics Automation Suite",
    version: "v2.0",
    category: "Video Editing",
    categoryColor: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    description:
      "Script otomasi Adobe After Effects untuk mempercepat workflow editing video vertikal (Shorts/Reels) dan motion graphics. Memungkinkan snapping anchor point instan 9 titik dan injeksi preset animasi otomatis tanpa mengganggu timeline.",
    stats: [
      { label: "Format", value: "ExtendScript .JSX" },
      { label: "Kompatibilitas", value: "AE 2020+" },
      { label: "Target", value: "Shorts & Reels" },
      { label: "Workflow", value: "Instant Snap" },
    ],
    features: [
      "9-Point Anchor Point snap instan tanpa mengubah posisi visual layer.",
      "Batch application animasi dan keyframe transitions.",
      "Integrasi pipeline EffectCraft untuk transisi presisi frame.",
    ],
    primaryDownloadUrl: "https://jsibra.me/downloads/AE_Preset_Manager.jsx",
    primaryDownloadLabel: "Download Script .JSX",
    featured: false,
  },
  {
    id: "spoti-pw",
    name: "Spoti.pw (Liquid Glass UI)",
    tagline: "Aesthetic Glassmorphism iOS Spotify Interface",
    version: "v0.22.0",
    category: "iOS Sideload",
    categoryColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    description:
      "Modifikasi antarmuka Spotify iOS dengan estetika Liquid Glass tembus pandang yang elegan dan minimalis. Siap dipasang langsung melalui AltStore, SideStore, atau TrollStore tanpa memerlukan jailbreak.",
    stats: [
      { label: "Format", value: "iOS .IPA" },
      { label: "Aesthetic", value: "Liquid Glass" },
      { label: "Jailbreak", value: "No (Rootless)" },
      { label: "Status", value: "Stable" },
    ],
    features: [
      "Full translucent backdrop blur dan dynamic accent lighting.",
      "Minimalist player controls dan clean typography.",
      "Signed package kompatibel dengan iOS 15.0 hingga iOS 18+.",
    ],
    primaryDownloadUrl: "https://jsibra.me/files/spoti.pw-0.22.0.ipa",
    primaryDownloadLabel: "Download IPA Package",
    githubUrl: "https://github.com/zh6xk/spoti.pw",
    featured: false,
  },
  {
    id: "idocker",
    name: "iDocker USB Mirror",
    tagline: "Low-Latency iOS Display & Audio Capture Pipeline",
    version: "v1.1",
    category: "Hardware Interop",
    categoryColor: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    description:
      "Implementasi protokol komunikasi USB tingkat rendah untuk mirroring layar dan transmisi audio lossless dari perangkat iOS ke stasiun kerja Windows. Menghindari delay lag Wi-Fi saat live-monitoring rekaman mobile.",
    stats: [
      { label: "Latency", value: "< 25 ms" },
      { label: "Framerate", value: "60 FPS Native" },
      { label: "Audio", value: "Lossless PCM" },
      { label: "Koneksi", value: "Direct USB" },
    ],
    features: [
      "CoreMedia / Dock Connector USB protocol parsing secara biner.",
      "Zero network latency: tidak membutuhkan hotspot atau router.",
      "Output audio langsung dapat di-route ke OBS Studio / DAW editing.",
    ],
    githubUrl: "https://github.com/zh6xk/idocker",
    featured: false,
  },
];

export default function ToolsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#0a0d14] text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-sky-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0d14]/80 border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke 3D Room</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEMS ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Software & Workflow Arsenal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Tools & Utilitas <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Kreasi Mandiri</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Kumpulan software desktop native, skrip otomasi motion graphics, dan utilitas performa tinggi yang dibangun untuk memangkas hambatan kerja kreatif dan pemrograman sehari-hari.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Arsitektur</div>
            <div className="text-xl font-bold text-white mt-1">Native C++ & JSX</div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Performa Rata-Rata</div>
            <div className="text-xl font-bold text-sky-400 mt-1">0% CPU / &lt;5MB RAM</div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Filosofi</div>
            <div className="text-xl font-bold text-white mt-1">Production-First</div>
          </div>
          <div className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Ketersediaan</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">100% Free & Open</div>
          </div>
        </div>

        {/* Tools Showcase Grid */}
        <div className="mt-12 space-y-8">
          {TOOLS_DATA.map((tool) => (
            <div
              key={tool.id}
              className={`relative rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                tool.featured
                  ? "bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-sky-500/40 shadow-[0_0_50px_rgba(14,165,233,0.12)]"
                  : "bg-slate-900/50 border border-white/10 hover:border-white/20"
              }`}
            >
              {tool.featured && (
                <div className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  <span>Flagship Project</span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left Info Column */}
                <div className="space-y-4 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tool.categoryColor}`}>
                      {tool.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/10 text-slate-300">
                      {tool.version}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {tool.name}
                    </h2>
                    <p className="text-sky-300 text-sm font-medium mt-1">{tool.tagline}</p>
                  </div>

                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Fitur & Karakteristik Utama:
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {tool.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Action & Stats Column */}
                <div className="lg:w-80 shrink-0 flex flex-col justify-between gap-6 lg:border-l lg:border-white/10 lg:pl-6">
                  {/* Performance Specs Card */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-2xl p-3 border border-white/5">
                    {tool.stats.map((st, idx) => (
                      <div key={idx} className="p-2">
                        <div className="text-[10px] uppercase font-mono text-slate-400">{st.label}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{st.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Buttons Action Suite */}
                  <div className="space-y-2.5">
                    {tool.primaryDownloadUrl && (
                      <a
                        href={tool.primaryDownloadUrl}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/25 active:scale-[0.98] cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{tool.primaryDownloadLabel || "Download"}</span>
                      </a>
                    )}

                    <div className="flex gap-2">
                      {tool.githubUrl && (
                        <a
                          href={tool.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>GitHub</span>
                        </a>
                      )}

                      {tool.docsUrl && (
                        <a
                          href={tool.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </a>
                      )}

                      {tool.primaryDownloadUrl && (
                        <button
                          onClick={() => handleCopyLink(tool.primaryDownloadUrl!, tool.id)}
                          title="Salin tautan download langsung"
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === tool.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8 px-6 text-center text-xs text-slate-400">
        <p>© 2026 Ariefansyah Hayanibran Farawowan (Ibra). Hosted on Azure VM jsibra.me.</p>
        <p className="mt-1 text-slate-400">All tools built native & production-focused.</p>
      </footer>
    </div>
  );
}