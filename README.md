# 🅕Ⓞ🅝XBotWhatsApp

WhatsApp Bot berbasis Baileys dengan fitur Group Guard (khusus admin) dan 10 Game HTML interaktif.

**Dev:** XioNiV ID
**Library:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
**OS Support:** Termux (Android), Ubuntu/Linux, Windows

---

## Fitur

### 🛡️ Group Guard (Admin Only)
- `.kick` — kick member (reply/mention/nomor)
- `.delete` — hapus pesan yang di-reply
- antilinkphishing — auto kick pengirim link/phishing
- antiimg — blokir pengiriman gambar
- antidelete — laporkan pesan yang dihapus
- antitoxic — filter kata kasar otomatis
- antispam — deteksi & tindak pesan beruntun
- rvo — flag untuk fitur read-once (extensible)
- `.set <fitur> <on/off>` — toggle tiap fitur per grup

### Plugin System
- `.addplugin <file.js>` — tambah command baru secara live (owner only)
- `.delplugin <file.js>` — hapus command (owner only)
- `.listplugin` — lihat semua command aktif

### 10 Game (HTML View)
1. Tebak Angka
2. Tebak Kata
3. Ular (Snake)
4. 2048
5. Flappy Bird
6. Tic Tac Toe (vs Bot)
7. Memory Card
8. Hangman
9. Quiz
10. Batu Gunting Kertas

Game dibuka lewat link (`.game <nomor>`), di-serve oleh server Express lokal di bot.

---

## Instalasi di Termux

### 1. Update & install dependensi dasar
```bash
pkg update && pkg upgrade -y
pkg install git nodejs-lts -y
```

### 2. Clone repository
```bash
git clone https://github.com/orythor/FOnXBotWhatsApp.git
cd FOnXBotWhatsApp
```

### 3. Install dependencies
```bash
npm install
```

### 4. Konfigurasi
Edit `config/settings.js`:
```bash
nano setting.js
```

- `ownerNumber` — isi nomor WhatsApp kamu (format `62xxxxxxxxxx`, tanpa `+`)

### 5. Jalankan bot
```bash
npm start
```

---

## Instalasi di Ubuntu/Linux/WSL

```bash
sudo apt update && sudo apt install git nodejs npm -y
git clone https://github.com/orythor/FOnXBotWhatsApp.git
cd FOnXBotWhatsApp
npm install
npm start
```

## Instalasi di Windows

1. Install [Node.js LTS](https://nodejs.org) dan [Git](https://git-scm.com)
2. Buka Command Prompt / PowerShell:
```bash
git clone https://github.com/orythor/FOnXBotWhatsApp.git
cd FOnXBotWhatsApp
npm install
npm start
```

---


## Struktur Folder

```
FOnXBotWhatsApp/
├── index.js              # entry point
├── config/settings.js    # konfigurasi bot
├── lib/
│   ├── pluginLoader.js   # sistem load command dinamis
│   ├── groupGuard.js     # antilink, antitoxic, antispam, antidelete, antiimg
│   ├── gameServer.js     # server Express untuk game
│   ├── database/db.js    # penyimpanan setting grup (JSON)
│   ├── utils/helper.js   # helper admin check dll
│   └── plugins/          # semua command (.kick, .game, dll)
├── games/                # 10 folder game HTML
├── database/             # data JSON runtime (auto-generated)
└── session/              # auth session WhatsApp (auto-generated, jangan di-share!)
```

---

## Menambah Plugin Baru

Bisa manual (taruh file `.js` baru di `lib/plugins/`) atau lewat chat (owner only):

```
.addplugin ping.js
module.exports = {
  command: "ping",
  description: "Cek respon bot",
  execute: async (sock, msg, { groupId }) => {
    const chatId = groupId || msg.key.remoteJid;
    await sock.sendMessage(chatId, { text: "Pong! 🏓" });
  }
};
```

Setiap plugin wajib punya `command` (string/array) dan `execute(sock, msg, ctx)`.

---

## Catatan

- `session/` menyimpan kredensial WhatsApp kamu — jangan pernah di-commit atau di-share ke publik (sudah masuk `.gitignore`).
- Fitur `antilinkphishing`, `antiimg`, `delete`, `kick` butuh bot dijadikan **admin grup** dulu.
- Nomor di `ownerNumber` menentukan siapa yang bisa pakai `.addplugin` / `.delplugin`.
