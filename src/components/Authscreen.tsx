interface AuthScreenProps {
  onLoginSuccess: () => void;
}

("use client");

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Login } from "./Login";
import { SignUp } from "./SignUp";

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome
          </CardTitle>
          <CardDescription className="text-center">
            Login or create an account to get started with RentEase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "login" | "signup")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Login onLoginSuccess={onLoginSuccess} />
            </TabsContent>
            <TabsContent value="signup">
              <SignUp onSignUpSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
