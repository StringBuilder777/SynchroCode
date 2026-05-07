import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { normalizeAuthError, normalizeUserError } from "@/lib/errors";

export function OrganizationSetupForm() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!orgName.trim()) {
      setError("Ingresa el nombre de la organización.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create org in backend
      const org = await api.post<{ id: string }>("/organizations", {
        name: orgName.trim()
      });

      // 2. Save organizationId and role as Admin in user_metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { organizationId: org.id, role: "Administrador" },
      });

      if (updateError) {
        setError(normalizeAuthError(updateError, "No se pudo actualizar el perfil del usuario."));
        setLoading(false);
        return;
      }

      // 3. Refresh session to get JWT with organizationId
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        setError(normalizeAuthError(refreshError, "No se pudo actualizar la sesión."));
        setLoading(false);
        return;
      }

      window.location.href = "/proyectos";
    } catch (err: unknown) {
      setError(normalizeUserError(err, { fallback: "No se pudo crear la organización." }));
      setLoading(false);
    }
  }

  async function handleSkip() {
    // Cerrar sesión y volver a login
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle />
      <Card className="w-full max-w-[460px]">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <span className="rounded-full border border-blue-500/50 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              Paso final
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Crear organización
          </CardTitle>
          <CardDescription>
            Necesitamos un nombre para tu organización para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la organización</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Ej: Mi Empresa, Proyecto Personal, Equipo Dev..."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={100}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                Puedes cambiar esto después en la configuración.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando organización..." : "Crear organización"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={loading}
            >
              <ArrowLeft size={16} className="mr-2" />
              Salir
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
