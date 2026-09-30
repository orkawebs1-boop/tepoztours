import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Foto o, si todavía no hay imagen, el bloque de color con la etiqueta «Foto» del diseño.
 */
export function Photo({
  src,
  alt,
  tone,
  className,
  style,
  chip,
  priority = false,
  attrs,
  children,
}: {
  src: string | null | undefined;
  alt: string;
  tone: string;
  className?: string;
  style?: CSSProperties;
  /** Texto del chip que se muestra solo cuando falta la foto («Foto», «Retrato»). */
  chip?: string;
  priority?: boolean;
  /** Atributos extra (marcas del editor visual). */
  attrs?: Record<string, string>;
  children?: ReactNode;
}) {
  return (
    <div className={className ? `tt-ph ${className}` : "tt-ph"} style={{ backgroundColor: tone, ...style }} {...attrs}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="tt-img"
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
        />
      ) : (
        chip && (
          <span className="tt-photo-chip">
            <Icon name="image" />
            {chip}
          </span>
        )
      )}
      {children}
    </div>
  );
}
