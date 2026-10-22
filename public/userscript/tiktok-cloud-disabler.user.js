// ==UserScript==
// @name         TikTok Studio Cloud Canvas Disabler & HQ Ingest
// @namespace    https://jsibra.me/
// @version      2.0.0
// @description  Menonaktifkan Cloud Canvas Video Editor di TikTok Studio (tiktok.com/tiktokstudio) agar video 1080p, 120 FPS, dan high-bitrate tidak di-downscale paksa ke 720p. Mendukung Faststart & metadata bypass jsibra.me.
// @author       Ibra Farawowan (jsibra.me)
// @match        https://*.tiktok.com/*
// @match        *://localhost/*
// @match        *://127.0.0.1/*
// @match        *://jsibra.me/*
// @match        *://*.jsibra.me/*
// @updateURL    https://jsibra.me/userscript/tiktok-cloud-disabler.user.js
// @downloadURL  https://jsibra.me/userscript/tiktok-cloud-disabler.user.js
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

/* jshint esversion: 11 */

(() => {
  'use strict';

  const win = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  if (win.__JSIBRA_TIKTOK_HQ_HOOK__) return;
  win.__JSIBRA_TIKTOK_HQ_HOOK__ = true;
  win.__JSIBRA_TIKTOK_HQ_VERSION__ = '2.0.0';

  try {
    document.documentElement.dataset.tiktokHqIngest = 'active';
    document.documentElement.dataset.tiktokHqIngestVersion = '2.0.0';
  } catch (_) {}

  // Respon ping dari web app
  win.addEventListener('message', (event) => {
    if (event.data?.type === 'TIKTOK_HQ_INGEST_PING' || event.data?.type === 'TIKTOK_CLOUD_DISABLER_PING' || event.data?.type === 'ADJN_PING') {
      win.postMessage({ type: 'TIKTOK_HQ_INGEST_PONG', version: '2.0.0', source: 'JSIBRA_HQ_INGEST' }, '*');
    }
  });

  const isTikTokSite = /tiktok\.com$/i.test(location.hostname) || location.hostname.includes('tiktok.com');
  const isTikTokStudio = isTikTokSite && (
    location.pathname.includes('/tiktokstudio') ||
    location.pathname.includes('/upload') ||
    location.pathname.includes('/creator-center')
  );

  const logEntries = [
    'System: TikTok Studio HQ Ingest v2.0.0 (jsibra.me)',
    `Host: ${location.hostname}`,
    'Payload Interceptor: Cloud Canvas bypass armed',
    'Metadata Verifier: JSIBRA Stealth Anchor Armed',
    'Status: Direct Pass-Through Active'
  ];

  let addUiLog = (msg) => {
    logEntries.push(msg);
  };

  // ================= PAYLOAD NORMALIZATION & HOOKS =================
  function isPublishPayload(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.cloud_edit_is_use_video_canvas !== undefined) return true;
    if (Array.isArray(obj.single_post_req_list)) return true;
    if (obj.post_common_info && typeof obj.post_common_info === 'object') return true;
    if (obj.canvas_config !== undefined || obj.draft !== undefined || obj.vedit_segment_info !== undefined) return true;
    return false;
  }

  function normalizePayload(payload) {
    if (!payload || typeof payload !== 'object') return;

    ['draft', 'canvas_config', 'vedit_segment_info'].forEach((key) => {
      if (payload[key] !== undefined) delete payload[key];
    });

    if (payload.cloud_edit_is_use_video_canvas !== undefined) {
      payload.cloud_edit_is_use_video_canvas = false;
    }
    payload.psg_vsp_aud = true;

    if (payload.enter_post_page_from !== undefined) {
      payload.enter_post_page_from = 1;
    }

    if (payload.post_common_info && typeof payload.post_common_info === 'object') {
      payload.post_common_info.post_type = 3;
      payload.post_common_info.enter_post_page_from = 1;
      payload.post_common_info.psg_vsp_aud = true;
    }

    if (Array.isArray(payload.single_post_req_list)) {
      payload.single_post_req_list.forEach((req) => {
        req.psg_vsp_aud = true;
        const info = req?.single_post_feature_info;
        if (!info || typeof info !== 'object') return;
        if (info.vedit_segment_info !== undefined) delete info.vedit_segment_info;
        info.cloud_edit_is_use_video_canvas = false;
        info.has_original_audio = 1;
        info.psg_vsp_aud = true;
        info.video_quality_score = 1.0;
        info.is_high_quality = true;
      });
    }

    const timeStr = new Date().toLocaleTimeString([], { hour12: false });
    addUiLog(`[${timeStr}] Cloud Canvas disabled: Kualitas 1080p/120fps dikunci`);
  }

  function transformJsonString(jsonStr) {
    if (typeof jsonStr !== 'string') return jsonStr;
    try {
      const parsed = JSON.parse(jsonStr);
      if (isPublishPayload(parsed)) {
        normalizePayload(parsed);
        return JSON.stringify(parsed);
      }
    } catch (_) {}
    return jsonStr;
  }

  // 1. Hook JSON.stringify
  const nativeStringify = win.JSON.stringify;
  win.JSON.stringify = function(value, replacer, space) {
    if (value && typeof value === 'object') {
      if (value.hasOwnProperty('video_quality_score') || value.hasOwnProperty('is_high_quality')) {
        value.video_quality_score = 1.0;
        value.is_high_quality = true;
      }
      if (isPublishPayload(value)) {
        try {
          normalizePayload(value);
        } catch (_) {}
      }
    }
    return nativeStringify.call(this, value, replacer, space);
  };

  // 2. Hook window.fetch
  if (typeof win.fetch === 'function') {
    const originalFetch = win.fetch;
    win.fetch = async function(input, init) {
      try {
        if (init && typeof init.body === 'string') {
          init.body = transformJsonString(init.body);
        }
      } catch (_) {}
      return originalFetch.apply(this, arguments);
    };
  }

  // 3. Hook XMLHttpRequest.prototype.send
  if (typeof win.XMLHttpRequest !== 'undefined' && win.XMLHttpRequest.prototype) {
    const originalSend = win.XMLHttpRequest.prototype.send;
    win.XMLHttpRequest.prototype.send = function(body) {
      try {
        if (typeof body === 'string') {
          arguments[0] = transformJsonString(body);
        }
      } catch (_) {}
      return originalSend.apply(this, arguments);
    };
  }

  // ================= METADATA DETECTOR (jsibra.me) =================
  async function isFilePatched(file) {
    if (!file) return false;
    try {
      const checkStrings = ['jsibra.me'];
      const slices = [];
      if (file.size <= 16 * 1024 * 1024) {
        slices.push(await file.arrayBuffer());
      } else {
        slices.push(await file.slice(0, 8 * 1024 * 1024).arrayBuffer());
        slices.push(await file.slice(file.size - 8 * 1024 * 1024, file.size).arrayBuffer());
      }

      for (const targetStr of checkStrings) {
        const targetBytes = new Uint8Array(targetStr.length);
        for (let i = 0; i < targetStr.length; i++) targetBytes[i] = targetStr.charCodeAt(i);

        for (const buf of slices) {
          const bytes = new Uint8Array(buf);
          const max = bytes.length - targetBytes.length;
          for (let i = 0; i <= max; i++) {
            if (bytes[i] === targetBytes[0]) {
              let match = true;
              for (let j = 1; j < targetBytes.length; j++) {
                if (bytes[i + j] !== targetBytes[j]) {
                  match = false;
                  break;
                }
              }
              if (match) return true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[TikTok HQ Ingest] Error checking file metadata:', e);
    }
    return false;
  }

  let isUploadLocked = false;

  function lockUploadContainer() {
    isUploadLocked = true;
    const container = findUploadContainer();
    if (container) {
      container.style.pointerEvents = 'none';
      container.style.opacity = '0.6';
    }
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(inp => {
      inp.disabled = true;
      inp.style.pointerEvents = 'none';
    });
  }

  function unlockUploadContainer() {
    isUploadLocked = false;
    const container = findUploadContainer();
    if (container) {
      container.style.pointerEvents = '';
      container.style.opacity = '';
    }
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(inp => {
      inp.disabled = false;
      inp.style.pointerEvents = '';
    });
  }

  function forwardFileToUpload(file) {
    if (isUploadLocked) return;

    const input = document.querySelector('input[type="file"]');
    if (input) {
      input.disabled = false;
      input.style.pointerEvents = '';

      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;

      const changeEvt = new Event('change', { bubbles: true });
      changeEvt._jsibraVerified = true;
      input.dispatchEvent(changeEvt);

      lockUploadContainer();
      const timeStr = new Date().toLocaleTimeString([], { hour12: false });
      addUiLog(`[${timeStr}] Upload dikirim ke TikTok Studio`);

      setTimeout(() => {
        if (document.querySelector('.upload-card, [class*="upload-card"], [class*="drop-zone"]')) {
          unlockUploadContainer();
        }
      }, 10000);
    }
  }

  function findUploadContainer() {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      let cur = fileInput.parentElement;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const cl = String(cur.className || '');
        const rect = cur.getBoundingClientRect();
        if (
          cl.includes('upload-card') ||
          cl.includes('before-upload') ||
          cl.includes('upload-stage') ||
          cl.includes('uploader-container') ||
          cl.includes('drop-zone') ||
          cl.includes('file-uploader') ||
          cl.includes('upload-container') ||
          (rect.height >= 240 && rect.width >= 350 && !cl.includes('sidebar') && !cl.includes('header') && !cl.includes('nav'))
        ) {
          return cur;
        }
        cur = cur.parentElement;
      }
    }
    return document.querySelector('.upload-card, .before-upload-new-stage, [class*="upload-card"], [class*="before-upload-new-stage"], [class*="upload-stage"], [class*="uploader-container"], [class*="drop-zone"], [class*="file-uploader"]');
  }

  // ================= MODAL PERINGATAN VIDEO BELUM DIPATCH =================
  function showUnpatchedModal(file, onContinue) {
    const existing = document.getElementById('jsibra-unpatched-modal-root');
    if (existing) existing.remove();

    const container = findUploadContainer();
    const targetParent = container || document.body;
    const isInsideContainer = !!container;

    if (isInsideContainer) {
      container.style.position = 'relative';
    }

    const root = document.createElement('div');
    root.id = 'jsibra-unpatched-modal-root';
    if (isInsideContainer) {
      root.classList.add('jsibra-in-container');
    }

    const safeName = file.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    root.innerHTML = `
      <style>
        #jsibra-unpatched-modal-root {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483646 !important;
          background: rgba(14, 10, 6, 0.85) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #fff1e0 !important;
          box-sizing: border-box !important;
        }
        #jsibra-unpatched-modal-root.jsibra-in-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 280px !important;
          border-radius: inherit !important;
          background: rgba(23, 16, 9, 0.95) !important;
          backdrop-filter: blur(8px) !important;
          z-index: 99999 !important;
        }
        .jsibra-modal-box {
          background: #1c140e !important;
          border: 1.5px solid #ffb066 !important;
          border-radius: 16px !important;
          max-width: 440px !important;
          width: 100% !important;
          padding: 24px !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6) !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
          text-align: left !important;
        }
        .jsibra-modal-header {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
          gap: 12px !important;
        }
        .jsibra-modal-title {
          font-size: 15px !important;
          font-weight: 700 !important;
          color: #ffb066 !important;
          line-height: 1.35 !important;
          margin: 0 !important;
        }
        .jsibra-modal-close {
          background: transparent !important;
          border: none !important;
          color: #c9b49d !important;
          font-size: 18px !important;
          cursor: pointer !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
        }
        .jsibra-modal-desc {
          font-size: 12.5px !important;
          color: #c9b49d !important;
          line-height: 1.5 !important;
          margin: 0 !important;
        }
        .jsibra-file-badge {
          display: inline-block !important;
          background: #251910 !important;
          border: 1px solid rgba(255, 176, 102, 0.3) !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-family: ui-monospace, monospace !important;
          color: #ffb066 !important;
          word-break: break-all !important;
          margin-top: 6px !important;
        }
        .jsibra-modal-actions {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          margin-top: 4px !important;
        }
        .jsibra-btn-patch {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 11px 0 !important;
          background: transparent !important;
          color: #ffb066 !important;
          border: 1.5px solid #ffb066 !important;
          border-radius: 9999px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          text-decoration: none !important;
          transition: background 0.15s ease !important;
        }
        .jsibra-btn-patch:hover {
          background: rgba(255, 176, 102, 0.15) !important;
        }
        .jsibra-btn-continue {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 11px 0 !important;
          background: #ffb066 !important;
          color: #25150a !important;
          border: none !important;
          border-radius: 9999px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: background 0.15s ease !important;
        }
        .jsibra-btn-continue:hover {
          background: #ffc285 !important;
        }
      </style>
      <div class="jsibra-modal-box">
        <div class="jsibra-modal-header">
          <h3 class="jsibra-modal-title">Video Belum Di-Optimize HQ?</h3>
          <button type="button" class="jsibra-modal-close" id="jsibra-btn-modal-dismiss" title="Tutup">&times;</button>
        </div>
        <div class="jsibra-modal-desc">
          File ini belum dipatch dengan Faststart & anchor metadata <strong>jsibra.me</strong>. Tanpa patch, TikTok Studio berpotensi men-downscale kualitas video ke 720p.
          <div><span class="jsibra-file-badge">${safeName} (${fileSizeMB} MB)</span></div>
        </div>
        <div class="jsibra-modal-actions">
          <a href="https://jsibra.me/tools/hq-optimizer" target="_blank" rel="noopener noreferrer" class="jsibra-btn-patch">
            ⚡ Optimize HQ di jsibra.me
          </a>
          <button type="button" class="jsibra-btn-continue" id="jsibra-btn-confirm-continue">
            Lanjut Upload Saja
          </button>
        </div>
      </div>
    `;

    targetParent.appendChild(root);

    const closeModal = () => {
      if (root.parentNode) root.remove();
      unlockUploadContainer();
    };

    const dismissBtn = root.querySelector('#jsibra-btn-modal-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }

    const continueBtn = root.querySelector('#jsibra-btn-confirm-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
        if (typeof onContinue === 'function') onContinue();
      });
    }
  }

  // ================= UPLOAD INTERCEPTOR =================
  function setupUploadInterceptor() {
    if (!isTikTokStudio) return;

    let isChecking = false;

    document.addEventListener('dragover', (e) => {
      if (isUploadLocked || isChecking || document.getElementById('jsibra-unpatched-modal-root')) {
        e.preventDefault();
      }
    }, true);

    document.addEventListener('change', async (e) => {
      if (e._jsibraVerified) return;
      if (isUploadLocked || isChecking || document.getElementById('jsibra-unpatched-modal-root')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      const target = e.target;
      if (target && target.tagName === 'INPUT' && target.type === 'file' && target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          isChecking = true;
          const timeStr = new Date().toLocaleTimeString([], { hour12: false });
          addUiLog(`[${timeStr}] Memeriksa metadata: ${file.name}`);

          try {
            const patched = await isFilePatched(file);
            if (patched) {
              addUiLog(`[${timeStr}] Video terverifikasi: Patched HQ`);
              forwardFileToUpload(file);
            } else {
              addUiLog(`[${timeStr}] Video belum dipatch`);
              showUnpatchedModal(file, () => {
                addUiLog(`[${new Date().toLocaleTimeString([], { hour12: false })}] Upload dilanjutkan`);
                forwardFileToUpload(file);
              });
            }
          } catch (err) {
            console.error(err);
            forwardFileToUpload(file);
          } finally {
            isChecking = false;
          }
        }
      }
    }, true);

    document.addEventListener('drop', async (e) => {
      if (e._jsibraVerified) return;
      if (isUploadLocked || isChecking || document.getElementById('jsibra-unpatched-modal-root')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          isChecking = true;
          const timeStr = new Date().toLocaleTimeString([], { hour12: false });
          addUiLog(`[${timeStr}] Memeriksa metadata: ${file.name}`);

          try {
            const patched = await isFilePatched(file);
            if (patched) {
              addUiLog(`[${timeStr}] Video terverifikasi: Patched HQ`);
              forwardFileToUpload(file);
            } else {
              addUiLog(`[${timeStr}] Video belum dipatch`);
              showUnpatchedModal(file, () => {
                addUiLog(`[${new Date().toLocaleTimeString([], { hour12: false })}] Upload dilanjutkan`);
                forwardFileToUpload(file);
              });
            }
          } catch (err) {
            console.error(err);
            forwardFileToUpload(file);
          } finally {
            isChecking = false;
          }
        }
      }
    }, true);
  }

  // ================= UI BADGE & STATUS WIDGET =================
  function shouldShowBadge() {
    const url = (location.href || '').toLowerCase();
    return url.includes('tiktokstudio') || url.includes('/upload') || url.includes('creator-center');
  }

  function initIndicator() {
    if (!shouldShowBadge()) {
      const existing = document.getElementById('jsibra-tktk-badge-root');
      if (existing) existing.remove();
      return;
    }

    let root = document.getElementById('jsibra-tktk-badge-root');
    const targetParent = document.body || document.documentElement;
    if (!targetParent) return;

    if (!root) {
      setupUploadInterceptor();

      root = document.createElement('div');
      root.id = 'jsibra-tktk-badge-root';

      const style = document.createElement('style');
      style.textContent = `
        #jsibra-tktk-badge-root {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #fff1e0 !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }
        .jsibra-badge {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: #1c140e !important;
          border: 1px solid #ffb066 !important;
          border-radius: 9999px !important;
          padding: 6px 12px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #fff1e0 !important;
          cursor: pointer !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }
        .jsibra-badge:hover {
          background: #251910 !important;
        }
        .jsibra-dot {
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background: #ffb066 !important;
          animation: jsibra-pulse 2s infinite !important;
        }
        @keyframes jsibra-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .jsibra-tag {
          color: #25150a !important;
          background: #ffb066 !important;
          font-size: 9.5px !important;
          font-weight: 700 !important;
          padding: 1px 6px !important;
          border-radius: 9999px !important;
        }
        .jsibra-panel {
          opacity: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          width: 320px !important;
          background: #1c140e !important;
          border: 1px solid transparent !important;
          border-radius: 12px !important;
          padding: 0 12px !important;
          margin-bottom: 0 !important;
          pointer-events: none !important;
          transition: all 0.22s ease !important;
        }
        .jsibra-panel.open {
          opacity: 1 !important;
          max-height: 280px !important;
          padding: 12px !important;
          margin-bottom: 8px !important;
          border-color: #ffb066 !important;
          pointer-events: auto !important;
        }
        .jsibra-panel-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 8px !important;
          padding-bottom: 6px !important;
          border-bottom: 1px solid rgba(255, 176, 102, 0.2) !important;
        }
        .jsibra-panel-title {
          font-size: 11.5px !important;
          font-weight: 700 !important;
          color: #ffb066 !important;
        }
        .jsibra-log-box {
          background: #130b06 !important;
          border: 1px solid rgba(255, 176, 102, 0.15) !important;
          border-radius: 8px !important;
          padding: 8px 10px !important;
          font-family: ui-monospace, monospace !important;
          font-size: 10px !important;
          line-height: 1.5 !important;
          color: #c9b49d !important;
          max-height: 150px !important;
          overflow-y: auto !important;
        }
      `;

      root.appendChild(style);

      const panel = document.createElement('div');
      panel.className = 'jsibra-panel';
      panel.innerHTML = `
        <div class="jsibra-panel-header">
          <div class="jsibra-panel-title">⚡ TikTok HQ Ingest (jsibra.me)</div>
          <button type="button" id="jsibra-btn-close" style="background:transparent;border:none;color:#c9b49d;cursor:pointer;">✕</button>
        </div>
        <div class="jsibra-log-box" id="jsibra-log-box"></div>
      `;

      const badge = document.createElement('div');
      badge.className = 'jsibra-badge';
      badge.innerHTML = `
        <span class="jsibra-dot"></span>
        <span>TikTok Studio HQ</span>
        <span class="jsibra-tag">Active</span>
      `;

      root.appendChild(panel);
      root.appendChild(badge);

      const logBox = panel.querySelector('#jsibra-log-box');
      const closeBtn = panel.querySelector('#jsibra-btn-close');

      function renderLogs() {
        if (!logBox) return;
        logBox.innerHTML = '';
        logEntries.forEach(entry => {
          const row = document.createElement('div');
          row.style.whiteSpace = 'nowrap';
          row.style.overflow = 'hidden';
          row.style.textOverflow = 'ellipsis';
          row.innerHTML = `<span style="color:#ffb066;margin-right:4px;">&gt;</span>${entry}`;
          logBox.appendChild(row);
        });
        logBox.scrollTop = logBox.scrollHeight;
      }

      addUiLog = (msg) => {
        logEntries.push(msg);
        renderLogs();
      };

      renderLogs();

      badge.addEventListener('click', () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) renderLogs();
      });

      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('open');
      });

      targetParent.appendChild(root);
    } else if (!targetParent.contains(root)) {
      targetParent.appendChild(root);
    }
  }

  const timer = setInterval(() => {
    initIndicator();
    if (document.getElementById('jsibra-tktk-badge-root')) clearInterval(timer);
  }, 300);

  setInterval(initIndicator, 1500);
})();
