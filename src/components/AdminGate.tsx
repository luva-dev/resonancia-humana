import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminGateProps {
  children: React.ReactNode;
}

export const AdminGate = ({ children }: AdminGateProps) => {
  const [state, setState] = useState<"checking" | "allowed" | "login" | "denied">("checking");

  useEffect(() => {
    const check = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setState("login");
        return;
      }

      const { data, error } = await supabase.rpc("is_admin");
      setState(!error && data ? "allowed" : "denied");
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (state === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </main>
    );
  }

  if (state === "login") return <Navigate to="/auth" replace />;

  if (state === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
        <div className="max-w-md border border-border bg-card p-8">
          <h1 className="font-display text-3xl">Acceso reservado</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Esta zona solo está disponible para el usuario administrador de la Bitácora.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
