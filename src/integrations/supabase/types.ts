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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          user_id: string
          user_name: string
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          user_id: string
          user_name: string
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          user_id?: string
          user_name?: string
          user_role?: string | null
        }
        Relationships: []
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
          media_pembelajaran: string | null
          model_pembelajaran: string | null
          nilai_karakter: string[] | null
          profil_pelajar: string[] | null
          semester: string | null
          sumber_belajar: string | null
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
          media_pembelajaran?: string | null
          model_pembelajaran?: string | null
          nilai_karakter?: string[] | null
          profil_pelajar?: string[] | null
          semester?: string | null
          sumber_belajar?: string | null
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
          media_pembelajaran?: string | null
          model_pembelajaran?: string | null
          nilai_karakter?: string[] | null
          profil_pelajar?: string[] | null
          semester?: string | null
          sumber_belajar?: string | null
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
      buku_induk_arsip: {
        Row: {
          catatan: string | null
          created_at: string
          daftar_siswa: Json
          dicetak_oleh: string | null
          dicetak_oleh_nama: string | null
          filter_kelas: string | null
          filter_ta: string | null
          id: string
          judul: string
          jumlah_siswa: number
          mode: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          daftar_siswa?: Json
          dicetak_oleh?: string | null
          dicetak_oleh_nama?: string | null
          filter_kelas?: string | null
          filter_ta?: string | null
          id?: string
          judul: string
          jumlah_siswa?: number
          mode: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          daftar_siswa?: Json
          dicetak_oleh?: string | null
          dicetak_oleh_nama?: string | null
          filter_kelas?: string | null
          filter_ta?: string | null
          id?: string
          judul?: string
          jumlah_siswa?: number
          mode?: string
        }
        Relationships: []
      }
      cp_templates: {
        Row: {
          capaian_pembelajaran: string
          created_at: string
          elemen: string[] | null
          elemen_cp: string[] | null
          fase: Database["public"]["Enums"]["fase_pembelajaran"]
          id: string
          iktp: Json | null
          kelas: number | null
          mapel: string
          materi_pembelajaran: string[] | null
          semester: string | null
          sumber: string | null
          tujuan_pembelajaran: string[] | null
          updated_at: string
        }
        Insert: {
          capaian_pembelajaran: string
          created_at?: string
          elemen?: string[] | null
          elemen_cp?: string[] | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          id?: string
          iktp?: Json | null
          kelas?: number | null
          mapel: string
          materi_pembelajaran?: string[] | null
          semester?: string | null
          sumber?: string | null
          tujuan_pembelajaran?: string[] | null
          updated_at?: string
        }
        Update: {
          capaian_pembelajaran?: string
          created_at?: string
          elemen?: string[] | null
          elemen_cp?: string[] | null
          fase?: Database["public"]["Enums"]["fase_pembelajaran"]
          id?: string
          iktp?: Json | null
          kelas?: number | null
          mapel?: string
          materi_pembelajaran?: string[] | null
          semester?: string | null
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
      elearning_forum_replies: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          created_at: string
          id: string
          konten: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          created_at?: string
          id?: string
          konten: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          created_at?: string
          id?: string
          konten?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elearning_forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "elearning_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      elearning_forum_topics: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          created_at: string
          id: string
          is_pinned: boolean | null
          judul: string
          kelas_id: string | null
          konten: string
          mapel: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          judul: string
          kelas_id?: string | null
          konten: string
          mapel?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          judul?: string
          kelas_id?: string | null
          konten?: string
          mapel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elearning_forum_topics_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      elearning_materi: {
        Row: {
          created_at: string
          deskripsi: string | null
          file_path: string | null
          guru_id: string | null
          id: string
          is_published: boolean | null
          jenis: string
          judul: string
          kelas_id: string | null
          konten: string | null
          mapel: string
          updated_at: string
          urutan: number | null
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          file_path?: string | null
          guru_id?: string | null
          id?: string
          is_published?: boolean | null
          jenis?: string
          judul: string
          kelas_id?: string | null
          konten?: string | null
          mapel: string
          updated_at?: string
          urutan?: number | null
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          file_path?: string | null
          guru_id?: string | null
          id?: string
          is_published?: boolean | null
          jenis?: string
          judul?: string
          kelas_id?: string | null
          konten?: string | null
          mapel?: string
          updated_at?: string
          urutan?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "elearning_materi_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elearning_materi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      elearning_submissions: {
        Row: {
          catatan_guru: string | null
          file_path: string | null
          graded_at: string | null
          id: string
          jawaban: string | null
          nilai: number | null
          siswa_id: string
          status: string
          submitted_at: string
          tugas_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          catatan_guru?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          jawaban?: string | null
          nilai?: number | null
          siswa_id: string
          status?: string
          submitted_at?: string
          tugas_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          catatan_guru?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          jawaban?: string | null
          nilai?: number | null
          siswa_id?: string
          status?: string
          submitted_at?: string
          tugas_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elearning_submissions_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elearning_submissions_tugas_id_fkey"
            columns: ["tugas_id"]
            isOneToOne: false
            referencedRelation: "elearning_tugas"
            referencedColumns: ["id"]
          },
        ]
      }
      elearning_tugas: {
        Row: {
          created_at: string
          deadline: string | null
          deskripsi: string | null
          file_path: string | null
          guru_id: string | null
          id: string
          is_published: boolean | null
          judul: string
          kelas_id: string | null
          mapel: string
          nilai_max: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          deskripsi?: string | null
          file_path?: string | null
          guru_id?: string | null
          id?: string
          is_published?: boolean | null
          judul: string
          kelas_id?: string | null
          mapel: string
          nilai_max?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          deskripsi?: string | null
          file_path?: string | null
          guru_id?: string | null
          id?: string
          is_published?: boolean | null
          judul?: string
          kelas_id?: string | null
          mapel?: string
          nilai_max?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elearning_tugas_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "gtk_ptk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elearning_tugas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      gtk_ptk: {
        Row: {
          alamat: string | null
          created_at: string
          email: string | null
          foto_path: string | null
          id: string
          jabatan: string | null
          jenis_kelamin: string | null
          lulusan: string | null
          mapel: string | null
          nama: string
          nik: string | null
          nip: string | null
          no_hp: string | null
          nomor_sertifikasi: string | null
          nuptk: string | null
          pendidikan: string | null
          sertifikasi: boolean
          status_aktif: string
          status_kepegawaian: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          foto_path?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          lulusan?: string | null
          mapel?: string | null
          nama: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nomor_sertifikasi?: string | null
          nuptk?: string | null
          pendidikan?: string | null
          sertifikasi?: boolean
          status_aktif?: string
          status_kepegawaian?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          email?: string | null
          foto_path?: string | null
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          lulusan?: string | null
          mapel?: string | null
          nama?: string
          nik?: string | null
          nip?: string | null
          no_hp?: string | null
          nomor_sertifikasi?: string | null
          nuptk?: string | null
          pendidikan?: string | null
          sertifikasi?: boolean
          status_aktif?: string
          status_kepegawaian?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hari_libur: {
        Row: {
          created_at: string
          id: string
          keterangan: string | null
          nama_libur: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          keterangan?: string | null
          nama_libur: string
          tanggal: string
        }
        Update: {
          created_at?: string
          id?: string
          keterangan?: string | null
          nama_libur?: string
          tanggal?: string
        }
        Relationships: []
      }
      ijazah_mapel_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kode_mapel: string
          nama_mapel: string
          ta_id: string | null
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kode_mapel: string
          nama_mapel: string
          ta_id?: string | null
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kode_mapel?: string
          nama_mapel?: string
          ta_id?: string | null
          urutan?: number
        }
        Relationships: []
      }
      ijazah_nilai: {
        Row: {
          created_at: string
          id: string
          kode_mapel: string
          nilai: number | null
          siswa_id: string
          ta_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode_mapel: string
          nilai?: number | null
          siswa_id: string
          ta_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode_mapel?: string
          nilai?: number | null
          siswa_id?: string
          ta_id?: string
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
      kelulusan: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          nomor_sk: string | null
          siswa_id: string
          status: string
          ta_id: string
          tanggal_lulus: string | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          nomor_sk?: string | null
          siswa_id: string
          status?: string
          ta_id: string
          tanggal_lulus?: string | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          nomor_sk?: string | null
          siswa_id?: string
          status?: string
          ta_id?: string
          tanggal_lulus?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kelulusan_settings: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          judul_pengumuman: string | null
          nomor_sk_format: string | null
          pesan_ucapan: string | null
          published_at: string | null
          ta_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          judul_pengumuman?: string | null
          nomor_sk_format?: string | null
          pesan_ucapan?: string | null
          published_at?: string | null
          ta_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          judul_pengumuman?: string | null
          nomor_sk_format?: string | null
          pesan_ucapan?: string | null
          published_at?: string | null
          ta_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      laporan_tahunan: {
        Row: {
          breakdown_pemasukan: Json
          breakdown_pengeluaran: Json
          catatan: string | null
          created_at: string
          daftar_tunggakan: Json
          id: string
          judul: string
          jumlah_siswa_nunggak: number
          nama_bendahara: string | null
          nama_kepala: string | null
          nip_kepala: string | null
          periode_jenis: string
          periode_label: string
          saldo: number
          ta_id: string | null
          tanggal_akhir: string
          tanggal_mulai: string
          total_pemasukan: number
          total_pengeluaran: number
          total_tunggakan: number
          tutup_oleh: string | null
          tutup_oleh_nama: string | null
        }
        Insert: {
          breakdown_pemasukan?: Json
          breakdown_pengeluaran?: Json
          catatan?: string | null
          created_at?: string
          daftar_tunggakan?: Json
          id?: string
          judul: string
          jumlah_siswa_nunggak?: number
          nama_bendahara?: string | null
          nama_kepala?: string | null
          nip_kepala?: string | null
          periode_jenis: string
          periode_label: string
          saldo?: number
          ta_id?: string | null
          tanggal_akhir: string
          tanggal_mulai: string
          total_pemasukan?: number
          total_pengeluaran?: number
          total_tunggakan?: number
          tutup_oleh?: string | null
          tutup_oleh_nama?: string | null
        }
        Update: {
          breakdown_pemasukan?: Json
          breakdown_pengeluaran?: Json
          catatan?: string | null
          created_at?: string
          daftar_tunggakan?: Json
          id?: string
          judul?: string
          jumlah_siswa_nunggak?: number
          nama_bendahara?: string | null
          nama_kepala?: string | null
          nip_kepala?: string | null
          periode_jenis?: string
          periode_label?: string
          saldo?: number
          ta_id?: string | null
          tanggal_akhir?: string
          tanggal_mulai?: string
          total_pemasukan?: number
          total_pengeluaran?: number
          total_tunggakan?: number
          tutup_oleh?: string | null
          tutup_oleh_nama?: string | null
        }
        Relationships: []
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
      notifikasi_wa_settings: {
        Row: {
          created_at: string
          hari_aktif: number[]
          id: string
          is_active: boolean
          jam: string
          jenis: string
          template_pesan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hari_aktif?: number[]
          id?: string
          is_active?: boolean
          jam?: string
          jenis: string
          template_pesan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hari_aktif?: number[]
          id?: string
          is_active?: boolean
          jam?: string
          jenis?: string
          template_pesan?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdum_mapel: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kelompok: string
          kkm: number | null
          kode_mapel: string
          nama_mapel: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kelompok?: string
          kkm?: number | null
          kode_mapel: string
          nama_mapel: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kelompok?: string
          kkm?: number | null
          kode_mapel?: string
          nama_mapel?: string
          urutan?: number
        }
        Relationships: []
      }
      pdum_nilai_rapor: {
        Row: {
          created_at: string
          id: string
          kode_mapel: string
          nilai: number | null
          semester: string
          siswa_id: string
          ta_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode_mapel: string
          nilai?: number | null
          semester: string
          siswa_id: string
          ta_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode_mapel?: string
          nilai?: number | null
          semester?: string
          siswa_id?: string
          ta_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdum_nilai_um: {
        Row: {
          created_at: string
          id: string
          kode_mapel: string
          nilai: number | null
          siswa_id: string
          ta_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kode_mapel: string
          nilai?: number | null
          siswa_id: string
          ta_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kode_mapel?: string
          nilai?: number | null
          siswa_id?: string
          ta_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdum_peserta: {
        Row: {
          created_at: string
          id: string
          jurusan: string | null
          kelas_ujian: number | null
          nama_ayah_override: string | null
          nama_ibu_override: string | null
          no_absen: number | null
          nomor_peserta: string | null
          siswa_id: string
          ta_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan?: string | null
          kelas_ujian?: number | null
          nama_ayah_override?: string | null
          nama_ibu_override?: string | null
          no_absen?: number | null
          nomor_peserta?: string | null
          siswa_id: string
          ta_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jurusan?: string | null
          kelas_ujian?: number | null
          nama_ayah_override?: string | null
          nama_ibu_override?: string | null
          no_absen?: number | null
          nomor_peserta?: string | null
          siswa_id?: string
          ta_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdum_settings: {
        Row: {
          bobot_rapor: number
          bobot_um: number
          created_at: string
          id: string
          nomor_peserta_prefix: string | null
          nsm: string | null
          ta_id: string
          updated_at: string
        }
        Insert: {
          bobot_rapor?: number
          bobot_um?: number
          created_at?: string
          id?: string
          nomor_peserta_prefix?: string | null
          nsm?: string | null
          ta_id: string
          updated_at?: string
        }
        Update: {
          bobot_rapor?: number
          bobot_um?: number
          created_at?: string
          id?: string
          nomor_peserta_prefix?: string | null
          nsm?: string | null
          ta_id?: string
          updated_at?: string
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
      ppdb_pendaftar: {
        Row: {
          agama: string | null
          alamat: string | null
          anak_ke: number | null
          asal_sekolah: string | null
          ayah_alamat: string | null
          ayah_domisili: string | null
          ayah_nik: string | null
          ayah_no_hp: string | null
          ayah_pekerjaan: string | null
          ayah_pendidikan: string | null
          ayah_penghasilan: string | null
          ayah_status: string | null
          ayah_status_tempat_tinggal: string | null
          ayah_tanggal_lahir: string | null
          ayah_tempat_lahir: string | null
          catatan: string | null
          cita_cita: string | null
          created_at: string
          email_siswa: string | null
          hobi: string | null
          ibu_alamat: string | null
          ibu_domisili: string | null
          ibu_nama: string | null
          ibu_nik: string | null
          ibu_no_hp: string | null
          ibu_pekerjaan: string | null
          ibu_pendidikan: string | null
          ibu_penghasilan: string | null
          ibu_status: string | null
          ibu_status_tempat_tinggal: string | null
          ibu_tanggal_lahir: string | null
          ibu_tempat_lahir: string | null
          id: string
          jarak_ke_madrasah: string | null
          jenis_kelamin: string | null
          jumlah_saudara: number | null
          kebutuhan_disabilitas: string | null
          kebutuhan_khusus: string | null
          kip: string | null
          nama: string
          nama_ayah: string | null
          nama_ibu: string | null
          nik: string | null
          nisn: string | null
          no_hp: string | null
          nomor_pendaftaran: string
          npsn_asal_sekolah: string | null
          nsm_asal_sekolah: string | null
          prestasi: string | null
          status: string
          status_tempat_tinggal: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          transportasi: string | null
          updated_at: string
          wa_ortu: string | null
          waktu_tempuh: string | null
          wali_alamat: string | null
          wali_domisili: string | null
          wali_nama: string | null
          wali_nik: string | null
          wali_no_hp: string | null
          wali_pekerjaan: string | null
          wali_pendidikan: string | null
          wali_penghasilan: string | null
          wali_status: string | null
          wali_status_tempat_tinggal: string | null
          wali_tanggal_lahir: string | null
          wali_tempat_lahir: string | null
          yang_membiayai: string | null
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          anak_ke?: number | null
          asal_sekolah?: string | null
          ayah_alamat?: string | null
          ayah_domisili?: string | null
          ayah_nik?: string | null
          ayah_no_hp?: string | null
          ayah_pekerjaan?: string | null
          ayah_pendidikan?: string | null
          ayah_penghasilan?: string | null
          ayah_status?: string | null
          ayah_status_tempat_tinggal?: string | null
          ayah_tanggal_lahir?: string | null
          ayah_tempat_lahir?: string | null
          catatan?: string | null
          cita_cita?: string | null
          created_at?: string
          email_siswa?: string | null
          hobi?: string | null
          ibu_alamat?: string | null
          ibu_domisili?: string | null
          ibu_nama?: string | null
          ibu_nik?: string | null
          ibu_no_hp?: string | null
          ibu_pekerjaan?: string | null
          ibu_pendidikan?: string | null
          ibu_penghasilan?: string | null
          ibu_status?: string | null
          ibu_status_tempat_tinggal?: string | null
          ibu_tanggal_lahir?: string | null
          ibu_tempat_lahir?: string | null
          id?: string
          jarak_ke_madrasah?: string | null
          jenis_kelamin?: string | null
          jumlah_saudara?: number | null
          kebutuhan_disabilitas?: string | null
          kebutuhan_khusus?: string | null
          kip?: string | null
          nama: string
          nama_ayah?: string | null
          nama_ibu?: string | null
          nik?: string | null
          nisn?: string | null
          no_hp?: string | null
          nomor_pendaftaran: string
          npsn_asal_sekolah?: string | null
          nsm_asal_sekolah?: string | null
          prestasi?: string | null
          status?: string
          status_tempat_tinggal?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          transportasi?: string | null
          updated_at?: string
          wa_ortu?: string | null
          waktu_tempuh?: string | null
          wali_alamat?: string | null
          wali_domisili?: string | null
          wali_nama?: string | null
          wali_nik?: string | null
          wali_no_hp?: string | null
          wali_pekerjaan?: string | null
          wali_pendidikan?: string | null
          wali_penghasilan?: string | null
          wali_status?: string | null
          wali_status_tempat_tinggal?: string | null
          wali_tanggal_lahir?: string | null
          wali_tempat_lahir?: string | null
          yang_membiayai?: string | null
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          anak_ke?: number | null
          asal_sekolah?: string | null
          ayah_alamat?: string | null
          ayah_domisili?: string | null
          ayah_nik?: string | null
          ayah_no_hp?: string | null
          ayah_pekerjaan?: string | null
          ayah_pendidikan?: string | null
          ayah_penghasilan?: string | null
          ayah_status?: string | null
          ayah_status_tempat_tinggal?: string | null
          ayah_tanggal_lahir?: string | null
          ayah_tempat_lahir?: string | null
          catatan?: string | null
          cita_cita?: string | null
          created_at?: string
          email_siswa?: string | null
          hobi?: string | null
          ibu_alamat?: string | null
          ibu_domisili?: string | null
          ibu_nama?: string | null
          ibu_nik?: string | null
          ibu_no_hp?: string | null
          ibu_pekerjaan?: string | null
          ibu_pendidikan?: string | null
          ibu_penghasilan?: string | null
          ibu_status?: string | null
          ibu_status_tempat_tinggal?: string | null
          ibu_tanggal_lahir?: string | null
          ibu_tempat_lahir?: string | null
          id?: string
          jarak_ke_madrasah?: string | null
          jenis_kelamin?: string | null
          jumlah_saudara?: number | null
          kebutuhan_disabilitas?: string | null
          kebutuhan_khusus?: string | null
          kip?: string | null
          nama?: string
          nama_ayah?: string | null
          nama_ibu?: string | null
          nik?: string | null
          nisn?: string | null
          no_hp?: string | null
          nomor_pendaftaran?: string
          npsn_asal_sekolah?: string | null
          nsm_asal_sekolah?: string | null
          prestasi?: string | null
          status?: string
          status_tempat_tinggal?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          transportasi?: string | null
          updated_at?: string
          wa_ortu?: string | null
          waktu_tempuh?: string | null
          wali_alamat?: string | null
          wali_domisili?: string | null
          wali_nama?: string | null
          wali_nik?: string | null
          wali_no_hp?: string | null
          wali_pekerjaan?: string | null
          wali_pendidikan?: string | null
          wali_penghasilan?: string | null
          wali_status?: string | null
          wali_status_tempat_tinggal?: string | null
          wali_tanggal_lahir?: string | null
          wali_tempat_lahir?: string | null
          yang_membiayai?: string | null
        }
        Relationships: []
      }
      ppdb_settings: {
        Row: {
          created_at: string
          id: string
          is_open: boolean
          pesan_selamat: string | null
          tahun_ajaran: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_open?: boolean
          pesan_selamat?: string | null
          tahun_ajaran?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_open?: boolean
          pesan_selamat?: string | null
          tahun_ajaran?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          initial_password: string | null
          sidebar_intensity: string | null
          sidebar_theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          initial_password?: string | null
          sidebar_intensity?: string | null
          sidebar_theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          initial_password?: string | null
          sidebar_intensity?: string | null
          sidebar_theme?: string | null
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
          foto_path: string | null
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
          user_id: string | null
          wa_ortu: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          foto_path?: string | null
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
          user_id?: string | null
          wa_ortu?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string
          foto_path?: string | null
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
          user_id?: string | null
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
      siswa_riwayat: {
        Row: {
          created_at: string
          id: string
          kelas_id: string
          siswa_id: string
          status: string
          ta_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelas_id: string
          siswa_id: string
          status?: string
          ta_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kelas_id?: string
          siswa_id?: string
          status?: string
          ta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_riwayat_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_riwayat_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_riwayat_ta_id_fkey"
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
      ujian_peserta: {
        Row: {
          created_at: string
          id: string
          is_manual_override: boolean
          kelas_asal_id: string | null
          nomor_kursi: number | null
          nomor_peserta: string
          ruang_id: string | null
          sesi_id: string
          siswa_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual_override?: boolean
          kelas_asal_id?: string | null
          nomor_kursi?: number | null
          nomor_peserta: string
          ruang_id?: string | null
          sesi_id: string
          siswa_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_manual_override?: boolean
          kelas_asal_id?: string | null
          nomor_kursi?: number | null
          nomor_peserta?: string
          ruang_id?: string | null
          sesi_id?: string
          siswa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ujian_peserta_ruang_id_fkey"
            columns: ["ruang_id"]
            isOneToOne: false
            referencedRelation: "ujian_ruang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ujian_peserta_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "ujian_sesi"
            referencedColumns: ["id"]
          },
        ]
      }
      ujian_ruang: {
        Row: {
          baris: number
          created_at: string
          id: string
          kapasitas: number
          kolom: number
          lokasi: string | null
          nama_ruang: string
          sesi_id: string
          urutan: number
        }
        Insert: {
          baris?: number
          created_at?: string
          id?: string
          kapasitas?: number
          kolom?: number
          lokasi?: string | null
          nama_ruang: string
          sesi_id: string
          urutan?: number
        }
        Update: {
          baris?: number
          created_at?: string
          id?: string
          kapasitas?: number
          kolom?: number
          lokasi?: string | null
          nama_ruang?: string
          sesi_id?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "ujian_ruang_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "ujian_sesi"
            referencedColumns: ["id"]
          },
        ]
      }
      ujian_sesi: {
        Row: {
          created_at: string
          id: string
          jenis: string
          kelas_ids: string[]
          nama: string
          nomor_peserta_prefix: string | null
          semester: string | null
          status: string
          ta_id: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis: string
          kelas_ids?: string[]
          nama: string
          nomor_peserta_prefix?: string | null
          semester?: string | null
          status?: string
          ta_id?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: string
          kelas_ids?: string[]
          nama?: string
          nomor_peserta_prefix?: string | null
          semester?: string | null
          status?: string
          ta_id?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          updated_at?: string
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
      generate_nomor_ppdb: { Args: never; Returns: string }
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
      app_role:
        | "admin"
        | "bendahara"
        | "operator"
        | "guru"
        | "siswa"
        | "panitia"
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
      app_role: ["admin", "bendahara", "operator", "guru", "siswa", "panitia"],
      fase_pembelajaran: ["A", "B", "C", "D", "E", "F"],
    },
  },
} as const
