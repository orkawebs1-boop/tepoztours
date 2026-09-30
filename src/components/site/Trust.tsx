import type { Dictionary } from "@/lib/i18n";
import { BrandIcon, Icon } from "../icons";
import s from "./Trust.module.css";
import { ed } from "@/lib/edit";

export function Trust({ dict }: { dict: Dictionary }) {
  const items = [
    { icon: <Icon name="compass" />, t: dict.trust.t1, d: dict.trust.d1, n: 1 },
    { icon: <Icon name="group" />, t: dict.trust.t2, d: dict.trust.d2, n: 2 },
    { icon: <BrandIcon name="whatsapp" />, t: dict.trust.t3, d: dict.trust.d3, n: 3 },
  ];
  return (
    <section aria-label={dict.trust.label} className={`tt-section ${s.section}`}>
      <div className={`tt-wrap ${s.grid}`}>
        {items.map((it) => (
          <div key={it.t} className={s.item}>
            <span className={s.badge}>{it.icon}</span>
            <div className={s.text}>
              <h3 className={`tt-d ${s.title}`} {...ed(`text:trust.t${it.n}`)}>
                {it.t}
              </h3>
              <p className={s.desc} {...ed(`text:trust.d${it.n}`)}>
                {it.d}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
