"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase/client";
import s from "../login/login.module.css";

/** Crear una nueva contraseña desde el enlace del correo de recuperación. */
export default function RecoverPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    const code = new URLSearchParams(window.location.search).get("code");
    const run = async () => {
      if (code) await sb.auth.exchangeCodeForSession(code);
      const { data } = await sb.auth.getSession();
      if (data.session) setReady(true);
      else setError("El enlace ya no es válido. Pide uno nuevo desde la pantalla de inicio de sesión.");
    };
    run();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    const { error: err } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("No pudimos guardar la contraseña. Inténtalo de nuevo.");
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className={s.page}>
      <div className={`tt-ph ${s.art}`}>
        <div className={s.brand}>
          <LogoMark size={48} hill="#F6EFE3" />
          <span className="tt-d">
            Tepoz<span style={{ color: "var(--amber)" }}>tours</span>
          </span>
        </div>
        <div className={s.pitch}>
          <span className={s.kicker}>Panel privado</span>
          <h2 className="tt-d">Nueva contraseña</h2>
        </div>
      </div>
      <div className={s.formCol}>
        <form className={s.form} onSubmit={submit} noValidate>
          <div className={s.head}>
            <h1 className="tt-d">Crea tu contraseña</h1>
            <p>Usa al menos 8 caracteres.</p>
          </div>
          <div>
            <label className="ad-label" htmlFor="new-pass">
              Nueva contraseña
            </label>
            <div className={s.field}>
              <Icon name="lock" />
              <input id="new-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
            </div>
          </div>
          <div>
            <label className="ad-label" htmlFor="new-pass2">
              Confírmala
            </label>
            <div className={s.field}>
              <Icon name="lock" />
              <input id="new-pass2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready} />
            </div>
          </div>
          {error && (
            <p className={s.error} role="alert">
              <Icon name="alert" size={16} />
              {error}
            </p>
          )}
          <button type="submit" className={s.submit} disabled={!ready || busy}>
            {busy ? "Guardando…" : "Guardar y entrar"}
            <Icon name="arrowRight" />
          </button>
        </form>
      </div>
    </div>
  );
}
