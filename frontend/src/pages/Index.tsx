import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Soft sand-particle text:
 *  - Only grains (no solid fill)
 *  - Each grain has a random fade-in start and duration
 *  - Text slowly forms over ~3.5 s, holds, then dissolves (except final line)
 *  - Warm-gray calming background
 */

type Grain = {
  x: number; y: number;
  ox: number; oy: number;
  vx: number; vy: number;
  alpha: number;
  size: number;
  shade: number;
  fadeInStart: number; // ms offset
  fadeInDur: number;   // ms duration
};

const MESSAGES = [
  "We are really sorry\nfor your loss.",
  "We are here to make this\n a little clearer and lighter.",
  "When you are ready,\nwe have a few gentle questions."
];

export default function Index() {
  const navigate = useNavigate();
  const handleContinue = useCallback(() => navigate("/survey"), [navigate]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [idx, setIdx] = useState(0);
  const isLast = idx === MESSAGES.length - 1;

  const T_APPEAR = 3500;
  const T_HOLD   = 2000;
  const T_OUT    = 2000;
  const T_TOTAL  = T_APPEAR + T_HOLD + T_OUT;

  const phaseStartRef = useRef<number>(0);
  const phaseRef = useRef<"in"|"hold"|"out"|"static">("in");
  const grainsRef = useRef<Grain[]>([]);

  function fit() {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = window.innerWidth, h = window.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function layoutText(ctx: CanvasRenderingContext2D, lines: string[], W: number, H: number) {
    const margin = 0.08;
    const maxW = W * (1 - 2 * margin);
    const maxH = H * (1 - 2 * margin);
    let lo = 16, hi = Math.min(W, H), best = 48;

    const apply = (px: number) => {
      ctx.font = `900 ${px}px "Arial Black", system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };

    while (hi - lo > 0.5) {
      const mid = (hi + lo) / 2;
      apply(mid);
      const widths = lines.map(l => ctx.measureText(l).width);
      const widest = Math.max(...widths);
      const gap = mid * 0.14;
      const blockH = lines.length * mid + (lines.length - 1) * gap;
      if (widest <= maxW && blockH <= maxH) { best = mid; lo = mid; } else { hi = mid; }
    }
    apply(best);
    return { fontPx: best, lineGap: best * 0.14 };
  }

  function seed(message: string) {
    const c = canvasRef.current;
    if (!c) return;
    const W = c.width / (window.devicePixelRatio || 1);
    const H = c.height / (window.devicePixelRatio || 1);

    let off = offscreenRef.current;
    if (!off) off = offscreenRef.current = document.createElement("canvas");
    off.width = Math.floor(W);
    off.height = Math.floor(H);
    const octx = off.getContext("2d")!;
    octx.clearRect(0, 0, W, H);

    const lines = message.split("\n").map(s => s.trim());
    const { fontPx, lineGap } = layoutText(octx, lines, W, H);
    const blockH = lines.length * fontPx + (lines.length - 1) * lineGap;
    const startY = H / 2 - blockH / 2;

    octx.fillStyle = "#ffffffff";
    lines.forEach((ln, i) => {
      const y = startY + i * (fontPx + lineGap) + fontPx / 2;
      octx.fillText(ln, W / 2, y);
    });

    const data = octx.getImageData(0, 0, W, H).data;
    const step = Math.max(1, Math.floor(fontPx / 36)); // very dense
    const grains: Grain[] = [];

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const a = data[((y|0)*(W|0)+(x|0))*4 + 3];
        if (a > 10) {
          const jx = (Math.random() - 0.5) * step * 0.4;
          const jy = (Math.random() - 0.5) * step * 0.4;
          const dir = Math.random() * Math.PI * 2;
          const spd = 0.15 + Math.random() * 0.45;
          const fadeStart = Math.random() * 2000; // random offset up to 2s
          const fadeDur = 1000 + Math.random() * 1500; // 1–2.5 s
          grains.push({
            x: x + jx, y: y + jy,
            ox: x + jx, oy: y + jy,
            vx: Math.cos(dir)*spd, vy: Math.sin(dir)*spd,
            alpha: 0,
            size: 0.8 + Math.random()*0.6,
            shade: 230 + Math.random() * 25, 
            fadeInStart: fadeStart,
            fadeInDur: fadeDur
          });
        }
      }
    }

    grainsRef.current = grains;
    phaseRef.current = "in";
    phaseStartRef.current = performance.now();
  }

  useEffect(() => {
    if (isLast) return;
    const t = setTimeout(() => setIdx(i => Math.min(i+1, MESSAGES.length-1)), T_TOTAL);
    return () => clearTimeout(t);
  }, [idx]);

  useEffect(() => {
    fit();
    seed(MESSAGES[idx]);
    const onResize = () => { fit(); seed(MESSAGES[idx]); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [idx]);

  useEffect(() => {
    fit();

    const loop = (t: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const W = c.width / (window.devicePixelRatio || 1);
      const H = c.height / (window.devicePixelRatio || 1);

      // peaceful warm gray
      // calm neutral gray background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "hsla(0, 0%, 0%, 1.00)");  // light gray top
      bg.addColorStop(1, "hsla(0, 0%, 0%, 1.00)");  // slightly darker bottom
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // very subtle drifting light to keep it alive
      const cx = W * 0.5 + Math.sin(t * 0.00025) * W * 0.06;
      const cy = H * 0.4 + Math.cos(t * 0.0003) * H * 0.05;
      const rg = ctx.createRadialGradient(
        cx, cy, Math.min(W, H) * 0.15,
        cx, cy, Math.max(W, H) * 0.9
      );
      rg.addColorStop(0, "rgba(255,255,255,0.08)"); // faint inner light
      rg.addColorStop(1, "rgba(0,0,0,0.08)");       // subtle outer shadow
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      const elapsed = t - phaseStartRef.current;
      let phase = phaseRef.current;
      if (isLast) {
        if (phase === "in" && elapsed >= T_APPEAR) { phaseRef.current = "static"; phase = "static"; }
      } else {
        if (phase === "in" && elapsed >= T_APPEAR) { phaseRef.current = "hold"; phaseStartRef.current = t; phase = "hold"; }
        else if (phase === "hold" && elapsed >= T_HOLD) { phaseRef.current = "out"; phaseStartRef.current = t; phase = "out"; }
      }

      const grains = grainsRef.current;
      for (const g of grains) {
        if (phase === "in" || phase === "hold" || phase === "static") {
          const localT = Math.max(0, elapsed - g.fadeInStart);
          const progress = Math.min(1, localT / g.fadeInDur);
          const ease = progress * progress * (3 - 2 * progress);
          g.alpha = (phase === "static" || phase === "hold") ? 1 : ease;
          g.x = g.ox + Math.sin((g.ox + t*0.03)*0.015)*0.2;
          g.y = g.oy + Math.cos((g.oy + t*0.02)*0.015)*0.2;
        } else if (phase === "out") {
          const k = Math.min(1, elapsed / T_OUT);
          const ease = 1 - Math.pow(1 - k, 2);
          g.x += g.vx * (1 + k*1.2);
          g.y += g.vy * (1 + k*1.2);
          g.alpha = 1 - ease;
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const g of grains) {
        if (g.alpha <= 0) continue;
        ctx.globalAlpha = g.alpha;
        const s = g.shade | 0;
        ctx.fillStyle = `rgb(${s},${s},${s})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [idx, isLast]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="relative z-10 h-screen w-full flex flex-col justify-end items-center pb-10">
        {isLast && (
          <button
            onClick={handleContinue}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}