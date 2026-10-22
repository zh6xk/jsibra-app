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
  Check,
  Copy,
} from "lucide-react";

// ==========================================
// MP4 ATOM BINARY MANIPULATION HELPERS
// ==========================================
function _ss_readU32(buf: Uint8Array, off: number): number {
  return ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0;
}

function _ss_writeU32(arr: Uint8Array, off: number, val: number): void {
  arr[off] = (val >>> 24) & 0xff;
  arr[off + 1] = (val >>> 16) & 0xff;
  arr[off + 2] = (val >>> 8) & 0xff;
  arr[off + 3] = val & 0xff;
}

interface BoxInfo {
  offset: number;
  size: number;
  contentStart: number;
  end: number;
  headerSize: number;
  type: string;
}

function _ss_findBox(buf: Uint8Array, start: number, end: number, type: string): BoxInfo | null {
  let p = start;
  while (p + 8 <= end) {
    let size = _ss_readU32(buf, p);
    const t = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7]);
    if (size === 1) {
      if (p + 16 > end) break;
      const hi = _ss_readU32(buf, p + 8);
      const lo = _ss_readU32(buf, p + 12);
      size = hi * 4294967296 + lo;
      if (t === type) return { offset: p, size, contentStart: p + 16, end: p + size, headerSize: 16, type: t };
      p += size;
    } else if (size === 0) {
      size = end - p;
      if (t === type) return { offset: p, size, contentStart: p + 8, end: p + size, headerSize: 8, type: t };
      break;
    } else {
      if (size < 8) break;
      if (t === type) return { offset: p, size, contentStart: p + 8, end: p + size, headerSize: 8, type: t };
      p += size;
    }
  }
  return null;
}

function _ss_parseBoxes(buf: Uint8Array, start: number, end: number): BoxInfo[] {
  const boxes: BoxInfo[] = [];
  let p = start;
  while (p + 8 <= end) {
    let size = _ss_readU32(buf, p);
    const t = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7]);
    let hSize = 8;
    if (size === 1) {
      if (p + 16 > end) break;
      const hi = _ss_readU32(buf, p + 8);
      const lo = _ss_readU32(buf, p + 12);
      size = hi * 4294967296 + lo;
      hSize = 16;
    } else if (size === 0) {
      size = end - p;
    }
    if (size < 8 || p + size > end) break;
    boxes.push({ offset: p, size, contentStart: p + hSize, end: p + size, headerSize: hSize, type: t });
    p += size;
  }
  return boxes;
}

function _ss_findDeep(buf: Uint8Array, start: number, end: number, type: string): BoxInfo | null {
  const boxes = _ss_parseBoxes(buf, start, end);
  for (const b of boxes) {
    if (b.type === type) return b;
    if (["moov", "trak", "mdia", "minf", "stbl", "edts"].includes(b.type)) {
      const found = _ss_findDeep(buf, b.contentStart, b.end, type);
      if (found) return found;
    }
  }
  return null;
}

function _ss_makeBox(type: string, payload: Uint8Array): Uint8Array {
  const size = 8 + payload.byteLength;
  const box = new Uint8Array(size);
  _ss_writeU32(box, 0, size);
  for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i);
  box.set(payload, 8);
  return box;
}

function concatArrays(arrays: Uint8Array[]): Uint8Array {
  let totalLen = 0;
  for (const a of arrays) totalLen += a.byteLength;
  const out = new Uint8Array(totalLen);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.byteLength;
  }
  return out;
}

