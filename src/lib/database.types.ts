
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Specific types for the Rack Detail View based on user request
export interface RackWithAssetsAndPorts {
  id: string;
  name: string | null;
  total_u: number;
  assets: AssetWithPorts[];
}

export interface AssetWithPorts {
  id: string;
  name: string | null;
  asset_type: string | null;
  status: string | null;
  start_u: number | null;
  size_u: number | null;
  details: Json | null;
  ports: PortDetails[];
}

export interface PortDetails {
  id: string;
  name: string | null;
  port_type: string | null;
}

export type Database = {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          name: string | null
          description: string | null
          asset_limit: number | null
          rack_limit: number | null
          user_limit: number | null
          price: number | null
          enabled_features: string[] | null
        }
        Insert: {
          id?: string
          name?: string | null
          description?: string | null
          asset_limit?: number | null
          rack_limit?: number | null
          user_limit?: number | null
          price?: number | null
          enabled_features?: string[] | null
        }
        Update: {
          id?: string
          name?: string | null
          description?: string | null
          asset_limit?: number | null
          rack_limit?: number | null
          user_limit?: number | null
          price?: number | null
          enabled_features?: string[] | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          id: string
          name: string
          plan_id: string
        }
        Insert: {
          id?: string
          name: string
          plan_id: string
        }
        Update: {
          id?: string
          name?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          full_name: string | null
          role: string | null
          avatar_url: string | null // Added from previous schema, assuming it's still desired
        }
        Insert: {
          id: string
          tenant_id: string
          full_name?: string | null
          role?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          full_name?: string | null
          role?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          tenant_id: string
          parent_location_id: string | null
          name: string
          description: string | null
          created_at: string | null // Assuming created_at is still desired
        }
        Insert: {
          id?: string
          tenant_id: string
          parent_location_id?: string | null
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          parent_location_id?: string | null
          name?: string
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      racks: {
        Row: {
          id: string
          tenant_id: string
          location_id: string
          name: string
          total_u: number
          pos_x: number | null
          pos_y: number | null
          notes: string | null
          created_at: string | null // Assuming created_at is still desired
          status: string | null // From old schema, added for get_racks_overview if needed
        }
        Insert: {
          id?: string
          tenant_id: string
          location_id: string
          name: string
          total_u: number
          pos_x?: number | null
          pos_y?: number | null
          notes?: string | null
          created_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          location_id?: string
          name?: string
          total_u?: number
          pos_x?: number | null
          pos_y?: number | null
          notes?: string | null
          created_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "racks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      assets: {
        Row: {
          id: string
          tenant_id: string
          rack_id: string | null
          location_id: string
          name: string
          asset_type: string | null
          status: string | null
          start_u: number | null
          size_u: number | null
          details: Json | null
          created_at: string | null // Assuming created_at is still desired
        }
        Insert: {
          id?: string
          tenant_id: string
          rack_id?: string | null
          location_id: string
          name: string
          asset_type?: string | null
          status?: string | null
          start_u?: number | null
          size_u?: number | null
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          rack_id?: string | null
          location_id?: string
          name?: string
          asset_type?: string | null
          status?: string | null
          start_u?: number | null
          size_u?: number | null
          details?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "racks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      ports: {
        Row: {
          id: string
          tenant_id: string
          asset_id: string
          name: string
          port_type: string | null
          created_at: string | null // Assuming created_at is still desired
        }
        Insert: {
          id?: string
          tenant_id: string
          asset_id: string
          name: string
          port_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          asset_id?: string
          name?: string
          port_type?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      connections: {
        Row: {
          id: string
          tenant_id: string
          port_a_id: string
          port_b_id: string
          details: Json | null
          created_at: string | null // Assuming created_at is still desired
        }
        Insert: {
          id?: string
          tenant_id: string
          port_a_id: string
          port_b_id: string
          details?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          port_a_id?: string
          port_b_id?: string
          details?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_port_a_id_fkey"
            columns: ["port_a_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_port_b_id_fkey"
            columns: ["port_b_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      todos: { // Kept from original schema as it's used elsewhere
        Row: {
          id: string
          user_id: string | null
          text: string | null
          is_completed: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          text?: string | null
          is_completed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          text?: string | null
          is_completed?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users" // Supabase auth.users
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: { // Keeping existing functions, ensure their definitions align with new table structures if they use them
      get_network_ports_stats: {
        Args: { tenant_id_param: string } 
        Returns: { total_ports: number; used_ports: number }[] 
      }
      get_fullest_rack: {
        Args: { tenant_id_param: string } 
        Returns: { id: string; name: string; occupancy_percentage: number }[] 
      }
      get_racks_overview: { 
        Args: { tenant_id_param: string } 
        Returns: {
          id: string 
          name: string | null
          // description: string | null -> racks table now has 'notes'
          notes: string | null // Added based on new racks schema
          location_id: string | null 
          location_name: string | null 
          status: string | null
          total_u: number // racks.total_u is not nullable
          occupied_u: number | null 
          asset_count: number | null 
          total_rack_ports: number | null 
          used_rack_ports: number | null 
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

// Generic utility types (Tables, TablesInsert, TablesUpdate, Enums) remain the same
// These are useful for general Supabase interactions but the specific interfaces above are for the rack detail view.

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
 VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
 VITE_SUPABASE_URL="http://localhost:54321"
    
VITE_SUPABASE_URL="http://127.0.0.1:54321"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

