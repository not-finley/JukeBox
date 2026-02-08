import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const redirectUrl = "https://jukeboxd.ca/reset-password";

    async function handleReset() {
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        setLoading(false);

        if (error) {
            toast({
                title: "Error",
                description: error.message,
            });
        } else {
            toast({
                title: "Check your inbox",
                description: "Password reset instructions have been sent.",
            });
        }
    }

    return (
        <div className="sm:w-420 flex-center flex-col">
            <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />
            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Forgot your password?</h2>
            <p className="text-light-3 small-medium md:base-regular mb-4">
                Enter your email and we'll send you a reset link.
            </p>

            <Input
                type="email"
                placeholder="you@example.com"
                className="shad-input pr-10 mb-5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <Button
                disabled={!email || loading}
                onClick={handleReset}
                className="shad-button_primary mb-6"
            >
                {loading ? "Sending..." : "Send reset link"}
            </Button>

            <p className="text-small-regular text-light-2 text-center -mt-2">
                Remember your password?
                <Link
                    to="/sign-in"
                    className="text-emerald-500 text-small-semibold ml-1 underline hover:text-emerald-400"
                >
                    sign in
                </Link>
            </p>
        </div>
    );
}
