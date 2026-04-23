import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRowFromAuth } from "@/lib/supabase/api/users";
import { useUserContext } from "@/lib/AuthContext";
import LoaderMusic from "@/components/shared/loaderMusic";
import { takePostAuthRedirect } from "@/lib/auth/oauth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuthUser } = useUserContext();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // React Strict Mode may run this twice; a reused code should still leave a session if the first exchange succeeded.
            console.warn("exchangeCodeForSession:", error.message);
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          if (!cancelled) navigate("/sign-in", { replace: true });
          return;
        }

        await ensureUserRowFromAuth(session.user);
        await checkAuthUser();

        if (!cancelled) {
          const next = takePostAuthRedirect();
          navigate(next, { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (!cancelled) {
          setMessage("Something went wrong. Redirecting…");
          navigate("/sign-in", { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkAuthUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LoaderMusic />
      <p className="text-light-3 text-sm">{message}</p>
    </div>
  );
};

export default AuthCallback;
