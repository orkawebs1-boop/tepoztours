import type { Dictionary } from "@/lib/i18n";
import { prettyPhone } from "@/lib/format";
import type { ChromeData } from "@/lib/site";
import { BrandIcon, Icon } from "../icons";
import { Socials } from "./Socials";
import s from "./Contact.module.css";
import { ed } from "@/lib/edit";

export function Contact({ dict, chrome }: { dict: Dictionary; chrome: ChromeData }) {
  const phone = prettyPhone(chrome.whatsapp) || `777 ${dict.contact.phonePending}`;
  const email = chrome.email || dict.contact.emailPending;
  const mapsQuery = encodeURIComponent(
    chrome.address && !chrome.address.includes("[") ? chrome.address : "Tepoztlán, Morelos",
  );
  const rows = [
    { icon: <BrandIcon name="whatsapp" />, k: dict.contact.whatsapp, v: `+52 ${phone}`, href: chrome.whatsapp ? chrome.waGeneral : undefined },
    { icon: <Icon name="mail" />, k: dict.contact.email, v: email, href: chrome.email ? `mailto:${chrome.email}` : undefined },
    { icon: <Icon name="pin" />, k: dict.contact.meeting, v: chrome.address },
    { icon: <Icon name="clock" />, k: dict.contact.hours, v: chrome.hours },
  ];
  return (
    <section id="contacto" className={`tt-section ${s.section}`}>
      <div className={`tt-wrap ${s.layout}`}>
        <div className={s.side}>
          <div className={`tt-eyebrow ${s.eyebrow}`}>{dict.contact.eyebrow}</div>
          <h2 className={`tt-d ${s.title}`} {...ed("text:contact.title")}>
            {dict.contact.title}
          </h2>
          <p className={s.intro} {...ed("text:contact.intro")}>
            {dict.contact.intro}
          </p>
          <div className={s.rows} {...ed("settings")}>
            {rows.map((r) => (
              <div key={r.k} className={s.row}>
                <span className={s.rowIco}>{r.icon}</span>
                <span>
                  <span className={s.rowK}>{r.k}</span>
                  {r.href ? (
                    <a className={s.rowV} href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener">
                      {r.v}
                    </a>
                  ) : (
                    <span className={s.rowV}>{r.v}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className={s.actions}>
            <a className="tt-btn tt-btn-amber" href={chrome.waGeneral} target="_blank" rel="noopener">
              <BrandIcon name="whatsapp" />
              {dict.contact.write}
            </a>
            {chrome.social && <Socials social={chrome.social} tone="dark" className={s.socials} />}
          </div>
        </div>

        <div className={s.map}>
          <svg viewBox="0 0 680 560" aria-hidden="true" className={s.mapSvg} preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="0" width="680" height="560" fill="#EFE3CB" />
            <path d="M-20 470C120 430 200 500 340 470C480 440 560 500 700 470" fill="none" stroke="#A9BFB4" strokeWidth="12" strokeLinecap="round" />
            <g stroke="#FFFBF4" strokeWidth="12" strokeLinecap="round" fill="none">
              <path d="M-20 190L700 150" /><path d="M-20 318L700 280" /><path d="M-20 420L700 390" />
              <path d="M120 60L150 600" /><path d="M300 60L324 600" /><path d="M490 60L506 600" />
            </g>
            <g fill="#E2D2B2">
              <rect x="160" y="200" width="126" height="92" rx="6" /><rect x="338" y="192" width="140" height="80" rx="6" /><rect x="160" y="328" width="130" height="64" rx="6" /><rect x="520" y="182" width="150" height="84" rx="6" /><rect x="10" y="206" width="96" height="94" rx="6" /><rect x="520" y="300" width="150" height="72" rx="6" />
            </g>
            <rect x="338" y="296" width="140" height="84" rx="10" fill="#B7BF98" />
            <path d="M0 0H680V82L640 58L600 86L560 34L520 72L480 26L440 66L400 40L360 76L320 30L280 70L240 44L200 78L160 38L120 74L80 48L40 80L0 54Z" fill="#CDB891" />
            <text x="408" y="344" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" fontWeight="700" fill="#4E6540">
              {dict.contact.square}
            </text>
          </svg>
          <div className={s.marker}>
            <div className={s.bubble}>
              <strong>{dict.contact.meeting}</strong>
              <span>{dict.contact.downtown}</span>
            </div>
            <svg width="44" height="56" viewBox="0 0 44 56" aria-hidden="true">
              <path d="M22 54S4 36 4 22a18 18 0 0 1 36 0c0 14-18 32-18 32z" fill="var(--terra)" />
              <circle cx="22" cy="22" r="7" fill="#FFFBF4" />
            </svg>
          </div>
          <a
            className={`tt-btn tt-btn-forest ${s.directions}`}
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener"
          >
            <Icon name="pin" />
            {dict.contact.directions}
          </a>
        </div>
      </div>
    </section>
  );
}
