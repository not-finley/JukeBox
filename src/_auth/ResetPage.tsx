import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [recoveryActive, setRecoveryActive] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event) => {
                if (event === "PASSWORD_RECOVERY") {
                    setRecoveryActive(true);
                }
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (error) setErrorMsg(error.message);
        else setSuccess(true);
    }

    // Still waiting for redirect → Supabase hasn't fired PASSWORD_RECOVERY yet
    if (!recoveryActive && !success)
        return <p>Validating reset link…</p>;

    if (success) {
        return (
            <div>
                <h2>Password updated ✅</h2>
                <button onClick={() => (window.location.href = "/sign-in")}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="sm:w-420 flex-center flex-col">
                <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />

                <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Set a new password</h2>

                <Input
                    type="password"
                    required
                    className="shad-input pr-10"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

                <Button
                    className="shad-button_primary"
                    disabled={loading}
                >
                    {loading ? "Updating…" : "Reset Password"}
                </Button>
            </div>
        </form>
    );
}
