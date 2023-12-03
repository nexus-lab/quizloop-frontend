import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Heading } from "@/src/components/Heading";
import { Spacer } from "@/src/components/Spacer";
import HeadElements from "@/src/components/misc/HeadElements";
import Layout from "@/src/layouts/landing/layout";
import useViewTransitionRouter from "@/src/hooks/useViewTransitionRouter";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { GradientButton } from "@/src/components/GradientButton";
import { useState } from "react";
import { loginUser, resendVerificationEmail } from "@/lib/api/auth/routes";
import { TransparentButton } from "@/src/components/TransparentButton";
import { useSession } from "@/src/contexts/SessionContext";
import Link from "next/link";


const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

export default function Login() {
  const router = useViewTransitionRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { setSession } = useSession();

  const goBack = () => {
    router.push("/");
  };

  const onClickForgotPassword = (e: any) => {
    e.preventDefault();
    router.push("/login");
  };

  const onClickSignup = (e: any) => {
    e.preventDefault();
    router.push("/signup");
  };

  // Define your form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await loginUser(values);
      
      if (response.status === 200) {
        // Set cookies instead of using localStorage
        document.cookie = `access_token=${response.data.access_token}; path=/; max-age=${response.data.expires_in};`;
        document.cookie = `refresh_token=${response.data.refresh_token}; path=/;`;
        document.cookie = `id_token=${response.data.id_token}; path=/; max-age=${response.data.expires_in};`;

        setSession(response.data.id_token);

        // Get user info  
        router.push("/dashboard");
      }

      if (response.error) {
        switch (response.error) {
          case "UserNotConfirmedException":
            // Resend confirm code
            const response = await resendVerificationEmail(values.email);

            if (response.error) {
              setErrorMessage("Unable to resend verification email. Please try again later.");
              break;
            }

            router.push("/signup/confirm?email=" + values.email);
            break;
        }
      }
      // Simulate a delay
      setTimeout(() => {
        setIsSubmitting(false);
        // Redirect after successful login
        // router.push("/some-path-after-login");
      }, 2000);
    } catch (e) {
      console.error(e);
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  return (
    <Layout>
      <HeadElements title="Login" />
      <div className="mt-20">
        <Image src="/real.svg" width={200} height={200} alt="Learnloop" onClick={goBack} className="hover:cursor-pointer" />
        <Spacer />
        <Heading>Login</Heading>
        <Spacer />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl className="bg-transparent border-gray-700">
                    <Input
                      placeholder="ex: example@gmail.com"
                      className="focus:border-ring focus-visible:ring-0 focus:outline-none text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Password</FormLabel>
                  <FormControl className="bg-transparent border-gray-700">
                    <Input
                      type="password"
                      placeholder="********"
                      className="focus:border-ring focus-visible:ring-0 focus:outline-none text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Link href="/forgot-password"
              className="bg-transparent hover:bg-transparent text-gray-400 flex ml-auto"
              onClick={onClickForgotPassword}
            >
              <span className="ml-auto text-sm">Forgot Password?</span>
            </Link>
            <GradientButton
              loading={isSubmitting}
              type="submit"
              className="w-full"
            >
              Login
            </GradientButton>
          </form>
        </Form>
        <Spacer />
        <Link href="/signup"
          className="bg-transparent hover:bg-transparent text-gray-400 flex ml-auto mr-auto"
          onClick={onClickSignup}
        >
          <p className="ml-auto text-sm">Don&apos;t have an account?</p>
          <span className="text-mainblue font-bold ml-2 text-sm mr-auto">Signup</span>
        </Link>
        {/* Add any additional buttons or links here */}
      </div>
    </Layout>
  );
}
