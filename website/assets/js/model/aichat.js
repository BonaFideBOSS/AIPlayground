$(document).ready(function () {
  load_chat_history();
});

function save_message(sender, message) {
  var chat_history = get_chat_history();
  const new_message = { sender: sender, message: message };
  chat_history.push(new_message);
  chat_history = JSON.stringify(chat_history);
  localStorage.setItem("chat_history", chat_history);
}

function get_chat_history() {
  var messages = localStorage.getItem("chat_history");
  messages = messages ? JSON.parse(messages) : [];
  return messages;
}

function load_chat_history() {
  const messages = get_chat_history();
  var chat = "";

  messages.forEach((message) => {
    if (message.sender == "user") {
      chat += render_user_message(message.message);
    } else {
      chat += render_bot_message(message.message);
    }
  });

  $("#chat").prepend(chat);
  $(".chat-history-loader").remove();
  scroll_to_bottom();
}

$("#send-message").on("submit", function (e) {
  e.preventDefault();

  const message = $("#message").val();
  if (message == "") {
    return;
  }
  $(this).find("input,button").attr("disabled", true);

  var messages = get_chat_history();
  messages = messages.map((i) => i.message);
  messages.push(message);

  save_message("user", message);
  send_message(messages);

  add_user_message(message);
  wait_for_bot_message();
  $("#message").val("");
  scroll_to_bottom();
});

async function send_message(messages) {
  const data = { "messages[]": messages };
  const url = `/aichat/message`;
  $.post(url, data)
    .done(function (response) {
      add_bot_message(response);
    })
    .fail(function () {
      add_bot_message("Failed to perform action.");
    })
    .always(function () {
      scroll_to_bottom();
    });
}

function add_user_message(message) {
  message = render_user_message(message);
  $("#chat").append(message);
}

function wait_for_bot_message() {
  const message = `
    <div class="waiting d-flex gap-1 mb-2 align-items-start">
      <div class="text-bg-primary px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-robot"></i></div>
      <div class="text-bg-primary fw-normal shadow p-3 px-5 rounded-3 text-wrap overflow-hidden"><div class="loader mx-5"></div></div>
    </div>`;
  $("#chat").append(message);
}

function add_bot_message(message) {
  save_message("ai", message);
  $("#chat .waiting").remove();
  message = render_bot_message(message);
  $("#chat").append(message);
  $("#send-message").find("input,button").attr("disabled", false);
  scroll_to_bottom();
  $("#message").focus();
}

function render_user_message(message) {
  return `
  <div class="d-flex gap-1 mb-2 align-items-start justify-content-end">
    <div class="text-bg-dark shadow p-3 fw-normal rounded-3 text-wrap overflow-hidden">${message}</div>
    <div class="text-bg-dark px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-person"></i></div>
  </div>`;
}

function render_bot_message(message) {
  const converter = new showdown.Converter();
  message = converter.makeHtml(message);
  message = `
    <div class="d-flex gap-1 mb-2 align-items-start">
      <div class="text-bg-primary px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-robot"></i></div>
      <div class="ai-response text-bg-primary fw-normal shadow p-3 rounded-3 text-wrap overflow-hidden">${message}</div>
    </div>`;
  return message;
}

function scroll_to_bottom() {
  window.scrollTo(0, document.scrollingElement.scrollHeight);
}
