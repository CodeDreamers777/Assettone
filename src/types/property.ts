// Define the Property interface with index signature
export interface Property {
  id: string;
  name: string;
  logo: string | null;
  logo_url: string | null;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string;
  created_at: string;
  updated_at: string;
  manager?: string | null;
  owner?: string;
  total_units?: number;
  [key: string]: string | null | undefined; // Index signature for dynamic property access
}

// Property field type for typesafe access
export type PropertyField = keyof Property;
