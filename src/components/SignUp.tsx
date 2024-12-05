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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Phone, Lock, CreditCard } from "lucide-react";

// Updated Zod schema to match backend field names
const signUpSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  phone_number: z.string().min(10, { message: "Invalid phone number" }),
  identification_type: z
    .string()
    .min(1, { message: "Please select an identification type" }),
  identification_number: z
    .string()
    .min(1, { message: "Identification number is required" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

interface SignUpProps {
  onSignUpSuccess: () => void;
}

export function SignUp({ onSignUpSuccess }: SignUpProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone_number: "",
      identification_type: "",
      identification_number: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    try {
      console.log("Submitting signup data:", values); // Added for debugging
      const response = await fetch("http://127.0.0.1:8000/api/v1/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      console.log("Response from server:", response, data); // Added for debugging

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during signup");
      }

      // Call the onSignUpSuccess callback to switch to the login tab
      onSignUpSuccess();
    } catch (err) {
      console.error("Signup error:", err); // Added for debugging
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter your email"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter your phone number"
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
          name="identification_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identification Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select identification type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="work_permit">Work Permit</SelectItem>
                  <SelectItem value="military_id">Military ID</SelectItem>
                  <SelectItem value="drivers_license">
                    Driver's License
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="identification_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identification Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Enter your identification number"
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
          Create Account
        </Button>
      </form>
    </Form>
  );
}
