/* global $ nodeRequire  */
const { shell } = nodeRequire('electron')
/*
  All this module does is open an external link in the browser window
*/
module.exports = function () {
  shell.openExternal('https://jfix.github.io/cover-image-position/')
  // re-display list of plugins, and therefore reinitialize the click count.
  // as we're using 'one()' the user can only click once. Except if the page
  // is redisplayed... a bit hacky, I agree.
  $('#header-link').click()
}
