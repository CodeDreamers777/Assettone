import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Users, Shield, Zap } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            About RentEase
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Your all-in-one property management solution
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.name}
                className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4 text-lg font-medium text-gray-900">
                    {feature.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600">
                At RentEase, we're committed to simplifying property management
                for landlords and tenants alike. Our comprehensive platform
                streamlines every aspect of property management, from rent
                collection to maintenance requests, ensuring a smooth and
                efficient experience for all parties involved.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Trusted by property managers across the globe
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of satisfied users who have transformed their
            property management experience with RentEase.
          </p>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    name: "Efficient Property Management",
    description:
      "Streamline your property management tasks with our intuitive dashboard and automated processes.",
    icon: Building,
  },
  {
    name: "Tenant Portal",
    description:
      "Provide your tenants with a user-friendly portal for rent payments, maintenance requests, and communication.",
    icon: Users,
  },
  {
    name: "Financial Tracking",
    description:
      "Keep track of your property finances with detailed reports and real-time analytics.",
    icon: Zap,
  },
  {
    name: "Maintenance Management",
    description:
      "Efficiently handle maintenance requests and track repairs to keep your properties in top condition.",
    icon: Shield,
  },
];