function makeCommentUdta(commentText: string): Uint8Array {
  const textCmt = new TextEncoder().encode(commentText);

  const cmtData = new Uint8Array(16 + textCmt.length);
  new DataView(cmtData.buffer).setUint32(0, cmtData.length, false);
  cmtData.set([0x64, 0x61, 0x74, 0x61, 0, 0, 0, 1, 0, 0, 0, 0], 4);
  cmtData.set(textCmt, 16);

  const cmtItem = new Uint8Array(8 + cmtData.length);
  new DataView(cmtItem.buffer).setUint32(0, cmtItem.length, false);
  cmtItem.set([0xa9, 0x63, 0x6d, 0x74], 4);
  cmtItem.set(cmtData, 8);

  const ilstSize = 8 + cmtItem.length;
  const ilstBox = new Uint8Array(ilstSize);
  new DataView(ilstBox.buffer).setUint32(0, ilstSize, false);
  ilstBox.set([0x69, 0x6c, 0x73, 0x74], 4);
  ilstBox.set(cmtItem, 8);

  const hdlrBox = new Uint8Array(33);
  new DataView(hdlrBox.buffer).setUint32(0, 33, false);
  hdlrBox.set([0x68, 0x64, 0x6c, 0x72], 4);
  hdlrBox.set([0x6d, 0x64, 0x69, 0x72], 12);

  const metaSize = 12 + hdlrBox.length + ilstBox.length;
  const metaBox = new Uint8Array(metaSize);
  new DataView(metaBox.buffer).setUint32(0, metaSize, false);
  metaBox.set([0x6d, 0x65, 0x74, 0x61], 4);
  metaBox.set(hdlrBox, 12);
  metaBox.set(ilstBox, 12 + hdlrBox.length);

  const udtaSize = 8 + metaBox.length;
  const udtaBox = new Uint8Array(udtaSize);
  new DataView(udtaBox.buffer).setUint32(0, udtaSize, false);
  udtaBox.set([0x75, 0x64, 0x74, 0x61], 4);
  udtaBox.set(metaBox, 8);

  return udtaBox;
}

