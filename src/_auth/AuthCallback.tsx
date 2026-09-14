import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/lib/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { takePostAuthRedirect } from "@/lib/auth/oauth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthUser } = useUserContext();
  const hasExchanged = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (hasExchanged.current) {
        console.log("[AuthCallback] Already processed, skipping duplicate run.");
        return;
      }
      hasExchanged.current = true;

      console.log("[AuthCallback] Started. Current URL:", window.location.href);

      try {
        // 1. Check if tokens exist in the hash fragment
        const hash = window.location.hash;
        console.log("[AuthCallback] Window hash present:", !!hash);
        
        if (hash && hash.includes("access_token")) {
          const params = new URLSearchParams(hash.replace("#", "?"));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          console.log("[AuthCallback] Extracted tokens from hash - Access Token exists:", !!access_token, "Refresh Token exists:", !!refresh_token);

          if (access_token && refresh_token) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setSessionError) {
              console.error("[AuthCallback] Error setting manual session:", setSessionError);
              throw setSessionError;
            }
            console.log("[AuthCallback] Successfully set manual session from hash tokens.");
          }
        }

        // 2. Standard session retrieval fallback
        console.log("[AuthCallback] Fetching current session from Supabase client...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[AuthCallback] Session error returned:", sessionError);
          throw sessionError;
        }

        console.log("[AuthCallback] Session retrieved successfully. User ID:", session?.user?.id ?? "None");

        if (!session) {
          console.warn("[AuthCallback] No session found. Redirecting to /sign-in");
          navigate("/sign-in", { replace: true });
          return;
        }

        console.log("[AuthCallback] Calling checkAuthUser()...");
        await checkAuthUser();
        console.log("[AuthCallback] checkAuthUser() completed.");

        const nextPath = takePostAuthRedirect();
        console.log("[AuthCallback] Navigating to post-auth destination:", nextPath);
        navigate(nextPath, { replace: true });

      } catch (err) {
        console.error("[AuthCallback] Fatal error caught during handleAuth:", err);
        navigate("/sign-in", { replace: true });
      }
    };

    handleAuth();
  }, [navigate, checkAuthUser]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-4">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-4 w-44 rounded-md" />
        <Skeleton className="h-3 w-56 rounded-md opacity-70" />
      </div>
      <p className="text-light-3 text-sm italic">Completing secure sign-in...</p>
    </div>
  );
};

export default AuthCallback;