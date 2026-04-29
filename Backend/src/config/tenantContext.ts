import { AsyncLocalStorage } from 'node:async_hooks';

type TenantStore = {
  organizationId?: string;
};

const storage = new AsyncLocalStorage<TenantStore>();

export const runWithTenant = (organizationId: string | undefined, callback: () => void) => {
  storage.run({ organizationId }, callback);
};

export const getTenantOrganizationId = () => {
  return storage.getStore()?.organizationId;
};
