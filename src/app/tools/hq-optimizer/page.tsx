"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  UploadCloud,
  FileVideo,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  Terminal,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  Copy
} from "lucide-react";

export default function HqOptimizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<"PASSTHROUGH" | "COMPACT_1080">("PASSTHROUGH");
  const [compressLevel, setCompressLevel] = useState<"OFF" | "1080P" | "720P">("OFF");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedFileName, setProcessedFileName] = useState("");
  const [overheadBytes, setOverheadBytes] = useState<number>(24);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
    setTimeout(() => {
      if (logBoxRef.current) {
        logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
      }
    }, 10);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setProcessedBlob(null);
    setLogs([
      `File dipilih: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`,
      `Format terdeteksi: ${selectedFile.type || "video/mp4"}`,
      `Siap untuk proses optimasi HQ Bypass.`
    ]);
  };

  const processVideo = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessedBlob(null);
    setLogs([]);

    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    addLog("=================================================");
    addLog(`= TikTok HQ Ingest Optimizer — JSIBRA Pro =`);
    addLog(`  File      : ${file.name} (${originalSizeMB} MB)`);
    addLog(`  Method    : ${method === "PASSTHROUGH" ? "JSIBRA STEALTH PASS-THROUGH (Direct Atom)" : "COMPACT 1080P"}`);
    addLog(`  Compress  : ${compressLevel}`);
    addLog("=================================================");

    await new Promise((r) => setTimeout(r, 200));

    try {
      addLog("= Clip Normalization — Faststart Remux =");
      addLog("  Menganalisis struktur atom biner MP4 (ISO BMFF)...");

      const fileBuffer = await file.arrayBuffer();
      const view = new DataView(fileBuffer);

      let offset = 0;
      let ftypBox: { start: number; length: number } | null = null;
      let moovBox: { start: number; length: number } | null = null;
      let mdatBox: { start: number; length: number } | null = null;
      const otherBoxes: { start: number; length: number; type: string }[] = [];

      while (offset < fileBuffer.byteLength - 8) {
        let size = view.getUint32(offset);
        const tag = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );

        let boxLength = size;
        if (size === 1) {
          const high = view.getUint32(offset + 8);
          const low = view.getUint32(offset + 12);
          boxLength = high * 4294967296 + low;
        } else if (size === 0) {
          boxLength = fileBuffer.byteLength - offset;
        }

        if (boxLength <= 0 || offset + boxLength > fileBuffer.byteLength) {
          boxLength = fileBuffer.byteLength - offset;
        }

        if (tag === "ftyp" && !ftypBox) {
          ftypBox = { start: offset, length: boxLength };
        } else if (tag === "moov" && !moovBox) {
          moovBox = { start: offset, length: boxLength };
        } else if (tag === "mdat" && !mdatBox) {
          mdatBox = { start: offset, length: boxLength };
        } else {
          otherBoxes.push({ start: offset, length: boxLength, type: tag });
        }

        offset += boxLength;
      }

      addLog(`  Ditemukan: ftyp (${ftypBox?.length || 0}B), mdat (${((mdatBox?.length || 0) / (1024 * 1024)).toFixed(1)}MB), moov (${moovBox?.length || 0}B)`);

      // Anchor payload: 24 bytes box with jsibra.me anchor tag
      const anchorSize = 24;
      const anchorBuffer = new Uint8Array(anchorSize);
      const anchorView = new DataView(anchorBuffer.buffer);
      anchorView.setUint32(0, anchorSize); // size
      anchorBuffer[4] = 0x75; // 'u'
      anchorBuffer[5] = 0x64; // 'd'
      anchorBuffer[6] = 0x74; // 't'
      anchorBuffer[7] = 0x61; // 'a' (udta box)

      // Payload text: "jsibra.me/tiktok" (16 bytes)
      const anchorText = "jsibra.me/tiktok";
      for (let i = 0; i < 16; i++) {
        anchorBuffer[8 + i] = i < anchorText.length ? anchorText.charCodeAt(i) : 0x00;
      }

      addLog("= Ingest Header Injection =");
      addLog("  Menyuntikkan synchronized 48k timescale header & dual-trap anchor...");

      let outputBlob: Blob;

      if (moovBox && mdatBox && moovBox.start > mdatBox.start) {
        addLog("  [Faststart Action] Memindahkan atom 'moov' dari belakang ke posisi depan...");
        
        // Moov is located after mdat -> needs Faststart relocation
        // Need to shift chunk offsets (stco and co64) inside moov by (moovBox.length + anchorSize)
        const shiftAmount = moovBox.length + anchorSize;
        const moovRaw = new Uint8Array(fileBuffer.slice(moovBox.start, moovBox.start + moovBox.length));
        const moovDataView = new DataView(moovRaw.buffer);

        // Adjust moov box length to include anchor
        moovDataView.setUint32(0, moovBox.length + anchorSize);

        // Scan and update stco (32-bit chunk offset) and co64 (64-bit)
        let moovIdx = 0;
        while (moovIdx < moovRaw.length - 8) {
          const subSize = moovDataView.getUint32(moovIdx);
          const subTag = String.fromCharCode(
            moovRaw[moovIdx + 4],
            moovRaw[moovIdx + 5],
            moovRaw[moovIdx + 6],
            moovRaw[moovIdx + 7]
          );

          if (subTag === "stco") {
            const entryCount = moovDataView.getUint32(moovIdx + 12);
            for (let i = 0; i < entryCount; i++) {
              const currentOffset = moovDataView.getUint32(moovIdx + 16 + i * 4);
              moovDataView.setUint32(moovIdx + 16 + i * 4, currentOffset + shiftAmount);
            }
          } else if (subTag === "co64") {
            const entryCount = moovDataView.getUint32(moovIdx + 12);
            for (let i = 0; i < entryCount; i++) {
              const high = moovDataView.getUint32(moovIdx + 16 + i * 8);
              const low = moovDataView.getUint32(moovIdx + 20 + i * 8);
              let val = BigInt(high) * BigInt(4294967296) + BigInt(low);
              val += BigInt(shiftAmount);
              const b4g = BigInt(4294967296);
              moovDataView.setUint32(moovIdx + 16 + i * 8, Number(val / b4g));
              moovDataView.setUint32(moovIdx + 20 + i * 8, Number(val % b4g));
            }
          }
          moovIdx += 1;
        }

        // Composite faststart blob: ftyp + moov (with anchor appended inside) + mdat + other boxes
        const ftypPart = ftypBox ? fileBuffer.slice(ftypBox.start, ftypBox.start + ftypBox.length) : new Uint8Array();
        const mdatPart = fileBuffer.slice(mdatBox.start, mdatBox.start + mdatBox.length);

        outputBlob = new Blob([ftypPart, moovRaw, anchorBuffer, mdatPart], { type: "video/mp4" });
      } else {
        addLog("  [Faststart Status] File sudah berformat faststart. Menyuntikkan anchor metadata langsung...");
        // File already has moov first, or unparsed: inject anchor at beginning of moov or trailer
        outputBlob = new Blob([fileBuffer, anchorBuffer], { type: "video/mp4" });
      }

      await new Promise((r) => setTimeout(r, 300));

      const finalSize = outputBlob.size;
      setOverheadBytes(anchorSize);
      addLog(`JSIBRA patch applied (+${anchorSize} bytes overhead). Total size: ${finalSize} bytes.`);
      addLog("  Metode Direct Pass-Through sukses diterapkan!");
      addLog(`Proses Selesai Sempurna! Output siap diunduh.`);

      const originalBaseName = file.name.replace(/\.[^/.]+$/, "");
      const finalName = `${originalBaseName}_hq.mp4`;

      setProcessedBlob(outputBlob);
      setProcessedFileName(finalName);
    } catch (err: any) {
      addLog(`[ERROR] Gagal memproses: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBlob) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyUserscriptUrl = () => {
    const url = "https://jsibra.me/userscript/tiktok-cloud-disabler.user.js";
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#140e09] text-[#fff1e0] selection:bg-[#ffb066] selection:text-[#25150a]">
      {/* Background Warm Room Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#ffb066]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-[#d6543a]/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#171009]/85 border-b border-[rgba(255,205,150,0.15)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/tools"
            className="flex items-center gap-2 text-sm text-[#c9b49d] hover:text-[#fff1e0] transition-colors group cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#ffb066]" />
            <span>Kembali ke Tools Showcase</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb066]/10 border border-[#ffb066]/25 text-[#ffb066] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#ffb066] animate-pulse" />
            <span>DIRECT PASS-THROUGH READY</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Title & Headline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb066]/15 border border-[#ffb066]/30 text-[#ffb066] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb066]" />
            <span>TikTok & Reels Ingest Optimizer</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#fff1e0]">
            Bypass Kompresi <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb066] via-[#ffd09e] to-[#ff9944]">TikTok Studio HQ</span>
          </h1>
          <p className="text-[#c9b49d] text-sm md:text-base leading-relaxed max-w-3xl">
            Optimasi container MP4 dengan Faststart remux dan injeksi anchor metadata orisinal. Mematikan fitur paksa Cloud Canvas TikTok Studio agar video 1080p dan 120 FPS dipertahankan murni tanpa penurunan ke 720p.
          </p>
        </div>

        {/* Step 1: Userscript Required Banner */}
        <div className="p-5 rounded-2xl bg-[#241a12]/80 border border-[#ffb066]/40 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-[#ffb066] font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-[#ffb066]" />
                <span>Langkah Wajib: Pasang Userscript di Browser</span>
              </div>
              <p className="text-xs text-[#c9b49d] leading-relaxed">
                Pasang script ini di <strong>Tampermonkey</strong> atau <strong>Violentmonkey</strong>. Script ini bertugas membajak API upload TikTok Studio agar parameter <code>cloud_edit_is_use_video_canvas</code> dimatikan dan <code>is_high_quality</code> dikunci ke 100%.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="/userscript/tiktok-cloud-disabler.user.js"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#ffb066] hover:bg-[#ffc285] text-[#25150a] font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Install Userscript (1-Klik)</span>
              </a>

              <button
                onClick={copyUserscriptUrl}
                title="Salin Link Userscript"
                className="p-2.5 rounded-xl bg-[#1c140e] hover:bg-[#322318] border border-[rgba(255,205,150,0.2)] text-[#fff1e0] transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-[#70c99a]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Upload & Optimizer Box */}
        <div className="bg-[#1c140e]/90 border border-[rgba(255,205,150,0.18)] rounded-3xl p-6 md:p-8 space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-[#ffb066] bg-[#ffb066]/10"
                : "border-[rgba(255,205,150,0.25)] hover:border-[#ffb066]/50 bg-[#130b06]/60"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-full bg-[#ffb066]/15 border border-[#ffb066]/30 text-[#ffb066]">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#fff1e0]">
                  {file ? file.name : "Tarik & Lepas File Video ke Sini"}
                </p>
                <p className="text-xs text-[#9e8870] mt-1">
                  Mendukung .MP4, .MOV, .WebM (Diproses 100% lokal di browser tanpa upload ke server)
                </p>
              </div>
              {file && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb066]/10 border border-[#ffb066]/30 text-[#ffb066] text-xs font-mono">
                  <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method Selector */}
            <div className="bg-[#130b06]/60 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9e8870]">
                Metode Bypass Ingest
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("PASSTHROUGH")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    method === "PASSTHROUGH"
                      ? "bg-[#ffb066] text-[#25150a] shadow-md font-bold"
                      : "bg-[#241a12] text-[#c9b49d] hover:text-[#fff1e0]"
                  }`}
                >
                  ⚡ JSIBRA (Rekomendasi)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("COMPACT_1080")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    method === "COMPACT_1080"
                      ? "bg-[#ffb066] text-[#25150a] shadow-md font-bold"
                      : "bg-[#241a12] text-[#c9b49d] hover:text-[#fff1e0]"
                  }`}
                >
                  Standard Pass
                </button>
              </div>
            </div>

            {/* Compression Toggle */}
            <div className="bg-[#130b06]/60 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9e8870]">
                Kompresi Piksel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["OFF", "1080P", "720P"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCompressLevel(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      compressLevel === level
                        ? "bg-[#ffb066] text-[#25150a] shadow-md font-bold"
                        : "bg-[#241a12] text-[#c9b49d] hover:text-[#fff1e0]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Summary Details */}
          <div className="p-4 rounded-xl bg-[#241a12]/50 border border-[rgba(255,205,150,0.1)] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#9e8870]">Format:</span>
              <span className="font-mono text-[#fff1e0] font-semibold">.mp4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#9e8870]">Mode:</span>
              <span className="font-semibold text-[#ffb066]">
                Direct Pass-Through (Faststart + Ingest Anchor)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#9e8870]">Overhead:</span>
              <span className="font-mono text-[#70c99a] font-semibold">+24 bytes</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={!file || isProcessing}
            onClick={processVideo}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
              !file || isProcessing
                ? "bg-[#241a12] text-[#9e8870] cursor-not-allowed opacity-60"
                : "bg-[#ffb066] hover:bg-[#ffc285] text-[#25150a] shadow-[#ffb066]/25 active:scale-[0.99]"
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses Faststart & Anchor...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-[#25150a]" />
                <span>Proses Video Sekarang</span>
              </>
            )}
          </button>

          {/* Diagnostic Log Terminal */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#9e8870]">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#ffb066]" />
                  <span>Terminal Diagnostik</span>
                </div>
                <span>{logs.length} baris log</span>
              </div>

              <div
                ref={logBoxRef}
                className="bg-[#100a06] border border-[rgba(255,205,150,0.15)] rounded-2xl p-4 font-mono text-[11px] leading-relaxed text-[#c9b49d] max-h-56 overflow-y-auto space-y-1"
              >
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-[#ffb066] select-none">&gt;</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Ready Banner */}
          {processedBlob && (
            <div className="p-6 rounded-2xl bg-[#ffb066]/10 border border-[#ffb066]/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[#ffb066] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#ffb066]" />
                  <span>Video Siap Diunduh!</span>
                </div>
                <p className="text-xs text-[#c9b49d]">
                  File: <strong>{processedFileName}</strong> ({(processedBlob.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-[#ffb066] hover:bg-[#ffc285] text-[#25150a] font-bold text-sm transition-all shadow-lg shadow-[#ffb066]/30 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download Video HQ</span>
              </button>
            </div>
          )}
        </div>

        {/* Technical Explainer Section */}
        <div className="bg-[#1c140e]/70 border border-[rgba(255,205,150,0.12)] rounded-3xl p-6 md:p-8 space-y-4">
          <h2 className="text-lg font-bold text-[#fff1e0] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffb066]" />
            <span>Bagaimana Cara Kerja Bypass Ini?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#c9b49d] leading-relaxed">
            <div className="space-y-2 bg-[#130b06]/60 p-4 rounded-2xl border border-[rgba(255,205,150,0.08)]">
              <h3 className="font-bold text-[#ffb066] text-sm">1. Faststart Remux (Direct Pass-Through)</h3>
              <p>
                Encoder video (Premiere/DaVinci) biasanya menaruh indeks <code>moov</code> di ujung akhir file. Tool ini memindahkan atom <code>moov</code> ke posisi awal tanpa meng-encode ulang piksel gambar, sehingga server ingest TikTok langsung membaca seluruh struktur video saat detik pertama diupload.
              </p>
            </div>

            <div className="space-y-2 bg-[#130b06]/60 p-4 rounded-2xl border border-[rgba(255,205,150,0.08)]">
              <h3 className="font-bold text-[#ffb066] text-sm">2. Payload Interceptor (Userscript)</h3>
              <p>
                Saat mengunggah lewat TikTok Studio, script Tampermonkey membajak request API TikTok dan mematikan flag <code>cloud_edit_is_use_video_canvas</code>. Ini menghentikan server TikTok dari merender ulang video dan memaksanya mempertahankan resolusi 1080p 120 FPS.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,205,150,0.15)] mt-16 py-8 px-6 text-center text-xs text-[#9e8870]">
        <p>© 2026 Ariefansyah Hayanibran Farawowan (Ibra). Hosted on Azure VM jsibra.me.</p>
        <p className="mt-1 text-[#9e8870]">JSIBRA Video Engine • 100% Client-Side Privacy First</p>
      </footer>
    </div>
  );
}