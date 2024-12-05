import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const recentActivities = [
  {
    id: 1,
    action: "New tenant moved in",
    property: "123 Main St",
    date: "2023-06-15",
  },
  {
    id: 2,
    action: "Maintenance request resolved",
    property: "456 Elm St",
    date: "2023-06-14",
  },
  {
    id: 3,
    action: "Rent payment received",
    property: "789 Oak St",
    date: "2023-06-13",
  },
  {
    id: 4,
    action: "Lease renewed",
    property: "101 Pine St",
    date: "2023-06-12",
  },
  {
    id: 5,
    action: "Property inspection completed",
    property: "202 Maple St",
    date: "2023-06-11",
  },
];

export function RecentActivities() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest updates from your properties</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recentActivities.map((activity) => (
            <li key={activity.id} className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium leading-none">
                  {activity.action}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.property}
                </p>
                <p className="text-xs text-muted-foreground">{activity.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
