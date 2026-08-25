import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { fetchProperty } from '../lib/services/propertiesService';
import { fetchLeases, fetchTenants } from '../lib/services/leasesService';
import { fetchPayments } from '../lib/services/auctionsService';
import type { Lease, Payment, PropertyUnit, Tenant } from '../types/domain';

export type UnitDetail = PropertyUnit & { propertyTitle: string; property_id: string };

export type EntityDetailView =
  | { kind: 'unit'; data: UnitDetail }
  | { kind: 'tenant'; data: Tenant }
  | { kind: 'lease'; data: Lease }
  | { kind: 'payment'; data: Payment };

interface EntityDetailContextValue {
  view: EntityDetailView | null;
  loading: boolean;
  openUnit: (unit: UnitDetail) => void;
  openTenant: (tenant: Tenant) => void;
  openLease: (lease: Lease) => void;
  openPayment: (payment: Payment) => void;
  openUnitById: (propertyId: string, unitId: string) => Promise<void>;
  openTenantById: (tenantId: string) => Promise<void>;
  openLeaseById: (leaseId: string) => Promise<void>;
  openPaymentById: (paymentId: string) => Promise<void>;
  close: () => void;
}

const EntityDetailContext = createContext<EntityDetailContextValue | null>(null);

export function EntityDetailProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const [view, setView] = useState<EntityDetailView | null>(null);
  const [loading, setLoading] = useState(false);

  const openUnit = useCallback((unit: UnitDetail) => setView({ kind: 'unit', data: unit }), []);
  const openTenant = useCallback((tenant: Tenant) => setView({ kind: 'tenant', data: tenant }), []);
  const openLease = useCallback((lease: Lease) => setView({ kind: 'lease', data: lease }), []);
  const openPayment = useCallback((payment: Payment) => setView({ kind: 'payment', data: payment }), []);
  const close = useCallback(() => setView(null), []);

  const openUnitById = useCallback(async (propertyId: string, unitId: string) => {
    setLoading(true);
    try {
      const property = await fetchProperty(propertyId);
      const unit = property?.units.find((u) => u.id === unitId);
      if (property && unit) {
        setView({
          kind: 'unit',
          data: { ...unit, propertyTitle: property.title, property_id: propertyId },
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openTenantById = useCallback(async (tenantId: string) => {
    setLoading(true);
    try {
      const tenant = (await fetchTenants(userId)).find((t) => t.id === tenantId);
      if (tenant) setView({ kind: 'tenant', data: tenant });
    } finally {
      setLoading(false);
    }
  }, []);

  const openLeaseById = useCallback(async (leaseId: string) => {
    setLoading(true);
    try {
      const lease = (await fetchLeases(userId)).find((l) => l.id === leaseId);
      if (lease) setView({ kind: 'lease', data: lease });
    } finally {
      setLoading(false);
    }
  }, []);

  const openPaymentById = useCallback(async (paymentId: string) => {
    setLoading(true);
    try {
      const payment = (await fetchPayments()).find((p) => p.id === paymentId);
      if (payment) setView({ kind: 'payment', data: payment });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <EntityDetailContext.Provider
      value={{
        view,
        loading,
        openUnit,
        openTenant,
        openLease,
        openPayment,
        openUnitById,
        openTenantById,
        openLeaseById,
        openPaymentById,
        close,
      }}
    >
      {children}
    </EntityDetailContext.Provider>
  );
}

export function useEntityDetail() {
  const ctx = useContext(EntityDetailContext);
  if (!ctx) {
    throw new Error('useEntityDetail must be used within EntityDetailProvider');
  }
  return ctx;
}
