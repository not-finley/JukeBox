import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
        }

        if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (error) {
        setErrorMsg(error.message);
        } else {
        setSuccess(true);
        }
    };

    if (success) {
        return (
        <div className="sm:w-420 flex-center flex-col">
            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
            Password updated successfully!
            </h2>
            <Button onClick={() => navigate("/sign-in")}>
            Go to Login
            </Button>
        </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
        <div className="sm:w-420 flex-center flex-col">
            <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />

            <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
            Set a new password
            </h2>

            <Input
            type="password"
            required
            className="shad-input pr-10 mb-4"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            />

            <Input
            type="password"
            required
            className="shad-input pr-10 mb-4"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            />

            {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

            <Button className="shad-button_primary" disabled={loading}>
            {loading ? "Updating…" : "Reset Password"}
            </Button>
        </div>
        </form>
    );
}
