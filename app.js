const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const USERS = {
  admin: { password: 'admin123', name: 'Администратор', role: 'admin' },
  employee: { password: 'employee123', name: 'Айдос Сеитов', role: 'employee' }
};
const categories = {
  biot: { title: 'БиОТ', subtitle: 'Безопасность и охрана труда', icon: '🛡️', color: 'Основы безопасности' },
  tech: { title: 'Техническая часть Казахтелеком', subtitle: 'Телекоммуникационная инфраструктура', icon: '◌', color: 'Технические знания' }
};

function makeQuestions(type) {
  const biot = [
    ['Что необходимо сделать перед началом работы с оборудованием?', 'Проверить исправность и рабочее место', 'Сразу начать работу', 'Отключить освещение'],
    ['Какой номер используется для вызова экстренных служб в Казахстане?', '112', '100', '777'],
    ['Что следует использовать при работах на высоте?', 'Средства индивидуальной защиты от падения', 'Обычную обувь', 'Только перчатки'],
    ['Первое действие при обнаружении пожара?', 'Сообщить по номеру 101 или 112', 'Продолжить работу', 'Открыть все окна'],
    ['Для чего нужен инструктаж по охране труда?', 'Для безопасного выполнения работ', 'Только для отчётности', 'Чтобы продлить смену'],
    ['При поражении электрическим током сначала нужно?', 'Прекратить воздействие тока безопасным способом', 'Дать пострадавшему воду', 'Оставить пострадавшего одного'],
    ['Когда применяются средства индивидуальной защиты?', 'Когда риск нельзя устранить другими мерами', 'Только по желанию работника', 'Только зимой'],
    ['Как нужно поднимать тяжёлый предмет?', 'С прямой спиной, сгибая ноги', 'Наклонившись с прямыми ногами', 'Рывком одной рукой'],
    ['Что запрещено на рабочем месте?', 'Работать с неисправным оборудованием', 'Сообщать о рисках', 'Использовать инструкции'],
    ['Кто отвечает за соблюдение правил безопасности?', 'Каждый работник и работодатель', 'Только охранник', 'Только новый сотрудник']
  ];
  const tech = [
    ['Для чего применяется оптоволоконный кабель?', 'Для передачи данных световым сигналом', 'Для подачи электропитания', 'Для охлаждения оборудования'],
    ['Что означает аббревиатура IP?', 'Internet Protocol', 'Internal Power', 'Input Port'],
    ['Основная функция маршрутизатора?', 'Передавать пакеты между сетями', 'Печатать документы', 'Измерять температуру'],
    ['Что измеряется в децибелах?', 'Уровень мощности или затухания сигнала', 'Длина кабеля', 'Количество абонентов'],
    ['Для чего используется коммутатор?', 'Соединять устройства в локальной сети', 'Прокладывать кабель', 'Заряжать аккумуляторы'],
    ['Что является преимуществом GPON?', 'Высокая скорость по оптической сети', 'Работа без кабелей', 'Не требует оборудования у абонента'],
    ['Какая среда передаёт сигнал в оптоволокне?', 'Световой импульс', 'Звуковая волна', 'Радиосигнал внутри кабеля'],
    ['Что такое VLAN?', 'Логически выделенная сеть', 'Марка кабеля', 'Источник питания'],
    ['Для чего нужен резервный канал связи?', 'Для сохранения доступности при отказе основного', 'Для увеличения расхода энергии', 'Для отключения маршрутизатора'],
    ['Что следует проверить при отсутствии связи у абонента?', 'Состояние линии и оборудования', 'Только погоду', 'Номер кабинета']
  ];
  const base = type === 'biot' ? biot : tech;
  return Array.from({ length: 60 }, (_, i) => {
    const item = base[i % base.length];
    const answers = [item[1], item[2], item[3]].sort(() => Math.random() - .5);
    return { id: `${type}-${i + 1}`, text: `${item[0]} ${i >= base.length ? `(${i + 1})` : ''}`, answers, correct: item[1] };
  });
}
const BANK = { biot: makeQuestions('biot'), tech: makeQuestions('tech') };
let currentUser = store.get('qadam.user', null);
let activeTest = null;
let currentView = 'dashboard';
let passScore = store.get('qadam.passScore', 70);

