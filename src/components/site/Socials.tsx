import { BrandIcon, type BrandName } from "../icons";
import s from "./Socials.module.css";

const NAMES: { key: "facebook" | "instagram" | "tiktok"; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
];

/**
 * Logos de redes. Solo se muestran las redes con enlace; mientras no haya
 * ninguna capturada en Ajustes se muestran las tres como en el diseño.
 */
export function Socials({
  social,
  tone = "light",
  className,
}: {
  social: { facebook: string; instagram: string; tiktok: string };
  tone?: "light" | "dark" | "footer";
  className?: string;
}) {
  const configured = NAMES.filter((n) => social[n.key]);
  const list = configured.length ? configured : NAMES;
  return (
    <div className={`${s.row} ${className ?? ""}`}>
      {list.map((n) => {
        const url = social[n.key];
        return (
          <a
            key={n.key}
            className={`${s.social} ${s[tone]}`}
            href={url || "#"}
            aria-label={n.label}
            {...(url ? { target: "_blank", rel: "noopener" } : {})}
          >
            <BrandIcon name={n.key as BrandName} />
          </a>
        );
      })}
    </div>
  );
}
