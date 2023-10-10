const predict = async () => {
    const modal = new bootstrap.Modal(document.querySelector(".status-modal"), { backdrop: 'static' });
    modal.show()

    var model = await qna.load();
    console.log(model)

    document.querySelector('.status-modal .modal-body').innerHTML = '<p class="fs-5 my-0">Model loaded successfully!</p>'
    modal.hide()

    document.getElementById('search').addEventListener('submit', (e) => {
        e.preventDefault();

        const context = document.getElementById('context')
        const question = document.getElementById('question')
        const result = document.getElementById('result')

        result.innerHTML += `<div class="d-flex gap-1 mb-2 align-items-start justify-content-end">
                <div class="text-bg-dark shadow p-3 fw-normal rounded-3 text-wrap">${question.value}</div>
                <div class="text-bg-dark px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-person"></i></div>
            </div>`

        model.findAnswers(question.value, context.value).then(answers => {
            console.log('Question:', question.value, '\nAnswers: ', answers);
            question.value = ""
            if (answers.length > 0) {
                result.innerHTML += bot_msg(answers[0].text);
                // context.focus()
                // context.setSelectionRange(answers[0].startIndex, answers[0].endIndex + 1)
            } else {
                result.innerHTML += bot_msg("Answer not found.")
            }
            result.scrollTop = result.scrollHeight
        });
    });
};

predict();

function bot_msg(msg) {
    return `<div class="d-flex gap-1 mb-2 align-items-start">
        <div class="text-bg-primary px-3 py-2 shadow rounded-3 fs-5"><i class="bi bi-robot"></i></div>
        <div class="text-bg-primary fw-normal shadow p-3 rounded-3 text-wrap">${msg}</div>
    </div>`
}