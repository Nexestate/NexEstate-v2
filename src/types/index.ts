import type { ComponentType } from 'react';

export type UserRole =
  | 'superadmin'
  | 'admin'
  | 'broker'
  | 'buyer'
  | 'developer'
  | 'owner'
  | 'investor'
  | 'manager'
  | 'receiver'
  | 'partner';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  company?: string | null;
  license_number?: string | null;
  avatar_url?: string;
  created_at?: string;
}

export type PropertyKind =
  | 'apartment'
  | 'house'
  | 'office'
  | 'commercial'
  | 'industrial'
  | 'land';

export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type PropertyVisibility = 'private' | 'public' | 'off_market' | 'auction';

export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface ManagedProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyIncome: number;
}

export interface SharedProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  permissionLevel: PermissionLevel;
  sharedByName: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  addNew?: string;
  adminOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
