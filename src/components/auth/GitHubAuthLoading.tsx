import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GithubIcon } from "./GithubIcon";
import { ThemeToggle } from "./ThemeToggle";

const steps = [
  { label: "Conexión con GitHub establecida", key: "connect" },
  { label: "Verificando credenciales...", key: "verify" },
  { label: "Redirigiendo al panel...", key: "redirect" },
];

export function GitHubAuthLoading() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulación de progreso — en producción esto se reemplaza con el flujo OAuth real
    const t1 = setTimeout(() => setCurrentStep(1), 1500);
    const t2 = setTimeout(() => setCurrentStep(2), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle />
      <Card className="w-full max-w-[420px]">
        <CardContent className="space-y-8 text-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
            </div>
            <span className="text-lg font-semibold">SynchroCode</span>
          </div>

          {/* GitHub icon */}
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-secondary">
              <GithubIcon className="size-10" />
            </div>
          </div>

          {/* Spinner + progress */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg className="size-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full animate-pulse rounded-full bg-primary" style={{ width: `${((currentStep + 1) / 3) * 100}%`, transition: "width 0.5s" }} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Autenticando con GitHub</h1>
            <p className="text-sm text-muted-foreground">
              Estamos verificando tu identidad con GitHub. Esto solo tomará un momento.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                {i < currentStep ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                ) : i === currentStep ? (
                  <svg className="size-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <div className="size-5 rounded-full border-2 border-muted" />
                )}
                <span className={`text-sm ${i < currentStep ? "text-foreground" : i === currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Cancel */}
          <a
            href="/login"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Cancelar y volver al inicio de sesión
          </a>

          {/* Security note */}
          <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-emerald-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <p className="text-xs text-muted-foreground">
              Conexión segura. SynchroCode nunca almacena tus credenciales de GitHub.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
