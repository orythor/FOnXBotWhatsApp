async function isGroupAdmin(sock, groupId, userId) {
  try {
    const metadata = await sock.groupMetadata(groupId);
    const participant = metadata.participants.find(p => p.id === userId);
    return participant && (participant.admin === "admin" || participant.admin === "superadmin");
  } catch {
    return false;
  }
}

async function isBotAdmin(sock, groupId) {
  const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  return isGroupAdmin(sock, groupId, botId);
}

function isOwner(userId, ownerList) {
  const num = userId.split("@")[0];
  return ownerList.includes(num);
}

function getSender(msg) {
  return msg.key.participant || msg.key.remoteJid;
}

function extractText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""
  );
}

module.exports = {
  isGroupAdmin,
  isBotAdmin,
  isOwner,
  getSender,
  extractText
};
