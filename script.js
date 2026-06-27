// ============================================================
//  FITNESS TRACKER – Complete App Logic
// ============================================================

// ---------- STATE ----------
let workouts = [];
let currentFilter = 'all'; // 'all', 'today', 'week', 'month'

// ---------- DOM REFS ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const totalWorkoutsEl = $('#totalWorkouts');
const totalCaloriesEl = $('#totalCalories');
const totalMinutesEl = $('#totalMinutes');
const activeDaysEl = $('#activeDays');

const calProgressFill = $('#calProgressFill');
const calProgressText = $('#calProgressText');
const wkProgressFill = $('#wkProgressFill');
const wkProgressText = $('#wkProgressText');
const minProgressFill = $('#minProgressFill');
const minProgressText = $('#minProgressText');

const logContainer = $('#logContainer');
const logCount = $('#logCount');

const workoutForm = $('#workoutForm');
const exerciseType = $('#exerciseType');
const duration = $('#duration');
const calories = $('#calories');
const workoutDate = $('#workoutDate');
const notes = $('#notes');

const filterBtns = $$('.filter-btn');
const clearAllBtn = $('#clearAllBtn');

// ---------- LOCAL STORAGE ----------
function loadWorkouts() {
    try {
        const data = localStorage.getItem('fitnessWorkouts');
        if (data) {
            workouts = JSON.parse(data);
            if (!Array.isArray(workouts)) workouts = [];
        } else {
            workouts = getSampleWorkouts();
        }
    } catch {
        workouts = getSampleWorkouts();
    }
    saveWorkouts();
}

function saveWorkouts() {
    try {
        localStorage.setItem('fitnessWorkouts', JSON.stringify(workouts));
    } catch {
        // ignore
    }
    renderAll();
}

function getSampleWorkouts() {
    const today = getToday();
    const yesterday = getDateOffset(-1);
    const twoDaysAgo = getDateOffset(-2);
    const threeDaysAgo = getDateOffset(-3);
    const fourDaysAgo = getDateOffset(-4);

    return [
        { id: Date.now() + 1, exercise: 'Running', duration: 30, calories: 280, date: today, notes: 'Morning run' },
        { id: Date.now() + 2, exercise: 'Cycling', duration: 45, calories: 350, date: yesterday, notes: 'Evening ride' },
        { id: Date.now() + 3, exercise: 'Yoga', duration: 20, calories: 120, date: twoDaysAgo, notes: 'Stretching' },
        { id: Date.now() + 4, exercise: 'Weightlifting', duration: 40, calories: 300, date: threeDaysAgo, notes: 'Upper body' },
        { id: Date.now() + 5, exercise: 'Walking', duration: 25, calories: 150, date: fourDaysAgo, notes: '' },
    ];
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getDateOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 10000);
}

// ---------- HELPERS ----------
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const end = new Date(today);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function getMonthRange() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function getFilteredWorkouts() {
    const today = getToday();
    const week = getWeekRange();
    const month = getMonthRange();

    switch (currentFilter) {
        case 'today':
            return workouts.filter(w => w.date === today);
        case 'week':
            return workouts.filter(w => w.date >= week.start && w.date <= week.end);
        case 'month':
            return workouts.filter(w => w.date >= month.start && w.date <= month.end);
        default:
            return workouts;
    }
}

// ---------- RENDER ----------
function renderDashboard() {
    const total = workouts.length;
    const totalCal = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const totalMin = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    const uniqueDays = new Set(workouts.map(w => w.date));
    const activeDays = uniqueDays.size;

    totalWorkoutsEl.textContent = total;
    totalCaloriesEl.textContent = totalCal;
    totalMinutesEl.textContent = totalMin;
    activeDaysEl.textContent = activeDays;

    // Progress
    const weekWorkouts = workouts.filter(w => {
        const week = getWeekRange();
        return w.date >= week.start && w.date <= week.end;
    });
    const weekCal = weekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0);
    const weekMin = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const weekCount = weekWorkouts.length;

    const calPercent = Math.min((weekCal / 2000) * 100, 100);
    const wkPercent = Math.min((weekCount / 5) * 100, 100);
    const minPercent = Math.min((weekMin / 150) * 100, 100);

    calProgressFill.style.width = calPercent + '%';
    calProgressText.textContent = Math.round(calPercent) + '%';
    wkProgressFill.style.width = wkPercent + '%';
    wkProgressText.textContent = Math.round(wkPercent) + '%';
    minProgressFill.style.width = minPercent + '%';
    minProgressText.textContent = Math.round(minPercent) + '%';
}

