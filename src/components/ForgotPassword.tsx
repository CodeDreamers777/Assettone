"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Mail, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Email request schema
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// OTP and new password schema
const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ForgotPasswordProps {
  onResetSuccess: () => void;
}

export function ForgotPassword({ onResetSuccess }: ForgotPasswordProps) {
  const { toast } = useToast();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Form for email request
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for OTP verification and password reset
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Helper component for required field label
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </div>
  );

  // Request password reset
  async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/reset-password/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Request Failed",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Store email for the next step
      setUserEmail(values.email);
      resetForm.setValue("email", values.email);

      // Close email modal and open OTP modal
      setIsEmailModalOpen(false);
      setIsOtpModalOpen(true);

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code",
      });
    } catch (err) {
      toast({
        title: "Request Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  // Verify OTP and reset password
  async function onResetSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/reset-password/verify/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            otp: values.otp,
            new_password: values.newPassword,
            confirm_password: values.confirmPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Password Reset Failed",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
        return;
      }

      // Save tokens from response
      if (data.tokens) {
        localStorage.setItem("accessToken", data.tokens.access);
        localStorage.setItem("refreshToken", data.tokens.refresh);
      }

      // Close OTP modal
      setIsOtpModalOpen(false);

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in.",
        variant: "default",
        className: "bg-green-500 text-white",
      });

      // Notify parent component about successful reset
      onResetSuccess();
    } catch (err) {
      toast({
        title: "Reset Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      {/* Forgot Password Link */}
      <Button
        variant="link"
        className="text-green-600 hover:text-green-800 p-0 h-auto text-sm"
        onClick={() => setIsEmailModalOpen(true)}
      >
        Forgot Password?
      </Button>

      {/* Email Confirmation Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a verification code.
            </DialogDescription>
          </DialogHeader>
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
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
                          placeholder="Enter your email address"
                          className="pl-10 border-green-600 focus:border-green-800 focus:ring-green-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  Send Code
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* OTP Verification and Password Reset Modal */}
      <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify and Reset Password</DialogTitle>
            <DialogDescription>
              Enter the verification code sent to {userEmail} and your new
              password.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Verification Code</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                        <Input
                          placeholder="Enter 6-digit code"
                          className="pl-10 border-green-600 focus:border-green-800 focus:ring-green-500"
                          maxLength={6}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>New Password</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        className="border-green-600 focus:border-green-800 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredLabel>Confirm Password</RequiredLabel>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        className="border-green-600 focus:border-green-800 focus:ring-green-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOtpModalOpen(false);
                    setIsEmailModalOpen(true);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
