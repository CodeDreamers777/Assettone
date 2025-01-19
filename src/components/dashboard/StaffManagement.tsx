import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Eye,
  Edit,
  Trash,
  UserPlus,
  Building,
  Search,
  User,
} from "lucide-react";

interface PropertyInfo {
  id: string;
  name: string;
  address: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_type: "MANAGER" | "CLERK";
  identification_type:
    | "id"
    | "passport"
    | "workPermit"
    | "militaryId"
    | "driversLicense";
  identification_number: string;
  can_manage_properties: boolean;
  can_add_units: boolean;
  can_edit_units: boolean;
  can_delete_units: boolean;
  can_view_financial_data: boolean;
  property_info: PropertyInfo[];
}

interface PropertyStaff {
  property_info: PropertyInfo;
  staff: Staff[];
}

export function StaffManagement() {
  const [propertyStaff, setPropertyStaff] = useState<PropertyStaff[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/staff/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data: PropertyStaff[] = await response.json();
      setPropertyStaff(data);
      if (data.length > 0 && !selectedProperty) {
        setSelectedProperty(data[0].property_info.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff",
        variant: "destructive",
      });
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/create-staff-account/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(newStaff),
        },
      );
      if (!response.ok) throw new Error("Failed to create staff");
      toast({
        title: "Success",
        description: "Staff account created successfully",
      });
      setIsCreateModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create staff account",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    try {
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/staff/${selectedStaff.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(selectedStaff),
        },
      );
      if (!response.ok) throw new Error("Failed to update staff");
      toast({
        title: "Success",
        description: "Staff account updated successfully",
      });
      setIsEditModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/staff/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to delete staff");
      toast({
        title: "Success",
        description: "Staff account deleted successfully",
      });
      fetchStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff account",
        variant: "destructive",
      });
    }
  };

  const filteredStaff = selectedProperty
    ? propertyStaff
        .find((ps) => ps.property_info.id === selectedProperty)
        ?.staff.filter(
          (s) =>
            s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || []
    : [];

  return (
    <div className="space-y-6">
      <Card className="border-green-100">
        <CardHeader className="bg-green-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <User className="h-5 w-5" />
                Staff Management
              </CardTitle>
              <CardDescription className="text-green-600 mt-1">
                Manage your property staff and their permissions
              </CardDescription>
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-green-800">
                    Create New Staff Member
                  </DialogTitle>
                  <DialogDescription className="text-green-600">
                    Fill in the details to create a new staff account
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateStaff();
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="first_name" className="text-right">
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        value={newStaff.first_name || ""}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            first_name: e.target.value,
                          })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="last_name" className="text-right">
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        value={newStaff.last_name || ""}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            last_name: e.target.value,
                          })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaff.email || ""}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, email: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone_number" className="text-right">
                        Phone Number
                      </Label>
                      <Input
                        id="phone_number"
                        value={newStaff.phone_number || ""}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            phone_number: e.target.value,
                          })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user_type" className="text-right">
                        User Type
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setNewStaff({
                            ...newStaff,
                            user_type: value as "MANAGER" | "CLERK",
                          })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANAGER">
                            Property Manager
                          </SelectItem>
                          <SelectItem value="CLERK">Clerk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="identification_type"
                        className="text-right"
                      >
                        ID Type
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setNewStaff({
                            ...newStaff,
                            identification_type:
                              value as Staff["identification_type"],
                          })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">National ID</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="workPermit">
                            Work Permit
                          </SelectItem>
                          <SelectItem value="militaryId">
                            Military ID
                          </SelectItem>
                          <SelectItem value="driversLicense">
                            Driver's License
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="identification_number"
                        className="text-right"
                      >
                        ID Number
                      </Label>
                      <Input
                        id="identification_number"
                        value={newStaff.identification_number || ""}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            identification_number: e.target.value,
                          })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="property" className="text-right">
                        Property
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setNewStaff({
                            ...newStaff,
                            property_info: [
                              { id: value, name: "", address: "" },
                            ],
                          })
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyStaff.map((ps) => (
                            <SelectItem
                              key={ps.property_info.id}
                              value={ps.property_info.id}
                            >
                              {ps.property_info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Staff
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-green-100 focus:ring-green-500"
              />
            </div>
            <div className="flex-1 max-w-sm">
              <Select
                value={selectedProperty || ""}
                onValueChange={(value) => setSelectedProperty(value)}
              >
                <SelectTrigger className="border-green-100 focus:ring-green-500">
                  <Building className="h-4 w-4 mr-2 text-green-500" />
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {propertyStaff.map((ps) => (
                    <SelectItem
                      key={ps.property_info.id}
                      value={ps.property_info.id}
                    >
                      {ps.property_info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredStaff.map((staff) => (
              <Card
                key={staff.id}
                className="hover:shadow-md transition-shadow border-green-100"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 rounded-full p-3">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {`${staff.first_name} ${staff.last_name}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">{staff.email}</p>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {staff.user_type === "MANAGER"
                              ? "Property Manager"
                              : "Clerk"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-green-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No staff members found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or add new staff members
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-green-600">Name</Label>
                  <p className="mt-1 font-medium">{`${selectedStaff.first_name} ${selectedStaff.last_name}`}</p>
                </div>
                <div>
                  <Label className="text-sm text-green-600">Email</Label>
                  <p className="mt-1">{selectedStaff.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-green-600">Phone</Label>
                  <p className="mt-1">{selectedStaff.phone_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-green-600">User Type</Label>
                  <p className="mt-1">
                    {selectedStaff.user_type === "MANAGER"
                      ? "Property Manager"
                      : "Clerk"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-green-600">Property</Label>
                  <p className="mt-1">
                    {selectedStaff.property_info[0]?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-green-600">ID Type</Label>
                  <p className="mt-1">
                    {
                      {
                        id: "National ID",
                        passport: "Passport",
                        workPermit: "Work Permit",
                        militaryId: "Military ID",
                        driversLicense: "Driver's License",
                      }[selectedStaff.identification_type]
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-green-600">ID Number</Label>
                  <p className="mt-1">{selectedStaff.identification_number}</p>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-green-600 mb-2 block">
                  Permissions
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Manage Properties",
                      value: selectedStaff.can_manage_properties,
                    },
                    { label: "Add Units", value: selectedStaff.can_add_units },
                    {
                      label: "Edit Units",
                      value: selectedStaff.can_edit_units,
                    },
                    {
                      label: "Delete Units",
                      value: selectedStaff.can_delete_units,
                    },
                    {
                      label: "View Financial Data",
                      value: selectedStaff.can_view_financial_data,
                    },
                  ].map((permission) => (
                    <div
                      key={permission.label}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${permission.value ? "bg-green-500" : "bg-gray-300"}`}
                      />
                      <span className="text-sm">{permission.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-green-800">Edit Staff</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateStaff();
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_first_name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="edit_first_name"
                    value={selectedStaff.first_name}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        first_name: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_last_name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="edit_last_name"
                    value={selectedStaff.last_name}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        last_name: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedStaff.email}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        email: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_phone_number" className="text-right">
                    Phone Number
                  </Label>
                  <Input
                    id="edit_phone_number"
                    value={selectedStaff.phone_number}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        phone_number: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_property" className="text-right">
                    Property
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        property_info: [
                          { ...selectedStaff.property_info[0], id: value },
                        ],
                      })
                    }
                    defaultValue={selectedStaff.property_info[0]?.id}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyStaff.map((ps) => (
                        <SelectItem
                          key={ps.property_info.id}
                          value={ps.property_info.id}
                        >
                          {ps.property_info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_user_type" className="text-right">
                    User Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        user_type: value as "MANAGER" | "CLERK",
                      })
                    }
                    defaultValue={selectedStaff.user_type}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGER">Property Manager</SelectItem>
                      <SelectItem value="CLERK">Clerk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit_identification_type"
                    className="text-right"
                  >
                    ID Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        identification_type:
                          value as Staff["identification_type"],
                      })
                    }
                    defaultValue={selectedStaff.identification_type}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="workPermit">Work Permit</SelectItem>
                      <SelectItem value="militaryId">Military ID</SelectItem>
                      <SelectItem value="driversLicense">
                        Driver's License
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="edit_identification_number"
                    className="text-right"
                  >
                    ID Number
                  </Label>
                  <Input
                    id="edit_identification_number"
                    value={selectedStaff.identification_number}
                    onChange={(e) =>
                      setSelectedStaff({
                        ...selectedStaff,
                        identification_number: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Update Staff
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
