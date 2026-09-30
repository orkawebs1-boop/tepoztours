"use client";

import { useState } from "react";
import { fmt, type Dictionary } from "@/lib/i18n";
import type { TourView } from "@/lib/site";
import { CATEGORIES, type Category } from "@/lib/types";
import { Icon, type IconName } from "../icons";
import s from "./Explore.module.css";
import { ed } from "@/lib/edit";

const CAT_STYLE: Record<Category, { tone: string; icon: IconName }> = {
  senderismo: { tone: "#4E6540", icon: "mountain" },
  aventura: { tone: "#3D3632", icon: "compass" },
  cultura: { tone: "#9C4A2F", icon: "temple" },
  bienestar: { tone: "#7A4634", icon: "leaf" },
};

export function Explore({ tours, dict }: { tours: TourView[]; dict: Dictionary }) {
  const [cat, setCat] = useState<Category | null>(null);
  const [first, second] = dict.explore.title.split("\n");

  return (
    <section id="explorar" className={`tt-section ${s.section}`}>
      <div className={`tt-wrap ${s.layout}`}>
        <div className={s.side}>
          <div className={`tt-eyebrow ${s.eyebrow}`}>{dict.explore.eyebrow}</div>
          <h2 className={`tt-d ${s.title}`} {...ed("text:explore.title")}>
            {first}
            {second && (
              <>
                <br className={s.br} /> {second}
              </>
            )}
          </h2>
          <p className={s.intro}>
            <span className={s.introDesk} {...ed("text:explore.intro")}>
              {dict.explore.intro}
            </span>
            <span className={s.introMob} {...ed("text:explore.introMobile")}>
              {dict.explore.introMobile}
            </span>
          </p>
          <div className={s.cats}>
            {CATEGORIES.map((c) => {
              const list = tours.filter((x) => x.category === c);
              const cover = list.find((x) => x.cover)?.cover;
              const on = cat === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`tt-ph ${s.cat} ${on ? s.isOn : ""}`}
                  style={{ backgroundColor: CAT_STYLE[c].tone }}
                  aria-pressed={on}
                  onClick={() => setCat(on ? null : c)}
                >
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.catImg} src={cover} alt="" loading="lazy" decoding="async" />
                  )}
                  <span className={s.catIco}>
                    <Icon name={CAT_STYLE[c].icon} />
                  </span>
                  <span className={s.catText}>
                    <span className={`tt-d ${s.catName}`}>{dict.category[c]}</span>
                    <span className={s.catCount}>
                      {list.length === 1 ? dict.explore.count1 : fmt(dict.explore.countN, { n: list.length })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className={s.linkBtn} onClick={() => setCat(null)} aria-pressed={cat === null}>
            {dict.explore.showAll}
          </button>
        </div>

        <div className={s.mapCol}>
          <div className={s.map}>
            <MapArt dict={dict} />
            {tours.map((x, i) => (
              <a
                key={x.id}
                href={x.href}
                className={`${s.pin} ${cat && x.category !== cat ? s.isDim : ""}`}
                style={{ left: `${(x.mapX / 640) * 100}%`, top: `${(x.mapY / 820) * 100}%` }}
                aria-label={x.name}
              >
                <span className={s.pinDot}>{i + 1}</span>
                <span className={s.pinLabel}>{x.pinLabel}</span>
              </a>
            ))}
            <span className={s.mapNote}>
              <span className={s.introDesk}>{dict.explore.mapNote}</span>
              <span className={s.introMob}>{dict.explore.mapNoteShort}</span>
            </span>
          </div>
          <ul className={s.legend}>
            {tours.map((x, i) => (
              <li key={x.id} className={cat && x.category !== cat ? s.isDim : ""}>
                <span className={s.legendN}>{i + 1}</span>
                {x.pinLabel}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Mapa ilustrado de Tepoztlán (SVG del diseño, 640×820). */
export function MapArt({ dict }: { dict: Pick<Dictionary, "explore"> }) {
  return (
    <svg viewBox="0 0 640 820" aria-hidden="true" className={s.mapSvg} preserveAspectRatio="xMidYMid slice">
      <rect x="0" y="0" width="640" height="820" fill="#EFE3CB" />
      <g fill="none" stroke="#E2D2B2" strokeWidth="1.4">
        <path d="M-10 260 C90 210 190 262 300 232 C410 202 520 250 650 214" />
        <path d="M-10 312 C100 272 200 312 310 286 C420 260 520 300 650 270" />
        <path d="M-10 820 C60 760 40 700 110 660 C170 626 230 650 260 612" />
        <path d="M650 560 C590 540 560 592 500 582 C440 572 430 522 380 522" />
        <path d="M650 470 C600 452 570 490 530 480" />
      </g>
      <path d="M0 0H640V130L604 96L572 128L540 74L508 112L474 64L444 106L410 58L380 98L352 60L322 100L290 62L258 104L226 66L196 110L162 72L130 114L98 78L64 118L32 88L0 120Z" fill="#B39C6E" />
      <path d="M0 0H640V190L610 156L584 182L556 124L528 164L498 110L468 150L436 100L404 146L372 116L340 96L312 140L282 104L250 152L220 114L188 162L156 124L124 170L92 130L60 172L30 142L0 182Z" fill="#CDB891" />
      <g fill="none" stroke="#B29C70" strokeWidth="1.3">
        <path d="M340 96L352 130M340 96L327 126M556 124L566 152M436 100L447 130M498 110L507 136M282 104L290 132M156 124L164 150M92 130L99 156" />
      </g>
      <path d="M330 98h20v-5h-3v-5h-14v5h-3z" fill="#7E6A40" />
      <path d="M20 820C70 740 60 662 120 592C170 532 150 472 200 412C240 362 230 302 270 252" fill="none" stroke="#A9BFB4" strokeWidth="9" strokeLinecap="round" />
      <g fill="#B7BF98">
        <circle cx="86" cy="300" r="9" /><circle cx="108" cy="288" r="7" /><circle cx="170" cy="298" r="8" /><circle cx="186" cy="322" r="7" /><circle cx="96" cy="364" r="8" /><circle cx="172" cy="370" r="9" /><circle cx="138" cy="392" r="7" /><circle cx="72" cy="334" r="7" /><circle cx="206" cy="352" r="6" />
        <circle cx="540" cy="330" r="8" /><circle cx="562" cy="352" r="6" /><circle cx="516" cy="356" r="7" /><circle cx="590" cy="318" r="7" />
      </g>
      <g fill="#E3D3B0" stroke="#D5C29C" strokeWidth="1">
        <rect x="70" y="548" width="74" height="46" rx="6" /><rect x="152" y="540" width="60" height="40" rx="6" /><rect x="84" y="604" width="62" height="42" rx="6" /><rect x="196" y="618" width="54" height="40" rx="6" />
      </g>
      <path d="M430 590C460 560 520 566 546 592C572 618 556 656 520 664C484 672 440 660 428 634C422 620 422 602 430 590Z" fill="#D3C0A0" />
      <g fill="#BCA884"><circle cx="470" cy="600" r="3" /><circle cx="500" cy="626" r="2.5" /><circle cx="528" cy="604" r="2.5" /><circle cx="458" cy="636" r="2" /><circle cx="520" cy="648" r="3" /></g>
      <path d="M320 452C360 532 430 612 640 662" fill="none" stroke="#FFFBF4" strokeWidth="10" strokeLinecap="round" />
      <path d="M320 452C360 532 430 612 640 662" fill="none" stroke="#D9C8A6" strokeWidth="1.5" strokeDasharray="8 8" />
      <path d="M320 452C290 542 250 642 200 830" fill="none" stroke="#FFFBF4" strokeWidth="7" strokeLinecap="round" />
      <path d="M320 452C330 382 338 302 340 230" fill="none" stroke="#B4532A" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round" />
      <g fill="#D8C4A0">
        <rect x="280" y="420" width="18" height="14" rx="2" /><rect x="302" y="416" width="22" height="16" rx="2" /><rect x="330" y="420" width="16" height="14" rx="2" /><rect x="350" y="426" width="20" height="16" rx="2" /><rect x="282" y="440" width="20" height="14" rx="2" /><rect x="344" y="448" width="18" height="14" rx="2" /><rect x="292" y="464" width="16" height="14" rx="2" /><rect x="316" y="470" width="22" height="16" rx="2" /><rect x="346" y="470" width="16" height="12" rx="2" />
      </g>
      <text x="324" y="512" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontSize="18" fontWeight="700" letterSpacing="3" fill="#6B5A3C">
        {dict.explore.town}
      </text>
      <text x="40" y="226" fontFamily="Hanken Grotesk, sans-serif" fontSize="14" fontStyle="italic" fill="#7A6848">
        {dict.explore.range}
      </text>
      <path d="M250 722C300 672 370 702 350 752C330 802 240 792 230 752C224 737 236 728 250 722Z" fill="none" stroke="#1F3A2E" strokeWidth="2.5" strokeDasharray="5 6" />
      <g transform="translate(592 760)">
        <circle r="24" fill="#FFFBF4" />
        <path d="M0 -15L6 4L0 0L-6 4Z" fill="#B4532A" />
        <text y="16" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontSize="11" fontWeight="700" fill="#1C1A15">
          N
        </text>
      </g>
    </svg>
  );
}
