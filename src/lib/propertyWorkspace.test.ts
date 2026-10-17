import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceActions,
  buildWorkspaceSnapshot,
  requirementsForTenantType,
} from './propertyWorkspace';
import type { Lease, Payment, PropertyWithUnits, SigningLink, Tenant } from '../types/domain';

const property = {
  id: 'p1',
  title: 'בניין',
  city: 'חיפה',
  address: 'הרצל 1',
  monthlyIncome: 5000,
  occupiedUnits: 1,
  totalUnits: 2,
  units: [{ id: 'u1', unit_number: '1', unit_status: 'occupied', tenant_id: 't1' }],
} as PropertyWithUnits;

const tenant: Tenant = {
  id: 't1',
  full_name: 'דנה',
  status: 'active',
  tenant_type: 'sole_proprietor',
};

const lease: Lease = {
  id: 'l1',
  property_id: 'p1',
  tenant_id: 't1',
  tenant_name: 'דנה',
  start_date: '2026-01-01',
  end_date: '2026-12-01',
  monthly_rent: 5000,
  is_active: true,
};

describe('document requirements', () => {
  it('uses company checklist for companies', () => {
    expect(requirementsForTenantType('company').some((r) => r.id === 'incorporation')).toBe(true);
    expect(requirementsForTenantType('sole_proprietor').some((r) => r.id === 'id')).toBe(true);
  });
});

describe('workspace snapshot + actions', () => {
  it('flags overdue payments and unsigned agreements', () => {
    const payments: Payment[] = [
      {
        id: 'pay1',
        tenant_name: 'דנה',
        property_title: 'בניין',
        unit_number: '1',
        amount: 2450,
        due_date: '2026-09-01',
        status: 'overdue',
      },
    ];
    const links: SigningLink[] = [
      {
        id: 's1',
        token: 'abc',
        client_name: 'דנה',
        agreement_type: 'exclusive',
        status: 'sent',
      },
    ];
    const snapshot = buildWorkspaceSnapshot({
      property,
      tenants: [tenant],
      leases: [lease],
      payments,
      links,
    });
    expect(snapshot.occupied).toBe(true);
    expect(snapshot.overduePayments).toHaveLength(1);
    const actions = buildWorkspaceActions(snapshot, 'p1');
    expect(actions.some((a) => a.id === 'overdue')).toBe(true);
    expect(actions.some((a) => a.id === 'unsigned')).toBe(true);
  });

  it('links document attention to tenant list, not a single open= modal', () => {
    const snapshot = buildWorkspaceSnapshot({
      property,
      tenants: [tenant, { ...tenant, id: 't2', full_name: 'יוסי' }],
      leases: [lease],
      payments: [],
      links: [],
    });
    const actions = buildWorkspaceActions(snapshot, 'p1');
    const docs = actions.find((a) => a.id === 'docs');
    expect(docs?.href).toBe('/broker/tenants?property=p1&attention=docs');
    expect(docs?.href).not.toContain('open=');
    expect(docs?.title).toContain('2 שוכרים');
  });

  it('describes an already-ended lease as expired, not zero days', () => {
    const snapshot = buildWorkspaceSnapshot({
      property,
      tenants: [tenant],
      leases: [{ ...lease, end_date: '2026-10-10' }],
      payments: [],
      links: [],
    });
    const actions = buildWorkspaceActions(snapshot, 'p1');
    expect(actions.some((a) => a.id === 'lease-end' && (a.title.includes('פג') || a.title.includes('חידוש')))).toBe(
      true,
    );
  });
});
