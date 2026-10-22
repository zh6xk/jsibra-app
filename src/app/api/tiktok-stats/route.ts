import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let url = (body.url || "").trim();

    if (!url) {
      return NextResponse.json({ error: "URL TikTok wajib diisi." }, { status: 400 });
    }

    // Panggil TikWM API dengan format x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("url", url);

    const apiRes = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData.toString(),
    });

    const resJson = await apiRes.json();

    if (resJson.code !== 0 || !resJson.data) {
      return NextResponse.json(
        { error: resJson.msg || "Gagal mengambil data video. Pastikan link TikTok valid dan publik." },
        { status: 404 }
      );
    }

    const d = resJson.data;

    // Hitung dasar
    const duration = Math.max(d.duration || 1, 1);
    const sizeBytes = d.size || 0;
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const calculatedBitrateMbps = ((sizeBytes * 8) / (duration * 1000000)).toFixed(2);

    const views = d.play_count || 0;
    const likes = d.digg_count || 0;
    const comments = d.comment_count || 0;
    const shares = d.share_count || 0;
    const saves = d.collect_count || 0;

    const totalEngagements = likes + comments + shares + saves;
    const engagementRate = views > 0 ? ((totalEngagements / views) * 100).toFixed(2) : "0.00";

    const createTimeUnix = d.create_time || Math.floor(Date.now() / 1000);
    const uploadDate = new Date(createTimeUnix * 1000).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    });

    const nowSeconds = Math.floor(Date.now() / 1000);
    const ageHours = (nowSeconds - createTimeUnix) / 3600;

    // Diagnosa Shadowban / Status Distribusi
    let shadowbanStatus: "RESTRICTED" | "REVIEW" | "NORMAL" = "NORMAL";
    let shadowbanTitle = "Distribusi Normal (FYP Active)";
    let shadowbanBadgeColor = "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
    let shadowbanReason = "Video terdistribusi secara publik di feed For You (FYP) dan tidak ada pembatasan sistem.";

    if (views <= 5 && ageHours > 1) {
      shadowbanStatus = "RESTRICTED";
      shadowbanTitle = "Dibatasi / Shadowban (0-5 Views Freeze)";
      shadowbanBadgeColor = "border-rose-500/50 text-rose-400 bg-rose-500/15";
      shadowbanReason = `Video terhenti di ${views} view meski sudah diunggah lebih dari ${Math.floor(ageHours)} jam lalu. Algoritma FYP membatasi distribusi awal akibat deteksi spam, metadata tidak standar, atau akun dalam status shadowban.`;
    } else if (views <= 50 && ageHours <= 2) {
      shadowbanStatus = "REVIEW";
      shadowbanTitle = "Sedang Ditinjau (Initial Review)";
      shadowbanBadgeColor = "border-amber-500/40 text-amber-400 bg-amber-500/10";
      shadowbanReason = "Video baru saja diunggah dan sedang melewati batch kurasi algoritma awal TikTok.";
    }

    // Ingest & Stream Probe via ffprobe
    let width = 1080;
    let height = 1920;
    let fps = "30";
    let videoCodec = "h264";
    let audioSampleRate = "44100";
    let isFaststart = true;
    let ingestMethod = "Direct Web Pass-Through";

    if (d.play) {
      try {
        const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name,r_frame_rate -of json "${d.play}"`;
        const { stdout } = await execAsync(ffprobeCmd, { timeout: 8000 });
        const probeData = JSON.parse(stdout);
        const vStream = probeData.streams?.[0];
        if (vStream) {
          if (vStream.width) width = vStream.width;
          if (vStream.height) height = vStream.height;
          if (vStream.codec_name) videoCodec = vStream.codec_name;
          if (vStream.r_frame_rate) {
            const [num, den] = vStream.r_frame_rate.split("/").map(Number);
            if (num && den) fps = Math.round(num / den).toString();
          }
        }
      } catch (err) {
        // fallback to defaults if probe times out
      }

      // Probe audio sample rate
      try {
        const audioProbeCmd = `ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of json "${d.play}"`;
        const { stdout: audioOut } = await execAsync(audioProbeCmd, { timeout: 5000 });
        const aData = JSON.parse(audioOut);
        const aStream = aData.streams?.[0];
        if (aStream?.sample_rate) audioSampleRate = aStream.sample_rate;
      } catch (_) {}

      // Range probe untuk mendeteksi signature ingest
      try {
        const headRes = await fetch(d.play, {
          headers: { Range: "bytes=0-16384" },
        });
        const headBuf = await headRes.arrayBuffer();
        const headBytes = new Uint8Array(headBuf);
        const headStr = String.fromCharCode(...headBytes);

        if (headStr.includes("jsibra.me")) {
          ingestMethod = "JSIBRA Stealth HQ Ingest";
        } else if (headStr.includes("moov") && headStr.indexOf("moov") < 1024) {
          ingestMethod = "Web Studio Faststart (Pass-Through)";
        } else {
          ingestMethod = "Mobile App / Cloud Canvas Transcode";
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      data: {
        id: d.id,
        title: d.title || "(Tanpa Judul)",
        region: d.region || "ID",
        uploadDate,
        createTimeUnix,
        author: {
          id: d.author?.id,
          username: d.author?.unique_id,
          nickname: d.author?.nickname,
          avatar: d.author?.avatar,
        },
        shadowban: {
          status: shadowbanStatus,
          title: shadowbanTitle,
          badgeColor: shadowbanBadgeColor,
          reason: shadowbanReason,
        },
        stream: {
          width,
          height,
          resolution: `${width}x${height}`,
          fps: `${fps} fps`,
          codec: videoCodec.toUpperCase(),
          bitrate: `${calculatedBitrateMbps} Mbps`,
          duration: `${duration}s`,
          size: `${sizeMB} MB`,
          audioSampleRate: `${audioSampleRate} Hz`,
          ingestMethod,
          isFaststart,
          playUrl: d.play,
        },
        engagement: {
          views,
          likes,
          comments,
          shares,
          saves,
          totalEngagements,
          rate: `${engagementRate}%`,
        },
        music: {
          title: d.music_info?.title || "Original Sound",
          author: d.music_info?.author || d.author?.nickname,
          url: d.music,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal Server Error: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
