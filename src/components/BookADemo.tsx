import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, User } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

export default function BookADemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSubmitMessage(null);
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/book-demo/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit the form");
      }

      setSubmitMessage({
        type: "success",
        text: "Your demo request has been submitted successfully.",
      });
      form.reset();
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "There was a problem submitting your request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md border-green-200 shadow-lg shadow-green-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-800">
            Book a Demo
          </CardTitle>
          <CardDescription className="text-center text-green-600">
            Fill out the form below to request a demo of our product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Your Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                        <Input
                          placeholder="Enter your name"
                          className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                        <Input
                          placeholder="Enter your email"
                          type="email"
                          className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-700">Message</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 text-green-500" />
                        <Textarea
                          placeholder="Enter your message"
                          className="min-h-[100px] pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#38b000] hover:bg-[#2d8c00] text-white transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Book Demo"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          {submitMessage && (
            <div
              className={`w-full p-4 rounded-md ${
                submitMessage.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {submitMessage.text}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
