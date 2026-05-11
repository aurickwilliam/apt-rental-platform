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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      apartment_images: {
        Row: {
          apartment_id: string | null
          created_at: string | null
          id: string
          is_cover: boolean | null
          url: string
        }
        Insert: {
          apartment_id?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          url: string
        }
        Update: {
          apartment_id?: string | null
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_images_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          advance_rent: number | null
          amenities: string[] | null
          area_sqm: number
          average_rating: number | null
          barangay: string
          city: string
          created_at: string
          deleted_at: string | null
          description: string
          floor_level: string | null
          furnished_type: string | null
          id: string
          landlord_id: string | null
          latitude: number | null
          lease_agreement_url: string | null
          lease_duration: string | null
          longitude: number | null
          max_occupants: number | null
          monthly_rent: number
          name: string
          no_bathrooms: number
          no_bedrooms: number
          no_favorites: number | null
          no_ratings: number | null
          province: string
          security_deposit: number | null
          status: string
          street_address: string
          type: string
          updated_at: string | null
          zip_code: number | null
        }
        Insert: {
          advance_rent?: number | null
          amenities?: string[] | null
          area_sqm: number
          average_rating?: number | null
          barangay: string
          city: string
          created_at?: string
          deleted_at?: string | null
          description: string
          floor_level?: string | null
          furnished_type?: string | null
          id?: string
          landlord_id?: string | null
          latitude?: number | null
          lease_agreement_url?: string | null
          lease_duration?: string | null
          longitude?: number | null
          max_occupants?: number | null
          monthly_rent: number
          name: string
          no_bathrooms: number
          no_bedrooms: number
          no_favorites?: number | null
          no_ratings?: number | null
          province: string
          security_deposit?: number | null
          status?: string
          street_address: string
          type: string
          updated_at?: string | null
          zip_code?: number | null
        }
        Update: {
          advance_rent?: number | null
          amenities?: string[] | null
          area_sqm?: number
          average_rating?: number | null
          barangay?: string
          city?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          floor_level?: string | null
          furnished_type?: string | null
          id?: string
          landlord_id?: string | null
          latitude?: number | null
          lease_agreement_url?: string | null
          lease_duration?: string | null
          longitude?: number | null
          max_occupants?: number | null
          monthly_rent?: number
          name?: string
          no_bathrooms?: number
          no_bedrooms?: number
          no_favorites?: number | null
          no_ratings?: number | null
          province?: string
          security_deposit?: number | null
          status?: string
          street_address?: string
          type?: string
          updated_at?: string | null
          zip_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_landlord_id_fkey1"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat: {
        Row: {
          apartment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          apartment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          apartment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_request: {
        Row: {
          apartment_id: string | null
          category: string
          created_at: string
          id: string
          image_urls: string[] | null
          message: string
          resolved_at: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string | null
          urgency: string
        }
        Insert: {
          apartment_id?: string | null
          category: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          message: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          urgency: string
        }
        Update: {
          apartment_id?: string | null
          category?: string
          created_at?: string
          id?: string
          image_urls?: string[] | null
          message?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_request_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number | null
          apartment_id: string | null
          created_at: string
          date: string
          due_date: string | null
          id: string
          method: string
          period_end: string | null
          period_start: string | null
          proof_url: string | null
          reference_no: number
          status: string
          tenancy_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          apartment_id?: string | null
          created_at?: string
          date: string
          due_date?: string | null
          id?: string
          method: string
          period_end?: string | null
          period_start?: string | null
          proof_url?: string | null
          reference_no: number
          status?: string
          tenancy_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          apartment_id?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          id?: string
          method?: string
          period_end?: string | null
          period_start?: string | null
          proof_url?: string | null
          reference_no?: number
          status?: string
          tenancy_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_tenancy_id_fkey"
            columns: ["tenancy_id"]
            isOneToOne: false
            referencedRelation: "tenancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_application: {
        Row: {
          created_at: string
          date_submitted: string
          duration_stay: string
          employer_name: string
          employment_type: string
          has_pets: boolean
          has_smoker: boolean
          id: string
          message: string | null
          monthly_income: number
          move_in_date: string
          need_parking: boolean
          no_occupants: number
          occupation: string
          prev_landlord_contact: string | null
          prev_landlord_name: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date_submitted: string
          duration_stay: string
          employer_name: string
          employment_type: string
          has_pets: boolean
          has_smoker: boolean
          id?: string
          message?: string | null
          monthly_income: number
          move_in_date: string
          need_parking: boolean
          no_occupants: number
          occupation: string
          prev_landlord_contact?: string | null
          prev_landlord_name?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date_submitted?: string
          duration_stay?: string
          employer_name?: string
          employment_type?: string
          has_pets?: boolean
          has_smoker?: boolean
          id?: string
          message?: string | null
          monthly_income?: number
          move_in_date?: string
          need_parking?: boolean
          no_occupants?: number
          occupation?: string
          prev_landlord_contact?: string | null
          prev_landlord_name?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          apartment_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          stayed_date: string | null
          tenant_id: string | null
        }
        Insert: {
          apartment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          stayed_date?: string | null
          tenant_id?: string | null
        }
        Update: {
          apartment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          stayed_date?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenancies: {
        Row: {
          advance_rent: number | null
          apartment_id: string
          created_at: string
          id: string
          landlord_id: string | null
          monthly_rent: number | null
          move_in_date: string
          move_out_date: string | null
          notes: string | null
          security_deposit: number | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          advance_rent?: number | null
          apartment_id: string
          created_at?: string
          id?: string
          landlord_id?: string | null
          monthly_rent?: number | null
          move_in_date: string
          move_out_date?: string | null
          notes?: string | null
          security_deposit?: number | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          advance_rent?: number | null
          apartment_id?: string
          created_at?: string
          id?: string
          landlord_id?: string | null
          monthly_rent?: number | null
          move_in_date?: string
          move_out_date?: string | null
          notes?: string | null
          security_deposit?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenancies_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string
          age: number | null
          avatar_url: string | null
          background_url: string | null
          barangay: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          mobile_number: string | null
          postal_code: number | null
          province: string | null
          role: string
          street_address: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_status?: string
          age?: number | null
          avatar_url?: string | null
          background_url?: string | null
          barangay?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          postal_code?: number | null
          province?: string | null
          role?: string
          street_address?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          account_status?: string
          age?: number | null
          avatar_url?: string | null
          background_url?: string | null
          barangay?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          mobile_number?: string | null
          postal_code?: number | null
          province?: string | null
          role?: string
          street_address?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      visit_request: {
        Row: {
          apartment_id: string | null
          created_at: string
          id: string
          no_visitors: number
          notes: string | null
          status: string
          tenant_id: string | null
          time: string
          updated_at: string | null
          visit_date: string
        }
        Insert: {
          apartment_id?: string | null
          created_at?: string
          id?: string
          no_visitors: number
          notes?: string | null
          status?: string
          tenant_id?: string | null
          time: string
          updated_at?: string | null
          visit_date: string
        }
        Update: {
          apartment_id?: string | null
          created_at?: string
          id?: string
          no_visitors?: number
          notes?: string | null
          status?: string
          tenant_id?: string | null
          time?: string
          updated_at?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_request_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_request_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conversations: {
        Args: { p_user_id: string }
        Returns: {
          apartment_id: string
          apartment_name: string
          conversation_key: string
          conversation_type: string
          last_message: string
          last_message_time: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          other_user_phone: string
          unread_count: number
        }[]
      }
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
