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
import { createUserAccount } from "@/lib/appwrite/api";

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

  const redirectTo = location.state?.from || "/";

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
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Create a new account</h2>
        <p className="text-light-3 small-medium md:base-regular">
          Enter your details to start reviewing.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
          {["name", "username", "email", "password"].map((field) => (
            <FormField
              key={field}
              control={form.control}
              name={field as any}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
                  <FormControl>
                    <Input
                      type={field === "password" ? "password" : "text"}
                      className="shad-input"
                      {...f}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" className="shad-button_primary">
            { isSigningIn ? (
              <div className="flex-center gap-2">
                Loading...
              </div>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
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
