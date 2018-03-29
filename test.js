/* global $ nodeRequire  */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = require('path')
const { loadAll } = require('./plugins/_plugin-loader/loader')

const plugins = loadAll(path.resolve(__dirname, 'plugins'))
Object.keys(plugins).forEach((name) => {
  console.log(name, plugins[name])
})
