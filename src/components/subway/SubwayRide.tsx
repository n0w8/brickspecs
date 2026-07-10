"use client";

/**
 * SubwayRide - First-Person-Fahrt in einer LEGO-U-Bahn unter BrickSpecs.
 * Canvas-2D, keine Dependencies. Pseudo-3D-Tunnel mit Parallax-Tiefe,
 * Stationen, Aufblick-Segmenten (Stadt bei Nacht) und Wagen-Interieur.
 */

import { useEffect, useRef, useState } from "react";
import { useLang, pick } from "@/lib/i18n";
import type { Lang, LocalizedString } from "@/data/types";

/* ---------------- Welt-Konstanten ---------------- */

const SEG = 3; // Länge eines Tunnelsegments (Welt-Einheiten)
const VIEW_SEGS = 22; // sichtbare Segmente
const HALF_W = 2.6; // halbe Tunnelbreite
const CEIL_Y = -1.7;
const FLOOR_Y = 1.5;
const PLAT_Y = 0.55; // Bahnsteighöhe

const CYCLE = 170; // Welt-Einheiten pro Stations-Zyklus
const STATION_END = 36; // Station belegt pos 0..36 eines Zyklus
const SKY_START = 96; // Aufblick-Zone (Deckenfenster zur Stadt)
const SKY_END = 122;
const PILLARS = [58, 78, 140]; // Pfeiler-Positionen im Zyklus

const BASE_SPEED = 10; // Einheiten/s bei "Normal"
const SPEED_MULTS = [0.55, 1, 1.8];
const SPARK_N = 24;
const STATIC_CAM_Z = 3 * CYCLE - 14; // Standbild: kurz vor einer Station
const STATIC_TIME = 4.2;

const NAMES = [
  "BrickSpecs Mitte",
  "Studville",
  "Minifig Allee",
  "Klemmhafen",
  "Noppenplatz Ost",
];

const ACCENTS: Array<[number, number, number]> = [
  [246, 199, 0], // LEGO-Gelb
  [208, 16, 18], // LEGO-Rot
  [42, 111, 214], // LEGO-Blau
];

const LINE_COLORS: Array<[number, number, number]> = [
  [246, 199, 0],
  [208, 16, 18],
  [42, 111, 214],
  [35, 164, 92],
];

const POSTERS: Array<[number, number, number]> = [
  [246, 199, 0],
  [204, 62, 62],
  [72, 122, 212],
  [92, 178, 122],
];

const MORTAR_YS = [-1.35, -0.75, -0.15, 0.45, 1.05];
const STUD_YS = [-1.2, -0.6, 0, 0.6];
const RAIL_XS = [-0.9, 0.9];

/* ---------------- Texte ---------------- */

const T: Record<string, LocalizedString> = {
  alt: {
    de: "Animierte First-Person-Fahrt in einer LEGO-U-Bahn: Tunnel aus Klemmbausteinen, beleuchtete Stationen mit wartenden Minifiguren und Blicke auf die Stadt bei Nacht.",
    en: "Animated first-person ride in a LEGO subway: a brick-built tunnel, lit stations with waiting minifigures and glimpses of the city at night.",
  },
  pause: { de: "Pause", en: "Pause" },
  resume: { de: "Weiterfahren", en: "Resume" },
  speed: { de: "Tempo", en: "Speed" },
  hint: {
    de: "Tipp: An Stationen lohnt der Blick nach rechts - und ab und zu öffnet sich die Decke zur Stadt.",
    en: "Tip: watch the right side at stations - and now and then the ceiling opens up to the city.",
  },
  reduced: {
    de: "Dein System bevorzugt reduzierte Bewegung - wir zeigen ein Standbild aus dem Tunnel statt der Animation.",
    en: "Your system prefers reduced motion - showing a still frame from the tunnel instead of the animation.",
  },
  ledNext: { de: "NÄCHSTER HALT", en: "NEXT STOP" },
  ledNow: { de: "HALT", en: "STOP" },
};

const SPEED_LABELS: LocalizedString[] = [
  { de: "Langsam", en: "Slow" },
  { de: "Normal", en: "Normal" },
  { de: "Schnell", en: "Express" },
];

/* ---------------- Helfer (pur, ohne Allokationen) ---------------- */

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Nebel: smoothstep-Abfall Richtung Tunnelende. */
function fogf(d: number): number {
  const v = 1 - d / 64;
  if (v <= 0) return 0;
  return v * v * (3 - 2 * v);
}

/** Farbe mit Nebel Richtung Nacht-Blau abgedunkelt. f = Sichtbarkeit 0..1 */
function col(r: number, g: number, b: number, f: number): string {
  const k = clamp01(f);
  return `rgb(${Math.round(8 + (r - 8) * k)},${Math.round(11 + (g - 11) * k)},${Math.round(20 + (b - 20) * k)})`;
}

/** Lampenflackern; ein paar Lampen sind "defekt". */
function flicker(t: number, seed: number): number {
  const base =
    0.82 + 0.18 * Math.sin(t * 9 + seed * 5.3) * Math.sin(t * 13.7 + seed * 2.1);
  if (hash(seed * 91.7) < 0.07) {
    return Math.sin(t * 40 + seed) > -0.2 ? base : base * 0.25;
  }
  return base;
}

/* ---------------- Komponente ---------------- */

