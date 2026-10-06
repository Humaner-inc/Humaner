const TENANT_WHERE_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany'
]);

function withOrganizationId(
  args: { where?: Record<string, unknown> } | undefined,
  organizationId: string
) {
  const next = args ?? {};
  const where = { ...((next.where ?? {}) as Record<string, unknown>) };
  where.organizationId = organizationId;
  next.where = where;
  return next;
}

// force the active workspace onto id lookups and writes
export function applyTenantQueryArgs(
  action: string,
  args: Record<string, unknown> | undefined,
  organizationId: string
): Record<string, unknown> {
  if (TENANT_WHERE_ACTIONS.has(action)) {
    return withOrganizationId(
      args as { where?: Record<string, unknown> } | undefined,
      organizationId
    );
  }

  if (action === 'create') {
    const data = {
      ...((args?.data ?? {}) as Record<string, unknown>)
    };
    data.organizationId = organizationId;
    return { ...args, data };
  }

  if (action === 'upsert') {
    const where = {
      ...((args?.where ?? {}) as Record<string, unknown>),
      organizationId
    };
    const create = {
      ...((args?.create ?? {}) as Record<string, unknown>),
      organizationId
    };
    return { ...args, where, create };
  }

  return args ?? {};
}
