const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const chalk = require("chalk");
const path = require("path");

const settings = require("./config/settings");
const pluginLoader = require("./lib/pluginLoader");
const groupGuard = require("./lib/groupGuard");
const { startGameServer } = require("./lib/gameServer");
const { extractText, getSender } = require("./lib/utils/helper");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, "session")
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: [settings.botName, "Chrome", "1.0.0"]
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(chalk.cyan("\n[QR] Scan QR code berikut dengan WhatsApp:\n"));
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red(`[CONNECTION] Terputus. Reconnect: ${shouldReconnect}`));
      if (shouldReconnect) startBot();
      else console.log(chalk.red("[CONNECTION] Logged out. Hapus folder session lalu scan ulang."));
    } else if (connection === "open") {
      console.log(chalk.green(`[CONNECTION] ${settings.botName} berhasil terhubung!`));
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Handle pesan masuk
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const groupId = isGroup ? from : null;

    try {
      // Jalankan group guard dulu (antilink, antitoxic, dst)
      if (isGroup) {
        const handled = await groupGuard.processIncoming(sock, msg, groupId);
        if (handled) return; // pesan sudah ditindak, stop di sini
      }

      // Command parsing
      const text = extractText(msg).trim();
      if (!text.startsWith(settings.prefix)) return;

      const withoutPrefix = text.slice(settings.prefix.length).trim();
      const args = withoutPrefix.split(/\s+/);
      const command = args.shift()?.toLowerCase();
      if (!command) return;

      const plugin = pluginLoader.getPlugin(command);
      if (!plugin) return;

      await plugin.execute(sock, msg, {
        args,
        rawText: text,
        groupId,
        sender: getSender(msg)
      });
    } catch (err) {
      console.log(chalk.red(`[ERROR] ${err.message}`));
    }
  });

  // Handle pesan dihapus (antidelete)
  sock.ev.on("messages.update", async (updates) => {
    try {
      await groupGuard.handleMessageDelete(sock, updates);
    } catch (err) {
      console.log(chalk.red(`[ANTIDELETE ERROR] ${err.message}`));
    }
  });

  return sock;
}

// Boot sequence
(async () => {
  console.log(chalk.magenta(`\n=== ${settings.botName} ===`));
  console.log(chalk.magenta(`Dev: ${settings.developer}\n`));

  pluginLoader.loadPlugins();
  startGameServer();
  await startBot();
})();
