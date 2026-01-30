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
      alumni: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          kelas_terakhir: string | null
          nama: string
          nis: string
          original_kelas_id: string | null
          original_siswa_id: string | null
          original_ta_id: string | null
          tahun_lulus: string | null
          wa_ortu: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          kelas_terakhir?: string | null
          nama: string
          nis: string
          original_kelas_id?: string | null
          original_siswa_id?: string | null
          original_ta_id?: string | null
          tahun_lulus?: string | null
          wa_ortu?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          kelas_terakhir?: string | null
          nama?: string
          nis?: string
          original_kelas_id?: string | null
          original_siswa_id?: string | null
          original_ta_id?: string | null
          tahun_lulus?: string | null
          wa_ortu?: string | null
        }
        Relationships: []
      }
      gtk_ptk: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          jabatan: string | null
          lulusan: string | null
          nama: string
          nik: string | null
          nip: string | null
          no_hp: string | null
          nuptk: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jabatan?: string | null
          lulusan?: string | null
          nama: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nuptk?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jabatan?: string | null
          lulusan?: string | null
          nama?: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nuptk?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jenis_tagihan: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          nama_tagihan: string
          nominal: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_tagihan: string
          nominal?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_tagihan?: string
          nominal?: number
        }
        Relationships: []
      }
      kelas: {
        Row: {
          created_at: string
          id: string
          nama_kelas: string
          tingkat: number
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kelas: string
          tingkat?: number
        }
        Update: {
          created_at?: string
          id?: string
          nama_kelas?: string
          tingkat?: number
        }
        Relationships: []
      }
      pembayaran: {
        Row: {
          bulan: number | null
          created_at: string
          id: string
          jenis_tagihan_id: string
          keterangan: string | null
          nominal: number
          nominal_bayar: number
          siswa_id: string
          status: string | null
          ta_id: string | null
          tahun: number | null
          tanggal_bayar: string | null
          updated_at: string
        }
        Insert: {
          bulan?: number | null
          created_at?: string
          id?: string
          jenis_tagihan_id: string
          keterangan?: string | null
          nominal?: number
          nominal_bayar?: number
          siswa_id: string
          status?: string | null
          ta_id?: string | null
          tahun?: number | null
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Update: {
          bulan?: number | null
          created_at?: string
          id?: string
          jenis_tagihan_id?: string
          keterangan?: string | null
          nominal?: number
          nominal_bayar?: number
          siswa_id?: string
          status?: string | null
          ta_id?: string | null
          tahun?: number | null
          tanggal_bayar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_jenis_tagihan_id_fkey"
            columns: ["jenis_tagihan_id"]
            isOneToOne: false
            referencedRelation: "jenis_tagihan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      pengeluaran: {
        Row: {
          created_at: string
          deskripsi: string
          id: string
          kategori: string
          nominal: number
          tanggal: string
        }
        Insert: {
          created_at?: string
          deskripsi: string
          id?: string
          kategori: string
          nominal?: number
          tanggal?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string
          id?: string
          kategori?: string
          nominal?: number
          tanggal?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      siswa: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          kelas_id: string | null
          nama: string
          nis: string
          status: string | null
          ta_id: string | null
          updated_at: string
          wa_ortu: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          kelas_id?: string | null
          nama: string
          nis: string
          status?: string | null
          ta_id?: string | null
          updated_at?: string
          wa_ortu?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          kelas_id?: string | null
          nama?: string
          nis?: string
          status?: string | null
          ta_id?: string | null
          updated_at?: string
          wa_ortu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_ajaran: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          nama_ta: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_ta: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_ta?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "bendahara" | "operator"
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
      app_role: ["admin", "bendahara", "operator"],
    },
  },
} as const
