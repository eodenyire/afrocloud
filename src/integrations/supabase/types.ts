export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      database_instances: {
        Row: {
          connection_string: string | null
          created_at: string | null
          engine: string
          id: string
          name: string
          plan: string
          port: number | null
          region: string
          status: string
          storage_gb: number
          updated_at: string | null
          user_id: string
          version: string
        }
        Insert: {
          connection_string?: string | null
          created_at?: string | null
          engine?: string
          id?: string
          name: string
          plan?: string
          port?: number | null
          region?: string
          status?: string
          storage_gb?: number
          updated_at?: string | null
          user_id: string
          version?: string
        }
        Update: {
          connection_string?: string | null
          created_at?: string | null
          engine?: string
          id?: string
          name?: string
          plan?: string
          port?: number | null
          region?: string
          status?: string
          storage_gb?: number
          updated_at?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      dns_records: {
        Row: {
          created_at: string | null
          id: string
          name: string
          record_type: string
          status: string
          ttl: number
          updated_at: string | null
          user_id: string
          value: string
          zone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          record_type?: string
          status?: string
          ttl?: number
          updated_at?: string | null
          user_id: string
          value: string
          zone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          record_type?: string
          status?: string
          ttl?: number
          updated_at?: string | null
          user_id?: string
          value?: string
          zone?: string
        }
        Relationships: []
      }
      edge_nodes: {
        Row: {
          created_at: string | null
          disk_gb: number
          id: string
          ip_address: string | null
          last_sync_at: string | null
          name: string
          node_type: string
          ram_gb: number
          region: string
          status: string
          sync_status: string
          updated_at: string | null
          user_id: string
          vcpus: number
          workloads: number
        }
        Insert: {
          created_at?: string | null
          disk_gb?: number
          id?: string
          ip_address?: string | null
          last_sync_at?: string | null
          name: string
          node_type?: string
          ram_gb?: number
          region?: string
          status?: string
          sync_status?: string
          updated_at?: string | null
          user_id: string
          vcpus?: number
          workloads?: number
        }
        Update: {
          created_at?: string | null
          disk_gb?: number
          id?: string
          ip_address?: string | null
          last_sync_at?: string | null
          name?: string
          node_type?: string
          ram_gb?: number
          region?: string
          status?: string
          sync_status?: string
          updated_at?: string | null
          user_id?: string
          vcpus?: number
          workloads?: number
        }
        Relationships: []
      }
      load_balancers: {
        Row: {
          created_at: string | null
          dns_name: string | null
          id: string
          lb_type: string
          name: string
          port: number
          protocol: string
          region: string
          status: string
          target_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dns_name?: string | null
          id?: string
          lb_type?: string
          name: string
          port?: number
          protocol?: string
          region?: string
          status?: string
          target_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dns_name?: string | null
          id?: string
          lb_type?: string
          name?: string
          port?: number
          protocol?: string
          region?: string
          status?: string
          target_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          onboarded: boolean | null
          org_name: string | null
          plan: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          onboarded?: boolean | null
          org_name?: string | null
          plan?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          onboarded?: boolean | null
          org_name?: string | null
          plan?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      storage_buckets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          object_count: number
          region: string
          size_bytes: number
          status: string
          storage_class: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          object_count?: number
          region?: string
          size_bytes?: number
          status?: string
          storage_class?: string
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          object_count?: number
          region?: string
          size_bytes?: number
          status?: string
          storage_class?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      storage_objects: {
        Row: {
          bucket_id: string
          content_type: string
          created_at: string | null
          id: string
          key: string
          size_bytes: number
          user_id: string
        }
        Insert: {
          bucket_id: string
          content_type?: string
          created_at?: string | null
          id?: string
          key: string
          size_bytes?: number
          user_id: string
        }
        Update: {
          bucket_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          key?: string
          size_bytes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_objects_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "storage_buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_machines: {
        Row: {
          created_at: string | null
          disk_gb: number
          id: string
          ip_address: string | null
          machine_type: string
          name: string
          os_image: string
          ram_gb: number
          region: string
          status: string
          updated_at: string | null
          user_id: string
          vcpus: number
        }
        Insert: {
          created_at?: string | null
          disk_gb?: number
          id?: string
          ip_address?: string | null
          machine_type?: string
          name: string
          os_image?: string
          ram_gb?: number
          region?: string
          status?: string
          updated_at?: string | null
          user_id: string
          vcpus?: number
        }
        Update: {
          created_at?: string | null
          disk_gb?: number
          id?: string
          ip_address?: string | null
          machine_type?: string
          name?: string
          os_image?: string
          ram_gb?: number
          region?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          vcpus?: number
        }
        Relationships: []
      }
      vpcs: {
        Row: {
          cidr_block: string
          created_at: string | null
          id: string
          name: string
          region: string
          status: string
          subnet_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cidr_block?: string
          created_at?: string | null
          id?: string
          name: string
          region?: string
          status?: string
          subnet_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cidr_block?: string
          created_at?: string | null
          id?: string
          name?: string
          region?: string
          status?: string
          subnet_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
