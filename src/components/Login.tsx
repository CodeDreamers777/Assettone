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

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

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

        // Show last session toast in green
        toast({
          title: "Last Session",
          description: `Previous login: ${new Date(lastSession).toLocaleString()}`,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter your username"
                    className="pl-10"
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
