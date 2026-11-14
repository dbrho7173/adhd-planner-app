const tabsEl = document.getElementById('tabs');
const listEl = document.getElementById('reminder-list');

const FILTERS = {
    today:    { label: 'Today',    test: r => !r.done && r.date === isoDate() },
    upcoming: { label: 'Upcoming', test: r => !r.done && r.date > isoDate() },
    overdue:  { label: 'Overdue',  test: r => isOverdue(r) },
    done:     { label: 'Done',     test: r => r.done }
};

let current = sessionStorage.getItem('remTab') || 'today';

function render() {
    const all = DB.getReminders();

    tabsEl.innerHTML = Object.entries(FILTERS).map(([key, f]) => {
        const n = all.filter(f.test).length;
        return `<button class="tab ${key === current ? 'active' : ''}" data-tab="${key}">${f.label}<span class="n">${n}</span></button>`;
    }).join('');

    let rows = all.filter(FILTERS[current].test);
    if (current === 'done') rows.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (!rows.length) {
        const msgs = {
            today: 'Nothing due today. Enjoy it!',
            upcoming: 'Nothing coming up yet.',
            overdue: 'Nothing overdue. You\'re on track!',
            done: 'Nothing finished yet — you got this.'
        };
        listEl.innerHTML = `<div class="empty"><i class="bx bx-sun"></i>${msgs[current]}</div>`;
        return;
    }

    listEl.innerHTML = rows.map(r => `
        <div class="list-item ${r.done ? 'done' : ''}">
            <input type="checkbox" class="check" data-id="${r.id}" ${r.done ? 'checked' : ''} aria-label="complete reminder">
            <div class="grow">
                ${escapeHtml(r.text)}
                <div class="rem-meta">
                    ${formatDateTime(r.date, r.time)}
                    <span class="chip ${r.priority}">${PRIORITY_LABELS[r.priority]}</span>
                    ${isOverdue(r) ? '<span class="chip overdue">Overdue</span>' : ''}
                </div>
            </div>
            <a class="icon-btn edit" href="add.html?id=${r.id}" aria-label="edit"><i class="bx bx-edit"></i></a>
            <button class="icon-btn" data-delete="${r.id}" aria-label="delete"><i class="bx bx-trash"></i></button>
        </div>`).join('');
}

tabsEl.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]');
    if (!t) return;
    current = t.dataset.tab;
    sessionStorage.setItem('remTab', current);
    render();
});

listEl.addEventListener('change', e => {
    if (!e.target.classList.contains('check')) return;
    const r = DB.toggleReminder(e.target.dataset.id);
    if (r && r.done) toast('Done! Great job 🎉', 'bx-party');
    render();
});

listEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    DB.deleteReminder(btn.dataset.delete);
    toast('Reminder deleted', 'bx-trash');
    render();
});

document.addEventListener('reminder-fired', render);
render();