import type { Query } from 'mongoose';
import { getTenantOrganizationId } from './tenantContext';

const readOps = [
  'find',
  'findOne',
  'countDocuments',
  'findOneAndUpdate',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
];

const hasOrganizationFilter = (query: Record<string, unknown>) => {
  if (Object.prototype.hasOwnProperty.call(query, 'organization')) return true;
  if (Object.prototype.hasOwnProperty.call(query, '$or')) return true;
  return false;
};

const patchQueryWithTenant = (query: Query<any, any>) => {
  const tenantOrganizationId = getTenantOrganizationId();
  if (!tenantOrganizationId) return;

  const raw = (query.getQuery() || {}) as Record<string, unknown>;
  if (hasOrganizationFilter(raw)) return;

  query.where({ organization: tenantOrganizationId });
};

export const tenantPlugin = (schema: any) => {
  if (!schema.path('organization')) {
    return;
  }

  readOps.forEach((op) => {
    schema.pre(op, function (this: Query<any, any>) {
      patchQueryWithTenant(this);
    });
  });

  schema.pre('save', function (this: any, next: () => void) {
    const tenantOrganizationId = getTenantOrganizationId();
    if (tenantOrganizationId && !this.get('organization')) {
      this.set('organization', tenantOrganizationId);
    }
    next();
  });

  schema.pre('insertMany', function (next: () => void, docs: any[]) {
    const tenantOrganizationId = getTenantOrganizationId();
    if (tenantOrganizationId && Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (!doc.organization) {
          doc.organization = tenantOrganizationId;
        }
      });
    }

    next();
  });

  schema.pre('aggregate', function (this: any) {
    const tenantOrganizationId = getTenantOrganizationId();
    if (!tenantOrganizationId) return;

    const pipeline = this.pipeline();
    const hasMatch = pipeline.some((stage: any) => {
      if (!stage.$match) return false;
      return Object.prototype.hasOwnProperty.call(stage.$match, 'organization');
    });

    if (!hasMatch) {
      pipeline.unshift({ $match: { organization: tenantOrganizationId } });
    }
  });
};
