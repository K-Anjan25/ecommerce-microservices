import { api } from "./client";
import { AuditLogEntry } from "../types/audit";

const source = (name: AuditLogEntry["source"]) => (entry: Omit<AuditLogEntry, "source">) => ({
  ...entry,
  source: name,
});

const getAuditLog = async () => {
  const [catalog, commerce, identity] = await Promise.all([
    api.get<Omit<AuditLogEntry, "source">[]>("/v1/product-audit"),
    api.get<Omit<AuditLogEntry, "source">[]>("/v1/commerce-audit"),
    api.get<Omit<AuditLogEntry, "source">[]>("/user/audit-logs"),
  ]);
  return [
    ...catalog.data.map(source("Catalog")),
    ...commerce.data.map(source("Commerce")),
    ...identity.data.map(source("Identity")),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const AuditApi = { getAuditLog };
