// Hand-written to match supabase/migrations/*.sql until a real project is
// linked. Once linked, regenerate with:
//   npx supabase gen types typescript --linked > src/lib/supabase/types.ts

export type UserRole = "admin" | "fleet_manager" | "mechanic" | "driver";
export type VehicleType =
  | "car"
  | "van"
  | "truck"
  | "construction_machinery"
  | "forklift";
export type VehicleStatus = "active" | "maintenance" | "inactive" | "sold";
export type DocumentCategory =
  | "registration"
  | "insurance"
  | "inspection"
  | "other";
export type NotificationCategory = "registration" | "insurance" | "inspection";
export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "brake_service"
  | "inspection"
  | "repair"
  | "other";
export type ExpenseCategory =
  | "fuel"
  | "toll"
  | "fine"
  | "parking"
  | "registration_fee"
  | "insurance_premium"
  | "other";

type NotificationRow = {
  id: string;
  company_id: string;
  recipient_id: string;
  vehicle_id: string;
  category: NotificationCategory;
  threshold_days: number;
  due_date: string;
  is_read: boolean;
  email_sent_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          id: string;
          company_id: string;
          type: VehicleType;
          status: VehicleStatus;
          make: string;
          model: string;
          year: number | null;
          license_plate: string;
          vin: string | null;
          assigned_driver_id: string | null;
          odometer: number | null;
          registration_expiry: string | null;
          insurance_expiry: string | null;
          inspection_expiry: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type: VehicleType;
          status?: VehicleStatus;
          make: string;
          model: string;
          year?: number | null;
          license_plate: string;
          vin?: string | null;
          assigned_driver_id?: string | null;
          odometer?: number | null;
          registration_expiry?: string | null;
          insurance_expiry?: string | null;
          inspection_expiry?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          type?: VehicleType;
          status?: VehicleStatus;
          make?: string;
          model?: string;
          year?: number | null;
          license_plate?: string;
          vin?: string | null;
          assigned_driver_id?: string | null;
          odometer?: number | null;
          registration_expiry?: string | null;
          insurance_expiry?: string | null;
          inspection_expiry?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_assigned_driver_id_fkey";
            columns: ["assigned_driver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicle_documents: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string;
          category: DocumentCategory;
          file_path: string;
          file_name: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id: string;
          category?: DocumentCategory;
          file_path: string;
          file_name: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string;
          category?: DocumentCategory;
          file_path?: string;
          file_name?: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      reminder_settings: {
        Row: {
          company_id: string;
          thresholds_days: number[];
          email_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          thresholds_days?: number[];
          email_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          thresholds_days?: number[];
          email_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminder_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: NotificationRow;
        Insert: {
          id?: string;
          company_id: string;
          recipient_id: string;
          vehicle_id: string;
          category: NotificationCategory;
          threshold_days: number;
          due_date: string;
          is_read?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          recipient_id?: string;
          vehicle_id?: string;
          category?: NotificationCategory;
          threshold_days?: number;
          due_date?: string;
          is_read?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_records: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string;
          type: MaintenanceType;
          status: MaintenanceStatus;
          title: string;
          description: string | null;
          scheduled_date: string | null;
          completed_date: string | null;
          odometer: number | null;
          cost: number | null;
          performed_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id: string;
          type?: MaintenanceType;
          status?: MaintenanceStatus;
          title: string;
          description?: string | null;
          scheduled_date?: string | null;
          completed_date?: string | null;
          odometer?: number | null;
          cost?: number | null;
          performed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string;
          type?: MaintenanceType;
          status?: MaintenanceStatus;
          title?: string;
          description?: string | null;
          scheduled_date?: string | null;
          completed_date?: string | null;
          odometer?: number | null;
          cost?: number | null;
          performed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string | null;
          category: ExpenseCategory;
          amount: number;
          expense_date: string;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id?: string | null;
          category?: ExpenseCategory;
          amount: number;
          expense_date?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string | null;
          category?: ExpenseCategory;
          amount?: number;
          expense_date?: string;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_due_reminders: {
        Args: Record<string, never>;
        Returns: NotificationRow[];
      };
    };
    Enums: {
      user_role: UserRole;
      vehicle_type: VehicleType;
      vehicle_status: VehicleStatus;
      document_category: DocumentCategory;
      maintenance_status: MaintenanceStatus;
      maintenance_type: MaintenanceType;
      expense_category: ExpenseCategory;
    };
  };
};
