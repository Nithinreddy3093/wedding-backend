export interface Organization {
  organization_name: string;
  collection_name: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface User {
  email: string;
  organization_name: string;
  token?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiError {
  success: boolean;
  error: string;
  details?: string;
}

export interface OrganizationCreateData {
  organization_name: string;
  email: string;
  password: string;
}

export interface OrganizationUpdateData {
  old_organization_name: string;
  new_organization_name: string;
  email: string;
  password: string;
}

export interface OrganizationDeleteData {
  organization_name: string;
  email: string;
  password: string;
}

// Stats interface for the dashboard visualization
export interface OrgStats {
  total: number;
  active: number;
  deleted: number;
  growth: { date: string; count: number }[];
}