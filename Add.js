const form = document.getElementById('reminder-form');
const textEl = document.getElementById('reminder');
const countEl = document.querySelector('#char-count span');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const prioBtns = document.querySelectorAll('#priority button');
const nagLabel = document.getElementById('nag-label');

const params = new URLSearchParams(location.search);
const editId = params.get('id');
let priority = 'important';

function updateCount() {
    const n = textEl.value.length;
    countEl.textContent = `${n}/100`;
    countEl.classList.toggle('warn', n >= 90);
}

function setPriority(value) {
    priority = value;
    prioBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === value));
    // The "nag" option's frequency depends on how loud the reminder is
    nagLabel.textContent = value === 'cant-miss'
        ? 'Every 30 minutes until done'
        : 'Every 3 hours until done';
}

prioBtns.forEach(b => b.addEventListener('click', () => setPriority(b.dataset.value)));
textEl.addEventListener('input', updateCount);

/* Defaults / prefill */
const now = new Date();
dateEl.value = isoDate(now);
now.setHours(now.getHours() + 1, 0, 0, 0);
timeEl.value = `${String(now.getHours()).padStart(2, '0')}:00`;
setPriority('important');

if (params.get('text')) textEl.value = params.get('text').slice(0, 100);

if (editId) {
    const r = DB.getReminder(editId);
    if (r) {
        document.getElementById('page-title').textContent = 'Edit Reminder';
        document.getElementById('save-reminder').textContent = 'UPDATE REMINDER';
        textEl.value = r.text;
        dateEl.value = r.date;
        timeEl.value = r.time;
        setPriority(r.priority);
        const radio = form.querySelector(`input[name="remind"][value="${r.remind}"]`);
        if (radio) radio.checked = true;
    }
}
updateCount();

form.addEventListener('submit', e => {
    e.preventDefault();
    const text = textEl.value.trim();
    if (!text) { toast('What should we remind you about?', 'bx-edit'); textEl.focus(); return; }
    if (!dateEl.value || !timeEl.value) { toast('Pick a date and time', 'bx-calendar'); return; }

    DB.saveReminder({
        ...(editId ? { id: editId } : {}),
        text,
        date: dateEl.value,
        time: timeEl.value,
        priority,
        remind: form.remind.value,
        lastNotified: null
    });

    toast(editId ? 'Reminder updated!' : 'Reminder saved!', 'bx-bell');
    setTimeout(() => { location.href = 'reminders.html'; }, 700);
});
