import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { MapPin, Phone, Mail } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." }),
});

export default function ContactUs() {
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
      const response = await fetch("http://127.0.0.1:8000/api/v1/contact-us/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the form");
      }

      setSubmitMessage({
        type: "success",
        text: "We've received your message and will get back to you soon.",
      });
      form.reset();
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "There was a problem sending your message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-green-800 sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-4 text-xl text-green-600">
            We're here to help with any questions or concerns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white border-green-200 shadow-lg shadow-green-100">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-800">
                Get in Touch
              </CardTitle>
              <CardDescription className="text-green-600">
                Fill out the form below and we'll get back to you as soon as
                possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-green-700">Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                            {...field}
                          />
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
                          <Input
                            placeholder="Your email"
                            type="email"
                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                            {...field}
                          />
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
                        <FormLabel className="text-green-700">
                          Message
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your message"
                            className="min-h-[100px] border-green-200 focus:border-green-500 focus:ring-green-500"
                            {...field}
                          />
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
                    {isLoading ? "Sending..." : "Send Message"}
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

          <div className="space-y-8">
            <Card className="bg-white border-green-200 shadow-lg shadow-green-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-800">
                  Our Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border-2 border-green-200">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.859462835704!2d36.80244357376679!3d-1.2561653355914302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f17503b312f5b%3A0xf18e3a6bafbaff7f!2sNairobi%20Garage!5e0!3m2!1sen!2sus!4v1733181263122!5m2!1sen!2sus"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-green-200 shadow-lg shadow-green-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-800">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-[#38b000]" />
                  </div>
                  <span className="text-green-600">
                    123 Property St, New York, NY 10001
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-[#38b000]" />
                  </div>
                  <span className="text-green-600">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[#38b000]" />
                  </div>
                  <span className="text-green-600">contact@rentease.com</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