export default function SubwayRide() {
  const { lang } = useLang();
  const [playing, setPlaying] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [reduced, setReduced] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingRef = useRef(true);
  const multRef = useRef(SPEED_MULTS[1]);
  const langRef = useRef<Lang>("de");
  const camZRef = useRef(CYCLE - 34); // Start: kurz vor "Studville"
  const reducedRef = useRef(false);
  const sparksRef = useRef(new Float32Array(SPARK_N * 5)); // x,y,vx,vy,life
  const drawRef = useRef<((t: number, dt: number) => void) | null>(null);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    multRef.current = SPEED_MULTS[speedIdx];
  }, [speedIdx]);

  useEffect(() => {
    langRef.current = lang;
    // Standbild bei reduced motion in neuer Sprache neu zeichnen
    if (reducedRef.current && drawRef.current) drawRef.current(STATIC_TIME, 0);
  }, [lang]);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    let raf = 0;
    let running = false;
    let last = 0;

    // pro Frame gesetzte Projektionsgrößen (von Helfern gelesen)
    let F = 0;
    let vpx = 0;
    let vpy = 0;
    let camZ = 0;

    /* ---- Zeichen-Helfer (Closure über ctx) ---- */

    const quad = (
      x1: number, y1: number, x2: number, y2: number,
      x3: number, y3: number, x4: number, y4: number,
      fill: string,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const seg = (x1: number, y1: number, x2: number, y2: number, stroke: string, lw: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    const disc = (x: number, y: number, r: number, fill: string) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    };

    const rrPath = (x: number, y: number, w2: number, h2: number, r: number) => {
      const rr = Math.min(r, w2 / 2, h2 / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w2, y, x + w2, y + h2, rr);
      ctx.arcTo(x + w2, y + h2, x, y + h2, rr);
      ctx.arcTo(x, y + h2, x, y, rr);
      ctx.arcTo(x, y, x + w2, y, rr);
      ctx.closePath();
    };

    /** Quad auf einer Wandebene x = xw, zwischen y1..y2 und Welt-z zA..zB. */
    const wallQuad = (xw: number, y1: number, y2: number, zA: number, zB: number, fill: string) => {
      const dA = Math.max(0.16, zA - camZ);
      const dB = Math.max(dA + 0.01, zB - camZ);
      const sA = F / dA;
      const sB = F / dB;
      quad(
        vpx + xw * sA, vpy + y1 * sA,
        vpx + xw * sA, vpy + y2 * sA,
        vpx + xw * sB, vpy + y2 * sB,
        vpx + xw * sB, vpy + y1 * sB,
        fill,
      );
    };

    /** Wartende Minifig-Silhouette: zylindrischer Kopf, trapezförmiger Torso. */
    const drawMinifig = (fx: number, fy: number, u: number, seed: number, f: number) => {
      const dark = col(20, 24, 38, f);
      // Beine
      ctx.fillStyle = dark;
      ctx.fillRect(fx - 0.15 * u, fy - 0.28 * u, 0.3 * u, 0.28 * u);
      // Torso: Trapez, unten breiter
      ctx.beginPath();
      ctx.moveTo(fx - 0.18 * u, fy - 0.28 * u);
      ctx.lineTo(fx + 0.18 * u, fy - 0.28 * u);
      ctx.lineTo(fx + 0.13 * u, fy - 0.55 * u);
      ctx.lineTo(fx - 0.13 * u, fy - 0.55 * u);
      ctx.closePath();
      ctx.fill();
      // Hals + zylindrischer Kopf mit Noppe
      ctx.fillRect(fx - 0.05 * u, fy - 0.58 * u, 0.1 * u, 0.04 * u);
      rrPath(fx - 0.09 * u, fy - 0.74 * u, 0.18 * u, 0.17 * u, 0.05 * u);
      ctx.fill();
      ctx.fillRect(fx - 0.05 * u, fy - 0.775 * u, 0.1 * u, 0.04 * u);
      // Winker-Arm für manche Figuren
      if (hash(seed * 5.1) > 0.78) {
        seg(fx + 0.14 * u, fy - 0.5 * u, fx + 0.27 * u, fy - 0.68 * u, dark, Math.max(1, 0.06 * u));
      }
      // Handy-Glow für manche Figuren
      if (hash(seed * 3.3) > 0.68) {
        ctx.fillStyle = `rgba(190,215,255,${0.75 * f})`;
        ctx.fillRect(fx + 0.08 * u, fy - 0.47 * u, 0.055 * u, 0.075 * u);
      }
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cssW = wrap.clientWidth;
      cssH = wrap.clientHeight;
      cv.width = Math.max(1, Math.round(cssW * dpr));
      cv.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* ---- Haupt-Zeichnung ---- */

    const draw = (t: number, dt: number) => {
      const w = cssW;
      const h = cssH;
      if (w < 10 || h < 10) return;
      camZ = camZRef.current;
      const mult = multRef.current;
      const motion = playingRef.current && !reducedRef.current ? mult : 0;
      const L = langRef.current;

      ctx.fillStyle = "#06090f";
      ctx.fillRect(0, 0, w, h);

      F = h * 0.85;
      vpx = w * 0.5 + Math.sin(t * 0.6) * w * 0.006 * (0.4 + motion);
      vpy =
        h * 0.54 +
        Math.sin(t * 1.9) * h * 0.006 * motion +
        Math.sin(t * 31) * 1.1 * motion;

      // Stations-Nähe (für warmes Licht im Wagen)
      const posC = ((camZ % CYCLE) + CYCLE) % CYCLE;
      const distSta = posC < STATION_END ? 0 : Math.min(posC - STATION_END, CYCLE - posC);
      const stationGlow = clamp01(1 - distSta / 22);

      const base = Math.floor(camZ / SEG);

      /* --- Tunnelsegmente, von hinten nach vorn --- */
      for (let k = VIEW_SEGS; k >= 0; k--) {
        const segIdx = base + k;
        const z0 = segIdx * SEG;
        let d1 = z0 - camZ;
        const d2 = d1 + SEG;
        if (d2 < 0.17) continue;
        if (d1 < 0.16) d1 = 0.16;
        const s1 = F / d1;
        const s2 = F / d2;
        const dm = (d1 + d2) / 2;
        const sm = F / dm;
        const fog1 = fogf(d1);
        const fogm = fogf(dm);
        const segPos = ((z0 % CYCLE) + CYCLE) % CYCLE;
        const inSta = segPos < STATION_END;
        const inSky = !inSta && segPos >= SKY_START && segPos < SKY_END;
        const stIdx = Math.floor(segPos / SEG);
        const cycleIdx = Math.floor(z0 / CYCLE);
        const h1 = hash(segIdx);

        const xl1 = vpx - HALF_W * s1;
        const xr1 = vpx + HALF_W * s1;
        const xl2 = vpx - HALF_W * s2;
        const xr2 = vpx + HALF_W * s2;
        const yc1 = vpy + CEIL_Y * s1;
        const yf1 = vpy + FLOOR_Y * s1;
        const yc2 = vpy + CEIL_Y * s2;
        const yf2 = vpy + FLOOR_Y * s2;

        /* Decke */
        if (inSky) {
          // Aufblick: Gitter/Glas-Segment zeigt die Stadt bei Nacht
          quad(xl1, yc1, xr1, yc1, xr2, yc2, xl2, yc2, col(9, 12, 30, Math.min(1, fogm * 1.15)));
          // Sterne
          for (let i = 0; i < 4; i++) {
            const u = hash(segIdx * 13.7 + i);
            const v = hash(segIdx * 17.3 + i * 2.1);
            const dS = d1 + v * (d2 - d1);
            const sS = F / dS;
            const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 2 + segIdx);
            ctx.fillStyle = `rgba(230,238,255,${(0.35 + 0.45 * tw) * fogf(dS)})`;
            ctx.fillRect(vpx + (-HALF_W + u * 2 * HALF_W) * sS - 1, vpy + CEIL_Y * sS - 1, 2, 2);
          }
          // Brick-Türme an den Rändern der Öffnung (Skyline von unten)
          const towerL = -HALF_W + 0.25 + hash(segIdx * 7.7) * 0.55;
          const towerR = HALF_W - 0.25 - hash(segIdx * 8.9) * 0.55;
          wallHelperTower(towerL, -HALF_W, z0, z0 + SEG, segIdx, fogm, t);
          wallHelperTower(towerR, HALF_W, z0, z0 + SEG, segIdx + 999, fogm, t);
          // Noppen-Mond, einmal pro Zone
          if (Math.floor((segPos - SKY_START) / SEG) === 4) {
            const dMo = z0 + 1.5 - camZ;
            if (dMo > 0.4) {
              const sMo = F / dMo;
              const mx = vpx + 0.55 * sMo;
              const my = vpy + CEIL_Y * sMo;
              disc(mx, my, 0.17 * sMo, col(238, 230, 190, fogf(dMo) * 1.2));
              ctx.beginPath();
              ctx.arc(mx, my, 0.1 * sMo, 0, Math.PI * 2);
              ctx.strokeStyle = col(205, 194, 150, fogf(dMo));
              ctx.lineWidth = Math.max(0.6, 0.015 * sMo);
              ctx.stroke();
            }
          }
          // Gitterstäbe quer + längs
          for (let gb = 1; gb <= 2; gb++) {
            const dG = z0 + gb - camZ;
            if (dG > 0.3) {
              const sG = F / dG;
              seg(vpx - HALF_W * sG, vpy + CEIL_Y * sG, vpx + HALF_W * sG, vpy + CEIL_Y * sG, col(12, 15, 26, fogf(dG) * 1.3), Math.max(1, 0.05 * sG));
            }
          }
          for (let gx = -1; gx <= 1; gx++) {
            seg(vpx + gx * 1.3 * s1, yc1, vpx + gx * 1.3 * s2, yc2, col(12, 15, 26, fogm * 1.3), Math.max(1, 0.04 * s1));
          }
          // Rahmen der Öffnung
          seg(xl1, yc1, xl2, yc2, col(50, 56, 80, fogm), Math.max(1, 0.05 * s1));
          seg(xr1, yc1, xr2, yc2, col(50, 56, 80, fogm), Math.max(1, 0.05 * s1));
        } else {
          quad(xl1, yc1, xr1, yc1, xr2, yc2, xl2, yc2, col(38 + h1 * 10, 44, 66, fogm * (inSta ? 1.5 : 1)));
        }

        /* Boden */
        quad(xl1, yf1, xr1, yf1, xr2, yf2, xl2, yf2, col(30, 33, 46, fogm * (inSta ? 1.25 : 0.95)));

        /* Wände */
        const wallL = inSta ? col(150, 150, 162, fogm * 1.15) : col(48 + h1 * 14, 55, 82, fogm);
        const wallR = inSta ? col(206, 197, 178, fogm * 1.2) : col(48 + h1 * 14, 55, 82, fogm);
        quad(xl1, yc1, xl1, yf1, xl2, yf2, xl2, yc2, wallL);
        quad(xr1, yc1, xr1, yf1, xr2, yf2, xr2, yc2, wallR);

        /* Mauerfugen (Brick-Reihen) */
        const mLw = Math.min(2.5, Math.max(0.5, 0.014 * s1));
        for (let mi = 0; mi < MORTAR_YS.length; mi++) {
          const my = MORTAR_YS[mi];
          seg(xl1, vpy + my * s1, xl2, vpy + my * s2, "rgba(0,0,0,0.28)", mLw);
          seg(xr1, vpy + my * s1, xr2, vpy + my * s2, "rgba(0,0,0,0.28)", mLw);
        }
        // versetzte Stoßfugen
        const ji = segIdx % 4;
        const jy1 = MORTAR_YS[ji];
        const jy2 = MORTAR_YS[ji + 1] ?? FLOOR_Y;
        seg(vpx - HALF_W * sm, vpy + jy1 * sm, vpx - HALF_W * sm, vpy + jy2 * sm, "rgba(0,0,0,0.25)", mLw);
        seg(vpx + HALF_W * sm, vpy + jy1 * sm, vpx + HALF_W * sm, vpy + jy2 * sm, "rgba(0,0,0,0.25)", mLw);

        /* Tunnelrippen mit Noppen */
        if (!inSta) {
          const ribC = col(70, 78, 108, fog1);
          const ribW = Math.max(1, 0.03 * s1);
          seg(xl1, yc1, xl1, yf1, ribC, ribW);
          seg(xr1, yc1, xr1, yf1, ribC, ribW);
          seg(xl1, yc1, xr1, yc1, ribC, ribW);
          const r = 0.055 * s1;
          if (r > 1.4) {
            const studC = col(88, 97, 130, fog1);
            for (let i = 0; i < STUD_YS.length; i++) {
              const sy = vpy + STUD_YS[i] * s1;
              disc(xl1 + r * 0.9, sy, r, studC);
              disc(xr1 - r * 0.9, sy, r, studC);
            }
          }
        }

        /* Bunte Akzent-Ringe */
        if (!inSta && !inSky && segIdx % 5 === 0) {
          const ac = ACCENTS[((segIdx / 5) % ACCENTS.length + ACCENTS.length) % ACCENTS.length];
          const db = d1 + 0.5;
          const sb = F / db;
          const acol = col(ac[0], ac[1], ac[2], fogm * 0.85);
          quad(xl1, yc1, xl1, yf1, vpx - HALF_W * sb, vpy + FLOOR_Y * sb, vpx - HALF_W * sb, vpy + CEIL_Y * sb, acol);
          quad(xr1, yc1, xr1, yf1, vpx + HALF_W * sb, vpy + FLOOR_Y * sb, vpx + HALF_W * sb, vpy + CEIL_Y * sb, acol);
          quad(xl1, yc1, xr1, yc1, vpx + HALF_W * sb, vpy + CEIL_Y * sb, vpx - HALF_W * sb, vpy + CEIL_Y * sb, acol);
        }

        /* Kabel an den Wänden */
        const cw = Math.max(0.6, 0.018 * s1);
        for (let ci = 0; ci < 2; ci++) {
          const cy = -1.28 + ci * 0.14;
          const cc = col(16, 17, 22, fogm * 1.2);
          ctx.beginPath();
          ctx.moveTo(vpx - (HALF_W - 0.02) * s1, vpy + cy * s1);
          ctx.quadraticCurveTo(
            vpx - (HALF_W - 0.02) * sm, vpy + (cy + 0.05) * sm,
            vpx - (HALF_W - 0.02) * s2, vpy + cy * s2,
          );
          ctx.strokeStyle = cc;
          ctx.lineWidth = cw;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(vpx + (HALF_W - 0.02) * s1, vpy + cy * s1);
          ctx.quadraticCurveTo(
            vpx + (HALF_W - 0.02) * sm, vpy + (cy + 0.05) * sm,
            vpx + (HALF_W - 0.02) * s2, vpy + cy * s2,
          );
          ctx.stroke();
        }

        /* Schwellen */
        for (let sw = 0; sw < 2; sw++) {
          const zs = z0 + 0.75 + sw * 1.5;
          const ds = zs - camZ;
          if (ds > 0.17) {
            const ss = F / ds;
            const ss2 = F / (ds + 0.22);
            quad(
              vpx - 1.25 * ss, vpy + FLOOR_Y * ss,
              vpx + 1.25 * ss, vpy + FLOOR_Y * ss,
              vpx + 1.25 * ss2, vpy + FLOOR_Y * ss2,
              vpx - 1.25 * ss2, vpy + FLOOR_Y * ss2,
              col(56, 44, 36, fogf(ds)),
            );
          }
        }

        /* Schienen */
        for (let ri = 0; ri < RAIL_XS.length; ri++) {
          const rx = RAIL_XS[ri];
          quad(
            vpx + (rx - 0.05) * s1, yf1,
            vpx + (rx + 0.05) * s1, yf1,
            vpx + (rx + 0.05) * s2, yf2,
            vpx + (rx - 0.05) * s2, yf2,
            col(105, 115, 138, fogm),
          );
          seg(vpx + rx * s1, vpy + (FLOOR_Y - 0.015) * s1, vpx + rx * s2, vpy + (FLOOR_Y - 0.015) * s2, col(185, 196, 220, fogm), Math.max(0.6, 0.014 * s1));
        }

        /* Pfeiler mit rotem Warnlicht */
        if (!inSta && !inSky) {
          for (let pi = 0; pi < PILLARS.length; pi++) {
            const p = PILLARS[pi];
            if (segPos <= p && p < segPos + SEG) {
              const zp = z0 + (p - segPos);
              const dp = zp - camZ;
              if (dp > 0.3) {
                const sp = F / dp;
                const sp2 = F / (dp + 0.35);
                const pc = col(118, 104, 74, fogf(dp) * 1.1);
                quad(vpx - HALF_W * sp, vpy + CEIL_Y * sp, vpx - HALF_W * sp, vpy + FLOOR_Y * sp, vpx - HALF_W * sp2, vpy + FLOOR_Y * sp2, vpx - HALF_W * sp2, vpy + CEIL_Y * sp2, pc);
                quad(vpx + HALF_W * sp, vpy + CEIL_Y * sp, vpx + HALF_W * sp, vpy + FLOOR_Y * sp, vpx + HALF_W * sp2, vpy + FLOOR_Y * sp2, vpx + HALF_W * sp2, vpy + CEIL_Y * sp2, pc);
                const blink = Math.sin(t * 4 + pi * 2) > 0 ? 1 : 0.35;
                disc(vpx - (HALF_W - 0.06) * sp, vpy - 0.9 * sp, Math.max(1.2, 0.05 * sp), col(225, 62, 50, fogf(dp) * blink));
                disc(vpx + (HALF_W - 0.06) * sp, vpy - 0.9 * sp, Math.max(1.2, 0.05 * sp), col(225, 62, 50, fogf(dp) * blink));
              }
            }
          }
        }

        /* Werbeplakate im LEGO-Stil */
        if (!inSta && !inSky && hash(segIdx * 1.31) > 0.7) {
          const side = hash(segIdx * 2.09) > 0.5 ? 1 : -1;
          const pcol = POSTERS[Math.floor(hash(segIdx * 3.3) * POSTERS.length) % POSTERS.length];
          const xw = side * (HALF_W - 0.015);
          const za = z0 + 0.35;
          const zb = z0 + 2.55;
          wallQuad(xw, -1.02, -0.08, za, zb, col(228, 226, 218, fogm * 0.85));
          wallQuad(xw, -0.96, -0.14, za + 0.12, zb - 0.12, col(pcol[0], pcol[1], pcol[2], fogm * 0.9));
          // 2x2-Brick als Motiv
          wallQuad(xw, -0.84, -0.58, za + 0.55, zb - 0.9, col(30, 30, 36, fogm * 0.9));
          const dBr = Math.max(0.2, za + 0.7 - camZ);
          const sBr = F / dBr;
          const rB = Math.max(0, 0.045 * sBr);
          if (rB > 1.2) {
            disc(vpx + xw * (F / Math.max(0.2, za + 0.75 - camZ)), vpy - 0.88 * (F / Math.max(0.2, za + 0.75 - camZ)), rB, col(30, 30, 36, fogm * 0.9));
            disc(vpx + xw * (F / Math.max(0.2, za + 1.25 - camZ)), vpy - 0.88 * (F / Math.max(0.2, za + 1.25 - camZ)), rB, col(30, 30, 36, fogm * 0.9));
          }
          // Text als Balken
          wallQuad(xw, -0.46, -0.38, za + 0.35, zb - 0.5, `rgba(10,12,18,${0.55 * fogm})`);
          wallQuad(xw, -0.3, -0.25, za + 0.35, zb - 1.1, `rgba(10,12,18,${0.45 * fogm})`);
        }

        /* Station */
        if (inSta) {
          // Linienfarbe der Station
          const lc = LINE_COLORS[((cycleIdx % LINE_COLORS.length) + LINE_COLORS.length) % LINE_COLORS.length];
          // Farbstreifen auf der Bahnsteig-Wand
          wallQuad(HALF_W - 0.01, -0.55, -0.32, z0, z0 + SEG, col(lc[0], lc[1], lc[2], fogm * 1.05));
          // Bahnsteig: Kante, Fläche, gelbe Sicherheitslinie
          quad(vpx + 1.05 * s1, vpy + PLAT_Y * s1, vpx + 1.05 * s1, yf1, vpx + 1.05 * s2, yf2, vpx + 1.05 * s2, vpy + PLAT_Y * s2, col(92, 88, 82, fogm));
          quad(vpx + 1.05 * s1, vpy + PLAT_Y * s1, xr1, vpy + PLAT_Y * s1, xr2, vpy + PLAT_Y * s2, vpx + 1.05 * s2, vpy + PLAT_Y * s2, col(182, 174, 158, fogm * 1.05));
          quad(vpx + 1.05 * s1, vpy + PLAT_Y * s1, vpx + 1.24 * s1, vpy + PLAT_Y * s1, vpx + 1.24 * s2, vpy + PLAT_Y * s2, vpx + 1.05 * s2, vpy + PLAT_Y * s2, col(238, 200, 40, fogm * 1.1));

          // Hazard-Streifen am Ein-/Ausgang der Station
          if (stIdx === 0 || stIdx === 11) {
            const db = d1 + 0.4;
            const sb = F / db;
            for (let hz = 0; hz < 6; hz++) {
              const hx1 = -HALF_W + hz * ((2 * HALF_W) / 6);
              const hx2 = hx1 + (2 * HALF_W) / 6;
              const hc = hz % 2 === 0 ? col(238, 200, 40, fog1) : col(22, 22, 24, fog1);
              quad(vpx + hx1 * s1, yc1, vpx + hx2 * s1, yc1, vpx + hx2 * sb, vpy + CEIL_Y * sb, vpx + hx1 * sb, vpy + CEIL_Y * sb, hc);
            }
          }

          // Wartende Minifiguren auf dem Bahnsteig
          if (stIdx >= 2 && stIdx <= 10 && hash(segIdx * 3.7) > 0.42) {
            const nFig = hash(segIdx * 9.1) > 0.6 ? 2 : 1;
            for (let fi = 0; fi < nFig; fi++) {
              const zf = z0 + 0.5 + hash(segIdx * 7.7 + fi * 3.1) * 2;
              const df = zf - camZ;
              if (df > 0.6) {
                const sf = F / df;
                const fx = vpx + (1.5 + hash(segIdx * 11.3 + fi) * 0.6) * sf;
                const fy = vpy + PLAT_Y * sf;
                drawMinifig(fx, fy, sf * 0.95, segIdx * 13 + fi, fogf(df));
              }
            }
          }

          // Automat auf dem Bahnsteig
          if (stIdx === 9) {
            wallQuad(HALF_W - 0.14, -0.7, PLAT_Y, z0 + 0.8, z0 + 1.6, col(168, 34, 34, fogm * 1.1));
            wallQuad(HALF_W - 0.15, -0.62, -0.2, z0 + 0.9, z0 + 1.5, col(250, 226, 160, fogm * flicker(t, segIdx + 3) * 1.2));
          }

          // Hängendes Stationsschild
          if (stIdx === 6) {
            const dsg = z0 + 1.5 - camZ;
            if (dsg > 1.1 && dsg < 55) {
              const ssg = F / dsg;
              const sx = vpx + 1.35 * ssg;
              const sy = vpy - 0.8 * ssg;
              const swd = 1.75 * ssg;
              const shg = 0.42 * ssg;
              const fsg = fogf(dsg);
              seg(sx - swd * 0.3, vpy + CEIL_Y * ssg, sx - swd * 0.3, sy - shg / 2, col(90, 96, 116, fsg), Math.max(1, 0.02 * ssg));
              seg(sx + swd * 0.3, vpy + CEIL_Y * ssg, sx + swd * 0.3, sy - shg / 2, col(90, 96, 116, fsg), Math.max(1, 0.02 * ssg));
              rrPath(sx - swd / 2, sy - shg / 2, swd, shg, shg * 0.22);
              ctx.fillStyle = col(36, 58, 108, fsg * 1.5);
              ctx.fill();
              ctx.strokeStyle = col(246, 199, 0, fsg * 1.2);
              ctx.lineWidth = Math.max(0.8, 0.028 * ssg);
              ctx.stroke();
              const fpx = Math.min(64, 0.165 * ssg);
              if (fpx >= 6.5) {
                ctx.font = `700 ${fpx}px system-ui, -apple-system, "Segoe UI", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = col(244, 246, 252, fsg * 1.6);
                const nm = NAMES[((cycleIdx % NAMES.length) + NAMES.length) % NAMES.length];
                ctx.fillText(nm, sx, sy + fpx * 0.05, swd * 0.92);
              }
            }
          }
        }

        /* Deckenlampen mit Glow + Flackern */
        const lampHere = inSta ? segIdx % 2 === 0 : !inSky && segIdx % 4 === 2;
        if (lampHere) {
          const ld = z0 + 1.5 - camZ;
          if (ld > 0.3) {
            const ls = F / ld;
            const lx = vpx + (inSta ? 0.9 : 0) * ls;
            const ly = vpy + (CEIL_Y + 0.05) * ls;
            const fl = flicker(t, segIdx);
            const fL = fogf(ld);
            ctx.fillStyle = col(246, 228, 170, fL * fl * 1.4);
            ctx.fillRect(lx - 0.16 * ls, ly - 0.03 * ls, 0.32 * ls, 0.06 * ls);
            const gR = Math.max(8, (inSta ? 1.15 : 0.85) * ls);
            const gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, gR);
            gr.addColorStop(0, `rgba(255,216,130,${(inSta ? 0.30 : 0.20) * fl * fL})`);
            gr.addColorStop(1, "rgba(255,216,130,0)");
            ctx.fillStyle = gr;
            ctx.fillRect(lx - gR, ly - gR, gR * 2, gR * 2);
          }
        }
      }

      /* --- Scheinwerferkegel des eigenen Zugs --- */
      const hlR = h * 0.55;
      const hl = ctx.createRadialGradient(vpx, vpy + h * 0.06, 0, vpx, vpy + h * 0.06, hlR);
      hl.addColorStop(0, "rgba(255,232,175,0.07)");
      hl.addColorStop(1, "rgba(255,232,175,0)");
      ctx.fillStyle = hl;
      ctx.fillRect(vpx - hlR, vpy - hlR, hlR * 2, hlR * 2);

      /* --- Speed-Streaks an den Seitenscheiben --- */
      if (motion > 0.4) {
        const sAlpha = 0.05 * motion;
        ctx.strokeStyle = `rgba(210,220,255,${sAlpha})`;
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 7; i++) {
          const sd = Math.floor(t * 22) * 7 + i;
          const yy = h * (0.12 + hash(sd * 1.7) * 0.74);
          const len = w * (0.05 + hash(sd * 2.3) * 0.1);
          const x0 = hash(sd * 3.1) * w * 0.06;
          ctx.beginPath();
          ctx.moveTo(x0, yy);
          ctx.lineTo(x0 + len, yy);
          ctx.moveTo(w - x0, yy * 0.94 + h * 0.03);
          ctx.lineTo(w - x0 - len, yy * 0.94 + h * 0.03);
          ctx.stroke();
        }
      }

      /* --- Funken an den Schienen --- */
      const sp = sparksRef.current;
      if (motion > 0.9 && Math.random() < dt * (motion * 2.4 - 1.7)) {
        const s0 = F / 1.15;
        const side = Math.random() < 0.5 ? -0.9 : 0.9;
        const ox = vpx + side * s0;
        const oy = vpy + (FLOOR_Y - 0.02) * s0;
        let spawned = 0;
        for (let i = 0; i < SPARK_N && spawned < 4; i++) {
          if (sp[i * 5 + 4] <= 0) {
            sp[i * 5] = ox;
            sp[i * 5 + 1] = oy;
            sp[i * 5 + 2] = (Math.random() - 0.5) * 320;
            sp[i * 5 + 3] = -(80 + Math.random() * 200);
            sp[i * 5 + 4] = 0.22 + Math.random() * 0.2;
            spawned++;
          }
        }
      }
      ctx.lineWidth = 1.6;
      for (let i = 0; i < SPARK_N; i++) {
        const life = sp[i * 5 + 4];
        if (life > 0) {
          sp[i * 5 + 4] = life - dt;
          sp[i * 5] += sp[i * 5 + 2] * dt;
          sp[i * 5 + 1] += sp[i * 5 + 3] * dt;
          sp[i * 5 + 3] += 950 * dt;
          ctx.strokeStyle = `rgba(255,${180 + Math.round(60 * life)},110,${clamp01(life * 3.5)})`;
          ctx.beginPath();
          ctx.moveTo(sp[i * 5], sp[i * 5 + 1]);
          ctx.lineTo(sp[i * 5] - sp[i * 5 + 2] * 0.02, sp[i * 5 + 1] - sp[i * 5 + 3] * 0.02);
          ctx.stroke();
        }
      }

      /* ================= Wagen-Interieur ================= */

      const ft = Math.max(14, Math.min(26, w * 0.02)); // Fensterrahmen-Dicke
      const iBob = Math.sin(t * 2.9) * 1.5 * motion;

      // Glas-Reflexe
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      ctx.beginPath();
      ctx.moveTo(w * 0.14, 0);
      ctx.lineTo(w * 0.3, 0);
      ctx.lineTo(w * 0.08, h);
      ctx.lineTo(w * 0.0, h * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.62, 0);
      ctx.lineTo(w * 0.68, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.lineTo(w * 0.44, h);
      ctx.closePath();
      ctx.fill();

      // Warmes Stationslicht fällt in den Wagen
      if (stationGlow > 0.02) {
        ctx.fillStyle = `rgba(255,198,110,${0.055 * stationGlow})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Fensterrahmen (außen Rechteck, innen abgerundet - evenodd)
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      rrInner(ft, ft, w - ft * 2, h - ft * 2, 18);
      ctx.fillStyle = "#0d1322";
      ctx.fill("evenodd");
      rrInner(ft, ft, w - ft * 2, h - ft * 2, 18);
      ctx.strokeStyle = "#232c47";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Noppenreihe auf dem oberen Rahmen
      for (let x = ft + 24; x < w - ft - 12; x += 46) {
        disc(x, ft * 0.5, Math.min(6, ft * 0.28), "#1a2138");
        disc(x - 1.5, ft * 0.5 - 1.5, Math.min(2.5, ft * 0.12), "#28324f");
      }

      // Fensterholme (3 Scheiben) mit Nieten
      const mw = Math.max(10, w * 0.014);
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const mx = w * (sIdx === 0 ? 0.28 : 0.72);
        ctx.fillStyle = "#0d1322";
        ctx.fillRect(mx - mw / 2, ft, mw, h - ft * 2);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(mx - mw / 2, ft, 2, h - ft * 2);
        for (let ry = ft + 30; ry < h - ft - 20; ry += 64) {
          disc(mx, ry, 2.5, "#2a3352");
        }
      }

      // Haltestangen (gelb, mit leichtem Schwingen)
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const side = sIdx === 0 ? -1 : 1;
        const px0 = w * (sIdx === 0 ? 0.085 : 0.915) + Math.sin(t * 1.3 + sIdx * 2.6) * 3 * motion;
        ctx.fillStyle = "#e0b400";
        ctx.fillRect(px0 - 6, ft + 2, 12, h - ft - 2);
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillRect(px0 - 3 + side, ft + 2, 3, h - ft - 2);
        ctx.fillStyle = "#3a445f";
        ctx.fillRect(px0 - 9, h * 0.24, 18, 10);
        ctx.fillRect(px0 - 9, h * 0.68, 18, 10);
      }

      // Deckenstange + Halteschlaufen
      const barY = ft + 12;
      ctx.fillStyle = "#2c3554";
      ctx.fillRect(w * 0.2, barY, w * 0.6, 7);
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const sx = w * (sIdx === 0 ? 0.3 : 0.7);
        const swing = Math.sin(t * 2.1 + sIdx * 2.4) * (0.05 + 0.13 * motion);
        ctx.save();
        ctx.translate(sx, barY + 7);
        ctx.rotate(swing);
        ctx.fillStyle = "#3d4869";
        ctx.fillRect(-3, 0, 6, 40);
        ctx.beginPath();
        ctx.arc(0, 50, 11, 0, Math.PI * 2);
        ctx.strokeStyle = "#e0b400";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.restore();
      }

      // LED-Anzeige: nächster Halt
      const posLed = ((camZ % CYCLE) + CYCLE) % CYCLE;
      let stIdxLed = Math.floor(camZ / CYCLE);
      let ledPrefix: string;
      if (posLed < STATION_END + 4) {
        ledPrefix = pickLocal(T.ledNow, L);
      } else {
        stIdxLed += 1;
        ledPrefix = pickLocal(T.ledNext, L);
      }
      const ledName = NAMES[((stIdxLed % NAMES.length) + NAMES.length) % NAMES.length];
      const ledText = `${ledPrefix} · ${ledName.toUpperCase()}`;
      const ledW = Math.min(400, w * 0.5);
      const ledX = (w - ledW) / 2;
      const ledY = ft + 26;
      rrInner(ledX, ledY, ledW, 28, 7);
      ctx.fillStyle = "#0a0f1c";
      ctx.fill();
      ctx.strokeStyle = "#232c47";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = '600 13px ui-monospace, "Cascadia Mono", Consolas, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffb054";
      ctx.fillText(ledText, w / 2 + 6, ledY + 15, ledW - 44);
      if (Math.floor(t * 2) % 2 === 0) {
        disc(ledX + 14, ledY + 14, 3.5, "#ffb054");
      }

      // Armaturenbrett (rote Brick-Konsole)
      const dh = Math.max(64, h * 0.15);
      const dy = h - dh + iBob;
      const grad = ctx.createLinearGradient(0, dy, 0, h);
      grad.addColorStop(0, "#b31114");
      grad.addColorStop(1, "#6f0a0d");
      rrInner(-6, dy, w + 12, dh + 12, 16);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, dy + 2);
      ctx.lineTo(w - 6, dy + 2);
      ctx.stroke();
      // Noppen auf der Konsole
      for (let x = 30; x < w - 16; x += 42) {
        disc(x, dy + 16, 7, "#8f0d10");
        disc(x, dy + 15, 5.5, "#c01115");
        ctx.beginPath();
        ctx.arc(x - 1.5, dy + 13.5, 3, Math.PI * 0.7, Math.PI * 1.6);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Tacho-Display
      const kmh = motion > 0 ? Math.round(38 * mult + Math.sin(t * 5) * 1.6) : 0;
      rrInner(w * 0.09, dy + dh * 0.42, 96, 32, 6);
      ctx.fillStyle = "#0a0f1c";
      ctx.fill();
      ctx.strokeStyle = "#232c47";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = '600 14px ui-monospace, "Cascadia Mono", Consolas, monospace';
      ctx.fillStyle = "#ffb054";
      ctx.fillText(`${kmh} km/h`, w * 0.09 + 48, dy + dh * 0.42 + 17);
      // Rundinstrument
      const dcx = w * 0.88;
      const dcy = dy + dh * 0.55;
      disc(dcx, dcy, 23, "#0a0f1c");
      ctx.beginPath();
      ctx.arc(dcx, dcy, 23, 0, Math.PI * 2);
      ctx.strokeStyle = "#232c47";
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let ti = 0; ti <= 4; ti++) {
        const ta = -2.35 + ti * 0.65;
        seg(dcx + Math.cos(ta) * 17, dcy + Math.sin(ta) * 17, dcx + Math.cos(ta) * 20, dcy + Math.sin(ta) * 20, "#3a445f", 2);
      }
      const needle = -2.35 + (motion > 0 ? mult / 1.8 : 0) * 2.6 + Math.sin(t * 9) * 0.02 * motion;
      seg(dcx, dcy, dcx + Math.cos(needle) * 16, dcy + Math.sin(needle) * 16, "#f6c700", 2.5);
      disc(dcx, dcy, 3, "#f6c700");

      // Haltegriff + Minifig-Klemmhände
      const hbY = dy - 2;
      rrInner(w / 2 - 108, hbY - 6, 216, 13, 6);
      ctx.fillStyle = "#525c78";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(w / 2 - 100, hbY - 4, 200, 2.5);
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const side = sIdx === 0 ? -1 : 1;
        const hx = w / 2 + side * 62;
        const hy = hbY + 1;
        // roter Ärmel
        seg(hx + side * 14, hy + 30, w / 2 + side * 132, h + 40, "#8f0d10", 19);
        // gelber Unterarm
        seg(hx + side * 4, hy + 12, hx + side * 30, hy + 52, "#e0b400", 13);
        // C-förmige Klemmhand um den Griff
        ctx.beginPath();
        ctx.arc(hx, hy, 13, Math.PI * 0.65, Math.PI * 2.35);
        ctx.strokeStyle = "#f6c700";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.lineCap = "butt";
      }

      // Vignette
      const vR = Math.max(w, h) * 0.85;
      const vg = ctx.createRadialGradient(vpx, vpy, h * 0.28, vpx, vpy, vR);
      vg.addColorStop(0, "rgba(3,5,10,0)");
      vg.addColorStop(1, "rgba(3,5,10,0.52)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    };

    /** Turm-Silhouette im Aufblick (an einer Öffnungskante). */
    const wallHelperTower = (
      xInner: number, xEdge: number, zA: number, zB: number,
      seed: number, fogm: number, t: number,
    ) => {
      const dA = Math.max(0.2, zA - camZ);
      const dB = Math.max(dA + 0.01, zB - camZ);
      const sA = F / dA;
      const sB = F / dB;
      quad(
        vpx + xEdge * sA, vpy + CEIL_Y * sA,
        vpx + xInner * sA, vpy + CEIL_Y * sA,
        vpx + xInner * sB, vpy + CEIL_Y * sB,
        vpx + xEdge * sB, vpy + CEIL_Y * sB,
        col(16, 22, 44, fogm * 1.25),
      );
      // beleuchtete Fenster
      for (let i = 0; i < 3; i++) {
        const u = hash(seed * 3.7 + i);
        const v = hash(seed * 5.9 + i * 1.7);
        const xwin = xEdge + (xInner - xEdge) * (0.2 + 0.6 * u);
        const dW = dA + v * (dB - dA);
        const sW = F / dW;
        const on = hash(seed * 7.3 + i) > 0.25 || Math.sin(t * 0.8 + i * 3 + seed) > 0;
        if (on) {
          ctx.fillStyle = `rgba(255,214,120,${0.85 * fogf(dW)})`;
          ctx.fillRect(vpx + xwin * sW - 1.5, vpy + CEIL_Y * sW - 1.5, 3, 3);
        }
      }
    };

    /** Abgerundetes Rechteck als Pfad (ohne fill/stroke). */
    const rrInner = (x: number, y: number, w2: number, h2: number, r: number) => {
      rrPath(x, y, w2, h2, r);
    };

    drawRef.current = draw;

    /* ---- Loop / Lifecycle ---- */

    const loop = (now: number) => {
      const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playingRef.current) {
        camZRef.current += dt * BASE_SPEED * multRef.current;
      }
      draw(now / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(STATIC_TIME, 0);
    });
    ro.observe(wrap);
    resize();

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      reducedRef.current = mql.matches;
      setReduced(mql.matches);
      if (mql.matches) {
        stop();
        camZRef.current = STATIC_CAM_Z;
        draw(STATIC_TIME, 0);
      } else {
        start();
      }
    };
    applyMotionPref();
    mql.addEventListener("change", applyMotionPref);

    return () => {
      stop();
      ro.disconnect();
      mql.removeEventListener("change", applyMotionPref);
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 9",
          background: "var(--bg, #0a0e1a)",
          border: "1px solid var(--border, #232c47)",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={pick(T.alt, lang)}
        />
        {reduced && (
          <div
            className="absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(18, 24, 41, 0.92)",
              border: "1px solid var(--border, #232c47)",
              color: "var(--muted, #94a0bd)",
            }}
          >
            {pick(T.reduced, lang)}
          </div>
        )}
      </div>

      {!reduced && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
            style={
              playing
                ? {
                    background: "var(--surface-2, #1a2138)",
                    color: "var(--text, #f2f4fb)",
                    border: "1px solid var(--border, #232c47)",
                  }
                : {
                    background: "var(--yellow, #f6c700)",
                    color: "#141414",
                    border: "1px solid var(--yellow, #f6c700)",
                  }
            }
          >
            {playing ? pick(T.pause, lang) : pick(T.resume, lang)}
          </button>

          <div
            role="group"
            aria-label={pick(T.speed, lang)}
            className="flex overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--border, #232c47)" }}
          >
            {SPEED_LABELS.map((sl, i) => (
              <button
                key={sl.en}
                type="button"
                aria-pressed={i === speedIdx}
                onClick={() => setSpeedIdx(i)}
                className="px-3 py-2 text-sm font-medium"
                style={
                  i === speedIdx
                    ? { background: "var(--blue, #2a6fd6)", color: "#ffffff" }
                    : {
                        background: "var(--surface, #121829)",
                        color: "var(--muted, #94a0bd)",
                      }
                }
              >
                {pick(sl, lang)}
              </button>
            ))}
          </div>

          <span className="text-xs" style={{ color: "var(--muted, #94a0bd)" }}>
            {pick(T.hint, lang)}
          </span>
        </div>
      )}
    </div>
  );
}

/** pick()-Variante für den Canvas-Loop (Sprache kommt aus einem Ref). */
function pickLocal(ls: LocalizedString, lang: Lang): string {
  return ls[lang];
}
