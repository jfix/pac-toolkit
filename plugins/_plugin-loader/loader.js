/*
  This plugin bootstraps the plugin loader process.
  It loads all 'public' plugins it finds in the plugins directory.
  'Public' plugins are those whose directories don't start with an underscore.
*/

const { lstatSync, readdirSync, readFileSync } = require('fs')
const path = require('path')
const Store = require('electron-store')
const store = new Store()

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

const readPluginConf = (dir) => {
  return JSON.parse(readFileSync(path.resolve(dir, 'plugin.json'), 'utf8'))
}
const PluginLoader = function () {}
let _plugins = {}
let _pluginDir

// TODO: implement!
PluginLoader.prototype.getSetting = (name) => {

}

PluginLoader.prototype.setSetting = (name, value) => {

}

PluginLoader.prototype.deleteSetting = (name) => {

}

PluginLoader.prototype.hasSetting = (name) => {

}

PluginLoader.prototype.loadAll = (pluginDirectory) => {
  _pluginDir = pluginDirectory
  const dirs = getDirectories(pluginDirectory)
  dirs.forEach((d) => {
    const pluginDirName = d.split(path.sep).slice(-1)[0]
    // ignore private plugins that start with _
    if (pluginDirName.indexOf('_') !== 0) {
      _plugins[pluginDirName] = readPluginConf(d)
    }
  })
  return _plugins
}

PluginLoader.prototype.deactivatePlugin = (pluginId) => {
  // TODO: destroy
}

PluginLoader.prototype.activatePlugin = (pluginId) => {
  const plugin = _plugins[pluginId]
  if (plugin.module) {
    require(path.resolve(_pluginDir, pluginId, plugin.module))()
    store.set(`plugins.lastUsed.${pluginId}`, new Date())
  }
}

module.exports = new PluginLoader()