function layout(content) {
  const adminTab = currentUser.role === 'admin' ? `<button class="tab ${currentView === 'admin' ? 'active' : ''}" data-view="admin">Администрирование</button>` : '';
  app.innerHTML = `<div class="shell"><header class="topbar"><div class="brand"><i>Q</i>Qadam</div><div class="user"><span class="name">${currentUser.name}</span><span class="avatar">${currentUser.name[0]}</span><button class="secondary" id="logout">Выйти</button></div></header><main class="main"><div class="header"><div><h1>${currentView === 'admin' ? 'Управление системой' : 'Моё обучение'}</h1><div class="sub">${currentView === 'admin' ? 'Настройка тестов и просмотр результатов' : 'Выберите направление для проверки знаний'}</div></div><div class="tabs"><button class="tab ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">Тесты</button><button class="tab ${currentView === 'history' ? 'active' : ''}" data-view="history">Мои результаты</button>${adminTab}</div></div>${content}</main></div>`;
  $('#logout').onclick = () => { currentUser = null; store.set('qadam.user', null); renderLogin(); };
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { currentView = b.dataset.view; render(); });
}

function attempts() { return store.get('qadam.attempts', []); }
function userAttempts(category) { return attempts().filter(a => a.user === currentUser.name && (!category || a.category === category)); }
function dashboard() {
  const cards = Object.entries(categories).map(([id, c]) => {
    const count = userAttempts(id).length;
    return `<article class="card"><div class="course-icon">${c.icon}</div><span class="tag">${c.color}</span><h2>${c.title}</h2><p class="muted">${c.subtitle}. В тесте 50 случайных вопросов.</p><footer><small class="muted">Попыток: ${count}</small><button class="primary" data-start="${id}">Начать тест</button></footer></article>`;
  }).join('');
  layout(`<section class="cards">${cards}</section>`);
  document.querySelectorAll('[data-start]').forEach(b => b.onclick = () => startTest(b.dataset.start));
}
function history() {
  const data = userAttempts();
  const body = data.length ? data.map(a => `<tr><td>${new Date(a.date).toLocaleString('ru-RU')}</td><td>${categories[a.category].title}</td><td>${a.correct}/50 (${a.percent}%)</td><td><span class="status ${a.passed ? 'ok' : 'no'}">${a.passed ? 'Сдан' : a.closed ? 'Не завершён' : 'Не сдан'}</span></td></tr>`).join('') : '<tr><td colspan="4" class="empty">У вас пока нет результатов.</td></tr>';
  layout(`<section class="card table-card"><table class="table"><thead><tr><th>Дата</th><th>Тест</th><th>Результат</th><th>Статус</th></tr></thead><tbody>${body}</tbody></table></section>`);
}
function admin() {
  const all = attempts(); const passed = all.filter(a => a.passed).length;
  const rows = all.slice().reverse().slice(0, 8).map(a => `<tr><td>${a.user}</td><td>${categories[a.category].title}</td><td>${a.percent}%</td><td><span class="status ${a.passed ? 'ok' : 'no'}">${a.passed ? 'Сдан' : 'Не сдан'}</span></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Результатов пока нет.</td></tr>';
  layout(`<section class="admin-grid"><article class="card"><h2>Настройки тестирования</h2><p class="muted">Проходной балл применяется ко всем направлениям.</p><label class="field">Проходной процент<input id="pass-score" type="number" min="1" max="100" value="${passScore}"></label><button class="primary wide" id="save-score">Сохранить</button></article><article class="card"><h2>База вопросов</h2><div class="row"><span>БиОТ</span><strong>${BANK.biot.length} вопросов</strong></div><div class="row"><span>Техническая часть</span><strong>${BANK.tech.length} вопросов</strong></div><p class="muted">В MVP вопросы демонстрационные. Подключите серверную БД для редактора вопросов.</p></article></section><section class="card table-card" style="margin-top:20px"><h2>Последние результаты</h2><table class="table"><thead><tr><th>Сотрудник</th><th>Тест</th><th>Балл</th><th>Статус</th></tr></thead><tbody>${rows}</tbody></table></section>`);
  $('#save-score').onclick = () => { passScore = Math.min(100, Math.max(1, Number($('#pass-score').value) || 70)); store.set('qadam.passScore', passScore); render(); };
}
function render() { if (!currentUser) return renderLogin(); if (currentView === 'history') return history(); if (currentView === 'admin') return admin(); dashboard(); }
function renderLogin() {
  app.innerHTML = `<section class="auth"><form class="auth-card" id="login-form"><div class="brand"><i>Q</i>Qadam</div><h1>Вход в систему</h1><p class="sub">Обучение и тестирование сотрудников Казахтелеком</p><label class="field">Логин<input required name="login" autocomplete="username" placeholder="Введите логин"></label><label class="field">Пароль<input required type="password" name="password" autocomplete="current-password" placeholder="Введите пароль"></label><div id="login-error" class="error"></div><button class="primary wide">Войти</button><div class="hint">Демо-доступ: <b>employee / employee123</b><br>Администратор: <b>admin / admin123</b></div></form></section>`;
  $('#login-form').onsubmit = (event) => { event.preventDefault(); const data = new FormData(event.target); const user = USERS[data.get('login')]; if (!user || user.password !== data.get('password')) { $('#login-error').textContent = 'Неверный логин или пароль.'; return; } currentUser = { name:user.name, role:user.role }; store.set('qadam.user', currentUser); currentView = 'dashboard'; render(); };
}
function startTest(category) {
  const attemptNo = userAttempts(category).length + 1;
  activeTest = { category, attemptNo, questions: [...BANK[category]].sort(() => Math.random() - .5).slice(0, 50), answers: {}, index: 0 };
  renderTest();
}
function renderTest() {
  const t = activeTest, q = t.questions[t.index], answered = t.answers[q.id];
  const tryNotice = t.attemptNo > 1 ? `<div class="hint">Вы проходите тест ${t.attemptNo === 2 ? 'второй раз' : `${t.attemptNo}-й раз`}.</div>` : '';
  app.innerHTML = `<div class="test-page"><header class="test-top"><div><b>${categories[t.category].title}</b><div class="muted">Вопрос ${t.index + 1} из 50</div></div><button class="danger" id="close-test">Закрыть тест</button></header><main class="test-wrap">${tryNotice}<div class="progress-line"><span style="width:${((t.index + 1) / 50) * 100}%"></span></div><section class="question"><span class="tag">Вопрос ${t.index + 1}</span><h2>${q.text}</h2>${q.answers.map((a, i) => `<label class="option"><input type="radio" name="answer" value="${a}" ${answered === a ? 'checked' : ''}><span>${String.fromCharCode(65+i)}. ${a}</span></label>`).join('')}</section><div class="test-nav"><button class="secondary" id="prev" ${t.index === 0 ? 'disabled' : ''}>Назад</button>${t.index === 49 ? '<button class="primary" id="finish">Завершить тест</button>' : '<button class="primary" id="next">Далее</button>'}</div></main></div>`;
  document.querySelectorAll('input[name="answer"]').forEach(input => input.onchange = () => { t.answers[q.id] = input.value; });
  $('#prev').onclick = () => { t.index--; renderTest(); }; const next = $('#next'); if (next) next.onclick = () => { t.index++; renderTest(); }; const finish = $('#finish'); if (finish) finish.onclick = finishTest; $('#close-test').onclick = closeModal;
}
function record(closed = false) { const t = activeTest; const correct = t.questions.reduce((n, q) => n + (t.answers[q.id] === q.correct ? 1 : 0), 0); const percent = Math.round(correct / 50 * 100); const item = { user:currentUser.name, category:t.category, date:new Date().toISOString(), correct, percent, passed:!closed && percent >= passScore, closed }; const list = attempts(); list.push(item); store.set('qadam.attempts', list); return item; }
function finishTest() { const result = record(); activeTest = null; app.innerHTML = `<section class="auth"><article class="auth-card result"><div class="result-icon">${result.passed ? '🎉' : '📝'}</div><h1>${result.passed ? 'Отлично! Тест успешно сдан' : 'Тест не сдан'}</h1><p class="sub">${result.passed ? 'Ваш результат сохранён в личном кабинете.' : 'Повторите попытку: новый тест будет содержать другие вопросы.'}</p><div class="score">${result.correct} из 50 · ${result.percent}%</div><button class="primary wide" id="back-home">Вернуться к тестам</button></article></section>`; $('#back-home').onclick = () => { currentView='dashboard'; render(); }; }
function closeModal() { app.insertAdjacentHTML('beforeend', `<div class="modal-backdrop"><section class="modal"><h2>Закрыть тест?</h2><p class="muted">Действительно хотите закрыть тест? Несохранённые ответы могут быть потеряны.</p><div class="modal-actions"><button class="secondary" id="stay">Нет, продолжить тест</button><button class="danger" id="confirm-close">Да, закрыть</button></div></section></div>`); $('#stay').onclick = () => $('.modal-backdrop').remove(); $('#confirm-close').onclick = () => { record(true); activeTest=null; currentView='dashboard'; render(); }; }
window.addEventListener('beforeunload', e => { if (activeTest) { e.preventDefault(); e.returnValue = ''; } });
render();
