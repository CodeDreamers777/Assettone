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
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Lock, CreditCard, Eye, EyeOff } from "lucide-react";

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
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await fetch("http://127.0.0.1:8000/api/v1/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!data.success) {
        // Handle specific error messages
        const errorMessages = Object.entries(data.message)
          .map(
            ([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`,
          )
          .join("\n");

        toast({
          title: "Sign Up Failed",
          description: errorMessages || "An error occurred during signup",
          variant: "destructive",
        });
        return;
      }

      // Show success toast
      toast({
        title: "Sign Up Successful",
        description: `Welcome, ${values.username}! Please log in.`,
      });

      // Call the onSignUpSuccess callback to switch to the login tab
      onSignUpSuccess();
    } catch (err) {
      toast({
        title: "Sign Up Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  // Helper component for required field label
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </div>
  );

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Email</RequiredLabel>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                  <Input
                    placeholder="Enter your email"
                    className="pl-10 border-green-600 focus:border-green-800 focus:ring-green-500"
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
                <FormLabel>
                  <RequiredLabel>First Name</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your first name"
                    className="border-green-600 focus:border-green-800 focus:ring-green-500"
                    {...field}
                  />
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
                <FormLabel>
                  <RequiredLabel>Last Name</RequiredLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your last name"
                    className="border-green-600 focus:border-green-800 focus:ring-green-500"
                    {...field}
                  />
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
              <FormLabel>
                <RequiredLabel>Phone Number</RequiredLabel>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                  <Input
                    placeholder="Enter your phone number"
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
          name="identification_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <RequiredLabel>Identification Type</RequiredLabel>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-green-600 focus:border-green-800 focus:ring-green-500">
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
              <FormLabel>
                <RequiredLabel>Identification Number</RequiredLabel>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                  <Input
                    placeholder="Enter your identification number"
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
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          Create Account
        </Button>
      </form>
    </Form>
  );
}
