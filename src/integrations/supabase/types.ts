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
      absensi_gtk: {
        Row: {
          created_at: string
          created_by: string | null
          gtk_id: string
          id: string
          keterangan: string | null
          status: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          gtk_id: string
          id?: string
          keterangan?: string | null
          status?: string
          tanggal?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          gtk_id?: string
          id?: string
          keterangan?: string | null
          status?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_gtk_gtk_id_fkey"
            columns: ["gtk_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
        ]
      }
      absensi_siswa: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kelas_id: string
          keterangan: string | null
          siswa_id: string
          status: string
          ta_id: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kelas_id: string
          keterangan?: string | null
          siswa_id: string
          status?: string
          ta_id: string
          tanggal?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kelas_id?: string
          keterangan?: string | null
          siswa_id?: string
          status?: string
          ta_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_siswa_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_siswa_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
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
      atp: {
        Row: {
          alokasi_waktu: string | null
          capaian_pembelajaran: string
          created_at: string
          elemen: string | null
          fase: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id: string | null
          id: string
          kelas: number | null
          keterangan: string | null
          mapel: string
          nilai_karakter: string[] | null
          semester: string | null
          ta_id: string | null
          tujuan_pembelajaran: string[] | null
          updated_at: string
        }
        Insert: {
          alokasi_waktu?: string | null
          capaian_pembelajaran: string
          created_at?: string
          elemen?: string | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          mapel: string
          nilai_karakter?: string[] | null
          semester?: string | null
          ta_id?: string | null
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Update: {
          alokasi_waktu?: string | null
          capaian_pembelajaran?: string
          created_at?: string
          elemen?: string | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          mapel?: string
          nilai_karakter?: string[] | null
          semester?: string | null
          ta_id?: string | null
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atp_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atp_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_templates: {
        Row: {
          capaian_pembelajaran: string
          created_at: string
          elemen: string[] | null
          fase: Database["public"]["Enums"]["fase_pembelajaran"]
          id: string
          mapel: string
          sumber: string | null
          tujuan_pembelajaran: string[] | null
          updated_at: string
        }
        Insert: {
          capaian_pembelajaran: string
          created_at?: string
          elemen?: string[] | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          id?: string
          mapel: string
          sumber?: string | null
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Update: {
          capaian_pembelajaran?: string
          created_at?: string
          elemen?: string[] | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          id?: string
          mapel?: string
          sumber?: string | null
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      disposisi: {
        Row: {
          catatan: string | null
          created_at: string
          dari: string
          id: string
          instruksi: string | null
          kepada: string
          status: string | null
          surat_masuk_id: string
          tanggal_disposisi: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dari: string
          id?: string
          instruksi?: string | null
          kepada: string
          status?: string | null
          surat_masuk_id: string
          tanggal_disposisi?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dari?: string
          id?: string
          instruksi?: string | null
          kepada?: string
          status?: string | null
          surat_masuk_id?: string
          tanggal_disposisi?: string
        }
        Relationships: [
          {
            foreignKeyName: "disposisi_surat_masuk_id_fkey"
            columns: ["surat_masuk_id"]
            isOneToOne: false
            referencedRelation: "surat_masuk"
            referencedColumns: ["id"]
          },
        ]
      }
      gtk_ptk: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          jabatan: string | null
          jenis_kelamin: string | null
          lulusan: string | null
          mapel: string | null
          nama: string
          nik: string | null
          nip: string | null
          no_hp: string | null
          nuptk: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          lulusan?: string | null
          mapel?: string | null
          nama: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nuptk?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          lulusan?: string | null
          mapel?: string | null
          nama?: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nuptk?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id?: string | null
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
          wali_kelas_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kelas: string
          tingkat?: number
          wali_kelas_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama_kelas?: string
          tingkat?: number
          wali_kelas_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_wali_kelas_id_fkey"
            columns: ["wali_kelas_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
        ]
      }
      kktp: {
        Row: {
          atp_id: string
          bentuk_instrumen: string | null
          created_at: string
          id: string
          keterangan: string | null
          kriteria_ketercapaian: string[] | null
          teknik_penilaian: string | null
          tujuan_pembelajaran: string
          updated_at: string
        }
        Insert: {
          atp_id: string
          bentuk_instrumen?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          kriteria_ketercapaian?: string[] | null
          teknik_penilaian?: string | null
          tujuan_pembelajaran: string
          updated_at?: string
        }
        Update: {
          atp_id?: string
          bentuk_instrumen?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          kriteria_ketercapaian?: string[] | null
          teknik_penilaian?: string | null
          tujuan_pembelajaran?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kktp_atp_id_fkey"
            columns: ["atp_id"]
            isOneToOne: false
            referencedRelation: "atp"
            referencedColumns: ["id"]
          },
        ]
      }
      madrasah_settings: {
        Row: {
          akreditasi: string | null
          alamat: string | null
          created_at: string
          email: string | null
          id: string
          kabupaten_kota: string | null
          kepala_madrasah: string | null
          kode_pos: string | null
          nama_madrasah: string
          nip_kepala: string | null
          no_sk_pendirian: string | null
          no_telp: string | null
          npsn: string | null
          nsm: string | null
          provinsi: string | null
          tanggal_sk_pendirian: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          akreditasi?: string | null
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kabupaten_kota?: string | null
          kepala_madrasah?: string | null
          kode_pos?: string | null
          nama_madrasah?: string
          nip_kepala?: string | null
          no_sk_pendirian?: string | null
          no_telp?: string | null
          npsn?: string | null
          nsm?: string | null
          provinsi?: string | null
          tanggal_sk_pendirian?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          akreditasi?: string | null
          alamat?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kabupaten_kota?: string | null
          kepala_madrasah?: string | null
          kode_pos?: string | null
          nama_madrasah?: string
          nip_kepala?: string | null
          no_sk_pendirian?: string | null
          no_telp?: string | null
          npsn?: string | null
          nsm?: string | null
          provinsi?: string | null
          tanggal_sk_pendirian?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      modul_ajar: {
        Row: {
          alokasi_waktu: string
          atp_id: string | null
          capaian_pembelajaran: string | null
          created_at: string
          created_by: string | null
          diferensiasi_konten: string | null
          diferensiasi_produk: string | null
          diferensiasi_proses: string | null
          guru_id: string | null
          hasil_rpp: string
          id: string
          jenis_asesmen: string[] | null
          jenjang: string
          kelas: number
          mapel: string
          materi_insersi: string | null
          model_pembelajaran: string
          nilai_karakter: string[] | null
          profil_pelajar: string[] | null
          semester: string
          status: string
          ta_id: string | null
          teknik_asesmen: string[] | null
          topik: string
          tujuan_pembelajaran: string[] | null
          updated_at: string
        }
        Insert: {
          alokasi_waktu: string
          atp_id?: string | null
          capaian_pembelajaran?: string | null
          created_at?: string
          created_by?: string | null
          diferensiasi_konten?: string | null
          diferensiasi_produk?: string | null
          diferensiasi_proses?: string | null
          guru_id?: string | null
          hasil_rpp: string
          id?: string
          jenis_asesmen?: string[] | null
          jenjang: string
          kelas: number
          mapel: string
          materi_insersi?: string | null
          model_pembelajaran?: string
          nilai_karakter?: string[] | null
          profil_pelajar?: string[] | null
          semester: string
          status?: string
          ta_id?: string | null
          teknik_asesmen?: string[] | null
          topik: string
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Update: {
          alokasi_waktu?: string
          atp_id?: string | null
          capaian_pembelajaran?: string | null
          created_at?: string
          created_by?: string | null
          diferensiasi_konten?: string | null
          diferensiasi_produk?: string | null
          diferensiasi_proses?: string | null
          guru_id?: string | null
          hasil_rpp?: string
          id?: string
          jenis_asesmen?: string[] | null
          jenjang?: string
          kelas?: number
          mapel?: string
          materi_insersi?: string | null
          model_pembelajaran?: string
          nilai_karakter?: string[] | null
          profil_pelajar?: string[] | null
          semester?: string
          status?: string
          ta_id?: string | null
          teknik_asesmen?: string[] | null
          topik?: string
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modul_ajar_atp_id_fkey"
            columns: ["atp_id"]
            isOneToOne: false
            referencedRelation: "atp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modul_ajar_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modul_ajar_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
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
      promes: {
        Row: {
          created_at: string
          fase: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id: string | null
          id: string
          kelas: number | null
          keterangan: string | null
          mapel: string
          semester: string
          ta_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          mapel: string
          semester?: string
          ta_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          mapel?: string
          semester?: string
          ta_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promes_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promes_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      promes_detail: {
        Row: {
          alokasi_waktu: string | null
          bulan: number
          created_at: string
          id: string
          keterangan: string | null
          minggu: number
          promes_id: string
          sub_tema: string | null
          tema: string | null
          tujuan_pembelajaran: string | null
        }
        Insert: {
          alokasi_waktu?: string | null
          bulan: number
          created_at?: string
          id?: string
          keterangan?: string | null
          minggu: number
          promes_id: string
          sub_tema?: string | null
          tema?: string | null
          tujuan_pembelajaran?: string | null
        }
        Update: {
          alokasi_waktu?: string | null
          bulan?: number
          created_at?: string
          id?: string
          keterangan?: string | null
          minggu?: number
          promes_id?: string
          sub_tema?: string | null
          tema?: string | null
          tujuan_pembelajaran?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promes_detail_promes_id_fkey"
            columns: ["promes_id"]
            isOneToOne: false
            referencedRelation: "promes"
            referencedColumns: ["id"]
          },
        ]
      }
      prota: {
        Row: {
          alokasi_waktu_total: string | null
          created_at: string
          fase: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id: string | null
          id: string
          kelas: number | null
          keterangan: string | null
          kompetensi_inti: string | null
          mapel: string
          ta_id: string | null
          updated_at: string
        }
        Insert: {
          alokasi_waktu_total?: string | null
          created_at?: string
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          kompetensi_inti?: string | null
          mapel: string
          ta_id?: string | null
          updated_at?: string
        }
        Update: {
          alokasi_waktu_total?: string | null
          created_at?: string
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          guru_id?: string | null
          id?: string
          kelas?: number | null
          keterangan?: string | null
          kompetensi_inti?: string | null
          mapel?: string
          ta_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prota_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prota_ta_id_fkey"
            columns: ["ta_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      prota_detail: {
        Row: {
          alokasi_waktu: string | null
          bulan: number
          created_at: string
          id: string
          keterangan: string | null
          materi: string | null
          prota_id: string
        }
        Insert: {
          alokasi_waktu?: string | null
          bulan: number
          created_at?: string
          id?: string
          keterangan?: string | null
          materi?: string | null
          prota_id: string
        }
        Update: {
          alokasi_waktu?: string | null
          bulan?: number
          created_at?: string
          id?: string
          keterangan?: string | null
          materi?: string | null
          prota_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prota_detail_prota_id_fkey"
            columns: ["prota_id"]
            isOneToOne: false
            referencedRelation: "prota"
            referencedColumns: ["id"]
          },
        ]
      }
      siswa: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          jenis_kelamin: string | null
          kelas_id: string | null
          nama: string
          nama_ayah_kandung: string | null
          nama_ibu_kandung: string | null
          nis: string
          nisn: string | null
          status: string | null
          ta_id: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          updated_at: string
          wa_ortu: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          jenis_kelamin?: string | null
          kelas_id?: string | null
          nama: string
          nama_ayah_kandung?: string | null
          nama_ibu_kandung?: string | null
          nis: string
          nisn?: string | null
          status?: string | null
          ta_id?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          wa_ortu?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          jenis_kelamin?: string | null
          kelas_id?: string | null
          nama?: string
          nama_ayah_kandung?: string | null
          nama_ibu_kandung?: string | null
          nis?: string
          nisn?: string | null
          status?: string | null
          ta_id?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
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
      surat_counter: {
        Row: {
          counter: number
          id: string
          jenis: string
          tahun: number
        }
        Insert: {
          counter?: number
          id?: string
          jenis: string
          tahun: number
        }
        Update: {
          counter?: number
          id?: string
          jenis?: string
          tahun?: number
        }
        Relationships: []
      }
      surat_keluar: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          keterangan: string | null
          klasifikasi: string | null
          nomor_surat: string
          perihal: string
          tanggal_surat: string
          tujuan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          keterangan?: string | null
          klasifikasi?: string | null
          nomor_surat: string
          perihal: string
          tanggal_surat?: string
          tujuan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          keterangan?: string | null
          klasifikasi?: string | null
          nomor_surat?: string
          perihal?: string
          tanggal_surat?: string
          tujuan?: string
          updated_at?: string
        }
        Relationships: []
      }
      surat_masuk: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          keterangan: string | null
          klasifikasi: string | null
          nomor_surat: string
          pengirim: string
          perihal: string
          tanggal_surat: string
          tanggal_terima: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          keterangan?: string | null
          klasifikasi?: string | null
          nomor_surat: string
          pengirim: string
          perihal: string
          tanggal_surat: string
          tanggal_terima?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          keterangan?: string | null
          klasifikasi?: string | null
          nomor_surat?: string
          pengirim?: string
          perihal?: string
          tanggal_surat?: string
          tanggal_terima?: string
          updated_at?: string
        }
        Relationships: []
      }
      tahun_ajaran: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          nama_ta: string
          semester: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_ta: string
          semester?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          nama_ta?: string
          semester?: string | null
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
      generate_nomor_surat: { Args: { p_jenis: string }; Returns: string }
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
      app_role: "admin" | "bendahara" | "operator" | "guru"
      fase_pembelajaran: "A" | "B" | "C" | "D" | "E" | "F"
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
      app_role: ["admin", "bendahara", "operator", "guru"],
      fase_pembelajaran: ["A", "B", "C", "D", "E", "F"],
    },
  },
} as const
