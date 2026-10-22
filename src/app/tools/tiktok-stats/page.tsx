"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Sparkles,
  Search,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Film,
  Music,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  RefreshCw,
  ExternalLink,
  Layers,
  Activity,
  ShieldAlert,
  ClipboardPaste
} from "lucide-react";

interface AnalysisResult {
  id: string;
  title: string;
  region: string;
  uploadDate: string;
  author: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
  shadowban: {
    status: "RESTRICTED" | "REVIEW" | "NORMAL";
    title: string;
    badgeColor: string;
    reason: string;
  };
  stream: {
    width: number;
    height: number;
    resolution: string;
    fps: string;
    codec: string;
    bitrate: string;
    duration: string;
    size: string;
    audioSampleRate: string;
    ingestMethod: string;
    isFaststart: boolean;
    playUrl: string;
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    totalEngagements: number;
    rate: string;
  };
  music: {
    title: string;
    author: string;
    url: string;
  };
}

export default function TikTokStatsPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch (_) {}
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tiktok-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Gagal mengambil data video.");
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memeriksa video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#140e09] text-[#fff1e0] selection:bg-[#ffb066] selection:text-[#25150a]">
      {/* Background Ambient Glow */}
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
            <span>STREAM ANALYSER PRO</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb066]/15 border border-[#ffb066]/30 text-[#ffb066] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb066]" />
            <span>TikTok Metadata & Distribution Engine</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#fff1e0]">
            TikTok Statistics & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb066] via-[#ffd09e] to-[#ff9944]">Shadowban Analyser</span>
          </h1>
          <p className="text-[#c9b49d] text-sm md:text-base leading-relaxed max-w-3xl">
            Audit menyeluruh metadata stream video TikTok: verifikasi resolusi asli, framerate, bitrate, deteksi metode ingest/upload, serta deteksi akurat apakah video terkena batasan algoritma (Shadowban 0-5 views freeze).
          </p>
        </div>

        {/* Input Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#1c140e]/90 border border-[rgba(255,205,150,0.2)] shadow-xl space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#9e8870] flex items-center justify-between">
            <span>Masukkan URL Video TikTok</span>
            <span className="font-normal text-[11px] text-[#c9b49d]">Mendukung link desktop & link vt.tiktok.com</span>
          </label>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username/video/1234567890..."
                className="w-full py-3.5 pl-4 pr-12 rounded-2xl bg-[#130b06]/80 border border-[rgba(255,205,150,0.2)] focus:border-[#ffb066] text-sm text-[#fff1e0] placeholder-[#9e8870] outline-none transition-all"
              />
              <button
                type="button"
                onClick={handlePaste}
                title="Tempel dari Clipboard"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-[#c9b49d] hover:text-[#fff1e0] hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={`py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer shrink-0 ${
                loading || !url.trim()
                  ? "bg-[#241a12] text-[#9e8870] cursor-not-allowed opacity-60"
                  : "bg-[#ffb066] hover:bg-[#ffc285] text-[#25150a] shadow-[#ffb066]/20 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memeriksa Stream...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Ambil Statistik</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Container */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Profil & Video Info */}
            <div className="p-6 rounded-3xl bg-[#1c140e]/90 border border-[rgba(255,205,150,0.18)] flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {result.author.avatar ? (
                  <img
                    src={result.author.avatar}
                    alt={result.author.username}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#ffb066]/40 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#241a12] border border-[#ffb066]/40 flex items-center justify-center font-bold text-lg text-[#ffb066]">
                    {result.author.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#fff1e0]">{result.author.nickname}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ffb066]/15 border border-[#ffb066]/30 text-[#ffb066]">
                      {result.region}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#9e8870]">@{result.author.username}</p>
                  <p className="text-xs text-[#c9b49d] mt-1.5 line-clamp-1">{result.title}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] uppercase font-mono text-[#9e8870]">Waktu Upload</div>
                <div className="text-sm font-semibold text-[#fff1e0] mt-0.5">{result.uploadDate}</div>
              </div>
            </div>

            {/* Shadowban Status Banner */}
            <div
              className={`p-6 rounded-3xl border shadow-lg space-y-3 ${
                result.shadowban.status === "RESTRICTED"
                  ? "bg-rose-950/25 border-rose-500/50 text-rose-300"
                  : "bg-emerald-950/25 border-emerald-500/50 text-emerald-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-base font-bold">
                  {result.shadowban.status === "RESTRICTED" ? (
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <span>Indikator Shadowban:</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${
                      result.shadowban.status === "RESTRICTED"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    }`}
                  >
                    {result.shadowban.title}
                  </span>
                </div>

                <div className="text-xs font-mono text-[#c9b49d]">
                  Deteksi: {result.shadowban.status === "RESTRICTED" ? "Not Recommended / NFF" : "Normal FYP Feed"}
                </div>
              </div>
              <p className="text-xs md:text-sm leading-relaxed opacity-90">{result.shadowban.reason}</p>
            </div>

            {/* Stream & Ingest Specs Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9e8870] flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-[#ffb066]" />
                <span>Spesifikasi Stream & Ingest Method</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl">
                  <div className="text-[10px] uppercase font-mono text-[#9e8870]">Resolusi Stream</div>
                  <div className="text-lg font-bold text-[#fff1e0] mt-1">{result.stream.resolution}</div>
                  <div className="text-[11px] text-[#ffb066] font-medium mt-0.5">{result.stream.fps}</div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl">
                  <div className="text-[10px] uppercase font-mono text-[#9e8870]">Bitrate Video</div>
                  <div className="text-lg font-bold text-[#ffb066] mt-1">{result.stream.bitrate}</div>
                  <div className="text-[11px] text-[#9e8870] mt-0.5">Codec {result.stream.codec}</div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl">
                  <div className="text-[10px] uppercase font-mono text-[#9e8870]">Durasi & Ukuran</div>
                  <div className="text-lg font-bold text-[#fff1e0] mt-1">{result.stream.duration}</div>
                  <div className="text-[11px] text-[#70c99a] mt-0.5">{result.stream.size}</div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-4 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-[#9e8870]">Metode Ingest</div>
                    {result.stream.ingestMethod.startsWith("http") ? (
                      <a
                        href={result.stream.ingestMethod}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#ffb066] hover:underline flex items-center gap-1 mt-1 break-all"
                      >
                        <span>{result.stream.ingestMethod}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <div className="text-xs font-bold text-[#ffb066] mt-1 line-clamp-2">
                        {result.stream.ingestMethod}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-[#9e8870] mt-2">Audio {result.stream.audioSampleRate}</div>
                </div>
              </div>
            </div>

            {/* Engagement Stats Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9e8870] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#ffb066]" />
                <span>Metrik Interaksi & Engagement Rate</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#9e8870]">
                    <Eye className="w-3 h-3 text-[#ffb066]" />
                    <span>Views</span>
                  </div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">
                    {result.engagement.views.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#9e8870]">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Likes</span>
                  </div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">
                    {result.engagement.likes.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#9e8870]">
                    <MessageCircle className="w-3 h-3 text-sky-400" />
                    <span>Komen</span>
                  </div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">
                    {result.engagement.comments.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#9e8870]">
                    <Share2 className="w-3 h-3 text-indigo-400" />
                    <span>Share</span>
                  </div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">
                    {result.engagement.shares.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#1c140e]/80 border border-[rgba(255,205,150,0.12)] p-3.5 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-[#9e8870]">
                    <Bookmark className="w-3 h-3 text-amber-400" />
                    <span>Favorit</span>
                  </div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">
                    {result.engagement.saves.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#241a12] border border-[#ffb066]/30 p-3.5 rounded-2xl">
                  <div className="text-[10px] uppercase font-mono text-[#ffb066]">Engagement</div>
                  <div className="text-base font-bold text-[#fff1e0] mt-1">{result.engagement.rate}</div>
                </div>
              </div>
            </div>

            {/* Audio Section */}
            <div className="p-4 rounded-2xl bg-[#1c140e]/70 border border-[rgba(255,205,150,0.1)] flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ffb066]/15 border border-[#ffb066]/25 text-[#ffb066]">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#fff1e0]">{result.music.title}</div>
                  <div className="text-[11px] text-[#9e8870]">{result.music.author}</div>
                </div>
              </div>

              {result.stream.playUrl && (
                <a
                  href={result.stream.playUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#fff1e0] transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#ffb066]" />
                  <span>Buka Video Asli</span>
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,205,150,0.15)] mt-16 py-8 px-6 text-center text-xs text-[#9e8870]">
        <p>© 2026 Ariefansyah Hayanibran Farawowan (Ibra). Hosted on Azure VM jsibra.me.</p>
        <p className="mt-1 text-[#9e8870]">JSIBRA Stream & Shadowban Engine • 100% In-House Built</p>
      </footer>
    </div>
  );
}