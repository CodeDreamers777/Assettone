import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const tenants = [
  {
    id: 1,
    name: "Alice Johnson",
    property: "123 Main St, Apt 4B",
    status: "Active",
  },
  {
    id: 2,
    name: "Bob Smith",
    property: "456 Elm St, Unit 2",
    status: "Late Payment",
  },
  {
    id: 3,
    name: "Carol Williams",
    property: "789 Oak St, Apt 7C",
    status: "Active",
  },
  {
    id: 4,
    name: "David Brown",
    property: "101 Pine St, Unit 3",
    status: "Moving Out",
  },
  {
    id: 5,
    name: "Eva Davis",
    property: "202 Maple St, Apt 1A",
    status: "Active",
  },
];

export function TenantList() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Tenants</CardTitle>
        <CardDescription>Overview of your current tenants</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {tenants.map((tenant) => (
            <li key={tenant.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${tenant.name}`}
                />
                <AvatarFallback>
                  {tenant.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {tenant.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tenant.property}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm ${tenant.status === "Active" ? "text-green-500" : tenant.status === "Late Payment" ? "text-red-500" : "text-yellow-500"}`}
                >
                  {tenant.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
