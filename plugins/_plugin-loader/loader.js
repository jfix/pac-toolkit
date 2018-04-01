/*
  This plugin bootstraps the plugin loader process.
  It loads all 'public' plugins it finds in the plugins directory.
  'Public' plugins are those whose directories don't start with an underscore.
*/

const { readFile, lstatSync, readdirSync, readFileSync } = require('fs')
const { join, resolve } = require('path')

const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory)

const readPluginConf = (dir) => {
  return JSON.parse(readFileSync(resolve(dir, 'plugin.json'), 'utf8'))
}
const PluginLoader = function () {}
let plugins = {}
let _pluginDir

PluginLoader.prototype.loadAll = (pluginDirectory) => {
  _pluginDir = pluginDirectory
  const dirs = getDirectories(pluginDirectory)
  dirs.forEach((d) => {
    const pluginDirName = d.split('/').slice(-1)[0]
    // ignore private plugins that start with _
    if (pluginDirName.indexOf('_') !== 0) {
      plugins[pluginDirName] = readPluginConf(d)
    }
  })
  return plugins
}

PluginLoader.prototype.deactivatePlugin = (pluginId) => {
  // TODO: destroy
}

PluginLoader.prototype.activatePlugin = (pluginId) => {
  const plugin = plugins[pluginId]
  if (plugin.module) require(resolve(_pluginDir, pluginId, plugin.module))()

  // TODO: Add to lastUsed
}

module.exports = new PluginLoader()
