import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Loader2,
  Phone,
  Mail,
  Building,
  FileText,
  ShieldCheck,
  Edit,
  X,
  Info,
} from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Permission descriptions mapping
const PERMISSION_DESCRIPTIONS = {
  can_manage_properties:
    "Allows the user to manage and oversee all property-related operations, including adding, editing, and removing properties from the system.",
  can_add_units:
    "Grants permission to add new units to existing properties in the system.",
  can_edit_units:
    "Enables the user to modify details of existing units within properties.",
  can_delete_units:
    "Provides the ability to remove units from the property management system.",
  can_view_financial_data:
    "Allows access to view financial information, including income, expenses, and financial reports.",
};

const profileFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  phone_number: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileData {
  user_id: string;
  username: string;
  email: string;
  phone_number: string;
  user_type: string;
  identification_type: string;
  identification_number: string;
  permissions: {
    can_manage_properties: boolean;
    can_add_units: boolean;
    can_edit_units: boolean;
    can_delete_units: boolean;
    can_view_financial_data: boolean;
  };
}

// Separate component for Permission Info Dialog
const PermissionInfoDialog = ({
  permissionKey,
  isGranted,
}: {
  permissionKey: string;
  isGranted: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(true)}
              className="ml-2 focus:outline-none"
            >
              <Info
                className={`
                  h-4 w-4 
                  ${isGranted ? "text-green-500" : "text-red-500"}
                  hover:opacity-75
                  transition-opacity
                `}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click for details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 capitalize">
              {permissionKey.split("_").join(" ")}
            </DialogTitle>
            <DialogClose
              className="
                absolute 
                right-0 
                top-0 
                p-2 
                hover:bg-gray-100 
                rounded-full 
                transition-colors
              "
            >
              <X className="h-5 w-5 text-gray-500 hover:text-gray-800" />
            </DialogClose>
          </DialogHeader>
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheck
                className={`
                  h-8 w-8 
                  ${isGranted ? "text-green-500" : "text-red-500"}
                  transition-colors
                `}
              />
              <span
                className={`
                text-base font-semibold
                ${isGranted ? "text-green-700" : "text-red-700"}
              `}
              >
                {isGranted ? "Granted" : "Not Granted"}
              </span>
            </div>
            <p className="text-gray-700">
              {
                PERMISSION_DESCRIPTIONS[
                  permissionKey as keyof typeof PERMISSION_DESCRIPTIONS
                ]
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      phone_number: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        console.log(accessToken);
        if (!accessToken) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "https://assettoneestates.pythonanywhere.com/api/v1/profile/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          form.reset({
            username: data.profile.username,
            phone_number: data.profile.phone_number,
          });
        } else {
          throw new Error(data.message || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast, form]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/profile/",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result = await response.json();
      if (result.success) {
        setProfile((prevProfile) => ({
          ...prevProfile!,
          username: data.username,
          phone_number: data.phone_number,
        }));
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4 bg-gray-50 rounded-t-lg">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-md">
              <AvatarImage
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${profile?.username}`}
                alt={profile?.username}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
                {profile?.username}
              </CardTitle>
              <Badge
                variant="secondary"
                className="
                  px-3 py-1 
                  text-sm 
                  bg-primary/10 
                  text-primary 
                  hover:bg-primary/20 
                  transition-colors
                "
              >
                {profile?.user_type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Mail className="h-6 w-6 text-primary" />,
                  label: "Email",
                  value: profile?.email,
                },
                {
                  icon: <Phone className="h-6 w-6 text-primary" />,
                  label: "Phone",
                  value: profile?.phone_number,
                },
                {
                  icon: <FileText className="h-6 w-6 text-primary" />,
                  label: "Identification Type",
                  value: profile?.identification_type,
                },
                {
                  icon: <Building className="h-6 w-6 text-primary" />,
                  label: "Identification Number",
                  value: profile?.identification_number,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="
                    flex items-center 
                    space-x-4 
                    p-4 
                    bg-gray-50 
                    rounded-lg 
                    shadow-sm 
                    hover:shadow-md 
                    transition-all 
                    duration-300
                  "
                >
                  {item.icon}
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6 bg-gray-200" />

            {/* Permissions Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(profile?.permissions || {}).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="
                        flex items-center 
                        space-x-3 
                        p-3 
                        rounded-lg 
                        transition-colors 
                        duration-300
                        hover:bg-gray-100
                        "
                    >
                      <ShieldCheck
                        className={`
                          h-6 w-6 
                          ${value ? "text-green-500" : "text-red-500"}
                          transition-colors
                        `}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {key.split("_").join(" ")}
                      </span>
                      <PermissionInfoDialog
                        permissionKey={key}
                        isGranted={value}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="
                    w-full 
                    sm:w-auto 
                    group 
                    transition-all 
                    duration-300 
                    hover:bg-primary-600
                  "
                >
                  <Edit className="mr-2 h-5 w-5 group-hover:rotate-6 transition-transform" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-xl shadow-2xl">
                <DialogHeader className="relative">
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Edit Profile
                  </DialogTitle>
                  <DialogClose
                    className="
                      absolute 
                      right-0 
                      top-0 
                      p-2 
                      hover:bg-gray-100 
                      rounded-full 
                      transition-colors
                    "
                  >
                    <X className="h-5 w-5 text-gray-500 hover:text-gray-800" />
                  </DialogClose>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="
                                focus:border-primary 
                                focus:ring-primary/30 
                                transition-colors
                              "
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              className="
                                focus:border-primary 
                                focus:ring-primary/30 
                                transition-colors
                              "
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-4">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="
                            border-gray-300 
                            text-gray-700 
                            hover:bg-gray-50 
                            transition-colors
                          "
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        className="
                          bg-primary 
                          hover:bg-primary-600 
                          transition-colors
                        "
                      >
                        Update Profile
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
