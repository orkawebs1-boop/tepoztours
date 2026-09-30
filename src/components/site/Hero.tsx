"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { SlideView } from "@/lib/site";
import { BrandIcon, Icon } from "../icons";
import s from "./Hero.module.css";
import { ed, part } from "@/lib/edit";

/**
 * Hero con carrusel de tours (réplica del video de referencia).
 *
 * Solo se animan transform, opacity y clip-path con @keyframes que arrancan al
 * montar cada estado. La tarjeta elegida crece hasta cubrir el hero y se vuelve
 * el nuevo fondo: su capa conserva la misma llave, así que al terminar React
 * reutiliza el mismo nodo como fondo base y no hay parpadeo. Las tarjetas se
 * identifican por su posición absoluta en la fila, así que tampoco se recrean.
 */

export type HeroLabels = {
  from: string;
  mxn: string;
  bookWa: string;
  viewDetails: string;
  prev: string;
  next: string;
  viewTour: string;
};

type Transition = {
  /** Posición absoluta (sin módulo) del slide destino. */
  targetPos: number;
  /** Ranura de la tarjeta que crece (0 = primera visible). */
  slot: number;
  /** Cuántas tarjetas se recorre la fila hacia la izquierda. */
  shift: number;
  dir: 1 | -1;
};

const VISIBLE = 4;
const QUEUE = 11;

