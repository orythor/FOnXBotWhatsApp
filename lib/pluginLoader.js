const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const PLUGIN_DIR = path.join(__dirname, "plugins");
const plugins = new Map();

function loadPlugins() {
  plugins.clear();
  const files = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const fullPath = path.join(PLUGIN_DIR, file);
      delete require.cache[require.resolve(fullPath)];
      const plugin = require(fullPath);

      if (!plugin.command || !plugin.execute) {
        console.log(chalk.yellow(`[PLUGIN] Skip ${file}: missing command/execute`));
        continue;
      }

      const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
      for (const cmd of commands) {
        plugins.set(cmd.toLowerCase(), plugin);
      }
    } catch (err) {
      console.log(chalk.red(`[PLUGIN] Gagal load ${file}: ${err.message}`));
    }
  }

  console.log(chalk.green(`[PLUGIN] ${plugins.size} command termuat dari ${files.length} file`));
  return plugins;
}

function getPlugin(command) {
  return plugins.get(command.toLowerCase());
}

function getAllPlugins() {
  return plugins;
}

function addPluginFile(filename, code) {
  const target = path.join(PLUGIN_DIR, filename.endsWith(".js") ? filename : `${filename}.js`);
  fs.writeFileSync(target, code, "utf8");
  return loadPlugins();
}

function deletePluginFile(filename) {
  const target = path.join(PLUGIN_DIR, filename.endsWith(".js") ? filename : `${filename}.js`);
  if (!fs.existsSync(target)) return false;
  fs.unlinkSync(target);
  loadPlugins();
  return true;
}

module.exports = {
  loadPlugins,
  getPlugin,
  getAllPlugins,
  addPluginFile,
  deletePluginFile,
  PLUGIN_DIR
};
