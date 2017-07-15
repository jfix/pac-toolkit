/* global $ loadJsonFile */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

let cfg

$(document).ready(function () {
  // INITIALIZATIOM
  disableSubtickets()
  $('select').material_select()
  $('.datepicker').pickadate({
    // TODO: would be nice to be able to use a user-friendly date for display
    //       and a Redmine-friendly date for submission; but this doesn't
    //       work yet in this modified version of the datepicker.
    // formatSubmit: 'yyyy-mm-dd',
    // format: 'd mmmm yyyy',
    format: 'yyyy-mm-dd',
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 10 // Creates a dropdown of 10 years to control year
  })
  loadJsonFile('config.json').then(json => { cfg = json })

  // EVENT HANDLERS
  $('#eid').on('blur', (evt) => {
    const val = evt.target.value
    if (val === '') {
      $('#pubtitle').val('')
      return
    }
    $.ajax({
      url: process.env.KV3_URL,
      dataType: 'xml',
      success: function (data) {
        const kv3id = $(data).find('rid')[0].textContent.split(':').pop()
        // TODO: this is clearly not precise enough, but good enough for a POC
        const kv2id = $(data).find('identifier')[0].textContent
        const title = $(data).find('title')[0].textContent
        $('#pubtitle').val(title)

        const desc = $('#description').val()
        if (desc !== '') {
          // TODO: should be updating not replacing
          $('#description').val(
            '* Book submission link: \n' +
            `* Kappa v2 link: http://pac-apps.oecd.org/kappa/search?q=${kv2id}\n` +
            `* Kappa v3 link: http://kappa.oecd.org/v3/?term=${kv3id}\n`
          )
        } else {
          $('#description').val(
            '* Book submission link: \n' +
            `* Kappa v2 link: http://pac-apps.oecd.org/kappa/search?q=${kv2id}\n` +
            `* Kappa v3 link: http://kappa.oecd.org/v3/?term=${kv3id}\n`
          )
        }
      }
    })
  })
  $('#submit').on('click', (evt) => {
    // TODO: make this work ...
    // $('#dossier-form').validate({
    //   rules: {
    //     pubtype: 'required'
    //   },
    //   submitHandler: (form) => {
    //     console.log('not doing much ...')
    //   }
    // })
    console.log('submitting now!')

    const subject = `${$('#eid').val()} - ${$('#pubtitle').val()}`
    // prepare tickets
    const mainTicket = {
      'issue': {
        'project_id': cfg.project.id,
        'subject': subject,
        'description': $('#description').val(),
        'watcher_user_ids': [],
        'due_date': $('#due-date').val()
      }
    }
    console.log(mainTicket)
    evt.preventDefault()
  })

  // what to do when publication type changes
  $('#pubtype').on('change', (evt) => {
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
