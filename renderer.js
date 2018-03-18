/* global $ nodeRequire  */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// specific code for dossier-redmine
const dossierRedmine = nodeRequire('./modules/dossier-redmine/renderer')

$(document).ready(function () {
  dossierRedmine()
})
