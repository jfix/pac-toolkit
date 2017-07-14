/* global $ */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const kv3Url = 'http://localhost:1234/kv3-response.xml'

$(document).ready(function () {
  disableSubtickets()

  $('select').material_select()

  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
  })

  $('#eid').on('blur', (evt) => {
    const val = evt.target.value
    if (val === '') return
    $.ajax({
      url: kv3Url,
      dataType: 'xml',
      success: function (data) {
        const title = $(data).find('title')[0].textContent
        $('#pub-title').val(title)

        // TODO: also update description with Kv2 and Kv3 links
      }
    })
  })

  // what to do when publication type changes

  $('#pub-type').on('change', (evt) => {
    switch (evt.target.value) {
      case 'pubstat':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        $('#t-body').prop('checked', true)
        enableSubtickets()
        break

      case 'crc':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        $('#t-mls').prop('checked', true)
        $('#t-blah').prop('checked', true)
        enableSubtickets()
        break

      case 'vrd':
        unselectSubtickets()
        $('#t-body').prop('checked', true)
        $('#t-foo').prop('checked', true)
        enableSubtickets()
        break

      case 'typeset':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        enableSubtickets()
        break

      default:
        unselectSubtickets()
        disableSubtickets()
    }
  })
})

function unselectSubtickets () {
  $('#subtickets :checkbox').prop('checked', false)
}
function disableSubtickets () {
  $('#subtickets :checkbox').prop('disabled', true)
}
function enableSubtickets () {
  $('#subtickets :checkbox').prop('disabled', false)
}
