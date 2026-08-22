export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
export type ClientType = 'buyer' | 'seller' | 'investor' | 'renter' | 'landlord';
export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type UnitType = 'office' | 'industrial' | 'storage' | 'residential' | 'commercial' | 'other';
export type TenantStatus = 'active' | 'ending' | 'ended';
export type TenantType = 'sole_proprietor' | 'company';
export type TenantRating = 'new' | 'good' | 'excellent' | 'warning' | 'bad';
export type SigningStatus = 'pending' | 'sent' | 'signed' | 'expired';
export type InviteStatus = 'pending' | 'claimed' | 'cancelled';
export type TaskStatus = 'open' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type AuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PropertyVisibility = 'private' | 'public' | 'off_market' | 'auction';
export type PropertyKind =
  | 'apartment'
  | 'house'
  | 'office'
  | 'commercial'
  | 'industrial'
  | 'land';
export type PropertyStatus = 'for_sale' | 'for_rent' | 'sold' | 'rented';
export type PermissionLevel = 'view' | 'edit' | 'admin';

export interface FavoriteProperty {
  id: string;
  title: string;
  city: string;
  address: string;
  price: number;
  kind: string;
  rooms?: number;
  added_at: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  city: string;
  address: string;
  price: number;
  kind: string;
  kindKey?: PropertyKind;
  status: string;
  statusLabel?: string;
  rooms?: number | null;
  area_sqm?: number | null;
}

export interface PropertySearchParams {
  query?: string;
  listingType?: 'sale' | 'rent';
}

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  kind: PropertyKind | string;
  status: PropertyStatus | string;
  visibility?: PropertyVisibility;
  price?: number;
  rooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  floor?: number;
  lat?: number;
  lng?: number;
  description?: string;
  images?: string[];
  featured?: boolean;
  broker_id?: string;
  owner_id?: string;
  created_at?: string;
}

export interface PropertyUnit {
  id: string;
  property_id: string;
  unit_number: string;
  unit_name?: string;
  unit_type?: UnitType;
  area_sqm?: number;
  monthly_rent?: number;
  unit_status: UnitStatus;
  tenant_name?: string;
}

export interface PropertyWithUnits extends Property {
  units: PropertyUnit[];
  totalUnits: number;
  occupiedUnits: number;
  monthlyIncome: number;
}

export interface Lead {
  id: string;
  broker_id?: string;
  property_id?: string;
  property_title?: string;
  full_name: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  source?: string;
  interest?: string;
  notes?: string;
  created_at: string;
}

export interface Client {
  id: string;
  broker_id?: string;
  full_name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_cities?: string[];
  preferred_kinds?: PropertyKind[];
  notes?: string;
  source?: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  full_name: string;
  tenant_type?: TenantType;
  company_name?: string;
  email?: string;
  phone?: string;
  status: TenantStatus;
  rating?: TenantRating;
  unit_number?: string;
  property_title?: string;
}

export interface Lease {
  id: string;
  property_id: string;
  property_title?: string;
  unit_id?: string;
  unit_number?: string;
  tenant_id: string;
  tenant_name: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  deposit?: number;
  is_active: boolean;
}

export interface SigningLink {
  id: string;
  token: string;
  broker_id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  deal_type?: string;
  agreement_type: string;
  commission_type?: string;
  commission_percent?: number;
  minimum_commission?: number;
  payment_days?: number;
  valid_days?: number;
  property_id?: string;
  property_address?: string;
  property_title?: string;
  property_description?: string;
  exact_address?: string;
  show_address_before_signing?: boolean;
  price?: number;
  hidden_details?: string;
  status: SigningStatus;
  signed_at?: string;
  expires_at?: string;
  pdf_url?: string;
  broker_name?: string;
}

export interface PropertyShareRow {
  id: string;
  property_id: string;
  shared_with: string;
  shared_by: string;
  permission_level: PermissionLevel;
  expires_at?: string | null;
  created_at: string;
}

export interface PendingInviteRow {
  id: string;
  property_id: string;
  invited_by: string;
  email: string;
  permission_level: PermissionLevel;
  intended_role: string;
  status: InviteStatus;
  sent_at?: string;
  accepted_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  qualified: 'מוכשר',
  won: 'הצליח',
  lost: 'נכשל',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#8b5cf6',
  won: '#10b981',
  lost: '#ef4444',
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  buyer: 'קונה',
  seller: 'מוכר',
  investor: 'משקיע',
  renter: 'שוכר',
  landlord: 'משכיר',
};

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'פנוי',
  occupied: 'תפוס',
  maintenance: 'תחזוקה',
  reserved: 'שמור',
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'פעיל',
  ending: 'בסיום',
  ended: 'הסתיים',
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  client_name?: string;
  property_title?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Auction {
  id: string;
  title: string;
  property_title: string;
  start_price: number;
  current_bid?: number;
  status: AuctionStatus;
  starts_at: string;
  ends_at: string;
}

export interface Payment {
  id: string;
  tenant_name: string;
  property_title: string;
  unit_number: string;
  amount: number;
  due_date: string;
  status: PaymentStatus;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'פתוח',
  in_progress: 'בתהליך',
  done: 'בוצע',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחוף',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  draft: 'טיוטה',
  scheduled: 'מתוכנן',
  active: 'פעיל',
  ended: 'הסתיים',
  cancelled: 'בוטל',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'ממתין',
  paid: 'שולם',
  overdue: 'באיחור',
  cancelled: 'בוטל',
};

export const SIGNING_STATUS_LABELS: Record<SigningStatus, string> = {
  pending: 'ממתין',
  sent: 'נשלח',
  signed: 'נחתם',
  expired: 'פג תוקף',
};
