import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  ClipboardList,
  WrenchIcon,
  CreditCard,
} from "lucide-react";

const quickActions = [
  {
    id: 1,
    title: "Add Property",
    icon: PlusCircle,
    description: "List a new rental property",
  },
  {
    id: 2,
    title: "Create Lease",
    icon: ClipboardList,
    description: "Set up a new tenant lease",
  },
  {
    id: 3,
    title: "Maintenance",
    icon: WrenchIcon,
    description: "Log a maintenance request",
  },
  {
    id: 4,
    title: "Collect Rent",
    icon: CreditCard,
    description: "Process rent payments",
  },
];

export function QuickActions() {
  return (
    <>
      {quickActions.map((action) => (
        <Card key={action.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {action.title}
            </CardTitle>
            <action.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {action.description}
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <action.icon className="mr-2 h-4 w-4" />
              {action.title}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}
