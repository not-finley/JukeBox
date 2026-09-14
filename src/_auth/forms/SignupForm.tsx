import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { SignupValidation } from "@/lib/validation";
import { z } from "zod";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations";
import { createUserAccount } from "@/lib/supabase/api";
import OAuthButtons from "@/components/shared/OAuthButtons";

const SignupForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const redirectTo = location.state?.from || "/home";

  const { mutateAsync: signInAccount, isPending: isSigningIn } = useSignInAccount();

  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    try {
      // 1️⃣ Create account
      const data = await createUserAccount({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username
      });
      console.log("Account created:", data);

      // 2️⃣ Auto sign-in
      const session = await signInAccount({ email: values.email, password: values.password });
      console.log("Signed in session:", session);

      if (session) {
        form.reset();
        navigate(redirectTo, { replace: true });
      } else {
        toast({ title: "Sign in after signup failed." });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "Something went wrong",
      });
    }
  }

  return (
    <Form {...form}>
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <img src="/assets/images/JBlogoSimple.svg" alt="Logo" className="w-50 h-10" />

        <h2 className="h3-bold md:h2-bold pt-3 sm:pt-6 text-center">Create a new account</h2>
        <p className="text-light-3 small-medium md:base-regular text-center">
          Enter your details to start reviewing.
        </p>

        <div className="w-full mt-4">
          <OAuthButtons redirectAfterAuth={redirectTo} />
        </div>

        <div className="flex items-center gap-3 w-full mt-4">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-xs uppercase text-gray-500">or sign up with email</span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        {/* Reduced gap-5 to gap-3 for compact layout on short screens */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full mt-3">
          {["name", "username", "email", "password"].map((field) => (
            <FormField
              key={field}
              control={form.control}
              name={field as any}
              render={({ field: f }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
                  <FormControl>
                    <Input
                      type={field === "password" ? "password" : "text"}
                      className="shad-input h-10"
                      {...f}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="shad-button_primary mt-2">
            { isSigningIn ? (
              <div className="flex-center gap-2">
                Loading...
              </div>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-1">
            Already have an account?
            <Link
              to="/sign-in"
              className="text-emerald-500 text-small-semibold ml-1 underline hover:text-emerald-400"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignupForm;
