"use client";

import { useId, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { HomeData } from "@/lib/site";
import { BrandIcon, Icon } from "../icons";
import s from "./Faq.module.css";
import { ed } from "@/lib/edit";

export function Faq({ dict, faqs, waGeneral }: { dict: Dictionary; faqs: HomeData["faqs"]; waGeneral: string }) {
  const [open, setOpen] = useState(0);
  const uid = useId();
  if (!faqs.length) return null;
  return (
    <section id="preguntas" className={`tt-section ${s.section}`}>
      <div className={`tt-wrap ${s.layout}`}>
        <div className={s.side}>
          <div className="tt-eyebrow">{dict.faq.eyebrow}</div>
          <h2 className={`tt-d ${s.title}`} {...ed("text:faq.title")}>
            {dict.faq.title}
          </h2>
          <p className={s.intro} {...ed("text:faq.intro")}>
            {dict.faq.intro}
          </p>
          <a className={`tt-btn tt-btn-amber ${s.ask}`} href={waGeneral} target="_blank" rel="noopener">
            <BrandIcon name="whatsapp" />
            {dict.faq.ask}
          </a>
        </div>
        <div className={s.list}>
          {faqs.map((f, i) => {
            const isOpen = open === i;
            const panel = `${uid}-a${i}`;
            return (
              <div key={f.id} className={`${s.item} ${isOpen ? s.isOpen : ""}`} {...ed(`faq:${f.id}`)}>
                <h3 className={s.h}>
                  <button
                    type="button"
                    className={s.q}
                    aria-expanded={isOpen}
                    aria-controls={panel}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{f.q}</span>
                    <span className={s.chev}>
                      <Icon name="chevDown" />
                    </span>
                  </button>
                </h3>
                <div id={panel} className={s.panel} hidden={!isOpen}>
                  <p className={s.a}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
