/* global $ nodeRequire  */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

/*
electron-json-storage structure of JSON:
{
  plugins: {
    lastUsed: {
      [plugin-id]: [date]
      ...
    },
    settings: {
      [plugin-id]: {
        redmine-api-key: ...,
        another-one: ...
      }
    }
  }
}
*/

const path = nodeRequire('path')
const { loadAll, activatePlugin } = nodeRequire('./plugins/_plugin-loader/loader.js')
const { ipcRenderer } = nodeRequire('electron')
const { app } = nodeRequire('electron').remote
const Store = nodeRequire('electron-store')
const semverCompare = nodeRequire('semver-compare')

const store = new Store()

function displayPluginCard (plugin, rowType) {
  const html = `<div class='col s4'>
      <div class='card small horizontal app-card ${!plugin.module ? 'disabled' : 'hoverable'}'>
        <div class='card-content' data-app-card-id='${plugin.id}'>
          <span class='card-title'>${plugin.name}</span>
          <p>${plugin.description}</p>
        </div>
      </div>
    </div>`
  $(`#app-container .row.${rowType}`).append(html)
}

function displayPluginList () {
  $('#app-container')
    .html(`<br/><br/><h6>Recently used applications</h6><div class='divider'></div>`)
    .append('<div class="row recent"></div>')
    .append(`<br/><h6>Other applications</h6><div class='divider'></div>`)
    .append('<div class="row other"></div>')

  const plugins = loadAll(path.resolve(__dirname, 'plugins'))
  Object.keys(plugins).forEach((name) => {
    if (store.has(`plugins.lastUsed.${name}`)) {
      displayPluginCard(plugins[name], 'recent')
    } else {
      displayPluginCard(plugins[name], 'other')
    }
  })

  $('.app-card').on('click', (evt) => {
    const pluginId = $(evt.target).closest('.card-content').data('appCardId')
    activatePlugin(pluginId)
  })
}

function cleanSettings () {
  $('#settings-dropdown-button').dropdown({
    'belowOrigin': true,
    'constrainWidth': false
  })
  // remove any(!) potential menu items in the settings dropdown
  // this is problematic if the principal page has settings!
  $('#settings-dropdown').empty()
}

// general initialization
$(document).ready(function () {
  console.log(`Ok, we're ready to initialize.`)
  // display the list of available applications on startup
  displayPluginList()
  cleanSettings()

  // display the list of applications when click on app title occurs
  $('#header-link').on('click', () => {
    displayPluginList()
    cleanSettings()
  })

  // version handling
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
  ipcRenderer.on('updateDownloading', (event, message) => {
    $('#updateAvailable').html(`⏳ Downloading ... ${message.percent} of ${message.total} done.`)
    console.log(`Downloading ... ${message.percent} of ${message.total} done.`)
  })
  ipcRenderer.on('updateReady', (event, message) => {
    $('#updateAvailable').html(`✨ Version ${message.version} has been successfully downloaded!`).delay(4000).fadeOut()
  })
})
