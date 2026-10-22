// App-facing names for the database types.
//
// The schema types live in ./database.types.ts, generated from the database
// by `npm run db:types` (see README). Don't edit that file by hand: change
// the schema with a migration, apply it, then regenerate.
import type { Enums } from "./database.types";

export type { Database, Json, Tables, TablesInsert, TablesUpdate } from "./database.types";

export type UserRole = Enums<"user_role">;
export type VehicleType = Enums<"vehicle_type">;
export type VehicleStatus = Enums<"vehicle_status">;
export type DocumentCategory = Enums<"document_category">;
export type NotificationCategory = Enums<"reminder_category">;
export type MaintenanceStatus = Enums<"maintenance_status">;
export type MaintenanceType = Enums<"maintenance_type">;
export type ExpenseCategory = Enums<"expense_category">;
export type DamageSeverity = Enums<"damage_severity">;
export type DamageReportStatus = Enums<"damage_report_status">;
