export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
  createdAt: string;
  source: "Catalog" | "Commerce" | "Identity";
}
