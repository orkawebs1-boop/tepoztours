"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { ChromeData } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { BrandIcon, Icon } from "../icons";
import { Logo } from "../Logo";
import { Socials } from "./Socials";
import s from "./Header.module.css";

type Section = "inicio" | "tours" | "explorar" | "nosotros" | "contacto";

export function Header({
  lang,
  dict,
  chrome,
  variant,
  active,
  altHref,
  waHref,
}: {
  lang: Lang;
  dict: Dictionary;
  chrome: ChromeData;
  /** "overlay" va encima del hero; "solid" lleva fondo verde (detalle). */
  variant: "overlay" | "solid";
  active: Section;
  altHref: string;
  /** Enlace del botón Reservar; en el detalle es el mensaje del tour. */
  waHref: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const base = variant === "overlay" ? "" : `/${lang}`;
  const other = lang === "es" ? "en" : "es";

  const links: { id: Section; label: string }[] = [
    { id: "inicio", label: dict.nav.home },
    { id: "tours", label: dict.nav.tours },
    { id: "explorar", label: dict.nav.explore },
    { id: "nosotros", label: dict.nav.about },
    { id: "contacto", label: dict.nav.contact },
  ];

  return (
    <header className={`${s.header} ${variant === "solid" ? s.solid : s.overlay}`}>
      <Link href={`/${lang}`} aria-label={dict.nav.homeAria} className={s.logo}>
        <Logo logoUrl={chrome.logoUrl} name={chrome.name} />
      </Link>

      <nav aria-label={dict.nav.main} className={s.nav}>
        {links.map((l) => (
          <a
            key={l.id}
            className={`${s.navLink} ${active === l.id ? s.isOn : ""}`}
            href={`${base}#${l.id}`}
            aria-current={active === l.id ? "page" : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className={s.tools}>
        <SearchBox dict={dict} chrome={chrome} className={s.searchDesk} />
        {chrome.social && <Socials social={chrome.social} className={s.socialsDesk} />}
        <nav className={s.lang} aria-label={dict.nav.lang}>
          {(["es", "en"] as const).map((code) =>
            code === lang ? (
              <span key={code} className={s.isOn} aria-current="true" lang={code}>
                {code.toUpperCase()}
              </span>
            ) : (
              <Link key={code} href={altHref} lang={code} hrefLang={code} aria-label={dict.nav.otherLang}>
                {code.toUpperCase()}
              </Link>
            ),
          )}
        </nav>
        <Link
          href={altHref}
          lang={other}
          hrefLang={other}
          aria-label={dict.nav.otherLang}
          className={`${s.iconBtn} ${s.langBtn}`}
        >
          {other.toUpperCase()}
        </Link>
        <button type="button" className={`${s.iconBtn} ${s.searchBtn}`} aria-label={dict.nav.search} onClick={() => setSearchOpen(true)}>
          <Icon name="search" />
        </button>
        <a className={`tt-btn tt-btn-amber ${s.book}`} href={waHref} target="_blank" rel="noopener">
          <BrandIcon name="whatsapp" />
          {dict.common.book}
        </a>
        <button
          type="button"
          className={`${s.iconBtn} ${s.menuBtn}`}
          aria-label={dict.nav.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>

      {menuOpen && (
        <MobileMenu
          dict={dict}
          chrome={chrome}
          links={links}
          base={base}
          active={active}
          waHref={waHref}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {searchOpen && <SearchOverlay dict={dict} chrome={chrome} onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

function useTourMatches(chrome: ChromeData, query: string) {
  return useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return chrome.tours.filter((x) => normalize(x.name).includes(q));
  }, [chrome.tours, query]);
}

function normalize(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function SearchBox({ dict, chrome, className }: { dict: Dictionary; chrome: ChromeData; className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useTourMatches(chrome, query);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div className={`${s.searchWrap} ${className ?? ""}`} ref={wrap}>
      <label className={s.search}>
        <Icon name="search" />
        <input
          type="search"
          placeholder={dict.nav.search}
          aria-label={dict.nav.search}
          value={query}
          role="combobox"
          aria-expanded={open && query.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && matches[0]) window.location.href = matches[0].href;
          }}
        />
      </label>
      {open && query.trim() && (
        <div className={s.results} id={listId} role="listbox">
          {matches.length ? (
            matches.map((m) => (
              <Link key={m.slug} href={m.href} className={s.result} role="option" aria-selected="false">
                {m.name}
                <Icon name="arrowRight" />
              </Link>
            ))
          ) : (
            <p className={s.noResult}>{dict.nav.searchEmpty}</p>
          )}
        </div>
      )}
    </div>
  );
}

function useOverlay(onClose: () => void) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return closeRef;
}

function SearchOverlay({ dict, chrome, onClose }: { dict: Dictionary; chrome: ChromeData; onClose: () => void }) {
  const closeRef = useOverlay(onClose);
  const [query, setQuery] = useState("");
  const matches = useTourMatches(chrome, query);
  const list = query.trim() ? matches : chrome.tours;
  return (
    <div className={s.overlayPanel} role="dialog" aria-modal="true" aria-label={dict.nav.search}>
      <div className={s.overlayTop}>
        <label className={`${s.search} ${s.searchBig}`}>
          <Icon name="search" />
          <input
            type="search"
            placeholder={dict.nav.search}
            aria-label={dict.nav.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </label>
        <button ref={closeRef} type="button" className={s.iconBtn} aria-label={dict.nav.closeMenu} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className={s.overlayList}>
        {list.length ? (
          list.map((m) => (
            <Link key={m.slug} href={m.href} className={s.overlayResult} onClick={onClose}>
              <span className="tt-d">{m.name}</span>
              <Icon name="arrowRight" />
            </Link>
          ))
        ) : (
          <p className={s.noResultDark}>{dict.nav.searchEmpty}</p>
        )}
      </div>
    </div>
  );
}

function MobileMenu({
  dict,
  chrome,
  links,
  base,
  active,
  waHref,
  onClose,
}: {
  dict: Dictionary;
  chrome: ChromeData;
  links: { id: Section; label: string }[];
  base: string;
  active: Section;
  waHref: string;
  onClose: () => void;
}) {
  const closeRef = useOverlay(onClose);
  return (
    <div className={s.overlayPanel} role="dialog" aria-modal="true" aria-label={dict.nav.main}>
      <div className={s.overlayTop}>
        <span className={s.logo}>
          <Logo size={36} textSize={23} logoUrl={chrome.logoUrl} name={chrome.name} />
        </span>
        <button ref={closeRef} type="button" className={s.iconBtn} aria-label={dict.nav.closeMenu} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <nav aria-label={dict.nav.main} className={s.menuLinks}>
        {links.map((l, i) => (
          <a
            key={l.id}
            href={`${base}#${l.id}`}
            className={`tt-d ${s.menuLink} ${active === l.id ? s.isOn : ""}`}
            style={{ animationDelay: `${0.04 * i}s` }}
            onClick={onClose}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className={s.menuFoot}>
        <a className="tt-btn tt-btn-amber" href={waHref} target="_blank" rel="noopener">
          <BrandIcon name="whatsapp" />
          {dict.common.bookWa}
        </a>
        {chrome.social && <Socials social={chrome.social} />}
      </div>
    </div>
  );
}
