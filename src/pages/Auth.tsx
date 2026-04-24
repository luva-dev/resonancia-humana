import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
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

  const handleAuth = async (mode: "signin" | "signup") => {
    setLoading(true);
    const credentials = { email: email.trim(), password };
    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword(credentials)
      : await supabase.auth.signUp(credentials);
    setLoading(false);

    if (error) {
      toast({ title: "No fue posible entrar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: mode === "signin" ? "Sesión iniciada" : "Usuario creado", description: "Entrando al módulo administrador." });
    navigate("/admin");
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
          <Button type="button" onClick={() => handleAuth("signin")} disabled={loading} className="rounded-none">
            Entrar
          </Button>
          <Button type="button" onClick={() => handleAuth("signup")} disabled={loading} variant="outline" className="rounded-none">
            Crear usuario admin inicial
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Auth;
