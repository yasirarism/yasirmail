'use client';

import { useEffect, useRef } from 'react';

type Star = {
  angle: number;
  radius: number;
  r: number;
  alpha: number;
  speed: number;
  twinklePhase: number;
  twinkleSpeed: number;
  // fixed position (light mode uniform layout); undefined = orbit around center
  x?: number;
  y?: number;
  // fixed colorful rgb for light mode; null = use theme starRgb
  colorRgb?: string | null;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ux: number;
  uy: number;
  life: number;
  maxLife: number;
  length: number;
};

type StarfieldProps = {
  density?: number; // 0..1 — how many stars
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Twinkling starfield + shooting stars (custom canvas, like premiumisme.co).
 * Theme-aware: bright stars in dark themes (glass/neomorph), subtle dark
 * stars in light theme (brutal). Respects prefers-reduced-motion.
 */
export function Starfield({ density = 0.5, className, style }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let meteorTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const readTheme = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'brutal';
      const dark = t === 'glass' || t === 'neomorph';
      const isCandy = t === 'candy';
      return {
        dark,
        // star fill — light mode uses a colorful palette (brutal/candy), white in dark themes
        starRgb: dark ? '255,255,255' : '',
        // meteor gradient colors: pastel purple for candy, light blue for dark, dark ink for brutal
        meteorRgb: isCandy ? '167,139,250' : dark ? '200,210,255' : '26,26,26',
        // overall opacity multiplier (light theme stays subtle)
        opacity: dark ? 1 : isCandy ? 0.95 : 0.9,
      };
    };

    let theme = readTheme();

    // Listen for theme changes (brutal <-> glass <-> neomorph)
    const themeObserver = new MutationObserver(() => {
      theme = readTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    resize();
    window.addEventListener('resize', resize);

    const centerX = w / 2;
    const centerY = h / 2;

    // Stars: orbit around viewport center (like premiumisme) — radius clamped so
    // every star stays on screen and visibly drifts. Light mode: bigger, colorful.
    const count = Math.round(((w * h) / 3500) * Math.max(0.15, density));
    const maxRadius = Math.min(w, h) / 2 + 20;
    const LIGHT_PALETTE = ['255,107,107', '255,159,28', '250,204,21', '74,222,128', '96,165,250', '167,139,250', '244,114,182', '45,212,191'];
    const stars: Star[] = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.sqrt(Math.random()) * Math.max(30, maxRadius),
      r: theme.dark ? 1.3 * Math.random() + 0.3 : 1.8 * Math.random() + 1.0,
      alpha: 0.5 * Math.random() + 0.25,
      speed: 0.5 * Math.random() + 0.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 * Math.random() + 0.006,
      // fixed colorful rgb for light mode; ignored in dark mode (white stars)
      colorRgb: theme.dark
        ? null
        : LIGHT_PALETTE[Math.floor(Math.random() * LIGHT_PALETTE.length)],
    }));

    const meteors: Meteor[] = [];
    let rotation = 0;

    // Spawn a shooting star periodically
    const spawnMeteor = () => {
      if (disposed) return;
      const t = 0.3 * w * Math.random();
      const r = 0.3 * h * Math.random();
      const angle = Math.PI / 4 + (0.3 * Math.random() - 0.15); // diagonal top-left -> bottom-right
      const magnitude = (6 * Math.random() + 8) * 0.63;
      const vx = Math.cos(angle) * magnitude;
      const vy = Math.sin(angle) * magnitude;
      const dist = Math.hypot(vx, vy);
      meteors.push({
        x: t,
        y: r,
        vx,
        vy,
        ux: vx / dist,
        uy: vy / dist,
        life: 0,
        maxLife: 40 * Math.random() + 40,
        length: 80 * Math.random() + 60,
      });
      meteorTimer = setTimeout(spawnMeteor, 1500 * Math.random() + 900);
    };

    const draw = () => {
      if (disposed) return;
      ctx.clearRect(0, 0, w, h);
      const { starRgb, meteorRgb, opacity } = theme;

      if (!prefersReduced) rotation += 0.0015;

      // Stars (orbit + twinkle for dark; fixed-position twinkle for light)
      for (const star of stars) {
        const sx = star.x ?? (centerX + Math.cos(star.angle + rotation * star.speed) * star.radius);
        const sy = star.y ?? (centerY + Math.sin(star.angle + rotation * star.speed) * star.radius);
        if (!prefersReduced) star.twinklePhase += star.twinkleSpeed;
        const tw = prefersReduced
          ? star.alpha
          : Math.max(0, Math.min(1, star.alpha + 0.3 * Math.sin(star.twinklePhase)));
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${star.colorRgb ?? starRgb},${(tw * opacity).toFixed(3)})`;
        ctx.fill();
      }

      // Meteors (shooting stars with gradient trail)
      if (!prefersReduced) {
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.life++;
          if (m.life >= m.maxLife || m.x > w + 100 || m.y > h + 100) {
            meteors.splice(i, 1);
            continue;
          }
          const tailX = m.x - m.ux * m.length;
          const tailY = m.y - m.uy * m.length;
          const fade = Math.min(1, m.life / 6) * Math.min(1, (m.maxLife - m.life) / 10) * opacity;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(${meteorRgb},${(0.9 * fade).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${meteorRgb},0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(m.x, m.y, 1.6, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(${starRgb},${fade.toFixed(3)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    if (!prefersReduced) {
      meteorTimer = setTimeout(spawnMeteor, 1200 * Math.random() + 600);
      raf = requestAnimationFrame(draw);
    } else {
      // Reduced motion: draw a single static frame (no meteors)
      ctx.clearRect(0, 0, w, h);
      const { starRgb, opacity } = theme;
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(centerX + Math.cos(star.angle) * star.radius, centerY + Math.sin(star.angle) * star.radius, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${starRgb},${(star.alpha * opacity).toFixed(3)})`;
        ctx.fill();
      }
    }

    return () => {
      disposed = true;
      window.removeEventListener('resize', resize);
      themeObserver.disconnect();
      if (meteorTimer) clearTimeout(meteorTimer);
      cancelAnimationFrame(raf);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