export function Hero({
  slides,
  labels,
  autoplay,
  interval,
}: {
  slides: SlideView[];
  labels: HeroLabels;
  autoplay: boolean;
  interval: number;
}) {
  const N = slides.length;
  const heroRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);
  const [tr, setTr] = useState<Transition | null>(null);
  const [timerCycle, setTimerCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const posRef = useRef(0);
  const trRef = useRef<Transition | null>(null);

  const mod = useCallback((i: number) => ((i % N) + N) % N, [N]);
  const active = N ? mod(pos) : 0;
  const busy = tr !== null;

  /* ---------- Geometría: de la tarjeta a pantalla completa ---------- */
  const measure = useCallback(() => {
    const hero = heroRef.current;
    const vp = viewportRef.current;
    if (!hero || !vp) return;
    const cs = getComputedStyle(hero);
    const cw = parseFloat(cs.getPropertyValue("--card-w")) || 210;
    const ch = parseFloat(cs.getPropertyValue("--card-h")) || 310;
    const gap = parseFloat(cs.getPropertyValue("--card-gap")) || 24;
    const r = parseFloat(cs.getPropertyValue("--card-r")) || 22;
    const lift = parseFloat(getComputedStyle(vp).paddingTop) || 0;
    const hr = hero.getBoundingClientRect();
    const vr = vp.getBoundingClientRect();
    const W = hr.width;
    const H = hr.height;
    const x0 = vr.left - hr.left;
    const y0 = vr.top - hr.top + lift;
    // Escala tipo "cover": la capa de W×H, recortada, queda del tamaño exacto de la tarjeta.
    const sc = Math.max(cw / W, ch / H);
    const ix = Math.max(0, (W - cw / sc) / 2);
    const iy = Math.max(0, (H - ch / sc) / 2);
    hero.style.setProperty("--g-s", String(sc));
    hero.style.setProperty("--g-ix", `${ix}px`);
    hero.style.setProperty("--g-iy", `${iy}px`);
    hero.style.setProperty("--g-r", `${r / sc}px`);
    hero.style.setProperty("--step", `${cw + gap}px`);
    for (let k = 0; k < VISIBLE; k++) {
      hero.style.setProperty(`--g${k}-x`, `${x0 + k * (cw + gap) - ix * sc}px`);
      hero.style.setProperty(`--g${k}-y`, `${y0 - iy * sc}px`);
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const hero = heroRef.current;
    if (!hero) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(hero);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ---------- Transiciones ---------- */
  const go = useCallback(
    (kind: "next" | "prev" | "card", k = 0) => {
      if (N < 2 || trRef.current) return;
      const p = posRef.current;
      const next: Transition =
        kind === "prev"
          ? { targetPos: p - 1, slot: 0, shift: 1, dir: -1 }
          : { targetPos: p + 1 + k, slot: Math.min(k, VISIBLE - 1), shift: k + 1, dir: 1 };
      trRef.current = next;
      setTr(next);
    },
    [N],
  );

  const finish = useCallback(() => {
    const current = trRef.current;
    if (!current) return;
    trRef.current = null;
    posRef.current = current.targetPos;
    setPos(current.targetPos);
    setTr(null);
  }, []);

  // Respaldo por si el navegador no dispara animationend (pestaña en segundo plano).
  useEffect(() => {
    if (!tr) return;
    const id = setTimeout(finish, 1400);
    return () => clearTimeout(id);
  }, [tr, finish]);

  /* ---------- Autoplay ---------- */
  const auto = autoplay && !reduced && N > 1;
  const running = auto && !busy && !paused && !hidden;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => go("next"), interval * 1000);
    return () => clearTimeout(id);
  }, [running, interval, go, pos, timerCycle]);

  useEffect(() => {
    const onVis = () => {
      setHidden(document.hidden);
      if (!document.hidden) setTimerCycle((c) => c + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Precarga el slide anterior (es el único que no está ya visible en las tarjetas).
  useEffect(() => {
    if (N < 2) return;
    const prev = slides[mod(pos - 1)];
    if (prev?.image) {
      const img = new Image();
      img.src = prev.image;
    }
  }, [pos, N, slides, mod]);

  /* ---------- Deslizar en pantallas táctiles ---------- */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") touch.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || e.pointerType !== "touch") return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? "next" : "prev");
  };

  if (N === 0) {
    return <section id="inicio" className={`${s.hero} ${s.empty}`} ref={heroRef} />;
  }

  const cur = slides[active];

  // Fila de tarjetas. En "anterior" se arma desde el destino y se anima desde -1 paso.
  const base = tr && tr.dir === -1 ? tr.targetPos : pos;
  const queue = Array.from({ length: QUEUE }, (_, i) => base + 1 + i);
  const trackClass = tr ? (tr.dir === -1 ? s.back : s.shift) : "";
  const trackStyle = tr && tr.dir === 1 ? ({ "--n": tr.shift } as CSSProperties) : undefined;

  const fillIndex = tr ? mod(tr.targetPos) : active;
  const total = String(N).padStart(2, "0");
  const growSlot = tr && tr.dir === 1 ? tr.slot : 0;

  const layers: { p: number; grow: boolean }[] = [{ p: pos, grow: false }];
  if (tr) layers.push({ p: tr.targetPos, grow: true });

  return (
    <section
      id="inicio"
      className={s.hero}
      ref={heroRef}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {/* Fondos: el actual y, durante la transición, la tarjeta que crece */}
      {layers.map((l) => {
        const sl = slides[mod(l.p)];
        return (
          <div
            key={`bg-${l.p}`}
            className={l.grow ? `${s.bg} ${s.grow}` : s.bg}
            {...(l.grow ? {} : ed(`slideimg:${sl.key}`, "image"))}
            style={
              {
                backgroundColor: sl.tone,
                ...(l.grow ? { "--gx": `var(--g${growSlot}-x)`, "--gy": `var(--g${growSlot}-y)` } : null),
              } as CSSProperties
            }
            onAnimationEnd={
              l.grow
                ? (e) => {
                    if (e.target === e.currentTarget) finish();
                  }
                : undefined
            }
          >
            {sl.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={s.bgImg}
                src={sl.image}
                alt=""
                decoding="async"
                fetchPriority={l.p === 0 && !l.grow ? "high" : undefined}
              />
            )}
            <div className={s.scrim} />
          </div>
        );
      })}
      {busy && <div className={s.dimmer} />}

      {/* Texto del slide actual */}
      <div key={`txt-${pos}`} className={`${s.txt} ${busy ? s.out : s.in}`} aria-live={paused ? "polite" : "off"}>
        <div className={`${s.fade} ${s.d1} ${s.eyebrow}`}>
          <span className={s.bar} />
          <span>
            {cur.cat} · <span {...part(`slide:${cur.key}`, "eyebrow")}>{cur.eyebrow}</span>
          </span>
        </div>
        <h1 className={`tt-d ${s.title}`} {...ed(`slide:${cur.key}`)}>
          <span className={s.mask}>
            <span className={`${s.rise} ${s.d2}`} {...part(`slide:${cur.key}`, "line1")}>
              {cur.line1}
            </span>
          </span>
          {cur.line2 && (
            <span className={s.mask}>
              <span className={`${s.rise} ${s.d3}`} {...part(`slide:${cur.key}`, "line2")}>
                {cur.line2}
              </span>
            </span>
          )}
        </h1>
        <p className={`${s.fade} ${s.d4} ${s.desc}`} {...part(`slide:${cur.key}`, "description")}>
          {cur.description}
        </p>
        <div className={`${s.fade} ${s.d5} ${s.meta}`}>
          <span className={s.metaItem}>
            <Icon name="clock" />
            {cur.dur}
          </span>
          <span className={s.metaItem}>
            <Icon name="mountain" />
            {cur.diff}
          </span>
          <span className={s.price}>
            {labels.from} <strong className="tt-d">{cur.priceTxt}</strong> {labels.mxn}
          </span>
        </div>
        <div className={`${s.fade} ${s.d6} ${s.ctas}`}>
          <a className="tt-btn tt-btn-amber" href={cur.wa} target="_blank" rel="noopener">
            <BrandIcon name="whatsapp" />
            {labels.bookWa}
          </a>
          <Link className="tt-btn tt-btn-light" href={cur.href}>
            {labels.viewDetails}
          </Link>
        </div>
      </div>

      {/* Tarjetas */}
      {N > 1 && (
        <div className={s.viewport} ref={viewportRef}>
          <div className={`${s.track} ${trackClass}`} style={trackStyle}>
            {queue.map((p, i) => {
              const sl = slides[mod(p)];
              const lifted = tr && tr.dir === 1 && i === tr.slot;
              const reachable = i < VISIBLE;
              return (
                <button
                  key={`card-${p}`}
                  type="button"
                  className={`tt-ph ${s.card}`}
                  style={{ backgroundColor: sl.tone, opacity: lifted ? 0 : 1 }}
                  onClick={reachable ? () => go("card", i) : undefined}
                  tabIndex={reachable ? 0 : -1}
                  aria-hidden={reachable ? undefined : true}
                  aria-label={`${labels.viewTour} ${sl.name}`}
                >
                  {sl.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.cardImg} src={sl.image} alt="" loading={i < 5 ? "eager" : "lazy"} decoding="async" />
                  )}
                  <span className={s.cardNum}>{sl.num}</span>
                  <span className={s.cardBody}>
                    <span className={s.cardBar} />
                    <span className={s.cardCat}>{sl.cat}</span>
                    <span className={`tt-d ${s.cardTitle}`}>{sl.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles, progreso y contador */}
      {N > 1 && (
        <div className={s.controls}>
          <button type="button" className={s.arrow} onClick={() => go("prev")} aria-label={labels.prev}>
            <Icon name="chevLeft" />
          </button>
          <button type="button" className={s.arrow} onClick={() => go("next")} aria-label={labels.next}>
            <Icon name="chevRight" />
          </button>
          <div className={s.progress}>
            <div className={s.fill} style={{ transform: `scaleX(${(fillIndex + 1) / N})` }} />
          </div>
        </div>
      )}
      <div className={s.counter} aria-hidden="true">
        <span className={`tt-d ${s.count}`}>
          <span key={`num-${pos}`} className={`${s.num} ${busy ? s.numOut : s.roll}`}>
            {cur.num}
          </span>
        </span>
        <span className={`tt-d ${s.total}`}>/ {total}</span>
      </div>

      {running && <div key={`timer-${pos}-${timerCycle}`} className={s.timer} style={{ animationDuration: `${interval}s` }} />}
    </section>
  );
}
