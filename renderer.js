/* global $ loadJsonFile shell Materialize */
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

let cfg
let eid
let parentId

$(document).ready(function () {
  // INITIALIZATIOM
  disableSubtickets()
  $('select').material_select()
  $('.modal').modal({
  })
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
  $('#modalresult').on('click', 'a.external', (evt) => {
    shell.openExternal($(evt.target).attr('href'))
    evt.preventDefault()
  })
  $('form#dossier-form').on('reset', (evt) => {
    Materialize.updateTextFields()
  })
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
    eid = $('#eid').val()
    const subject = `${eid} - ${$('#pubtitle').val()}`
    // prepare main ticket
    const mainTicket = {
      'issue': {
        'project_id': process.env.REDMINE_PROJECT_ID,
        'subject': subject,
        'description': $('#description').val(),
        // FIXME: delete this if we don't have any watchers for the main ticket
        'watcher_user_ids': [],
        'due_date': $('#due-date').val()
      }
    }
    // send main ticket
    $.ajax(process.env.REDMINE_API_URL, {
      data: JSON.stringify(mainTicket),
      contentType: 'application/json',
      method: 'POST',
      headers: {
        'X-Redmine-API-Key': process.env.REDMINE_API_KEY
      }
    })

    // success for main ticket
    .done((data, status, xhr) => {
      // FIXME: probably not this simple ...
      parentId = data.issue.id
      $('div#subtickets input[type=checkbox]:checked').each(function (index) {
        const ticketType = this.id
        const ticketConfig = cfg.subtasks[ticketType]
        const subTicket = {
          'issue': {
            'project_id': process.env.REDMINE_PROJECT_ID,
            'subject': `${eid} - ${ticketConfig.name}`,
            'watcher_user_ids': ticketConfig.watchers,
            'parent_issue_id': parentId
          }
        }
        $.ajax(process.env.REDMINE_API_URL, {
          data: JSON.stringify(subTicket),
          contentType: 'application/json',
          method: 'POST',
          headers: {
            'X-Redmine-API-Key': process.env.REDMINE_API_KEY
          }
        })
        // success for one specific subticket
        .done((data, status, error) => {
          const u = `https://pacps01.oecd.org/redmine/issues/${parentId}`
          $('#modalresult .modal-content').append(`<p>Tickets have been created successfully. The main ticket is here: <a class='external' href='${u}'>${u}</a></p>`)
          $('.modal h4').html(`<i class="material-icons small">check</i> Success`)
          $('#modalresult').modal('open', {
            dismissable: true,
            complete: function () {
              $('div.modal-content p').remove()
              $('div.modal-content h4').empty()
            }
          })
          $('#dossier-form')[0].reset()
        })
        // fail for subtickets
        .fail((xhr, status, error) => {
          $('#modalresult .modal-content').append(`<p>There was an error: ${error.message}. Please ask someone ...</p>`)
          $('.modal h4').html(`<i class="material-icons small">bug_report</i> Failure`)
          $('#modalresult').modal('open', {
            dismissable: true,
            complete: function () {
              $('div.modal-content p').remove()
              $('div.modal-content h4').empty()
            }
          })
        })
      })
    })
    // fail for main ticket
    .fail((xhr, status, error) => {
      $('#modalresult .modal-content').append(`<p>There was an error: '${error}'.<br/><code>xhr.status=${xhr.status}</code><br/>Please ask someone ...</p>`)
      $('.modal h4').html(`<i class="material-icons small">bug_report</i> Failure`)
      $('#modalresult').modal('open', {
        dismissable: true,
        complete: function () {
          $('div.modal-content p').remove()
          $('div.modal-content h4').empty()
        }
      })
    })
    .always(() => {
    })
    evt.preventDefault()
  })

  // what to do when publication type changes
  $('#pubtype').on('change', (evt) => {
    switch (evt.target.value) {
      case 'pubstat':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        $('#t-mls').prop('checked', true)
        $('#t-threepages').prop('checked', true)
        enableSubtickets()
        break

      case 'crc':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        $('#t-mls').prop('checked', true)
        $('#t-graphics').prop('checked', true)
        enableSubtickets()
        break

      case 'vrd':
        unselectSubtickets()
        $('#t-body').prop('checked', true)
        $('#t-mls').prop('checked', true)
        enableSubtickets()
        break

      case 'typeset':
        unselectSubtickets()
        $('#t-cover').prop('checked', true)
        $('#t-body').prop('checked', true)
        $('#t-threepages').prop('checked', true)
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
