import { useState } from "react";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { rememberPostAuthRedirect, signInWithGoogleOAuth } from "@/lib/auth/oauth";

type OAuthButtonsProps = {
  /** App path to open after OAuth completes (e.g. `location.state?.from`). */
  redirectAfterAuth?: string;
  className?: string;
};

const OAuthButtons = ({ redirectAfterAuth = "/", className = "" }: OAuthButtonsProps) => {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const onGoogle = async () => {
    try {
      setPending(true);
      rememberPostAuthRedirect(redirectAfterAuth);
      await signInWithGoogleOAuth();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not start sign-in";
      toast({ title: "Sign-in failed", description: message });
      setPending(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <button
        type="button"
        disabled={pending}
        onClick={onGoogle}
        className="flex-center gap-3 w-full rounded-lg border border-white/15 bg-dark-3 py-3 px-4 text-sm font-semibold text-light-1 transition hover:bg-white/10 disabled:opacity-50"
      >
        <SiGoogle className="h-5 w-5 shrink-0" aria-hidden />
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
    </div>
  );
};

export default OAuthButtons;
