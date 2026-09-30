/** Cerro con la pirámide del Tepozteco y el sol ámbar, más TEPOZTOURS. */
export function LogoMark({ size = 44, sun = "var(--amber)", hill = "currentColor", pyramid = true }: {
  size?: number;
  sun?: string;
  hill?: string;
  pyramid?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="31" cy="17" r="9" fill={sun} />
      <path d="M3 41L13 25L17.5 30L23.5 14L28 22L32 18.5L39 29L45 41Z" fill={hill} />
      {pyramid && <path d="M21.6 14.4h3.8v-2.4h-0.9v-1.6h-2v1.6h-0.9z" fill={hill} />}
    </svg>
  );
}

export function Logo({
  size = 44,
  textSize = 28,
  logoUrl,
  name = "TepozTours",
}: {
  size?: number;
  textSize?: number;
  logoUrl?: string | null;
  name?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} style={{ height: size, width: "auto" }} />;
  }
  return (
    <>
      <LogoMark size={size} />
      <span className="tt-d" style={{ fontSize: textSize, fontWeight: 800, letterSpacing: ".03em", lineHeight: 1 }}>
        Tepoz<span style={{ color: "var(--amber)" }}>tours</span>
      </span>
    </>
  );
}
