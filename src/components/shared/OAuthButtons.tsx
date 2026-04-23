import { useState } from "react";
import { SiApple, SiGoogle, SiSpotify } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import {
  rememberPostAuthRedirect,
  signInWithOAuthProvider,
  type SocialProvider,
} from "@/lib/auth/oauth";

const providerConfig: Record<
  SocialProvider,
  { label: string; icon: typeof SiGoogle; className: string }
> = {
  google: {
    label: "Google",
    icon: SiGoogle,
    className: "hover:bg-white/10 border-white/15",
  },
  apple: {
    label: "Apple",
    icon: SiApple,
    className: "hover:bg-white/10 border-white/15",
  },
  spotify: {
    label: "Spotify",
    icon: SiSpotify,
    className: "hover:bg-[#1DB954]/20 border-[#1DB954]/40 text-[#1DB954]",
  },
};

type OAuthButtonsProps = {
  /** App path to open after OAuth completes (e.g. `location.state?.from`). */
  redirectAfterAuth?: string;
  className?: string;
};

const OAuthButtons = ({ redirectAfterAuth = "/", className = "" }: OAuthButtonsProps) => {
  const { toast } = useToast();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  const onProvider = async (provider: SocialProvider) => {
    try {
      setPending(provider);
      rememberPostAuthRedirect(redirectAfterAuth);
      await signInWithOAuthProvider(provider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not start sign-in";
      toast({ title: "Sign-in failed", description: message });
      setPending(null);
    }
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {(Object.keys(providerConfig) as SocialProvider[]).map((provider) => {
        const { label, icon: Icon, className: btnClass } = providerConfig[provider];
        const isBusy = pending !== null;
        const isThis = pending === provider;
        return (
          <button
            key={provider}
            type="button"
            disabled={isBusy}
            onClick={() => onProvider(provider)}
            className={`flex-center gap-3 w-full rounded-lg border bg-dark-3 py-3 px-4 text-sm font-semibold text-light-1 transition disabled:opacity-50 ${btnClass}`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {isThis ? "Redirecting…" : `Continue with ${label}`}
          </button>
        );
      })}
    </div>
  );
};

export default OAuthButtons;
