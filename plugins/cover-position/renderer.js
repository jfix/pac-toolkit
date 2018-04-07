/* global $ nodeRequire  */
const { shell } = nodeRequire('electron')

/*
  All this module does is open an external link in the browser window
*/
module.exports = function () {
  shell.openExternal('https://jfix.github.io/cover-image-position/')
}
