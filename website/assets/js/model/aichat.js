$('#send-message').on('submit', function (e) {
  e.preventDefault()

  if ($('#message').val() == "") {
    return
  }

  send_message(this)
  add_user_message($('#message').val())
  wait_for_bot_message()
  $('#message').val("")
  scroll_to_bottom()
})

async function send_message(message) {
  const data = $(message).serialize()
  const url = `/aichat/new`
  if (message.checkValidity()) {
    $.post(url, data)
      .done(function (response) {
        add_bot_message(response)
      }).fail(function () {
        add_bot_message("Failed to perform action.");
      }).always(function () {
        scroll_to_bottom()
      })
  }
}

function add_user_message(message) {
  message = `
    <div class="d-flex gap-1 mb-2 align-items-start justify-content-end">
      <div class="text-bg-dark shadow p-3 fw-normal rounded-3 text-wrap overflow-hidden">${message}</div>
      <div class="text-bg-dark px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-person"></i></div>
    </div>`
  $('#chat').append(message)
}

function wait_for_bot_message() {
  const message = `
    <div class="waiting d-flex gap-1 mb-2 align-items-start">
      <div class="text-bg-primary px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-robot"></i></div>
      <div class="text-bg-primary fw-normal shadow p-3 px-5 rounded-3 text-wrap overflow-hidden"><div class="loader mx-5"></div></div>
    </div>`
  $('#chat').append(message)
}

function add_bot_message(message) {
  $('#chat .waiting').remove()
  const converter = new showdown.Converter();
  message = converter.makeHtml(message);
  message = `
    <div class="d-flex gap-1 mb-2 align-items-start">
      <div class="text-bg-primary px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-robot"></i></div>
      <div class="ai-response text-bg-primary fw-normal shadow p-3 rounded-3 text-wrap overflow-hidden">${message}</div>
    </div>`
  $('#chat').append(message)
  scroll_to_bottom()
}

function scroll_to_bottom() {
  window.scrollTo(0, document.scrollingElement.scrollHeight)
}