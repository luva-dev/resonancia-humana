import { useEffect, useState, type ReactNode } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ACCESS_TOKEN_KEY = "equilibria.preview.access-token";

interface AccessGateProps {
  children: ReactNode;
}

type GateState = "checking" | "locked" | "granted";

export const AccessGate = ({ children }: AccessGateProps) => {
  const [state, setState] = useState<GateState>("checking");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verifyExistingAccess = async () => {
      const storedToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);

      if (!storedToken) {
        setState("locked");
        return;
      }

      const { data, error: verifyError } = await supabase.functions.invoke("preview-access", {
        body: { action: "verify", token: storedToken },
      });

      if (verifyError || !data?.authorized) {
        window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        setState("locked");
        return;
      }

      setState("granted");
    };

    void verifyExistingAccess();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password.trim()) {
      setError("Ingresa el usuario y la contraseña para continuar.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { data, error: requestError } = await supabase.functions.invoke("preview-access", {
      body: {
        action: "login",
        username: normalizedUsername,
        password,
      },
    });

    setSubmitting(false);

    if (requestError || !data?.authorized || !data?.token) {
      setError("Las credenciales no coinciden con el acceso provisional habilitado.");
      return;
    }

    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, data.token);
    setPassword("");
    setState("granted");
  };

  if (state === "granted") {
    return <>{children}</>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-ritual text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsla(var(--accent),0.14),transparent_34%),linear-gradient(180deg,transparent,hsla(var(--primary),0.22))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-accent/40" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-2xl space-y-7">
            <div className="inline-flex items-center gap-3 border border-accent/30 bg-background/20 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center border border-accent/35 bg-accent/10 text-accent">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Equilibria</p>
                <p className="font-display text-2xl leading-none text-foreground">Acceso provisional</p>
              </div>
            </div>

            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-accent">The Human Shift 2026</p>
              <h1 className="font-display text-5xl leading-[0.98] text-foreground md:text-7xl">Previsualización restringida para organizadores</h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
                Este acceso protege temporalmente la landing mientras el contenido sigue en revisión editorial y validación interna.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card/88 p-7 shadow-resonance backdrop-blur-md sm:p-8">
            {state === "checking" ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-accent" />
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Verificando acceso</p>
              </div>
            ) : (
              <form className="grid gap-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Control de acceso</p>
                  <h2 className="font-display text-3xl text-foreground">Ingreso de organizadores</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Introduce las credenciales provisionales para desbloquear la vista completa de la bitácora.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preview-username">Usuario</Label>
                  <Input
                    id="preview-username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    className="rounded-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preview-password">Contraseña</Label>
                  <Input
                    id="preview-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="rounded-none"
                  />
                </div>

                {error ? <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

                <Button type="submit" disabled={submitting} className="h-12 rounded-none text-base">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Acceder a la vista
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};