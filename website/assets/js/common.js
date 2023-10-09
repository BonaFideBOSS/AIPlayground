// Bootstrap Tooltips
function enable_tooltips() {
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );
}
enable_tooltips();


// Bootstrap Toasts
const toastElList = document.querySelectorAll(".toast");
const toastList = [...toastElList].map(
  (toastEl) => new bootstrap.Toast(toastEl)
);


// Notification Toast
function notify(message, delay = 5000) {
  toast_container = document.getElementById("notification-toast");
  const wrapper = document.createElement("div");
  wrapper.classList.add("toast", "text-bg-warning", "shadow-lg", "border-0");
  wrapper.setAttribute("data-bs-delay", delay);
  wrapper.innerHTML =
    '<div class="toast-header border-0">' +
    '<img src="/assets/img/favico.ico" width="20" class="me-2">' +
    '<strong class="me-auto">IMDbStats</strong>' +
    "<small>Just Now</small>" +
    '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>' +
    "</div>" +
    '<div class="toast-body fs-6">' +
    message +
    "</div>";
  toast_container.append(wrapper);
  const toast = new bootstrap.Toast(wrapper);
  toast.show();
}