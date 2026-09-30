import Link from "next/link";
import { fmt, type Dictionary } from "@/lib/i18n";
import { prettyPhone } from "@/lib/format";
import type { ChromeData } from "@/lib/site";
import type { Lang } from "@/lib/types";
import { BrandIcon } from "../icons";
import { Logo } from "../Logo";
import { Socials } from "./Socials";
import s from "./Footer.module.css";
import { ed } from "@/lib/edit";

export function Footer({
  lang,
  dict,
  chrome,
  compact = false,
}: {
  lang: Lang;
  dict: Dictionary;
  chrome: ChromeData;
  /** Versión corta del detalle de tour. */
  compact?: boolean;
}) {
  const year = new Date().getFullYear();
  const base = `/${lang}`;
  const sections = [
    { id: "inicio", label: dict.nav.home },
    { id: "tours", label: dict.nav.tours },
    { id: "explorar", label: dict.nav.explore },
    { id: "nosotros", label: dict.nav.about },
    { id: "galeria", label: dict.footer.gallery },
    { id: "preguntas", label: dict.footer.faq },
    { id: "contacto", label: dict.nav.contact },
  ];
  const phone = prettyPhone(chrome.whatsapp) || `777 ${dict.contact.phonePending}`;

  if (compact) {
    return (
      <footer className={`tt-section ${s.footer} ${s.compact}`}>
        <div className={`tt-wrap ${s.compactTop}`}>
          <Link href={base} aria-label={dict.nav.homeAria} className={s.logo}>
            <Logo size={40} textSize={26} logoUrl={chrome.logoUrl} name={chrome.name} />
          </Link>
          <nav aria-label={dict.footer.nav} className={s.compactNav}>
            {sections
              .filter((x) => !["galeria", "preguntas"].includes(x.id))
              .map((x) => (
                <a key={x.id} className={s.link} href={`${base}#${x.id}`}>
                  {x.label}
                </a>
              ))}
          </nav>
        </div>
        <div className={`tt-wrap ${s.bottom}`}>
          <span>{fmt(dict.footer.rights, { year })}</span>
          <a className={s.link} href="#">
            {dict.footer.privacy}
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`tt-section ${s.footer}`}>
      <div className={`tt-wrap ${s.grid}`}>
        <div className={s.brand}>
          <Link href={base} aria-label={dict.nav.homeAria} className={s.logo}>
            <Logo logoUrl={chrome.logoUrl} name={chrome.name} />
          </Link>
          <p className={s.blurb} {...ed("text:footer.blurb")}>
            {dict.footer.blurb}
          </p>
          <a className={`tt-btn tt-btn-amber ${s.cta}`} href={chrome.waGeneral} target="_blank" rel="noopener">
            <BrandIcon name="whatsapp" />
            {dict.common.bookWa}
          </a>
        </div>
        <div className={s.col}>
          <h4 className={s.fh}>{dict.footer.tours}</h4>
          <div className={s.links}>
            {chrome.tours.map((x) => (
              <Link key={x.slug} className={s.link} href={x.href}>
                {x.name}
              </Link>
            ))}
          </div>
        </div>
        <div className={s.col}>
          <h4 className={s.fh}>{dict.footer.explore}</h4>
          <div className={s.links}>
            {sections.map((x) => (
              <a key={x.id} className={s.link} href={`#${x.id}`}>
                {x.label}
              </a>
            ))}
          </div>
        </div>
        <div className={s.col}>
          <h4 className={s.fh}>{dict.footer.follow}</h4>
          {chrome.social && <Socials social={chrome.social} tone="footer" />}
          <p className={s.contact}>
            +52 {phone}
            <br />
            {chrome.email || dict.contact.emailPending}
            <br />
            {dict.footer.town}
          </p>
        </div>
      </div>
      <div className={`tt-wrap ${s.bottom}`}>
        <span>{fmt(dict.footer.rights, { year })}</span>
        <a className={s.link} href="#">
          {dict.footer.privacy}
        </a>
      </div>
    </footer>
  );
}
