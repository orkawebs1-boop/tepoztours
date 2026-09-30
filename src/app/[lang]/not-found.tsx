import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main
      id="contenido"
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 20px",
        textAlign: "center",
        background: "var(--forest)",
        color: "var(--cream)",
      }}
    >
      <LogoMark size={72} hill="#F6EFE3" />
      <h1 className="tt-d" style={{ fontSize: "clamp(56px, 10vw, 104px)", lineHeight: 0.88 }}>
        404
      </h1>
      <p style={{ maxWidth: 420, fontSize: 17, lineHeight: 1.6, color: "rgba(246,239,227,.86)" }}>
        No encontramos esta página. · We couldn&apos;t find this page.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link className="tt-btn tt-btn-amber" href="/es">
          Ir al inicio
        </Link>
        <Link className="tt-btn tt-btn-light" href="/en">
          Go home
        </Link>
      </div>
    </main>
  );
}
