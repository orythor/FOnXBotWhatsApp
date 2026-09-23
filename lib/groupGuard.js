const settings = require("../config/settings");
const db = require("./database/db");
const { isGroupAdmin, isBotAdmin, getSender, extractText } = require("./utils/helper");

const LINK_REGEX = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+)/gi;
const PHISHING_HINTS = ["bit.ly", "tinyurl", "verify-account", "wa-gift", "claim-reward", "whatsapp-web-verify"];

// Simpan cache pesan buat fitur antidelete (in-memory, sesuaikan retensi sesuai kebutuhan)
const messageCache = new Map(); // key: msg.key.id -> { text, sender, groupId, timestamp }

function cacheMessage(msg, groupId) {
  const text = extractText(msg);
  if (!text && !msg.message?.imageMessage) return;
  messageCache.set(msg.key.id, {
    text,
    sender: getSender(msg),
    groupId,
    hasImage: !!msg.message?.imageMessage,
    timestamp: Date.now()
  });

  // bersihkan cache lama (>10 menit) biar ga bengkak
  if (messageCache.size > 500) {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [k, v] of messageCache) {
      if (v.timestamp < cutoff) messageCache.delete(k);
    }
  }
}

async function handleAntilink(sock, msg, groupId, text) {
  const gs = db.getGroupSettings(groupId);
  if (!gs.antilinkphishing) return false;

  const hasLink = LINK_REGEX.test(text);
  if (!hasLink) return false;

  const sender = getSender(msg);
  const senderIsAdmin = await isGroupAdmin(sock, groupId, sender);
  if (senderIsAdmin) return false;

  const botIsAdmin = await isBotAdmin(sock, groupId);
  if (!botIsAdmin) return false;

  await sock.sendMessage(groupId, { delete: msg.key });
  await sock.groupParticipantsUpdate(groupId, [sender], "remove").catch(() => {});
  await sock.sendMessage(groupId, {
    text: `🚫 Link/phishing terdeteksi. Member dikeluarkan otomatis.\n@${sender.split("@")[0]}`,
    mentions: [sender]
  });
  return true;
}

async function handleAntitoxic(sock, msg, groupId, text) {
  const gs = db.getGroupSettings(groupId);
  if (!gs.antitoxic) return false;

  const lower = text.toLowerCase();
  const found = settings.toxicWords.some(w => lower.includes(w));
  if (!found) return false;

  const sender = getSender(msg);
  const senderIsAdmin = await isGroupAdmin(sock, groupId, sender);
  if (senderIsAdmin) return false;

  const botIsAdmin = await isBotAdmin(sock, groupId);
  if (botIsAdmin) await sock.sendMessage(groupId, { delete: msg.key });

  await sock.sendMessage(groupId, {
    text: `⚠️ Terdeteksi kata kasar, harap jaga sopan santun.\n@${sender.split("@")[0]}`,
    mentions: [sender]
  });
  return true;
}

async function handleAntiimg(sock, msg, groupId) {
  const gs = db.getGroupSettings(groupId);
  if (!gs.antiimg) return false;
  if (!msg.message?.imageMessage) return false;

  const sender = getSender(msg);
  const senderIsAdmin = await isGroupAdmin(sock, groupId, sender);
  if (senderIsAdmin) return false;

  const botIsAdmin = await isBotAdmin(sock, groupId);
  if (!botIsAdmin) return false;

  await sock.sendMessage(groupId, { delete: msg.key });
  await sock.sendMessage(groupId, {
    text: `🖼️ Pengiriman gambar dinonaktifkan di grup ini.\n@${sender.split("@")[0]}`,
    mentions: [sender]
  });
  return true;
}

async function handleAntispam(sock, msg, groupId) {
  const gs = db.getGroupSettings(groupId);
  if (!gs.antispam) return false;

  const sender = getSender(msg);
  const senderIsAdmin = await isGroupAdmin(sock, groupId, sender);
  if (senderIsAdmin) return false;

  const track = db.getSpamTrack();
  const key = `${groupId}_${sender}`;
  const now = Date.now();

  if (!track[key]) track[key] = [];
  track[key] = track[key].filter(ts => now - ts < settings.antispam.intervalMs);
  track[key].push(now);
  db.saveSpamTrack(track);

  if (track[key].length > settings.antispam.maxMessages) {
    const botIsAdmin = await isBotAdmin(sock, groupId);
    if (botIsAdmin) await sock.sendMessage(groupId, { delete: msg.key });
    await sock.sendMessage(groupId, {
      text: `🚨 Terdeteksi spam, mohon jangan kirim pesan beruntun.\n@${sender.split("@")[0]}`,
      mentions: [sender]
    });
    return true;
  }
  return false;
}

// Dipanggil dari messages.upsert utama sebelum command parsing
async function processIncoming(sock, msg, groupId) {
  const text = extractText(msg);

  cacheMessage(msg, groupId);

  if (await handleAntilink(sock, msg, groupId, text)) return true;
  if (await handleAntitoxic(sock, msg, groupId, text)) return true;
  if (await handleAntiimg(sock, msg, groupId)) return true;
  if (await handleAntispam(sock, msg, groupId)) return true;

  return false;
}

// Dipanggil dari messages.update (event delete) untuk fitur antidelete
async function handleMessageDelete(sock, updates) {
  for (const update of updates) {
    const groupId = update.key.remoteJid;
    if (!groupId?.endsWith("@g.us")) continue;

    const gs = db.getGroupSettings(groupId);
    if (!gs.antidelete) continue;

    const cached = messageCache.get(update.key.id);
    if (!cached) continue;

    await sock.sendMessage(groupId, {
      text: `🗑️ *Pesan Dihapus Terdeteksi*\nDari: @${cached.sender.split("@")[0]}\nIsi: ${cached.text || "[media]"}`,
      mentions: [cached.sender]
    }).catch(() => {});
  }
}

module.exports = {
  processIncoming,
  handleMessageDelete,
  messageCache
};
