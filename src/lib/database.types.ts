export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      todos: {
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string; 
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      }
      racks: {
        Row: {
          id: string // uuid
          name: string | null
          total_u: number | null // integer or numeric
          tenant_id: string | null // uuid
          created_at: string | null // timestamp with timezone
        }
        Insert: {
          id?: string
          name?: string | null
          total_u?: number | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          total_u?: number | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "users" 
            referencedColumns: ["id"]
          }
        ]
      }
      assets: {
        Row: {
          id: string // uuid
          name: string | null
          size_u: number | null // integer or numeric
          rack_id: string | null // uuid
          tenant_id: string | null // uuid
          created_at: string | null // timestamp with timezone
        }
        Insert: {
          id?: string
          name?: string | null
          size_u?: number | null
          rack_id?: string | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          size_u?: number | null
          rack_id?: string | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Relationships: [
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ports: {
        Row: {
          id: string // uuid
          name: string | null
          port_type: string | null // e.g., 'RJ45', 'SFP+'
          asset_id: string | null // uuid
          tenant_id: string | null // uuid
          created_at: string | null // timestamp with timezone
        }
        Insert: {
          id?: string
          name?: string | null
          port_type?: string | null
          asset_id?: string | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          port_type?: string | null
          asset_id?: string | null
          tenant_id?: string | null
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      connections: {
        Row: {
          id: string // uuid
          name: string | null
          port_a_id: string | null // uuid
          port_b_id: string | null // uuid
          tenant_id: string | null // uuid
          created_at: string | null // timestamp with timezone
        }
        Insert: {
          id?: string
          name?: string | null
          port_a_id?: string | null
          port_b_id?: string | null
          tenant_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          port_a_id?: string | null
          port_b_id?: string | null
          tenant_id?: string | null
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_network_ports_stats: {
        Args: { tenant_id_param: string } // uuid
        Returns: { total_ports: number; used_ports: number }[] // BIGINT becomes number
      }
      get_fullest_rack: {
        Args: { tenant_id_param: string } // uuid
        Returns: { id: string; name: string; occupancy_percentage: number }[] // uuid, TEXT, NUMERIC
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

    