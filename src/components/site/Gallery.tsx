import type { Dictionary } from "@/lib/i18n";
import type { HomeData } from "@/lib/site";
import { Icon } from "../icons";
import { Photo } from "../Photo";
import s from "./Gallery.module.css";
import { ed } from "@/lib/edit";

export function Gallery({
  dict,
  items,
  instagram,
}: {
  dict: Dictionary;
  items: HomeData["gallery"];
  instagram: string;
}) {
  if (!items.length) return null;
  return (
    <section id="galeria" className={`tt-section ${s.section}`}>
      <div className="tt-wrap">
        <div className={s.head}>
          <div className={s.headMain}>
            <div className="tt-eyebrow">{dict.gallery.eyebrow}</div>
            <h2 className={`tt-d ${s.title}`} {...ed("text:gallery.title")}>
              {dict.gallery.title}
            </h2>
          </div>
          <a
            className={`tt-btn tt-btn-ghost ${s.follow}`}
            href={instagram || "#"}
            {...(instagram ? { target: "_blank", rel: "noopener" } : {})}
          >
            {dict.gallery.follow}
          </a>
        </div>
        <div className={s.grid}>
          {items.map((g) => (
            <Photo key={g.id} src={g.image} alt={g.caption} tone={g.tone} className={s.item} attrs={ed(`gal:${g.id}`, "image")}>
              {g.caption && (
                <span className="tt-cap">
                  {!g.image && <Icon name="image" />}
                  {g.caption}
                </span>
              )}
            </Photo>
          ))}
        </div>
      </div>
    </section>
  );
}
