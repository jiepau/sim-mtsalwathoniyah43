// Model Pembelajaran Deep Learning
export const MODEL_PEMBELAJARAN = {
  discovery_learning: {
    nama: "Discovery Learning",
    deskripsi: "Pembelajaran penemuan mandiri melalui proses eksplorasi dan inkuiri",
    sintaks: [
      "Stimulation (Pemberian Rangsangan)",
      "Problem Statement (Identifikasi Masalah)",
      "Data Collection (Pengumpulan Data)",
      "Data Processing (Pengolahan Data)",
      "Verification (Pembuktian)",
      "Generalization (Menarik Kesimpulan)"
    ]
  },
  problem_based_learning: {
    nama: "Problem Based Learning (PBL)",
    deskripsi: "Pembelajaran berbasis masalah autentik untuk mengembangkan kemampuan berpikir kritis",
    sintaks: [
      "Orientasi pada Masalah",
      "Organisasi Belajar",
      "Penyelidikan Individual/Kelompok",
      "Pengembangan dan Penyajian Hasil",
      "Analisis dan Evaluasi Proses"
    ]
  },
  project_based_learning: {
    nama: "Project Based Learning (PjBL)",
    deskripsi: "Pembelajaran berbasis proyek untuk menghasilkan produk nyata",
    sintaks: [
      "Penentuan Pertanyaan Mendasar",
      "Menyusun Perencanaan Proyek",
      "Menyusun Jadwal",
      "Monitoring Kemajuan Proyek",
      "Menguji Hasil",
      "Evaluasi Pengalaman"
    ]
  },
  inquiry_learning: {
    nama: "Inquiry Learning",
    deskripsi: "Pembelajaran inkuiri untuk mengembangkan keterampilan investigasi ilmiah",
    sintaks: [
      "Orientasi",
      "Merumuskan Masalah",
      "Merumuskan Hipotesis",
      "Mengumpulkan Data",
      "Menguji Hipotesis",
      "Merumuskan Kesimpulan"
    ]
  },
  differentiated_instruction: {
    nama: "Differentiated Instruction",
    deskripsi: "Pembelajaran berdiferensiasi sesuai kebutuhan dan gaya belajar siswa",
    sintaks: [
      "Pre-Assessment (Penilaian Awal)",
      "Diferensiasi Konten",
      "Diferensiasi Proses",
      "Diferensiasi Produk",
      "Ongoing Assessment (Penilaian Berkelanjutan)"
    ]
  }
};

// Profil Pelajar Pancasila
export const PROFIL_PELAJAR_PANCASILA = {
  beriman: {
    label: "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia",
    subElemen: ["Akhlak beragama", "Akhlak pribadi", "Akhlak kepada manusia", "Akhlak kepada alam", "Akhlak bernegara"]
  },
  mandiri: {
    label: "Mandiri",
    subElemen: ["Pemahaman diri dan situasi", "Regulasi diri"]
  },
  bergotong_royong: {
    label: "Bergotong Royong",
    subElemen: ["Kolaborasi", "Kepedulian", "Berbagi"]
  },
  berkebinekaan_global: {
    label: "Berkebinekaan Global",
    subElemen: ["Mengenal dan menghargai budaya", "Komunikasi dan interaksi antarbudaya", "Refleksi dan tanggung jawab"]
  },
  bernalar_kritis: {
    label: "Bernalar Kritis",
    subElemen: ["Memperoleh dan memproses informasi", "Menganalisis dan mengevaluasi penalaran", "Merefleksi pemikiran"]
  },
  kreatif: {
    label: "Kreatif",
    subElemen: ["Menghasilkan gagasan yang orisinal", "Menghasilkan karya dan tindakan yang orisinal"]
  }
};

