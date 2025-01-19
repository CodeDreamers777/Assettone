import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, Key, BarChart3, Shield, MessageSquare } from "lucide-react";
import QuoteSection from "./QuoteSection"; // Import the new QuoteSection component

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-green-50/20 to-green-100/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#38b000] to-green-600 animate-gradient">
            Simplify Your Rental Property Management
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Streamline your property management with our all-in-one solution.
            From tenant screening to maintenance requests, we've got you
            covered.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="border-[#38b000] text-[#38b000] hover:bg-[#38b000]/10 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => navigate("/book-demo")}
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Quote Section - Now using the new component */}
      <QuoteSection />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#38b000]">
            Everything You Need to Manage Your Properties
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Building2 className="w-10 h-10 text-[#38b000]" />}
              title="Property Management"
              description="Easily manage multiple properties from a single dashboard with detailed property insights."
            />
            <FeatureCard
              icon={<Key className="w-10 h-10 text-[#38b000]" />}
              title="Tenant Screening"
              description="Comprehensive tenant screening with background checks and rental history verification."
            />
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10 text-[#38b000]" />}
              title="Financial Tracking"
              description="Track rent payments, expenses, and generate detailed financial reports automatically."
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-[#38b000]" />}
              title="Maintenance Management"
              description="Handle maintenance requests efficiently with our automated ticketing system."
            />
            <FeatureCard
              icon={<MessageSquare className="w-10 h-10 text-[#38b000]" />}
              title="Communication Hub"
              description="Built-in messaging system for seamless communication between property managers and tenants."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#38b000] to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of property managers who have simplified their rental
            operations
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-[#38b000] hover:bg-gray-100 transition-colors duration-300"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <FooterColumn
              title="Product"
              items={["Features", "Pricing", "Documentation"]}
            />
            <FooterColumn
              title="Company"
              items={["About", "Blog", "Careers"]}
            />
            <FooterColumn
              title="Support"
              items={["Help Center", "Contact", "Status"]}
            />
            <FooterColumn
              title="Legal"
              items={["Privacy", "Terms", "Security"]}
            />
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© 2024 Assettone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-white shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-[#38b000]">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-[#38b000]">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-white font-bold mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            <a
              href="#"
              className="hover:text-[#38b000] transition-colors duration-200"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