function renderLogs() {
    const filtered = getFilteredWorkouts();

    if (filtered.length === 0) {
        logContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>No workouts found${currentFilter !== 'all' ? ' for this period' : ''}.</p>
                <p class="hint">Start logging your fitness activities above!</p>
            </div>
        `;
        logCount.textContent = '0 entries';
        return;
    }

    const sorted = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));

    let html = '';
    sorted.forEach(w => {
        const exerciseEmoji = getExerciseEmoji(w.exercise);
        html += `
            <div class="log-item">
                <div class="log-info">
                    <span class="exercise">${exerciseEmoji} ${escapeHtml(w.exercise)}</span>
                    <span class="detail"><strong>⏱️</strong> ${w.duration} min</span>
                    <span class="detail"><strong>🔥</strong> ${w.calories} cal</span>
                    <span class="detail">📅 ${formatDate(w.date)}</span>
                    ${w.notes ? `<span class="badge">📝 ${escapeHtml(w.notes)}</span>` : ''}
                </div>
                <div class="log-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteWorkout(${w.id})">🗑️</button>
                </div>
            </div>
        `;
    });

    logContainer.innerHTML = html;
    logCount.textContent = `${filtered.length} entries`;
}

function getExerciseEmoji(exercise) {
    const map = {
        'Running': '🏃',
        'Cycling': '🚴',
        'Swimming': '🏊',
        'Walking': '🚶',
        'Yoga': '🧘',
        'Weightlifting': '🏋️',
        'Dancing': '💃',
        'Hiking': '🥾',
        'Boxing': '🥊',
    };
    return map[exercise] || '📌';
}

function renderAll() {
    renderDashboard();
    renderLogs();
}

// ---------- CRUD ----------
function addWorkout(e) {
    e.preventDefault();

    const exercise = exerciseType.value;
    const dur = parseInt(duration.value);
    const cal = parseInt(calories.value);
    const date = workoutDate.value;
    const note = notes.value.trim();

    if (!exercise || !dur || !cal || !date) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (dur < 1 || cal < 1) {
        showToast('Duration and calories must be positive numbers.', 'error');
        return;
    }

    workouts.push({
        id: generateId(),
        exercise,
        duration: dur,
        calories: cal,
        date,
        notes: note || '',
    });

    saveWorkouts();
    workoutForm.reset();
    workoutDate.value = getToday();
    showToast('✅ Workout logged successfully!', 'success');
}

function deleteWorkout(id) {
    if (!confirm('Delete this workout entry?')) return;
    workouts = workouts.filter(w => w.id !== id);
    saveWorkouts();
    showToast('🗑️ Workout deleted.', 'success');
}

function clearAllWorkouts() {
    if (workouts.length === 0) {
        showToast('No workouts to clear.', 'error');
        return;
    }
    if (!confirm('⚠️ Delete ALL workout entries? This cannot be undone!')) return;
    workouts = [];
    saveWorkouts();
    showToast('🗑️ All workouts cleared.', 'success');
}

window.deleteWorkout = deleteWorkout;

// ---------- FILTER ----------
function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderLogs();
}

// ---------- TOAST ----------
function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast ' + type;
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// ---------- INIT ----------
function init() {
    workoutDate.value = getToday();
    loadWorkouts();

    // Initialise progress bars to 0 (they start at 0% via CSS)
    // No inline style needed – CSS sets width:0% by default

    workoutForm.addEventListener('submit', addWorkout);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });

    clearAllBtn.addEventListener('click', clearAllWorkouts);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setFilter('all');
            filterBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === 'all');
            });
        }
    });

    renderAll();
}

document.addEventListener('DOMContentLoaded', init);