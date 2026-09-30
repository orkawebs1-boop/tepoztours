import type { Dictionary } from "@/lib/i18n";
import type { HomeData } from "@/lib/site";
import { Icon } from "../icons";
import { LogoMark } from "../Logo";
import { Photo } from "../Photo";
import s from "./About.module.css";
import { ed } from "@/lib/edit";

export function About({
  dict,
  guides,
  photos,
}: {
  dict: Dictionary;
  guides: HomeData["guides"];
  photos: { main: string | null; secondary: string | null };
}) {
  const [b1, b2] = dict.about.badge.split("\n");
  return (
    <section id="nosotros" className={`tt-section ${s.section}`}>
      <div className="tt-wrap">
        <div className={s.story}>
          <div className={s.collage}>
            <Photo src={photos.main} alt={dict.about.photo1} tone="#4E6540" className={s.photoMain} attrs={ed("about:main", "image")}>
              {!photos.main && (
                <span className="tt-cap">
                  <Icon name="image" />
                  {dict.about.photo1}
                </span>
              )}
            </Photo>
            <Photo src={photos.secondary} alt={dict.about.photo2} tone="#B4532A" className={s.photoSmall} attrs={ed("about:secondary", "image")}>
              {!photos.secondary && (
                <span className="tt-cap">
                  <Icon name="image" />
                  {dict.about.photo2}
                </span>
              )}
            </Photo>
            <div className={s.badge}>
              <LogoMark size={40} sun="#FFFBF4" hill="var(--forest)" pyramid={false} />
              <span className="tt-d">
                {b1}
                <br />
                {b2}
              </span>
            </div>
          </div>

          <div className={s.text}>
            <div className="tt-eyebrow">{dict.about.eyebrow}</div>
            <h2 className={`tt-d ${s.title}`} {...ed("text:about.title")}>
              {dict.about.title}
            </h2>
            <p className={s.p} {...ed("text:about.p1")}>
              {dict.about.p1}
            </p>
            <p className={s.p} {...ed("text:about.p2")}>
              {dict.about.p2}
            </p>
            <div className={s.mission}>
              <span className={s.missionIco}>
                <Icon name="sun" size={24} />
              </span>
              <div className={s.missionText}>
                <h3 className="tt-d" {...ed("text:about.missionTitle")}>
                  {dict.about.missionTitle}
                </h3>
                <p {...ed("text:about.mission")}>{dict.about.mission}</p>
              </div>
            </div>
          </div>
        </div>

        {guides.length > 0 && (
          <>
            <div className={s.guidesHead}>
              <h3 className={`tt-d ${s.guidesTitle}`} {...ed("text:about.guidesTitle")}>
                {dict.about.guidesTitle}
              </h3>
              <p className={s.guidesIntro} {...ed("text:about.guidesIntro")}>
                {dict.about.guidesIntro}
              </p>
            </div>
            <div className={s.guides}>
              {guides.map((g) => (
                <article key={g.id} className={s.guide}>
                  <Photo src={g.photo} alt={g.name} tone={g.tone} className={s.guidePhoto} chip={dict.common.portrait} attrs={ed(`guide:${g.id}`, "image")} />
                  <div className={s.guideText} {...ed(`guide:${g.id}`)}>
                    <h4 className="tt-d">{g.name}</h4>
                    <span>{g.role}</span>
                  </div>
                  {g.tags.length > 0 && (
                    <div className={s.tags}>
                      {g.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
