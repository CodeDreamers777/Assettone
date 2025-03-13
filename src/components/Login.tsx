"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ForgotPassword } from "./ForgotPassword";

export type UserType = "ADMIN" | "MANAGER" | "CLERK" | "TENANT";

interface LoginProps {
  onLoginSuccess: () => void;
}

const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export function Login({ onLoginSuccess }: LoginProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Helper component for required field label
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </div>
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Function to format date and time
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString(undefined, options);
  };

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/login/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Save tokens and user info to localStorage
      localStorage.setItem("accessToken", data.tokens.access);
      localStorage.setItem("refreshToken", data.tokens.refresh);

      // Save user type to localStorage
      const userType = data.profile?.user_type;
      if (userType) {
        localStorage.setItem("userType", userType);
      }

      // Save last session to localStorage
      const lastSession = data.last_session;
      if (lastSession) {
        localStorage.setItem("lastSession", lastSession);

        // Personalized last session toast
        toast({
          title: `Welcome, ${data.profile.username}!`,
          description: `Your last login was on ${formatLastLogin(lastSession)}`,
          variant: "default",
          className: "bg-green-500 text-white",
        });
      }

      // Show success toast
      toast({
        title: "Login Successful",
        description: `Welcome, ${data.profile.username}!`,
      });

      // Call onLoginSuccess
      onLoginSuccess();
    } catch (err) {
      toast({
        title: "Login Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  // Handle successful password reset
  const handleResetSuccess = () => {
    // Call onLoginSuccess after password reset
    onLoginSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Username</RequiredLabel>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                  <Input
                    placeholder="Enter your username"
                    className="pl-10 border-green-600 focus:border-green-800 focus:ring-green-500"
                    {...field}
                  />
                </div>
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
              <FormLabel>
                <RequiredLabel>Password</RequiredLabel>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 border-green-600 focus:border-green-800 focus:ring-green-500"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <ForgotPassword onResetSuccess={handleResetSuccess} />
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          Sign In
        </Button>
      </form>
    </Form>
  );
}
