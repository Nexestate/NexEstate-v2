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
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'failed' | 'pending_verification';
export type PaymentMethod = 'check' | 'transfer' | 'cash' | 'credit' | 'direct_debit' | 'bit' | 'recurring' | 'other';
export type PaymentRequestType = 'rent' | 'vaad_bayit' | 'one_off' | 'repair';
export type PaymentProviderType = 'acquiring' | 'invoicing';
export type PaymentProviderVendor = 'grow' | 'tranzila' | 'meshulam' | 'icount' | 'morning' | 'invoice4u';
export type IntegrationStatus = 'disconnected' | 'connected' | 'error';
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
  tenant_id?: string;
  lease_id?: string;
  floor?: number;
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
  min_rooms?: number;
  min_area?: number;
  linked_property_id?: string;
  notes?: string;
  source?: string;
  created_at: string;
}

export type MatchLevel = 'perfect' | 'high' | 'none';

export interface PropertyLandingPageRow {
  id: string;
  property_id: string;
  broker_id: string;
  slug: string;
  is_active: boolean;
  created_at?: string;
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
  property_id?: string;
  unit_id?: string;
  lease_id?: string;
  monthly_rent?: number;
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
  payment_method?: PaymentMethod;
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
  property_id?: string;
  unit_number: string;
  unit_id?: string;
  tenant_id?: string;
  lease_id?: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: PaymentStatus;
  payment_method?: PaymentMethod | string;
  payment_type?: PaymentRequestType | string;
  checkout_slug?: string;
  pdf_invoice_url?: string;
  invoice_number?: string;
  transfer_proof_url?: string;
  receipt_number?: string;
  notes?: string;
  paid_at?: string;
}

export interface PaymentIntegration {
  id: string;
  owner_id: string;
  provider_type: PaymentProviderType;
  vendor: PaymentProviderVendor;
  display_name?: string;
  is_active: boolean;
  is_sandbox: boolean;
  status: IntegrationStatus;
  last_error?: string;
  connected_at?: string;
}

export interface OutboundWebhook {
  id: string;
  owner_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at?: string;
}

export interface PaymentSessionResult {
  mode: 'simulate' | 'redirect';
  checkout_slug: string;
  session_id?: string;
  redirect_url?: string;
  vendor?: string | null;
}

export interface InvoiceResult {
  success: boolean;
  invoice_number?: string;
  pdf_invoice_url?: string;
  already_issued?: boolean;
}

export interface PublicPaymentCheckout {
  id: string;
  amount: number;
  due_date?: string;
  payment_type: string;
  payment_status: string;
  notes?: string;
  tenant_name: string;
  property_title: string;
  property_address?: string;
  unit_number?: string;
  manager_name: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  bank_account_holder?: string;
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
  failed: 'נכשל',
  pending_verification: 'ממתין לאימות',
};

export const PAYMENT_REQUEST_TYPE_LABELS: Record<PaymentRequestType, string> = {
  rent: 'דמי שכירות',
  vaad_bayit: 'ועד בית',
  one_off: 'תשלום חריג',
  repair: 'תיקון',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: "צ'ק",
  transfer: 'העברה בנקאית',
  cash: 'מזומן',
  credit: 'כרטיס אשראי',
  direct_debit: 'הוראת קבע',
  bit: 'Bit',
  recurring: 'חיוב חוזר',
  other: 'אחר',
};

export const PAYMENT_PROVIDER_VENDOR_LABELS: Record<PaymentProviderVendor, string> = {
  grow: 'Grow (משולם)',
  tranzila: 'Tranzila',
  meshulam: 'Meshulam',
  icount: 'iCount',
  morning: 'Morning (Green Invoice)',
  invoice4u: 'Invoice4u',
};

export const SIGNING_STATUS_LABELS: Record<SigningStatus, string> = {
  pending: 'ממתין',
  sent: 'נשלח',
  signed: 'נחתם',
  expired: 'פג תוקף',
};
