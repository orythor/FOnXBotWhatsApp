module.exports = {
  botName: "🅕Ⓞ🅝XBotWhatsApp",
  developer: "XioNiV ID",
  prefix: ".",
  ownerNumber: ["62xxxxxxxxxxx"], // ganti dengan nomor lo, format 62xxx tanpa +
  sessionName: "session",

  // Port untuk server game HTML (webview)
  gamePort: 3939,
  gameBaseUrl: "http://localhost:3939", // ganti ke domain/tunnel publik kalo mau diakses dari luar

  // Fitur toggle default per group (bisa di-override lewat database/groups.json)
  defaultGroupSettings: {
    antilinkphishing: true,
    antiimg: false,
    antidelete: true,
    antitoxic: true,
    antispam: true,
    rvo: true // read view once
  },

  // Batas antispam
  antispam: {
    maxMessages: 10,   // maksimal pesan
    intervalMs: 8000, // dalam rentang waktu ini (ms)
    muteSeconds: 60   // durasi user di-mute otomatis (soft mute via warning+delete)
  },

  // Kata-kata toxic dasar (bisa ditambah)
  toxicWords: [
    "anjing", "bangsat", "kontol", "memek", "goblok", "tolol", "babi", "asu", " jancok", "tai", " tempek"
  ]
};
