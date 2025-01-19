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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock } from "lucide-react";

// Define available user types
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
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

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
        throw new Error(data.message || "An error occurred");
      }

      // Save token to localStorage
      localStorage.setItem("accessToken", data.tokens.access);

      // Save user type to localStorage
      const userType = data.profile?.user_type;
      if (userType) {
        localStorage.setItem("userType", userType);
      } else {
        console.warn("User type not found in response");
      }

      // Call onLoginSuccess
      onLoginSuccess();

      // Log success (you can remove this in production)
      console.log("Login successful");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