// Nilai Karakter Kurikulum Berbasis Cinta dengan materi insersi
export const NILAI_KARAKTER_KBC: Record<string, { label: string; materiInsersi: string[] }> = {
  cinta_allah: {
    label: 'Cinta Allah Swt. dan Rasul-Nya',
    materiInsersi: [
      'Mengagumi kebesaran Allah Swt. melalui ciptaan-Nya yang dipelajari.',
      'Meneladani akhlak Rasulullah SAW dalam kehidupan sehari-hari.',
      'Mengaitkan materi pembelajaran dengan ayat Al-Qur\'an atau hadis yang relevan.',
    ]
  },
  cinta_diri: {
    label: 'Cinta diri sendiri',
    materiInsersi: [
      'Menghargai diri sendiri sebagai makhluk ciptaan Allah yang mulia.',
      'Menjaga kesehatan jasmani dan rohani sebagai bentuk syukur.',
      'Mengembangkan potensi diri untuk kebaikan.',
    ]
  },
  cinta_sesama: {
    label: 'Cinta sesama manusia',
    materiInsersi: [
      'Menghormati perbedaan dan keberagaman dalam masyarakat.',
      'Membangun sikap toleransi dan saling menghargai antar sesama.',
      'Mempraktikkan ukhuwah Islamiyah dalam interaksi sosial.',
    ]
  },
  cinta_lingkungan: {
    label: 'Cinta lingkungan',
    materiInsersi: [
      'Menjaga kelestarian lingkungan sebagai amanah dari Allah Swt.',
      'Larangan merusak lingkungan (QS. Ar-Rum: 41).',
      'Menerapkan perilaku ramah lingkungan dalam kehidupan sehari-hari.',
    ]
  },
  cinta_tanah_air: {
    label: 'Cinta tanah air',
    materiInsersi: [
      'Menghargai jasa para pahlawan dan pejuang kemerdekaan.',
      'Menjaga persatuan dan kesatuan bangsa.',
      'Berkontribusi positif untuk kemajuan bangsa dan negara.',
    ]
  },
  kasih_sayang: {
    label: 'Kasih sayang',
    materiInsersi: [
      'Meneladani sifat ar-Rahman dan ar-Rahim Allah Swt.',
      'Menunjukkan kasih sayang kepada orang tua, guru, dan teman.',
      'Menyayangi makhluk hidup lain sebagai sesama ciptaan Allah.',
    ]
  },
  empati: {
    label: 'Empati',
    materiInsersi: [
      'Memahami perasaan dan kondisi orang lain.',
      'Membantu sesama yang membutuhkan pertolongan.',
      'Tidak meremehkan atau menghina orang lain.',
    ]
  },
  ketulusan: {
    label: 'Ketulusan',
    materiInsersi: [
      'Melakukan segala sesuatu dengan ikhlas karena Allah Swt.',
      'Menghindari sikap riya\' dan pamer dalam beramal.',
      'Mengutamakan niat yang tulus dalam setiap pembelajaran.',
    ]
  },
  syukur: {
    label: 'Syukur',
    materiInsersi: [
      'Mensyukuri nikmat Allah Swt. melalui perilaku sehari-hari.',
      'Menggunakan nikmat yang diberikan untuk kebaikan.',
      'Bersyukur atas ilmu pengetahuan yang diperoleh.',
    ]
  },
  kejujuran: {
    label: 'Kejujuran',
    materiInsersi: [
      'Menanamkan sikap jujur dalam perkataan dan perbuatan.',
      'Menghindari perilaku curang dan berbohong.',
      'Meneladani kejujuran Rasulullah SAW (Al-Amin).',
    ]
  },
};

// Teknik Asesmen HOTS
export const TEKNIK_ASESMEN = {
  tes_tertulis: {
    label: "Tes Tertulis",
    deskripsi: "Essay analisis, pemecahan masalah, studi kasus",
    levelHots: ["C4 - Menganalisis", "C5 - Mengevaluasi", "C6 - Mencipta"]
  },
  tes_lisan: {
    label: "Tes Lisan",
    deskripsi: "Presentasi, diskusi terbimbing, tanya jawab",
    levelHots: ["C4 - Menganalisis", "C5 - Mengevaluasi"]
  },
  observasi: {
    label: "Observasi",
    deskripsi: "Checklist sikap, rubrik kinerja, anecdotal record",
    levelHots: ["Afektif", "Psikomotorik"]
  },
  penugasan: {
    label: "Penugasan",
    deskripsi: "Proyek, portofolio, produk, investigasi",
    levelHots: ["C5 - Mengevaluasi", "C6 - Mencipta"]
  },
  praktik: {
    label: "Penilaian Praktik",
    deskripsi: "Demonstrasi, simulasi, role play",
    levelHots: ["C4 - Menganalisis", "C6 - Mencipta"]
  },
  peer_assessment: {
    label: "Peer Assessment",
    deskripsi: "Penilaian antar teman dengan rubrik terstandar",
    levelHots: ["C5 - Mengevaluasi"]
  },
  self_assessment: {
    label: "Self Assessment",
    deskripsi: "Refleksi diri, jurnal belajar",
    levelHots: ["Metakognitif"]
  }
};

// Jenis Asesmen
export const JENIS_ASESMEN = {
  diagnostik: "Asesmen Diagnostik (pra-pembelajaran)",
  formatif: "Asesmen Formatif (selama pembelajaran)",
  sumatif: "Asesmen Sumatif (akhir pembelajaran)"
};

