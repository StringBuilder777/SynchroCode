import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GithubIcon } from "./GithubIcon";
import { supabase } from "@/lib/supabase";
import { checkAndRedirectIfNoOrganization } from "@/lib/organizationSetup";
import { normalizeAuthError } from "@/lib/errors";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasConnection, setHasConnection] = useState(true);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setHasConnection(true);
    const handleOffline = () => setHasConnection(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const setSpanishValidationMessage = (input: HTMLInputElement) => {
    if (input.validity.valueMissing) {
      input.setCustomValidity(
        input.type === "password" ? "Ingresa tu contraseña." : "Ingresa tu correo electrónico.",
      );
      return;
    }

    if (input.validity.typeMismatch) {
      input.setCustomValidity("Ingresa un correo electrónico válido.");
      return;
    }

    input.setCustomValidity("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Add timeout to detect network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        clearTimeout(timeoutId);

        if (error) {
          const errorMessage = normalizeAuthError(error, "No se pudo iniciar sesión.");
          setError(errorMessage);
          setLoading(false);
        } else {
          // Check if user has organization, if not redirect to org setup
          const hasOrganization = await checkAndRedirectIfNoOrganization();
          if (hasOrganization) {
            window.location.href = "/proyectos";
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        const errorMessage = normalizeAuthError(fetchError, "Error de red. Intenta de nuevo.");
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = normalizeAuthError(err, "No se pudo iniciar sesión.");
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleGitHubLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/github` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[420px] space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>Inicia tu sesión colaborativa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!hasConnection && (
                <div className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                  No hay conexión a internet. Verifica tu conexión e intenta de nuevo.
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={(e) => setSpanishValidationMessage(e.currentTarget)}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  maxLength={255}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onInvalid={(e) => setSpanishValidationMessage(e.currentTarget)}
                    onInput={(e) => e.currentTarget.setCustomValidity("")}
                    maxLength={255}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Login"}
              </Button>

              <div className="text-center">
                <a
                  href="/recuperar-contrasena"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    O continúa con
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGitHubLogin}
              >
                <GithubIcon />
                Continuar con GitHub
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <a href="/setup" className="text-primary hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
