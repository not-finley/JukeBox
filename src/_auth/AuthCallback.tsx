import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRowFromAuth } from "@/lib/supabase/api/users";
import { useUserContext } from "@/lib/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { takePostAuthRedirect } from "@/lib/auth/oauth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthUser } = useUserContext();
  const hasExchanged = useRef(false); // Prevents double-processing in Strict Mode

  useEffect(() => {
    const handleAuth = async () => {
      if (hasExchanged.current) return;
      hasExchanged.current = true;

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/sign-in", { replace: true });
          return;
        }

        // Trigger handles users table creation automatically
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