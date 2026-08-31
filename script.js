const buttons = document.querySelectorAll('.navBar a');

buttons.forEach(button => {
    button.addEventListener('click', e => {

        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    })
})