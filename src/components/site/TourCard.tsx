import Link from "next/link";
import type { TourView } from "@/lib/site";
import { BrandIcon, Icon } from "../icons";
import { Photo } from "../Photo";
import s from "./TourCard.module.css";
import { ed } from "@/lib/edit";

export type CardLabels = {
  from: string;
  perPerson: string;
  viewDetails: string;
  book: string;
  photo: string;
};

export function TourCard({
  tour,
  labels,
  imgHeight,
  style,
  preview = false,
}: {
  tour: TourView;
  labels: CardLabels;
  imgHeight?: number;
  style?: React.CSSProperties;
  /** Vista previa del panel: sin enlaces. */
  preview?: boolean;
}) {
  if (preview) return <PreviewCard tour={tour} labels={labels} />;
  return (
    <article className={s.card} style={style}>
      <Photo
        src={tour.cover}
        alt={tour.name}
        tone={tour.tone}
        className={s.img}
        style={imgHeight ? { height: imgHeight } : undefined}
        chip={labels.photo}
        attrs={ed(`tourimg:${tour.id}`, "image")}
      >
        <span className={s.tag}>{tour.catLabel}</span>
      </Photo>
      <div className={s.body}>
        <h3 className={`tt-d ${s.name}`} {...ed(`tour:${tour.id}`)}>
          <Link href={tour.href} className={s.nameLink}>
            {tour.name}
          </Link>
        </h3>
        <p className={s.short}>{tour.short}</p>
        <div className={s.metaRow}>
          <span className={s.meta}>
            <Icon name="clock" />
            {tour.dur}
          </span>
          <span className={s.meta}>
            <Icon name="mountain" />
            {tour.diff}
          </span>
        </div>
        <div className={s.priceRow}>
          <span className={s.small}>{labels.from}</span>
          <span className={`tt-d ${s.price}`} {...ed(`price:${tour.id}`, "price")}>
            {tour.priceTxt}
          </span>
          <span className={s.small}>{labels.perPerson}</span>
        </div>
        <div className={s.actions}>
          <Link className="tt-btn tt-btn-ghost tt-btn-sm" href={tour.href}>
            {labels.viewDetails}
          </Link>
          <a className="tt-btn tt-btn-amber tt-btn-sm" href={tour.wa} target="_blank" rel="noopener">
            <BrandIcon name="whatsapp" />
            {labels.book}
          </a>
        </div>
      </div>
    </article>
  );
}

function PreviewCard({ tour, labels }: { tour: TourView; labels: CardLabels }) {
  return (
    <article className={s.card} style={{ animation: "none" }}>
      <Photo src={tour.cover} alt={tour.name} tone={tour.tone} className={s.img} chip={labels.photo}>
        <span className={s.tag}>{tour.catLabel}</span>
      </Photo>
      <div className={s.body}>
        <h3 className={`tt-d ${s.name}`}>{tour.name}</h3>
        <p className={s.short}>{tour.short}</p>
        <div className={s.metaRow}>
          <span className={s.meta}>
            <Icon name="clock" />
            {tour.dur}
          </span>
          <span className={s.meta}>
            <Icon name="mountain" />
            {tour.diff}
          </span>
        </div>
        <div className={s.priceRow}>
          <span className={s.small}>{labels.from}</span>
          <span className={`tt-d ${s.price}`}>{tour.priceTxt}</span>
          <span className={s.small}>{labels.perPerson}</span>
        </div>
        <div className={s.actions}>
          <span className="tt-btn tt-btn-ghost tt-btn-sm">{labels.viewDetails}</span>
          <span className="tt-btn tt-btn-amber tt-btn-sm">
            <BrandIcon name="whatsapp" />
            {labels.book}
          </span>
        </div>
      </div>
    </article>
  );
}