// Jenjang options
export const JENJANG_OPTIONS = [
  { value: 'MI', label: 'MI (Madrasah Ibtidaiyah)', fase: 'B' },
  { value: 'MTs', label: 'MTs (Madrasah Tsanawiyah)', fase: 'D' },
  { value: 'MA', label: 'MA (Madrasah Aliyah)', fase: 'E' },
  { value: 'SD', label: 'SD (Sekolah Dasar)', fase: 'B' },
  { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)', fase: 'D' },
  { value: 'SMA', label: 'SMA (Sekolah Menengah Atas)', fase: 'E' },
];

// Mapel options
export const MAPEL_OPTIONS = [
  "Al-Qur'an Hadis",
  'Akidah Akhlak',
  'Fiqih',
  'Sejarah Kebudayaan Islam',
  'Bahasa Arab',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Matematika',
  'IPA',
  'IPS',
  'PKN',
  'Seni Budaya',
  'PJOK',
  'Prakarya',
  'Informatika',
];

// Kelas options per jenjang
export const KELAS_OPTIONS: Record<string, { value: string; label: string }[]> = {
  MI: [
    { value: '1', label: 'Kelas 1' },
    { value: '2', label: 'Kelas 2' },
    { value: '3', label: 'Kelas 3' },
    { value: '4', label: 'Kelas 4' },
    { value: '5', label: 'Kelas 5' },
    { value: '6', label: 'Kelas 6' },
  ],
  SD: [
    { value: '1', label: 'Kelas 1' },
    { value: '2', label: 'Kelas 2' },
    { value: '3', label: 'Kelas 3' },
    { value: '4', label: 'Kelas 4' },
    { value: '5', label: 'Kelas 5' },
    { value: '6', label: 'Kelas 6' },
  ],
  MTs: [
    { value: '7', label: 'Kelas 7 (VII)' },
    { value: '8', label: 'Kelas 8 (VIII)' },
    { value: '9', label: 'Kelas 9 (IX)' },
  ],
  SMP: [
    { value: '7', label: 'Kelas 7 (VII)' },
    { value: '8', label: 'Kelas 8 (VIII)' },
    { value: '9', label: 'Kelas 9 (IX)' },
  ],
  MA: [
    { value: '10', label: 'Kelas 10 (X)' },
    { value: '11', label: 'Kelas 11 (XI)' },
    { value: '12', label: 'Kelas 12 (XII)' },
  ],
  SMA: [
    { value: '10', label: 'Kelas 10 (X)' },
    { value: '11', label: 'Kelas 11 (XI)' },
    { value: '12', label: 'Kelas 12 (XII)' },
  ],
};

// Alokasi Waktu options
export const ALOKASI_WAKTU_OPTIONS = [
  { value: '1 x 40 menit', label: '1 x 40 menit (1 JP)' },
  { value: '2 x 40 menit', label: '2 x 40 menit (2 JP)' },
  { value: '3 x 40 menit', label: '3 x 40 menit (3 JP)' },
  { value: '4 x 40 menit', label: '4 x 40 menit (4 JP)' },
  { value: '2 x 35 menit', label: '2 x 35 menit (MI/SD)' },
  { value: '2 x 45 menit', label: '2 x 45 menit (MA/SMA)' },
  { value: '3 x 45 menit', label: '3 x 45 menit (MA/SMA)' },
];

// Diferensiasi presets
export const DIFERENSIASI_PRESETS = {
  konten: [
    'Teks bacaan dengan tingkat kesulitan berbeda',
    'Video pembelajaran dan infografis untuk visual learner',
    'Materi ringkasan untuk siswa yang membutuhkan scaffolding',
    'Materi pengayaan untuk siswa yang sudah menguasai',
  ],
  proses: [
    'Diskusi kelompok kecil untuk auditori learner',
    'Praktik langsung / hands-on untuk kinestetik learner',
    'Membaca dan menulis catatan untuk visual learner',
    'Bimbingan individual untuk siswa yang membutuhkan bantuan',
  ],
  produk: [
    'Presentasi lisan',
    'Poster / infografis',
    'Laporan tertulis',
    'Video pendek / vlog pembelajaran',
    'Mind map / peta konsep',
  ],
};

// Helper functions
export const generateMateriInsersi = (nilaiKarakter: string[]): string => {
  const materiList: string[] = [];
  nilaiKarakter.forEach(nilai => {
    const data = NILAI_KARAKTER_KBC[nilai];
    if (data?.materiInsersi) {
      materiList.push(...data.materiInsersi.slice(0, 2));
    }
  });
  return materiList.map(m => `- ${m}`).join('\n');
};
