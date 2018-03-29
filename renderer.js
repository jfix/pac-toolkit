/* global $ nodeRequire  */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = nodeRequire('path')
const { loadAll } = nodeRequire('./plugins/_plugin-loader/loader.js')
const { ipcRenderer } = nodeRequire('electron')
const { app } = nodeRequire('electron').remote
const semverCompare = nodeRequire('semver-compare')

function displayPluginCard (plugin) {
  const html = `<div class='row'>
    <div class='col s12 m6'>
      <div class='card small horizontal'>
        <div class='card-content'>
          <span class='card-title'>${plugin.name}</span>
          <p>${plugin.description}</p>
        </div>
      </div>
    </div>
  </div>`
  $('#app-container').append(html)
}

$(document).ready(function () {
  const plugins = loadAll(path.resolve(__dirname, 'plugins'))
  Object.keys(plugins).forEach((name) => {
    displayPluginCard(plugins[name])
  })
  $('#appVersion').html(`<strong>v${app.getVersion()}</strong>`)
  // using the same channel for both available update events and for not-available update events
  ipcRenderer.on('updateAvailable', (event, message) => {
    console.log(`updateAvailable message received: ${message.version}`)
    const currentVersion = app.getVersion()
    const newVersion = message.version
    if (semverCompare(newVersion, currentVersion) === 1) {
      $('#updateAvailable').html(`- A new version (${message.version}) is available and will be installed on quit.`).delay(4000).fadeOut()
    } else {
      $('#updateAvailable').html(`👍  You already have the latest version!`).delay(4000).fadeOut()
    }
  })
})
