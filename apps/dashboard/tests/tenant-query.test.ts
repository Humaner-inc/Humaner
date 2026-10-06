import { describe, expect, it } from 'vitest';

import { applyTenantQueryArgs } from '@/lib/db/tenant-query';

describe('applyTenantQueryArgs', () => {
  it('overwrites a foreign organization id on findUnique', () => {
    const args = applyTenantQueryArgs(
      'findUnique',
      { where: { id: 'row-1', organizationId: 'other-org' } },
      'active-org'
    );

    expect(args.where).toEqual({
      id: 'row-1',
      organizationId: 'active-org'
    });
  });

  it('scopes update and delete by the active organization', () => {
    expect(
      applyTenantQueryArgs('update', { where: { id: 'row-1' } }, 'active-org')
        .where
    ).toEqual({ id: 'row-1', organizationId: 'active-org' });
    expect(
      applyTenantQueryArgs('delete', { where: { id: 'row-1' } }, 'active-org')
        .where
    ).toEqual({ id: 'row-1', organizationId: 'active-org' });
  });

  it('stamps create and upsert with the active organization', () => {
    expect(
      applyTenantQueryArgs(
        'create',
        { data: { name: 'Inbox', organizationId: 'other-org' } },
        'active-org'
      ).data
    ).toEqual({ name: 'Inbox', organizationId: 'active-org' });

    const upsert = applyTenantQueryArgs(
      'upsert',
      {
        where: { id: 'row-1' },
        create: { name: 'Inbox' },
        update: { name: 'Inbox' }
      },
      'active-org'
    );
    expect(upsert.where).toEqual({
      id: 'row-1',
      organizationId: 'active-org'
    });
    expect(upsert.create).toEqual({
      name: 'Inbox',
      organizationId: 'active-org'
    });
  });
});
