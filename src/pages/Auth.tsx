import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("luva@equilibria.lat");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const handleAuth = async (mode: "signin" | "signup") => {
    setLoading(true);
    const credentials = { email: email.trim(), password };
    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp(credentials);
    setLoading(false);

    if (error) {
      toast({ title: "No fue posible entrar", description: "Revisa que hayas preparado el acceso administrador o que la clave sea correcta.", variant: "destructive" });
      return;
    }

    toast({ title: mode === "signin" ? "Sesión iniciada" : "Usuario creado", description: "Entrando al módulo administrador." });
    navigate("/admin");
  };

  const prepareAdminAccess = async () => {
    setPreparing(true);
    const { data, error } = await supabase.functions.invoke("bootstrap-admin", {
      body: { email: email.trim(), password },
    });
    setPreparing(false);

    if (error) {
      toast({ title: "No fue posible preparar el acceso", description: "Revisa el correo, la clave o inténtalo nuevamente.", variant: "destructive" });
      return;
    }

    if (data?.status === "already_prepared") {
      toast({ title: "Acceso ya preparado", description: "Este acceso ya fue preparado anteriormente. Ahora puedes entrar." });
      return;
    }

    toast({ title: "Administrador preparado", description: "Ahora puedes entrar con el correo y la clave configurados." });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ritual px-4 py-10 text-foreground">
      <section className="w-full max-w-md border border-border bg-card/88 p-7 shadow-resonance backdrop-blur-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-accent/40 bg-accent/10 text-accent">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Bitácora</p>
            <h1 className="font-display text-3xl">Acceso administrador</h1>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-none" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Clave</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-none" />
          </div>
          <Button type="button" onClick={() => handleAuth("signin")} disabled={loading || preparing} className="rounded-none">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
          <Button type="button" onClick={prepareAdminAccess} disabled={loading || preparing} variant="outline" className="rounded-none">
            {preparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Preparar acceso administrador
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Auth;
