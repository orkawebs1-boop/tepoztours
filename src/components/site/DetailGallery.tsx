"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { fmt, type Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { Icon } from "../icons";
import s from "./DetailGallery.module.css";

type GalleryPhoto = { url: string | null; caption: string; tone: string };

/**
 * Galería del detalle. Escritorio: foto principal + 4 miniaturas.
 * Móvil: foto a lo ancho con flechas, puntos y deslizar; incluye volver e idioma.
 */
export function DetailGallery({
  photos,
  name,
  dict,
  lang,
  altHref,
}: {
  photos: GalleryPhoto[];
  name: string;
  dict: Dictionary;
  lang: Lang;
  altHref: string;
}) {
  const [sel, setSel] = useState(0);
  const total = photos.length || 1;
  const list = photos.length ? photos : [{ url: null, caption: "", tone: "#4E6540" }];
  const main = list[sel] ?? list[0];
  const thumbs = list.map((p, i) => ({ ...p, i })).filter((p) => p.i !== 0).slice(0, 4);
  const other = lang === "es" ? "en" : "es";

  const go = (d: number) => setSel((v) => (v + d + total) % total);
  const touch = useRef<number | null>(null);

  return (
    <>
      {/* Escritorio y tablet */}
      <div className={`tt-section ${s.desk}`}>
        <div className={`tt-wrap ${s.grid} ${thumbs.length ? "" : s.single}`}>
          <PhotoBox key={`m-${sel}`} photo={main} className={`${s.main} ${s.fade}`} alt={main.caption || name} priority={sel === 0}>
            <span className={`tt-photo-chip ${s.count}`}>{fmt(dict.detail.photoOf, { n: sel + 1, total })}</span>
            {main.caption && (
              <span className={s.cap}>
                <Icon name="image" />
                {main.caption}
              </span>
            )}
          </PhotoBox>
          {thumbs.length > 0 && (
            <div className={s.thumbs}>
              {thumbs.map((p) => {
                const on = sel === p.i;
                return (
                  <button
                    key={p.i}
                    type="button"
                    className={`tt-ph ${s.thumb} ${on ? s.isOn : ""}`}
                    style={{ backgroundColor: p.tone }}
                    onClick={() => setSel(on ? 0 : p.i)}
                    aria-label={fmt(dict.detail.viewPhoto, { label: p.caption || String(p.i + 1) })}
                    aria-pressed={on}
                  >
                    {p.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="tt-img" src={p.url} alt="" loading="lazy" decoding="async" />
                    )}
                    {p.caption && <span className={s.thumbLabel}>{p.caption}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Móvil */}
      <div
        className={s.mob}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <PhotoBox key={`mm-${sel}`} photo={main} className={`${s.mobPhoto} ${s.fade}`} alt={main.caption || name} priority={sel === 0}>
          <div className={s.mobShade} />
          <div className={s.mobTop}>
            <Link className={s.glass} href={`/${lang}#tours`} aria-label={dict.detail.back}>
              <Icon name="chevLeft" />
            </Link>
            <span className={s.mobTopRight}>
              <span className={s.mobCount}>{fmt(dict.detail.photoOf, { n: sel + 1, total })}</span>
              <Link className={`${s.glass} ${s.glassLang}`} href={altHref} lang={other} hrefLang={other} aria-label={dict.nav.otherLang}>
                {other.toUpperCase()}
              </Link>
            </span>
          </div>
          {total > 1 && (
            <>
              <button type="button" className={`${s.glass} ${s.prev}`} onClick={() => go(-1)} aria-label={dict.detail.prevPhoto}>
                <Icon name="chevLeft" />
              </button>
              <button type="button" className={`${s.glass} ${s.next}`} onClick={() => go(1)} aria-label={dict.detail.nextPhoto}>
                <Icon name="chevRight" />
              </button>
            </>
          )}
          {main.caption && (
            <div className={s.mobCap}>
              <Icon name="image" size={16} />
              {main.caption}
            </div>
          )}
          {total > 1 && (
            <div className={s.dots} aria-hidden="true">
              {list.map((_, i) => (
                <span key={i} className={`${s.dot} ${i === sel ? s.isOn : ""}`} />
              ))}
            </div>
          )}
        </PhotoBox>
      </div>
    </>
  );
}

function PhotoBox({
  photo,
  className,
  alt,
  priority,
  children,
}: {
  photo: GalleryPhoto;
  className: string;
  alt: string;
  priority: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`tt-ph ${className}`} style={{ backgroundColor: photo.tone }}>
      {photo.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tt-img" src={photo.url} alt={alt} decoding="async" fetchPriority={priority ? "high" : undefined} />
      )}
      {children}
    </div>
  );
}
