"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "../icons";
import { LogoMark } from "../Logo";

/** Sesión válida pero el correo no está en la lista de administradores. */
export function NoAccess({ email }: { email: string }) {
  const router = useRouter();
  return (
    <main style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="ad-card" style={{ maxWidth: 480, padding: 32, display: "flex", flexDirection: "column", gap: 14 }}>
        <LogoMark size={44} hill="var(--forest)" />
        <h1 className="tt-d" style={{ margin: 0, fontSize: 40, lineHeight: 0.95, color: "var(--forest)" }}>
          Sin acceso al panel
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--muted)" }}>
          La cuenta <strong>{email}</strong> no está autorizada como administradora de TepozTours. Pide a quien administra el
          sitio que la agregue.
        </p>
        <button
          type="button"
          className="ad-btn ad-btn-ghost"
          style={{ alignSelf: "flex-start" }}
          onClick={async () => {
            await supabaseBrowser().auth.signOut();
            router.replace("/admin/login");
            router.refresh();
          }}
        >
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
