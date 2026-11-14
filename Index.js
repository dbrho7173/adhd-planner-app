const input = document.getElementById('dump-input');
const list = document.getElementById('parking-list');
const counter = document.getElementById('counter');

function greet() {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    document.getElementById('greeting').textContent = `${part}, ${DB.getProfile().name}!`;
}

function render() {
    const items = DB.getItems();
    // Open items first, finished at the bottom
    items.sort((a, b) => a.done - b.done);
    counter.textContent = items.filter(i => !i.done).length;

    if (!items.length) {
        list.innerHTML = `<div class="empty"><i class="bx bx-cloud"></i>Your head is clear. Nice!</div>`;
        return;
    }

    list.innerHTML = items.map(i => {
        const lead = i.type === 'task'
            ? `<input type="checkbox" class="check" data-id="${i.id}" ${i.done ? 'checked' : ''} aria-label="complete task">`
            : `<div class="note-icon"><i class="bx bx-note"></i></div>`;
        return `
        <div class="list-item ${i.done ? 'done' : ''}" data-id="${i.id}">
            ${lead}
            <div class="grow">${escapeHtml(i.text)}</div>
            <button class="icon-btn" data-delete="${i.id}" aria-label="delete item"><i class="bx bx-trash"></i></button>
        </div>`;
    }).join('');
}

function add(type) {
    const text = input.value.trim();
    if (!text) { toast('Type something first!', 'bx-edit'); input.focus(); return; }
    DB.addItem(type, text);
    input.value = '';
    toast(type === 'task' ? 'Task parked' : 'Note parked', type === 'task' ? 'bx-check-circle' : 'bx-note');
    render();
}

document.getElementById('add-note').addEventListener('click', () => add('note'));
document.getElementById('add-task').addEventListener('click', () => add('task'));

// "+" turns the text into a full reminder
document.getElementById('add-event').addEventListener('click', () => {
    const text = input.value.trim();
    location.href = text ? `add.html?text=${encodeURIComponent(text)}` : 'add.html';
});

// Ctrl/Cmd+Enter = quick add as note
input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add('note');
});

list.addEventListener('change', e => {
    if (!e.target.classList.contains('check')) return;
    const item = DB.toggleItem(e.target.dataset.id);
    if (item && item.done) toast('Nice work! One less thing 🎉', 'bx-party');
    render();
});

list.addEventListener('click', e => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    DB.deleteItem(btn.dataset.delete);
    render();
});

greet();
render();