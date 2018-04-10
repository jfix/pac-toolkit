/* global $ Materialize   nodeRequire  */
const loadJsonFile = nodeRequire('load-json-file')
const { app } = nodeRequire('electron').remote
const fs = nodeRequire('fs')
const path = nodeRequire('path')
const { shell } = nodeRequire('electron')
nodeRequire('dotenv').config({path: path.join(__dirname, '_env')})
const Store = nodeRequire('electron-store')
const store = new Store()
let cfg, eid, oecdCode, parentId, dueDate, redmineApiKey, pluginId, apiKeySettingName

// TODO: make this function smaller by putting stuff elsewhere

module.exports = function () {
  const index = path.join(__dirname, './index.html')
  loadJsonFile(path.join(__dirname, './plugin.json')).then(json => {
    pluginId = json.id
    // TODO: should be encapsulated by plugin.getSetting(settingName)
    apiKeySettingName = `plugins.settings.${pluginId}.redmine-api-key`
  })
  fs.readFile(index, (err, data) => {
    if (err) console.log(err)
    // inject plugin's content into main area
    $('#app-container').html(data.toString())

    // inject settings menu item
    $('#settings-dropdown').html(`
        <li><a id="api-key-settings" href="#!">API key settings</a></li>
    `)

    // INITIALISATIOM
    loadJsonFile(path.join(__dirname, 'config.json')).then(json => {
      cfg = json
      initializeSubtickets()
      disableSubtickets()
    })

    $('.modal').modal()
    $('.tooltipped').tooltip({delay: 50})
    $('.datepicker').pickadate({
      // TODO: would be nice to be able to use a user-friendly date for display
      //       and a Redmine-friendly date for submission; but this doesn't
      //       work yet in this modified version of the datepicker.
      // formatSubmit: 'yyyy-mm-dd',
      // format: 'd mmmm yyyy',
      min: new Date(),
      format: 'yyyy-mm-dd',
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 10 // Creates a dropdown of 10 years to control year
    })

    // Fill in the subcontractor dropdown from the _env file info
    $.each(process.env.CUSTOM_FIELD_SUBCONTRACTORS.split('|'), function (i, item) {
      $('#subcontractor').append($('<option>', {
        value: item,
        text: item
      }))
    })
    $('select').material_select()
    $('#redmine_my_account_link').attr('href', process.env.REDMINE_API_URL + '/my/account')
    checkForRedmineApiKey()

    // EVENT HANDLERS
    $('div.modal').on('click', 'a.external', (evt) => {
      shell.openExternal($(evt.target).attr('href'))
      evt.preventDefault()
    })
    $('form#dossier-form').on('reset', (evt) => {
      Materialize.updateTextFields()
    })
    $('#kappa-icon').on('click', (evt) => {
      console.log(`CLICK: ${evt.type}`)
      shell.openExternal('http://kappa.oecd.org/')
      evt.preventDefault()
    })

    // when someone clicks the API key settings dropdown menu
    $('a#api-key-settings').on('click', (evt) => {
      $('#modalkey').modal('open', {
        dismissable: false
      })
      redmineApiKey = store.get(apiKeySettingName)
      $('#redmine-api-key').val(redmineApiKey).select()
    })

    $('#redmine-api-key').on('focus', (evt) => {
      evt.target.select()
    })
    // when someone wants to test the pasted API key
    $('a#key-test').on('click', (evt) => {
      $('span#key-test-feedback').html('').show()
      $.ajax({
        url: `${process.env.REDMINE_API_URL}/issues.json`,
        method: 'GET',
        headers: {
          'X-Redmine-API-Key': $('#redmine-api-key').val()
        }
      })
        .done((data, status, xhr) => {
          $('#key-test-feedback')
            .css({'color': 'green'})
            .html(`<i class="material-icons left">check</i><span>All good!</span>`)
          setTimeout(() => {
            $('#key-test-feedback').fadeOut('fast').html('')
          }, 2000)
        })
        .fail((xhr, status, error) => {
          $('#key-test-feedback')
            .css({'color': 'red'})
            .html(`<i class="material-icons left">error_outline</i><span>Error ${xhr.status}</span>`)
          setTimeout(() => {
            $('#key-test-feedback').fadeOut('fast').html('')
          }, 2000)
        })
    })

    // KAPPAV3 LOOKUP
    $('#eid').on('blur', (evt) => {
      eid = evt.target.value
      if (eid === '') {
        $('#pubtitle').val('')
        return
      }
      console.log(`EID: ${eid}.`)
      $.ajax({
        url: `${process.env.KV3_URL}${eid}?apikey=${process.env.KV3_API_KEY}`,
        dataType: 'xml',
        success: function (data) {
          const kv3id = $(data).find('rid')[0].textContent.split(':').pop()
          // TODO: this is clearly not precise enough, but good enough for a POC
          oecdCode = $(data).find('identifier')[1].textContent
          const title = $(data).find('title')[0].textContent
          $('#pubtitle').val(title)

          const desc = $('#description').val()
          if (desc !== '') {
            // TODO: should be updating not replacing
            $('#description').val(
              '* Book submission link: \n' +
              `* Kappa v2 link: http://pac-apps.oecd.org/kappa/Search/Results.asp?QuickSearch=ID:${oecdCode}\n` +
              `* Kappa v3 link: http://kappa.oecd.org/v3/Expression/Details/${kv3id}\n`
            )
          } else {
            $('#description').val(
              '* Book submission link: \n' +
              `* Kappa v2 link: http://pac-apps.oecd.org/kappa/Search/Results.asp?QuickSearch=ID:${oecdCode}\n` +
              `* Kappa v3 link: http://kappa.oecd.org/v3/Expression/Details/${kv3id}\n`
            )
          }
        }
      })
    })

    // SUBMIT FORM
    $('#submit').on('click', (evt) => {
      // TODO: make this work ... not much validation going on right now 😞
      // $('#dossier-form').validate({
      //   rules: {
      //     pubtype: 'required'
      //   },
      //   submitHandler: (form) => {
      //     console.log('not doing much ...')
      //   }
      // })

      // prepare main ticket
      eid = $('#eid').val()
      dueDate = $('#due-date').val()
      const subject = `${oecdCode} - ${cfg['publication-types'][$('#pubtype').val()].name} - ${$('#pubtitle').val()}`
      const mainTicket = {
        'issue': {
          'project_id': cfg.project['project-id'],
          'due_date': dueDate,
          'tracker_id': cfg.project['tracker-id'], // typically "Task"
          'category_id': cfg['publication-types'][$('#pubtype').val()]['redmine-category-id'],
          'subject': subject,
          'description': $('#description').val(),
          'custom_fields': [
            {
              'value': $('#subcontractor').val(),
              'id': cfg.subcontractor['redmine-id']
            }
          ]
        }
      }

      console.log(`ABOUT TO SEND THIS TICKET: \n ${JSON.stringify(mainTicket)}`)

      // send main ticket
      $.ajax(`${process.env.REDMINE_API_URL}/issues.json`, {
        data: JSON.stringify(mainTicket),
        contentType: 'application/json',
        method: 'POST',
        headers: {
          'X-Redmine-API-Key': redmineApiKey
        }
      })

      // success for main ticket
        .done((data, status, xhr) => {
          parentId = data.issue.id
          // loop over all select subtickets and create them
          $('div#subtickets input[type=checkbox]:checked').each(function (index) {
            const ticketType = this.id
            const ticketConfig = cfg.subtasks[ticketType]
            const subTicket = {
              'issue': {
                'tracker_id': cfg.project['tracker-id'], // typically "Task"
                'due_date': dueDate,
                'category_id': ticketConfig['redmine-category-id'],
                'project_id': cfg.project['project-id'],
                'subject': `___ ${oecdCode} -  ${$('#pubtitle').val()}`,
                'watcher_user_ids': ticketConfig.watchers,
                'parent_issue_id': parentId
              }
            }
            console.log('SUBTICKET about to be submitted:')
            console.log(subTicket)

            $.ajax(`${process.env.REDMINE_API_URL}/issues.json`, {
              data: JSON.stringify(subTicket),
              contentType: 'application/json',
              method: 'POST',
              headers: {
                'X-Redmine-API-Key': redmineApiKey
              }
            })
            // success for one specific subticket
              .done((data, status, error) => {
                console.log(`*** created subticket: ${status}: ${JSON.stringify(data)}`)
              })
              // fail for a subticket
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
          })
          const u = `${process.env.REDMINE_API_URL}/issues/${parentId}`
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
          $('#t-threepages').prop('checked', true)
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

    $('#key-submit').on('click', (evt) => {
      console.log(`The key: ${$('#redmine-api-key').val()}`)
      redmineApiKey = $('#redmine-api-key').val()
      store.set(apiKeySettingName, redmineApiKey)
      $('#modalkey').modal('close')
      redmineApiKey = store.get(apiKeySettingName)
    })
  })
}

function initializeSubtickets () {
  const subtasks = cfg.subtasks
  // let i = 0
  for (let subTaskId in subtasks) {
    const subTask = subtasks[subTaskId]
    const tpl = `<div class="col s4">
                  <input type="checkbox" name="${subTaskId}" id="${subTaskId}" />
                  <label for="${subTaskId}">${subTask.name}</label>
                </div>`
    // if (i % 3 === 0) {
    //   currentRow = $('<div class="row"></div>').appendTo
    // }
    $('#subtickets div.row').append(tpl)
    // i++
  }
}
function unselectSubtickets () {
  $('#subtickets :checkbox').prop('checked', false)
}
function disableSubtickets () {
  $('#subtickets :checkbox').prop('disabled', true)
}
function enableSubtickets () {
  $('#subtickets :checkbox').prop('disabled', false)
}
function checkForRedmineApiKey () {
  if (store.has(apiKeySettingName)) {
    redmineApiKey = store.get(apiKeySettingName)
    console.log(`STORED KEY DATA: ${redmineApiKey}`)
  } else {
    $('#modalkey').modal('open', {
      dismissable: false
    })
    $('#redmine-api-key').focus()
    console.log(`Location of user data: ${app.getPath('userData')}.`)
  }
}
