import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle ambient light effect behind the login card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-sm space-y-8 animate-slide-up relative z-10">
        <div className="text-center space-y-3">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <Logo className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Aperture</h1>
          <p className="text-sm text-muted">
            Sign in to the platform.
          </p>
        </div>
        <Card className="animate-scale-in" style={{ animationDelay: "150ms" }}>
          <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
        </Card>
        
        <div 
          className="mt-8 rounded-xl bg-surface-2/50 p-4 text-center border border-white/5 animate-scale-in" 
          style={{ animationDelay: "300ms" }}
        >
          <p className="text-xs text-white/50 leading-relaxed">
            Access allowed only for WT, TA and Core members.<br />
            Contact <a href="mailto:admin@aperturemuj.com" className="text-white/80 hover:text-white hover:underline transition-colors">admin@aperturemuj.com</a> for any issues related to login.
          </p>
        </div>
      </div>
    </div>
  );
}