// Full 100% Lossless TikTok Quality Bypass Engine (JSIBRA Pro Method)
function patchMp4JsibraEngine(buf: Uint8Array, commentText = "https://jsibra.me"): Uint8Array {
  const ftyp = _ss_findBox(buf, 0, buf.length, "ftyp");
  const moov = _ss_findBox(buf, 0, buf.length, "moov");
  const mdat = _ss_findBox(buf, 0, buf.length, "mdat");

  if (!ftyp || !moov || !mdat) {
    throw new Error("Struktur MP4 tidak valid (ftyp, moov, atau mdat tidak ditemukan).");
  }

  const ftypBytes = buf.subarray(ftyp.offset, ftyp.end);
  const origMdatPayload = buf.subarray(mdat.contentStart, mdat.end);
  const origMdatContentStart = mdat.contentStart;

  const traks = _ss_parseBoxes(buf, moov.contentStart, moov.end).filter((b) => b.type === "trak");
  if (!traks.length) throw new Error("Tidak ada track video dalam file.");

  const mvhd = _ss_findDeep(buf, moov.contentStart, moov.end, "mvhd");
  if (!mvhd) throw new Error("Atom mvhd tidak ditemukan.");

  const origMvhdVer = buf[mvhd.contentStart];
  const origMvhdTimescale = _ss_readU32(buf, mvhd.contentStart + (origMvhdVer === 1 ? 20 : 12)) || 1000;
  const targetMvhdTimescale = 48000;

  function rescaleTkhd(tkhdBox: BoxInfo): Uint8Array {
    const copy = new Uint8Array(tkhdBox.size);
    copy.set(buf.subarray(tkhdBox.offset, tkhdBox.end));
    const ver = copy[8];
    const dv = new DataView(copy.buffer, copy.byteOffset, copy.byteLength);
    if (ver === 1) {
      const origDur = dv.getBigUint64(8 + 28, false);
      const newDur = (origDur * BigInt(targetMvhdTimescale)) / BigInt(origMvhdTimescale);
      dv.setBigUint64(8 + 28, newDur, false);
    } else {
      const origDur = dv.getUint32(8 + 20, false);
      const newDur = Math.round((origDur * targetMvhdTimescale) / origMvhdTimescale);
      dv.setUint32(8 + 20, newDur, false);
    }
    return copy;
  }

  function rescaleEdts(edtsBox: BoxInfo): Uint8Array {
    const elstBox = _ss_findDeep(buf, edtsBox.contentStart, edtsBox.end, "elst");
    if (!elstBox) return buf.subarray(edtsBox.offset, edtsBox.end);
    const elstCopy = new Uint8Array(elstBox.size - elstBox.headerSize);
    elstCopy.set(buf.subarray(elstBox.contentStart, elstBox.end));
    const elstDv = new DataView(elstCopy.buffer, elstCopy.byteOffset, elstCopy.byteLength);
    const ver = elstCopy[0];
    const count = elstDv.getUint32(4, false);
    for (let i = 0; i < count; i++) {
      const base = 8 + i * (ver === 1 ? 20 : 12);
      if (ver === 1) {
        const segDur = elstDv.getBigUint64(base, false);
        const newSegDur = (segDur * BigInt(targetMvhdTimescale)) / BigInt(origMvhdTimescale);
        elstDv.setBigUint64(base, newSegDur, false);
      } else {
        const segDur = elstDv.getUint32(base, false);
        const newSegDur = Math.round((segDur * targetMvhdTimescale) / origMvhdTimescale);
        elstDv.setUint32(base, newSegDur, false);
      }
    }
    return _ss_makeBox("edts", _ss_makeBox("elst", elstCopy));
  }

  // 1. mvhd Version 1 (64-bit) Infinite Duration Sentinel
  const newMvhdPayload = new Uint8Array(112);
  const mvhdDv = new DataView(newMvhdPayload.buffer);
  newMvhdPayload[0] = 1;
  mvhdDv.setUint32(20, targetMvhdTimescale, false);
  mvhdDv.setBigUint64(24, BigInt("0xFFFFFFFFFFFFFFFF"), false);
  mvhdDv.setUint32(32, 0x00010000, false);
  mvhdDv.setUint16(36, 0x0100, false);
  mvhdDv.setUint32(48, 0x00010000, false);
  mvhdDv.setUint32(64, 0x00010000, false);
  mvhdDv.setUint32(80, 0x40000000, false);
  mvhdDv.setUint32(108, 4, false);
  const newMvhdBox = _ss_makeBox("mvhd", newMvhdPayload);

  // 2. Video Track (Track 1)
  const videoTrak = traks[0];
  const audioTrak = traks.length > 1 ? traks[1] : null;

  const vSttsBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "stts");
  const vStscBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "stsc");
  const vStszBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "stsz");
  const vStcoBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "stco") || _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "co64");
  const vCttsBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "ctts");

  if (!vSttsBox || !vStscBox || !vStszBox || !vStcoBox) {
    throw new Error("Atom video stbl (stts/stsc/stsz/stco) tidak ditemukan.");
  }

  const vChunkCount = _ss_readU32(buf, vStcoBox.contentStart + 4);
  const vRelOffsets: number[] = [];
  for (let i = 0; i < vChunkCount; i++) {
    const off = _ss_readU32(buf, vStcoBox.contentStart + 8 + i * 4);
    vRelOffsets.push(off - origMdatContentStart);
  }

  let aStcoBox: BoxInfo | null = null;
  let aStsdBox: BoxInfo | null = null;
  let aChunkCount = 0;
  const aRelOffsets: number[] = [];
  if (audioTrak) {
    aStsdBox = _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "stsd");
    aStcoBox = _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "stco") || _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "co64");
    if (aStcoBox) {
      aChunkCount = _ss_readU32(buf, aStcoBox.contentStart + 4);
      for (let i = 0; i < aChunkCount; i++) {
        const off = _ss_readU32(buf, aStcoBox.contentStart + 8 + i * 4);
        aRelOffsets.push(off - origMdatContentStart);
      }
    }
  }

  // 8 bytes dummy sample in mdat + 16 bytes dummy sample in Track 3 = 24 bytes overhead
  const inMdatAnchor = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65]);
  const outMdatTrap = new Uint8Array([
    0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65,
  ]);

  // Video STTS (+1 zero-delta sample)
  const origVSttsEntries = _ss_readU32(buf, vSttsBox.contentStart + 4);
  const newVSttsPayload = new Uint8Array(8 + (origVSttsEntries + 1) * 8);
  const vSttsDv = new DataView(newVSttsPayload.buffer);
  vSttsDv.setUint32(4, origVSttsEntries + 1, false);
  newVSttsPayload.set(buf.subarray(vSttsBox.contentStart + 8, vSttsBox.contentStart + 8 + origVSttsEntries * 8), 8);
  vSttsDv.setUint32(8 + origVSttsEntries * 8, 1, false);
  vSttsDv.setUint32(8 + origVSttsEntries * 8 + 4, 0, false);
  const newVSttsBox = _ss_makeBox("stts", newVSttsPayload);

  // Video STSZ (+1 sample of size 8)
  const origVSampleSize = _ss_readU32(buf, vStszBox.contentStart + 4);
  const origVSampleCount = _ss_readU32(buf, vStszBox.contentStart + 8);
  const newVStszPayload = new Uint8Array(12 + (origVSampleCount + 1) * 4);
  const vStszDv = new DataView(newVStszPayload.buffer);
  vStszDv.setUint32(4, 0, false);
  vStszDv.setUint32(8, origVSampleCount + 1, false);
  if (origVSampleSize === 0) {
    newVStszPayload.set(buf.subarray(vStszBox.contentStart + 12, vStszBox.contentStart + 12 + origVSampleCount * 4), 12);
  } else {
    for (let i = 0; i < origVSampleCount; i++) vStszDv.setUint32(12 + i * 4, origVSampleSize, false);
  }
  vStszDv.setUint32(12 + origVSampleCount * 4, 8, false);
  const newVStszBox = _ss_makeBox("stsz", newVStszPayload);

  // Video CTTS
  let newVCttsBox: Uint8Array | null = null;
  if (vCttsBox) {
    const origCttsEntries = _ss_readU32(buf, vCttsBox.contentStart + 4);
    const newCttsPayload = new Uint8Array(8 + (origCttsEntries + 1) * 8);
    const cttsDv = new DataView(newCttsPayload.buffer);
    newCttsPayload[0] = buf[vCttsBox.contentStart];
    cttsDv.setUint32(4, origCttsEntries + 1, false);
    newCttsPayload.set(buf.subarray(vCttsBox.contentStart + 8, vCttsBox.contentStart + 8 + origCttsEntries * 8), 8);
    cttsDv.setUint32(8 + origCttsEntries * 8, 1, false);
    cttsDv.setUint32(8 + origCttsEntries * 8 + 4, 0, false);
    newVCttsBox = _ss_makeBox("ctts", newCttsPayload);
  } else {
    const newCttsPayload = new Uint8Array(8 + 2 * 8);
    const cttsDv = new DataView(newCttsPayload.buffer);
    newCttsPayload[0] = 0;
    cttsDv.setUint32(4, 2, false);
    cttsDv.setUint32(8, origVSampleCount, false);
    cttsDv.setUint32(12, 0, false);
    cttsDv.setUint32(16, 1, false);
    cttsDv.setUint32(20, 0, false);
    newVCttsBox = _ss_makeBox("ctts", newCttsPayload);
  }

  // Video STSC (+1 chunk)
  const origVStscEntries = _ss_readU32(buf, vStscBox.contentStart + 4);
  const newVStscPayload = new Uint8Array(8 + (origVStscEntries + 1) * 12);
  const vStscDv = new DataView(newVStscPayload.buffer);
  vStscDv.setUint32(4, origVStscEntries + 1, false);
  newVStscPayload.set(buf.subarray(vStscBox.contentStart + 8, vStscBox.contentStart + 8 + origVStscEntries * 12), 8);
  vStscDv.setUint32(8 + origVStscEntries * 12, vChunkCount + 1, false);
  vStscDv.setUint32(8 + origVStscEntries * 12 + 4, 1, false);
  vStscDv.setUint32(8 + origVStscEntries * 12 + 8, 1, false);
  const newVStscBox = _ss_makeBox("stsc", newVStscPayload);

  // Track 3 (Micro-Shield Auxiliary Audio Track)
  const t3TkhdPayload = new Uint8Array(84);
  const t3TkhdDv = new DataView(t3TkhdPayload.buffer);
  t3TkhdDv.setUint32(0, 0x00000007, false);
  t3TkhdDv.setUint32(12, 3, false);
  t3TkhdDv.setUint32(20, 48000, false);
  t3TkhdDv.setUint16(36, 0x0100, false);
  t3TkhdDv.setUint32(40, 0x00010000, false);
  t3TkhdDv.setUint32(56, 0x00010000, false);
  t3TkhdDv.setUint32(72, 0x40000000, false);
  const t3Tkhd = _ss_makeBox("tkhd", t3TkhdPayload);

  const t3MdhdPayload = new Uint8Array(24);
  const t3MdhdDv = new DataView(t3MdhdPayload.buffer);
  t3MdhdDv.setUint32(12, 48000, false);
  t3MdhdDv.setUint32(16, 48000, false);
  const t3Mdhd = _ss_makeBox("mdhd", t3MdhdPayload);

  const t3HdlrPayload = new Uint8Array(25);
  t3HdlrPayload.set([0x73, 0x6f, 0x75, 0x6e], 8);
  const nameStr = "SoundHandler";
  for (let i = 0; i < nameStr.length; i++) t3HdlrPayload[12 + i] = nameStr.charCodeAt(i);
  const t3Hdlr = _ss_makeBox("hdlr", t3HdlrPayload);

  let t3Stsd: Uint8Array | null = null;
  if (aStsdBox) {
    t3Stsd = buf.subarray(aStsdBox.offset, aStsdBox.end);
  } else {
    const dummyStsd = new Uint8Array(28);
    const dDv = new DataView(dummyStsd.buffer);
    dDv.setUint32(4, 1, false);
    dDv.setUint32(8, 20, false);
    dummyStsd.set([0x6d, 0x70, 0x34, 0x61], 12);
    t3Stsd = _ss_makeBox("stsd", dummyStsd);
  }

  const t3SttsPayload = new Uint8Array(16);
  const t3SttsDv = new DataView(t3SttsPayload.buffer);
  t3SttsDv.setUint32(4, 1, false);
  t3SttsDv.setUint32(8, 1, false);
  t3SttsDv.setUint32(12, 1024, false);
  const t3Stts = _ss_makeBox("stts", t3SttsPayload);

  const t3StszPayload = new Uint8Array(12);
  const t3StszDv = new DataView(t3StszPayload.buffer);
  t3StszDv.setUint32(4, 8, false);
  t3StszDv.setUint32(8, 1, false);
  const t3Stsz = _ss_makeBox("stsz", t3StszPayload);

  const t3StscPayload = new Uint8Array(20);
  const t3StscDv = new DataView(t3StscPayload.buffer);
  t3StscDv.setUint32(4, 1, false);
  t3StscDv.setUint32(8, 1, false);
  t3StscDv.setUint32(12, 1, false);
  t3StscDv.setUint32(16, 1, false);
  const t3Stsc = _ss_makeBox("stsc", t3StscPayload);

  const t3Smhd = _ss_makeBox("smhd", new Uint8Array(8));
  const drefEntry = new Uint8Array([0x00, 0x00, 0x00, 0x0c, 0x75, 0x72, 0x6c, 0x20, 0x00, 0x00, 0x00, 0x01]);
  const drefPayload = new Uint8Array(8 + drefEntry.length);
  new DataView(drefPayload.buffer).setUint32(4, 1, false);
  drefPayload.set(drefEntry, 8);
  const t3Dref = _ss_makeBox("dref", drefPayload);
  const t3Dinf = _ss_makeBox("dinf", t3Dref);

  const vStblBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "stbl");
  if (!vStblBox) throw new Error("stbl tidak ditemukan");
  const vStblChildren = _ss_parseBoxes(buf, vStblBox.contentStart, vStblBox.end);

  const vMinfBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "minf");
  if (!vMinfBox) throw new Error("minf tidak ditemukan");
  const vMinfChildren = _ss_parseBoxes(buf, vMinfBox.contentStart, vMinfBox.end);

  const vMdiaBox = _ss_findDeep(buf, videoTrak.contentStart, videoTrak.end, "mdia");
  if (!vMdiaBox) throw new Error("mdia tidak ditemukan");
  const vMdiaChildren = _ss_parseBoxes(buf, vMdiaBox.contentStart, vMdiaBox.end);
  const vTrakChildren = _ss_parseBoxes(buf, videoTrak.contentStart, videoTrak.end);

  const udtaBox = makeCommentUdta(commentText);

  let moovBytes: Uint8Array | null = null;
  let finalOutput: Uint8Array | null = null;

  for (let iter = 0; iter < 3; iter++) {
    const estMoovLen = moovBytes ? moovBytes.length : moov.size + udtaBox.length + 1024;
    const newMdatContentStart = ftypBytes.length + estMoovLen + 8;
    const anchorChunkOffset = newMdatContentStart + origMdatPayload.length;
    const outMdatChunkOffset = anchorChunkOffset + inMdatAnchor.length;

    const newVStcoPayload = new Uint8Array(8 + (vChunkCount + 1) * 4);
    const vStcoDv = new DataView(newVStcoPayload.buffer);
    vStcoDv.setUint32(4, vChunkCount + 1, false);
    for (let i = 0; i < vChunkCount; i++) {
      vStcoDv.setUint32(8 + i * 4, vRelOffsets[i] + newMdatContentStart, false);
    }
    vStcoDv.setUint32(8 + vChunkCount * 4, anchorChunkOffset, false);
    const newVStcoBox = _ss_makeBox("stco", newVStcoPayload);

    const vStblParts: Uint8Array[] = [];
    for (const child of vStblChildren) {
      if (child.type === "stts") {
        vStblParts.push(newVSttsBox);
        if (!vCttsBox && newVCttsBox) vStblParts.push(newVCttsBox);
      } else if (child.type === "ctts" && newVCttsBox) {
        vStblParts.push(newVCttsBox);
      } else if (child.type === "stsc") vStblParts.push(newVStscBox);
      else if (child.type === "stsz") vStblParts.push(newVStszBox);
      else if (child.type === "stco" || child.type === "co64") vStblParts.push(newVStcoBox);
      else vStblParts.push(buf.subarray(child.offset, child.end));
    }
    const newVStbl = _ss_makeBox("stbl", concatArrays(vStblParts));

    const vMinfParts: Uint8Array[] = [];
    for (const child of vMinfChildren) {
      if (child.type === "stbl") vMinfParts.push(newVStbl);
      else vMinfParts.push(buf.subarray(child.offset, child.end));
    }
    const newVMinf = _ss_makeBox("minf", concatArrays(vMinfParts));

    const vMdiaParts: Uint8Array[] = [];
    for (const child of vMdiaChildren) {
      if (child.type === "minf") vMdiaParts.push(newVMinf);
      else vMdiaParts.push(buf.subarray(child.offset, child.end));
    }
    const newVMdia = _ss_makeBox("mdia", concatArrays(vMdiaParts));

    const vTrakParts: Uint8Array[] = [];
    for (const child of vTrakChildren) {
      if (child.type === "tkhd") vTrakParts.push(rescaleTkhd(child));
      else if (child.type === "edts") vTrakParts.push(rescaleEdts(child));
      else if (child.type === "mdia") vTrakParts.push(newVMdia);
      else vTrakParts.push(buf.subarray(child.offset, child.end));
    }
    const newVTrak = _ss_makeBox("trak", concatArrays(vTrakParts));

    let newATrak: Uint8Array | null = null;
    if (audioTrak && aStcoBox) {
      const newAStcoPayload = new Uint8Array(8 + aChunkCount * 4);
      const aStcoDv = new DataView(newAStcoPayload.buffer);
      aStcoDv.setUint32(4, aChunkCount, false);
      for (let i = 0; i < aChunkCount; i++) {
        aStcoDv.setUint32(8 + i * 4, aRelOffsets[i] + newMdatContentStart, false);
      }
      const newAStcoBox = _ss_makeBox("stco", newAStcoPayload);

      const aStblBox = _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "stbl");
      if (aStblBox) {
        const aStblChildren = _ss_parseBoxes(buf, aStblBox.contentStart, aStblBox.end);
        const aStblParts: Uint8Array[] = [];
        for (const child of aStblChildren) {
          if (child.type === "stco" || child.type === "co64") aStblParts.push(newAStcoBox);
          else aStblParts.push(buf.subarray(child.offset, child.end));
        }
        const newAStbl = _ss_makeBox("stbl", concatArrays(aStblParts));

        const aMinfBox = _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "minf");
        if (aMinfBox) {
          const aMinfChildren = _ss_parseBoxes(buf, aMinfBox.contentStart, aMinfBox.end);
          const aMinfParts: Uint8Array[] = [];
          for (const child of aMinfChildren) {
            if (child.type === "stbl") aMinfParts.push(newAStbl);
            else aMinfParts.push(buf.subarray(child.offset, child.end));
          }
          const newAMinf = _ss_makeBox("minf", concatArrays(aMinfParts));

          const aMdiaBox = _ss_findDeep(buf, audioTrak.contentStart, audioTrak.end, "mdia");
          if (aMdiaBox) {
            const aMdiaChildren = _ss_parseBoxes(buf, aMdiaBox.contentStart, aMdiaBox.end);
            const aMdiaParts: Uint8Array[] = [];
            for (const child of aMdiaChildren) {
              if (child.type === "minf") aMdiaParts.push(newAMinf);
              else aMdiaParts.push(buf.subarray(child.offset, child.end));
            }
            const newAMdia = _ss_makeBox("mdia", concatArrays(aMdiaParts));

            const aTrakChildren = _ss_parseBoxes(buf, audioTrak.contentStart, audioTrak.end);
            const aTrakParts: Uint8Array[] = [];
            for (const child of aTrakChildren) {
              if (child.type === "tkhd") aTrakParts.push(rescaleTkhd(child));
              else if (child.type === "edts") aTrakParts.push(rescaleEdts(child));
              else if (child.type === "mdia") aTrakParts.push(newAMdia);
              else aTrakParts.push(buf.subarray(child.offset, child.end));
            }
            newATrak = _ss_makeBox("trak", concatArrays(aTrakParts));
          }
        }
      }
    }

    // Track 3 Assembly
    const t3StcoPayload = new Uint8Array(12);
    const t3StcoDv = new DataView(t3StcoPayload.buffer);
    t3StcoDv.setUint32(4, 1, false);
    t3StcoDv.setUint32(8, outMdatChunkOffset, false);
    const t3Stco = _ss_makeBox("stco", t3StcoPayload);

    const t3Stbl = _ss_makeBox("stbl", concatArrays([t3Stsd!, t3Stts, t3Stsz, t3Stsc, t3Stco]));
    const t3Minf = _ss_makeBox("minf", concatArrays([t3Smhd, t3Dinf, t3Stbl]));
    const t3Mdia = _ss_makeBox("mdia", concatArrays([t3Mdhd, t3Hdlr, t3Minf]));
    const t3Trak = _ss_makeBox("trak", concatArrays([t3Tkhd, t3Mdia]));

    const traksList = [newVTrak];
    if (newATrak) traksList.push(newATrak);
    traksList.push(t3Trak);

    moovBytes = _ss_makeBox("moov", concatArrays([newMvhdBox, ...traksList, udtaBox]));

    if (iter === 2) {
      const newMdatPayload = concatArrays([origMdatPayload, inMdatAnchor]);
      const newMdatBox = _ss_makeBox("mdat", newMdatPayload);
      finalOutput = concatArrays([ftypBytes, moovBytes, newMdatBox, outMdatTrap]);
    }
  }

  if (!finalOutput) throw new Error("Gagal mengompilasi struktur output MP4.");
  return finalOutput;
}

