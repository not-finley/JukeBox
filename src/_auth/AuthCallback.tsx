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
      if (hasExchanged.current) return;
      hasExchanged.current = true;

      try {
        // 1. Check if tokens exist in the hash fragment (Implicit flow / production behavior)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const params = new URLSearchParams(hash.replace("#", "?"));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          }
        }

        // 2. Standard session retrieval fallback
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/sign-in", { replace: true });
          return;
        }

        await checkAuthUser();

        const nextPath = takePostAuthRedirect();
        navigate(nextPath, { replace: true });

      } catch (err) {
        console.error("Auth callback error:", err);
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