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
          org_id: string | null
          plan: string
          port: number | null
          project_id: string | null
          provider: string
          region: string
          status: string
          storage_gb: number
          tags: Json
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
          org_id?: string | null
          plan?: string
          port?: number | null
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          storage_gb?: number
          tags?: Json
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
          org_id?: string | null
          plan?: string
          port?: number | null
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          storage_gb?: number
          tags?: Json
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
          org_id: string | null
          project_id: string | null
          provider: string
          record_type: string
          status: string
          tags: Json
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
          org_id?: string | null
          project_id?: string | null
          provider?: string
          record_type?: string
          status?: string
          tags?: Json
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
          org_id?: string | null
          project_id?: string | null
          provider?: string
          record_type?: string
          status?: string
          tags?: Json
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
          org_id: string | null
          project_id: string | null
          provider: string
          ram_gb: number
          region: string
          status: string
          sync_status: string
          tags: Json
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
          org_id?: string | null
          project_id?: string | null
          provider?: string
          ram_gb?: number
          region?: string
          status?: string
          sync_status?: string
          tags?: Json
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
          org_id?: string | null
          project_id?: string | null
          provider?: string
          ram_gb?: number
          region?: string
          status?: string
          sync_status?: string
          tags?: Json
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
          org_id: string | null
          port: number
          protocol: string
          project_id: string | null
          provider: string
          region: string
          status: string
          tags: Json
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
          org_id?: string | null
          port?: number
          protocol?: string
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          tags?: Json
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
          org_id?: string | null
          port?: number
          protocol?: string
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          tags?: Json
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
          mfa_enabled: boolean | null
          onboarded: boolean | null
          org_id: string | null
          org_name: string | null
          plan: string | null
          project_id: string | null
          region: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          mfa_enabled?: boolean | null
          onboarded?: boolean | null
          org_id?: string | null
          org_name?: string | null
          plan?: string | null
          project_id?: string | null
          region?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          onboarded?: boolean | null
          org_id?: string | null
          org_name?: string | null
          plan?: string | null
          project_id?: string | null
          region?: string | null
          role?: string | null
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
          org_id: string | null
          project_id: string | null
          provider: string
          region: string
          size_bytes: number
          status: string
          storage_class: string
          tags: Json
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          object_count?: number
          org_id?: string | null
          project_id?: string | null
          provider?: string
          region?: string
          size_bytes?: number
          status?: string
          storage_class?: string
          tags?: Json
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          object_count?: number
          org_id?: string | null
          project_id?: string | null
          provider?: string
          region?: string
          size_bytes?: number
          status?: string
          storage_class?: string
          tags?: Json
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
          org_id: string | null
          os_image: string
          project_id: string | null
          provider: string
          ram_gb: number
          region: string
          status: string
          tags: Json
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
          org_id?: string | null
          os_image?: string
          project_id?: string | null
          provider?: string
          ram_gb?: number
          region?: string
          status?: string
          tags?: Json
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
          org_id?: string | null
          os_image?: string
          project_id?: string | null
          provider?: string
          ram_gb?: number
          region?: string
          status?: string
          tags?: Json
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
          org_id: string | null
          project_id: string | null
          provider: string
          region: string
          status: string
          subnet_count: number
          tags: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cidr_block?: string
          created_at?: string | null
          id?: string
          name: string
          org_id?: string | null
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          subnet_count?: number
          tags?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cidr_block?: string
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string | null
          project_id?: string | null
          provider?: string
          region?: string
          status?: string
          subnet_count?: number
          tags?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          org_id: string | null
          project_id: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          org_id?: string | null
          project_id?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          org_id?: string | null
          project_id?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json
          id: string
          org_id: string
          project_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json
          id?: string
          org_id: string
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json
          id?: string
          org_id?: string
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cost_records: {
        Row: {
          amount_usd: number
          created_at: string | null
          currency: string
          id: string
          org_id: string
          period_end: string | null
          period_start: string | null
          project_id: string | null
          resource_id: string | null
          resource_type: string | null
          usage_quantity: number
          usage_unit: string
        }
        Insert: {
          amount_usd?: number
          created_at?: string | null
          currency?: string
          id?: string
          org_id: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          usage_quantity?: number
          usage_unit?: string
        }
        Update: {
          amount_usd?: number
          created_at?: string | null
          currency?: string
          id?: string
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          usage_quantity?: number
          usage_unit?: string
        }
        Relationships: []
      }
      iac_run_steps: {
        Row: {
          action: string
          details: Json
          id: string
          run_id: string
          status: string
          step_order: number
        }
        Insert: {
          action: string
          details?: Json
          id?: string
          run_id: string
          status?: string
          step_order: number
        }
        Update: {
          action?: string
          details?: Json
          id?: string
          run_id?: string
          status?: string
          step_order?: number
        }
        Relationships: []
      }
      iac_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          org_id: string
          plan: Json
          policy_violations: Json
          project_id: string | null
          started_at: string | null
          status: string
          template_id: string | null
          triggered_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          org_id: string
          plan?: Json
          policy_violations?: Json
          project_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          triggered_by: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          org_id?: string
          plan?: Json
          policy_violations?: Json
          project_id?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          triggered_by?: string
        }
        Relationships: []
      }
      iac_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          language: string
          name: string
          org_id: string
          project_id: string | null
          template: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name: string
          org_id: string
          project_id?: string | null
          template: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          name?: string
          org_id?: string
          project_id?: string | null
          template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          name: string
          plan: string | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          plan?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          plan?: string | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          environment: string
          id: string
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          environment?: string
          id?: string
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          environment?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_accounts: {
        Row: {
          account_id: string | null
          created_at: string | null
          credentials_ref: string | null
          display_name: string
          id: string
          org_id: string
          provider: string
          status: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          credentials_ref?: string | null
          display_name: string
          id?: string
          org_id: string
          provider: string
          status?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          credentials_ref?: string | null
          display_name?: string
          id?: string
          org_id?: string
          provider?: string
          status?: string
        }
        Relationships: []
      }
      quotas: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          project_id: string | null
          quota_limit: number
          resource_type: string
          used: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          quota_limit: number
          resource_type: string
          used?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          quota_limit?: number
          resource_type?: string
          used?: number
        }
        Relationships: []
      }
      resource_operations: {
        Row: {
          completed_at: string | null
          id: string
          message: string | null
          operation_type: string
          resource_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          message?: string | null
          operation_type: string
          resource_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          message?: string | null
          operation_type?: string
          resource_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      resource_tags: {
        Row: {
          id: string
          resource_id: string
          tag_key: string
          tag_value: string
        }
        Insert: {
          id?: string
          resource_id: string
          tag_key: string
          tag_value: string
        }
        Update: {
          id?: string
          resource_id?: string
          tag_key?: string
          tag_value?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json
          name: string
          org_id: string
          project_id: string | null
          provider: string
          region: string | null
          resource_id: string | null
          resource_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json
          name: string
          org_id: string
          project_id?: string | null
          provider?: string
          region?: string | null
          resource_id?: string | null
          resource_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json
          name?: string
          org_id?: string
          project_id?: string | null
          provider?: string
          region?: string | null
          resource_id?: string | null
          resource_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_bindings: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role_id: string
          scope_id: string | null
          scope_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          role_id: string
          scope_id?: string | null
          scope_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role_id?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          permissions: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          permissions?: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          permissions?: Json
        }
        Relationships: []
      }
      sso_requests: {
        Row: {
          company_domain: string
          created_at: string | null
          id: string
          org_id: string | null
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          company_domain: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider?: string
          status?: string
          user_id: string
        }
        Update: {
          company_domain?: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider?: string
          status?: string
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