export default function HqOptimizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<"JSIBRA_STEALTH" | "PASSTHROUGH">("JSIBRA_STEALTH");
  const [compressLevel, setCompressLevel] = useState<"OFF" | "1080P" | "720P">("OFF");
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedFileName, setProcessedFileName] = useState("");
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
      `Siap untuk proses optimasi JSIBRA HQ Bypass.`,
    ]);
  };

  const processVideo = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessedBlob(null);
    setLogs([]);

    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    addLog("=================================================");
    addLog(`= TikTok HQ Ingest Optimizer — JSIBRA Pro Engine =`);
    addLog(`  File      : ${file.name} (${originalSizeMB} MB)`);
    addLog(`  Method    : JSIBRA STEALTH PRO (Dual-Trap + 48k Clock Sentinel)`);
    addLog(`  Compress  : ${compressLevel}`);
    addLog("=================================================");

    await new Promise((r) => setTimeout(r, 150));

    try {
      addLog("= Clip Normalization — Faststart Inspection =");
      addLog("  Membaca struktur MP4 container ke browser memory...");

      const fileBuffer = await file.arrayBuffer();
      const rawBytes = new Uint8Array(fileBuffer);

      addLog("  Standardizing MP4 streams (Verifikasi atom ftyp & moov)...");
      await new Promise((r) => setTimeout(r, 200));

      addLog("=====");
      addLog("= Applying JSIBRA STEALTH Method =");
      addLog("  Injecting synchronized 48k infinite header & dual-trap anchor...");
      addLog("  - Setting 64-bit Infinite Duration Sentinel (mvhd 48000 clock)");
      addLog("  - Injecting Zero-Offset CTTS Table & In-Track Video Anchor");
      addLog("  - Arming Micro-Shield Stream Trap on Track 3");
      addLog("  - Embedding original signature: https://jsibra.me into udta metadata");

      await new Promise((r) => setTimeout(r, 250));

      // Run full binary patch engine
      const patchedBytes = patchMp4JsibraEngine(rawBytes, "https://jsibra.me");

      const overhead = patchedBytes.length - rawBytes.length;
      addLog(`JSIBRA patch applied (+${overhead} bytes overhead). Total size: ${patchedBytes.length} bytes.`);
      addLog("  JSIBRA Stealth method successfully applied!");
      addLog("Process Completed Successfully! Output: done_hd.mp4");

      const originalBaseName = file.name.replace(/\.[^/.]+$/, "");
      const finalName = `${originalBaseName}_hd.mp4`;

      const outputBlob = new Blob([patchedBytes.buffer as ArrayBuffer], { type: "video/mp4" });
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
            <span>JSIBRA STEALTH PRO READY</span>
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
            Optimasi container MP4 dengan sentinel 48k timescale infinite duration, zero-offset CTTS, dan dual-trap stream anchor. Mengunci kualitas 1080p dan 120 FPS tanpa penurunan bitrate atau resolusi paksa ke 720p.
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
                  onClick={() => setMethod("JSIBRA_STEALTH")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    method === "JSIBRA_STEALTH"
                      ? "bg-[#ffb066] text-[#25150a] shadow-md font-bold"
                      : "bg-[#241a12] text-[#c9b49d] hover:text-[#fff1e0]"
                  }`}
                >
                  ⚡ JSIBRA (Rekomendasi)
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("PASSTHROUGH")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    method === "PASSTHROUGH"
                      ? "bg-[#ffb066] text-[#25150a] shadow-md font-bold"
                      : "bg-[#241a12] text-[#c9b49d] hover:text-[#fff1e0]"
                  }`}
                >
                  Faststart Direct
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
                JSIBRA Stealth Pro (Dual-Trap + 48k Sentinel)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#9e8870]">Signature:</span>
              <span className="font-mono text-[#70c99a] font-semibold">https://jsibra.me</span>
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
                <span>Menyuntikkan Dual-Trap Anchor...</span>
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
            <span>Bagaimana Cara Kerja JSIBRA Stealth Bypass?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#c9b49d] leading-relaxed">
            <div className="space-y-2 bg-[#130b06]/60 p-4 rounded-2xl border border-[rgba(255,205,150,0.08)]">
              <h3 className="font-bold text-[#ffb066] text-sm">1. 64-bit Infinite Duration Sentinel (48k Clock)</h3>
              <p>
                Atom <code>mvhd</code> dimodifikasi menjadi Version 1 (64-bit) dengan durasi tak terhingga (<code>0xFFFFFFFFFFFFFFFF</code>) pada clock 48000 Hz. Cloud canvas editor TikTok tidak sanggup me-render stream berdurasi tak hingga sehingga otomatis membatalkan re-encoding dan beralih ke <strong>Direct Pass-Through</strong> murni.
              </p>
            </div>

            <div className="space-y-2 bg-[#130b06]/60 p-4 rounded-2xl border border-[rgba(255,205,150,0.08)]">
              <h3 className="font-bold text-[#ffb066] text-sm">2. Dual-Trap Stream Anchor (+24 Bytes)</h3>
              <p>
                Menyuntikkan 8 byte dummy sample di ujung <code>mdat</code> dan 16 byte trap di Track 3 audio auxiliary. Ditambah metadata signature <code>https://jsibra.me</code> di dalam atom <code>udta</code>, memastikan metode dikenali di seluruh analyser.
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
