import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRowFromAuth } from "@/lib/supabase/api/users";
import { useUserContext } from "@/lib/AuthContext";
import LoaderMusic from "@/components/shared/loaderMusic";
import { takePostAuthRedirect } from "@/lib/auth/oauth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthUser } = useUserContext();
  const hasExchanged = useRef(false); // Prevents double-processing in Strict Mode

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Prevent the "Double Mount" bug in React 18 Dev
      if (hasExchanged.current) return;
      hasExchanged.current = true;

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        // 2. Exchange code for session if present
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // 3. Verify we actually have a session now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          console.warn("No session found after callback exchange.");
          navigate("/sign-in", { replace: true });
          return;
        }

        // 4. Run your database syncs
        await ensureUserRowFromAuth(session.user);
        
        // 5. Update your global AuthContext state
        await checkAuthUser();

        // 6. Final Redirect
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
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LoaderMusic />
      <p className="text-light-3 text-sm italic">Completing secure sign-in...</p>
    </div>
  );
};

export default AuthCallback;