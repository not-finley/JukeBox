import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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
import { SigninValidation } from "@/lib/validation";
import { z } from "zod";
import Loader from "@/components/shared/loader";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations"; 

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync: signInAccount, isPending } = useSignInAccount();

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    try {
      const session = await signInAccount(values); // ✅ use the mutation
      console.log("Signed in session:", session);

      if (session) {
        form.reset();
        navigate("/");
      } else {
        toast({ title: "Sign in failed. Please try again." });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Something went wrong",
      });
    }
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/JBlogoSimple.svg" alt="Logo" />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Log in to your account</h2>
        <p className="text-light-3 small-medium md:base-regular">
          Welcome back! Please enter your details
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary">
            {isPending ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't have an account?
            <Link
              to="/sign-up"
              className="text-emerald-500 text-small-semibold ml-1 underline hover:text-emerald-400"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
