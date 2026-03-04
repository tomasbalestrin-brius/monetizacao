export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      closers: {
        Row: {
          created_at: string
          id: string
          name: string
          squad_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          squad_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          squad_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "closers_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_columns: {
        Row: {
          id: string
          name: string
          position: number
          color: string
          editable: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position: number
          color?: string
          editable?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          color?: string
          editable?: boolean
          created_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          revenue: number | null
          niche: string | null
          instagram: string | null
          main_pain: string | null
          difficulty: string | null
          state: string | null
          business_name: string | null
          business_position: string | null
          has_partner: boolean | null
          knows_specialist_since: string | null
          funnel_id: string | null
          classification: Database["public"]["Enums"]["lead_classification"] | null
          qualification: string | null
          assigned_sdr_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          crm_column_id: string | null
          custom_fields: Json
          distributed_at: string | null
          distribution_origin: string | null
          sheet_row_id: string | null
          sheet_source_url: string | null
          form_filled_at: string | null
          imported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          email?: string | null
          revenue?: number | null
          niche?: string | null
          instagram?: string | null
          main_pain?: string | null
          difficulty?: string | null
          state?: string | null
          business_name?: string | null
          business_position?: string | null
          has_partner?: boolean | null
          knows_specialist_since?: string | null
          funnel_id?: string | null
          classification?: Database["public"]["Enums"]["lead_classification"] | null
          qualification?: string | null
          assigned_sdr_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          crm_column_id?: string | null
          custom_fields?: Json
          distributed_at?: string | null
          distribution_origin?: string | null
          sheet_row_id?: string | null
          sheet_source_url?: string | null
          form_filled_at?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          revenue?: number | null
          niche?: string | null
          instagram?: string | null
          main_pain?: string | null
          difficulty?: string | null
          state?: string | null
          business_name?: string | null
          business_position?: string | null
          has_partner?: boolean | null
          knows_specialist_since?: string | null
          funnel_id?: string | null
          classification?: Database["public"]["Enums"]["lead_classification"] | null
          qualification?: string | null
          assigned_sdr_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          crm_column_id?: string | null
          custom_fields?: Json
          distributed_at?: string | null
          distribution_origin?: string | null
          sheet_row_id?: string | null
          sheet_source_url?: string | null
          form_filled_at?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_crm_column_id_fkey"
            columns: ["crm_column_id"]
            isOneToOne: false
            referencedRelation: "crm_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          lead_id: string
          sdr_id: string | null
          closer_id: string | null
          funnel_id: string | null
          qualification: string | null
          scheduled_date: string
          duration: number
          timezone: string
          status: Database["public"]["Enums"]["appointment_status"]
          reschedule_count: number
          attended: boolean | null
          converted: boolean | null
          conversion_value: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          sdr_id?: string | null
          closer_id?: string | null
          funnel_id?: string | null
          qualification?: string | null
          scheduled_date: string
          duration?: number
          timezone?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          reschedule_count?: number
          attended?: boolean | null
          converted?: boolean | null
          conversion_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          sdr_id?: string | null
          closer_id?: string | null
          funnel_id?: string | null
          qualification?: string | null
          scheduled_date?: string
          duration?: number
          timezone?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          reschedule_count?: number
          attended?: boolean | null
          converted?: boolean | null
          conversion_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      closer_availability: {
        Row: {
          id: string
          closer_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          closer_id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          closer_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      default_availability: {
        Row: {
          id: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          id: string
          lead_id: string
          column_id: string | null
          user_id: string | null
          action_type: string
          notes: string | null
          tags: string[]
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          column_id?: string | null
          user_id?: string | null
          action_type: string
          notes?: string | null
          tags?: string[]
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          column_id?: string | null
          user_id?: string | null
          action_type?: string
          notes?: string | null
          tags?: string[]
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "crm_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_rules: {
        Row: {
          id: string
          funnel_id: string | null
          rule_name: string
          conditions: Json
          qualification_label: string
          classification: Database["public"]["Enums"]["lead_classification"] | null
          priority: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          funnel_id?: string | null
          rule_name: string
          conditions?: Json
          qualification_label: string
          classification?: Database["public"]["Enums"]["lead_classification"] | null
          priority?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          funnel_id?: string | null
          rule_name?: string
          conditions?: Json
          qualification_label?: string
          classification?: Database["public"]["Enums"]["lead_classification"] | null
          priority?: number
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_rules_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_rules: {
        Row: {
          id: string
          name: string
          funnel_id: string | null
          classifications: string[]
          sdr_ids: string[]
          max_leads_per_sdr: number | null
          active: boolean | null
          schedule_enabled: boolean | null
          schedule_days: number[]
          schedule_time: string | null
          distribution_mode: string | null
          sdr_percentages: Json
          sdr_funnel_limits: Json
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          funnel_id?: string | null
          classifications?: string[]
          sdr_ids: string[]
          max_leads_per_sdr?: number | null
          active?: boolean | null
          schedule_enabled?: boolean | null
          schedule_days?: number[]
          schedule_time?: string | null
          distribution_mode?: string | null
          sdr_percentages?: Json
          sdr_funnel_limits?: Json
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          funnel_id?: string | null
          classifications?: string[]
          sdr_ids?: string[]
          max_leads_per_sdr?: number | null
          active?: boolean | null
          schedule_enabled?: boolean | null
          schedule_days?: number[]
          schedule_time?: string | null
          distribution_mode?: string | null
          sdr_percentages?: Json
          sdr_funnel_limits?: Json
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_rules_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_logs: {
        Row: {
          id: string
          distributed_by: string | null
          funnel_id: string | null
          rule_id: string | null
          leads_count: number
          sdr_ids: string[]
          distribution_mode: string
          classifications: string[] | null
          lead_ids: string[] | null
          workload_snapshot: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          distributed_by?: string | null
          funnel_id?: string | null
          rule_id?: string | null
          leads_count: number
          sdr_ids: string[]
          distribution_mode: string
          classifications?: string[] | null
          lead_ids?: string[] | null
          workload_snapshot?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          distributed_by?: string | null
          funnel_id?: string | null
          rule_id?: string | null
          leads_count?: number
          sdr_ids?: string[]
          distribution_mode?: string
          classifications?: string[] | null
          lead_ids?: string[] | null
          workload_snapshot?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_distribution_logs_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_distribution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "distribution_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_capacities: {
        Row: {
          id: string
          sdr_id: string
          funnel_id: string | null
          max_leads: number | null
          percentage: number | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          sdr_id: string
          funnel_id?: string | null
          max_leads?: number | null
          percentage?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sdr_id?: string
          funnel_id?: string | null
          max_leads?: number | null
          percentage?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_capacities_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_capacities_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          metadata: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          metadata?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          metadata?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      niches: {
        Row: {
          id: string
          name: string
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          id: string
          lead_id: string | null
          lead_data: Json
          cleanup_reason: string
          google_sheet_row: number | null
          google_sheet_url: string | null
          sheet_name: string | null
          exported_at: string | null
          cleaned_at: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          lead_data: Json
          cleanup_reason: string
          google_sheet_row?: number | null
          google_sheet_url?: string | null
          sheet_name?: string | null
          exported_at?: string | null
          cleaned_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          lead_data?: Json
          cleanup_reason?: string
          google_sheet_row?: number | null
          google_sheet_url?: string | null
          sheet_name?: string | null
          exported_at?: string | null
          cleaned_at?: string | null
        }
        Relationships: []
      }
      funnel_daily_data: {
        Row: {
          calls_done: number
          calls_scheduled: number
          created_at: string
          created_by: string | null
          date: string
          funnel_id: string
          id: string
          leads_count: number
          qualified_count: number
          sales_count: number
          sales_value: number
          sdr_id: string | null
          user_id: string
        }
        Insert: {
          calls_done?: number
          calls_scheduled?: number
          created_at?: string
          created_by?: string | null
          date: string
          funnel_id: string
          id?: string
          leads_count?: number
          qualified_count?: number
          sales_count?: number
          sales_value?: number
          sdr_id?: string | null
          user_id: string
        }
        Update: {
          calls_done?: number
          calls_scheduled?: number
          created_at?: string
          created_by?: string | null
          date?: string
          funnel_id?: string
          id?: string
          leads_count?: number
          qualified_count?: number
          sales_count?: number
          sales_value?: number
          sdr_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_daily_data_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          google_sheet_url: string | null
          sheet_name: string | null
          column_mapping: Json | null
          auto_sync_enabled: boolean | null
          last_sync_at: string | null
          sync_interval_minutes: number | null
          import_from_date: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          google_sheet_url?: string | null
          sheet_name?: string | null
          column_mapping?: Json | null
          auto_sync_enabled?: boolean | null
          last_sync_at?: string | null
          sync_interval_minutes?: number | null
          import_from_date?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          google_sheet_url?: string | null
          sheet_name?: string | null
          column_mapping?: Json | null
          auto_sync_enabled?: boolean | null
          last_sync_at?: string | null
          sync_interval_minutes?: number | null
          import_from_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          metric_key: string
          month: string
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metric_key: string
          month: string
          target_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metric_key?: string
          month?: string
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      google_sheets_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_sync_at: string | null
          row_mapping: Json | null
          spreadsheet_id: string
          spreadsheet_name: string | null
          sync_message: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id: string
          spreadsheet_name?: string | null
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id?: string
          spreadsheet_name?: string | null
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_action_items: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          meeting_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          meeting_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          meeting_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by: string
          id?: string
          meeting_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          meeting_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          meeting_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          meeting_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          meeting_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          calls: number
          cancellation_entries: number | null
          cancellation_value: number | null
          cancellations: number | null
          closer_id: string
          created_at: string
          created_by: string | null
          entries: number
          entries_trend: number | null
          id: string
          period_end: string
          period_start: string
          revenue: number
          revenue_trend: number | null
          sales: number
          source: string | null
          updated_at: string
        }
        Insert: {
          calls?: number
          cancellation_entries?: number | null
          cancellation_value?: number | null
          cancellations?: number | null
          closer_id: string
          created_at?: string
          created_by?: string | null
          entries?: number
          entries_trend?: number | null
          id?: string
          period_end: string
          period_start: string
          revenue?: number
          revenue_trend?: number | null
          sales?: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          calls?: number
          cancellation_entries?: number | null
          cancellation_value?: number | null
          cancellations?: number | null
          closer_id?: string
          created_at?: string
          created_by?: string | null
          entries?: number
          entries_trend?: number | null
          id?: string
          period_end?: string
          period_start?: string
          revenue?: number
          revenue_trend?: number | null
          sales?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          timezone: string
          active: boolean
          squad_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          timezone?: string
          active?: boolean
          squad_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          timezone?: string
          active?: boolean
          squad_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_funnels: {
        Row: {
          created_at: string
          created_by: string | null
          funnel_name: string
          id: string
          sdr_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          funnel_name: string
          id?: string
          sdr_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          funnel_name?: string
          id?: string
          sdr_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_funnels_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_metrics: {
        Row: {
          activated: number
          attendance_rate: number
          attended: number
          conversion_rate: number
          created_at: string
          created_by: string | null
          date: string
          funnel: string
          id: string
          sales: number
          scheduled: number
          scheduled_follow_up: number
          scheduled_rate: number
          scheduled_same_day: number
          sdr_id: string
          source: string | null
          updated_at: string
        }
        Insert: {
          activated?: number
          attendance_rate?: number
          attended?: number
          conversion_rate?: number
          created_at?: string
          created_by?: string | null
          date: string
          funnel?: string
          id?: string
          sales?: number
          scheduled?: number
          scheduled_follow_up?: number
          scheduled_rate?: number
          scheduled_same_day?: number
          sdr_id: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          activated?: number
          attendance_rate?: number
          attended?: number
          conversion_rate?: number
          created_at?: string
          created_by?: string | null
          date?: string
          funnel?: string
          id?: string
          sales?: number
          scheduled?: number
          scheduled_follow_up?: number
          scheduled_rate?: number
          scheduled_same_day?: number
          sdr_id?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_metrics_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_sheets_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          last_sync_at: string | null
          row_mapping: Json | null
          spreadsheet_id: string
          spreadsheet_name: string | null
          sync_message: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id: string
          spreadsheet_name?: string | null
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id?: string
          spreadsheet_name?: string | null
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sdrs: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_sheets_config: {
        Row: {
          created_at: string | null
          id: string
          last_sync_at: string | null
          row_mapping: Json | null
          spreadsheet_id: string
          spreadsheet_name: string | null
          squad_id: string
          sync_message: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id: string
          spreadsheet_name?: string | null
          squad_id: string
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          row_mapping?: Json | null
          spreadsheet_id?: string
          spreadsheet_name?: string | null
          squad_id?: string
          sync_message?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "squad_sheets_config_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: true
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_entity_links: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entity_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_funnels: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          funnel_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          funnel_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          funnel_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_funnels_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_qualification_rules: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      get_all_funnels_summary: {
        Args: { p_period_end?: string; p_period_start?: string }
        Returns: Json
      }
      get_funnel_report: {
        Args: {
          p_funnel_id: string
          p_period_end?: string
          p_period_start?: string
        }
        Returns: Json
      }
      get_sales_by_person_and_product: {
        Args: { p_period_end?: string; p_period_start?: string }
        Returns: Json
      }
      get_sdr_total_metrics: {
        Args: { p_period_end?: string; p_period_start?: string; p_type: string }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_module_permission: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_lider: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_linked_to_entity: {
        Args: { _entity_id: string; _entity_type: string; _user_id: string }
        Returns: boolean
      }
      manager_can_access_closer: {
        Args: { _closer_id: string; _user_id: string }
        Returns: boolean
      }
      manager_can_access_sdr: {
        Args: { _sdr_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "viewer" | "user" | "lider" | "sdr" | "closer"
      lead_classification: "diamante" | "ouro" | "prata" | "bronze"
      lead_status: "novo" | "em_atendimento" | "agendado" | "concluido"
      appointment_status: "agendado" | "reagendado" | "realizado" | "nao_compareceu" | "cancelado"
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
    Enums: {
      app_role: ["admin", "manager", "viewer", "user", "lider", "sdr", "closer"],
      lead_classification: ["diamante", "ouro", "prata", "bronze"],
      lead_status: ["novo", "em_atendimento", "agendado", "concluido"],
      appointment_status: ["agendado", "reagendado", "realizado", "nao_compareceu", "cancelado"],
    },
  },
} as const
