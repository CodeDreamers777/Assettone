import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const topProperties = [
  { id: 1, address: "123 Main St", units: 10, occupancy: 95, revenue: 15000 },
  { id: 2, address: "456 Elm St", units: 8, occupancy: 100, revenue: 12000 },
  { id: 3, address: "789 Oak St", units: 12, occupancy: 92, revenue: 18000 },
  { id: 4, address: "101 Pine St", units: 6, occupancy: 83, revenue: 9000 },
  { id: 5, address: "202 Maple St", units: 15, occupancy: 97, revenue: 22000 },
];

export function TopProperties() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Top Performing Properties</CardTitle>
        <CardDescription>
          Properties with the highest occupancy and revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {topProperties.map((property) => (
            <li key={property.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium leading-none">
                  {property.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {property.units} units
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={property.occupancy >= 95 ? "default" : "secondary"}
                >
                  {property.occupancy}% occupied
                </Badge>
                <p className="text-sm font-medium">
                  ${property.revenue.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
