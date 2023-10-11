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

        if (question.value == "") { return }

        result.innerHTML += `<div class="mb-2 text-bg-dark shadow p-3 fw-normal rounded-3">
                <div class="text-secondary opacity-75 small">Question</div>
                <div class="fw-normal">${question.value}</div>
            </div>`

        model.findAnswers(question.value, context.value).then(answers => {
            console.log('Question:', question.value, '\nAnswers: ', answers);
            question.value = ""
            if (answers.length > 0) {
                result.innerHTML += bot_msg(answers[0].text);
                // context.focus()
                // context.setSelectionRange(answers[0].startIndex, answers[0].endIndex + 1)
            } else {
                result.innerHTML += (context.value == "") ? bot_msg("Context not provided.") : bot_msg("Answer not found.")
            }
            scroll_to_latest_msg()
        });
    });
};

predict();

function bot_msg(msg) {
    return `<div class="mb-2 text-bg-primary shadow p-3 fw-normal rounded-3">
        <div class="text-dark opacity-75 small">Answer</div>
        <div class="fw-normal">${msg}</div>
    </div>`
}

function scroll_to_latest_msg() {
    result.scrollTop = result.scrollHeight
    window.scrollTo(0, document.scrollingElement.scrollHeight)
}