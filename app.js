const app = document.querySelector('#app');
const store = { get: (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch { return f; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
const key = 'suist20.positions';
const demo = [
  {id:'1', name:'Аудит состояния оборудования', due:'2026-09-15', owner:'А. Нуртаев', comment:'Плановая проверка', percent:100, photo:''},
  {id:'2', name:'Благоустройство территории', due:'2026-09-25', owner:'М. Абдрахманов', comment:'Закупить материалы', percent:60, photo:''},
  {id:'3', name:'Внедрение чек-листа контроля', due:'2026-09-10', owner:'С. Омаров', comment:'Согласовать форму', percent:35, photo:''},
  {id:'4', name:'Замена информационных табличек', due:'2026-10-03', owner:'Д. Сарсенов', comment:'Подготовлен макет', percent:75, photo:''},
  {id:'5', name:'Обновление инструкции', due:'2026-09-08', owner:'А. Нуртаев', comment:'На согласовании', percent:20, photo:''}
];
let positions = store.get(key, demo);
let pendingPhoto = '';
let activePhotoId = null;
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date = (d) => d ? new Intl.DateTimeFormat('ru-RU').format(new Date(d+'T00:00:00')) : '—';
const pct = () => positions.length ? Math.round(positions.reduce((n,p)=>n+Number(p.percent||0),0)/positions.length) : 0;
const state = p => p.percent >= 100 ? ['Выполнено','done'] : (p.due && p.due < new Date().toISOString().slice(0,10) ? ['Требует внимания','late'] : ['В работе','work']);
function sorted() { return [...positions].sort((a,b) => a.name.localeCompare(b.name,'ru')); }
function render() {
  const total=positions.length, done=positions.filter(p=>p.percent>=100).length, late=positions.filter(p=>state(p)[1]==='late').length, average=pct();
  const owners=[...new Set(positions.map(p=>p.owner).filter(Boolean))];
  const byOwner=owners.map(owner=>({owner, count:positions.filter(p=>p.owner===owner).length, avg:Math.round(positions.filter(p=>p.owner===owner).reduce((n,p)=>n+Number(p.percent),0)/positions.filter(p=>p.owner===owner).length)}));
  const max=Math.max(...byOwner.map(x=>x.count),1);
  app.innerHTML = `<header class="top"><div class="logo"><span>С</span>СУИСТ 2.0</div><small>Система учёта и визуального контроля позиций</small></header>
  <main class="wrap"><section class="headline"><div><h1>Общая сводка</h1><div class="muted">Актуальные показатели по всем позициям</div></div><div class="actions"><button class="secondary" id="import">↑ Загрузить Excel</button><button class="secondary" id="export">↓ Выгрузить Excel</button><button class="secondary" id="ppt">▣ PowerPoint</button><button class="primary" id="new">+ Добавить позицию</button></div></section>
  <section class="stats"><article class="stat"><span>Всего позиций</span><strong>${total}</strong><small>в системе</small></article><article class="stat"><span>Выполнено</span><strong>${done}</strong><small>${total?Math.round(done/total*100):0}% от общего числа</small></article><article class="stat"><span>В работе</span><strong>${total-done-late}</strong><small>активные позиции</small></article><article class="stat"><span>Среднее выполнение</span><strong>${average}%</strong><small>по всем позициям</small></article></section>
  <section class="grid"><article class="card"><h2>Нагрузка по исполнителям</h2><div class="muted">Количество позиций</div><div class="chart">${byOwner.length ? byOwner.map((x,i)=>`<div class="bar-wrap"><b>${x.count}</b><div class="bar ${i%2?'green':''}" style="height:${Math.max(8,x.count/max*125)}px"></div><small>${esc(x.owner)}</small></div>`).join('') : '<div class="empty">Нет данных</div>'}</div></article>
  <article class="card"><h2>Процент выполнения</h2><div class="muted">Общий результат</div><div class="donut-area"><div class="donut" style="--pct:${average}%"><b>${average}%</b></div><div class="legend"><span>Выполнено: ${done}</span><span>В работе: ${total-done-late}</span><span>Требует внимания: ${late}</span></div></div></article></section>
  <section class="card table-card"><div class="table-head"><div><h2>Позиции</h2><div class="muted">Сортировка по наименованию — от А до Я</div></div><div class="filters"><input id="search" placeholder="Поиск по таблице"><select id="ownerFilter"><option value="">Все исполнители</option>${owners.sort((a,b)=>a.localeCompare(b,'ru')).map(x=>`<option>${esc(x)}</option>`).join('')}</select></div></div><table class="table"><thead><tr><th>№</th><th>Наименование позиции</th><th>Срок выполнения</th><th>Исполнитель</th><th>Комментарий</th><th>Фото</th><th>Процент выполнения</th><th></th></tr></thead><tbody id="rows"></tbody></table><div class="footer-note" id="total-note"></div></section></main>`;
  drawRows(); bind();
}
function drawRows() {
  const term=(document.querySelector('#search')?.value||'').toLowerCase(), owner=document.querySelector('#ownerFilter')?.value||'';
  const list=sorted().filter(p => (!term || [p.name,p.owner,p.comment].join(' ').toLowerCase().includes(term)) && (!owner || p.owner===owner));
  document.querySelector('#rows').innerHTML=list.length ? list.map((p,i)=>{const s=state(p);return `<tr><td>${i+1}</td><td><b>${esc(p.name)}</b><br><span class="pill ${s[1]}">${s[0]}</span></td><td>${date(p.due)}</td><td>${esc(p.owner)}</td><td>${esc(p.comment)}</td><td>${p.photo?`<img class="thumb" data-photo="${p.id}" src="${p.photo}" alt="Фото">`:'<div class="no-photo">нет</div>'}</td><td><b>${p.percent}%</b><div class="progress"><i style="width:${p.percent}%"></i></div></td><td><button class="ghost" data-edit="${p.id}">Изменить</button><button class="ghost" data-delete="${p.id}">Удалить</button></td></tr>`}).join('') : '<tr><td colspan="8" class="empty">По вашему запросу позиции не найдены.</td></tr>';
  document.querySelector('#total-note').textContent=`Показано: ${list.length}. Общий итог: ${positions.length} позиций, средний процент выполнения — ${pct()}%.`;
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openForm(b.dataset.edit));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Удалить позицию?')){positions=positions.filter(p=>p.id!==b.dataset.delete);save();}});
  document.querySelectorAll('[data-photo]').forEach(i=>i.onclick=()=>showPhoto(i.getAttribute('src')));
}
function bind() {
  document.querySelector('#new').onclick=()=>openForm();
  document.querySelector('#import').onclick=()=>document.querySelector('#excel-file').click();
  document.querySelector('#export').onclick=exportExcel;
  document.querySelector('#ppt').onclick=makePpt;
  document.querySelector('#search').oninput=drawRows;
  document.querySelector('#ownerFilter').onchange=drawRows;
}
function openForm(id) {
  const p=positions.find(x=>x.id===id)||{name:'',due:'',owner:'',comment:'',percent:0,photo:''}; pendingPhoto=p.photo||''; activePhotoId=id||null;
  modal(`<h2>${id?'Редактировать':'Новая'} позиция</h2><form id="position-form" class="form"><label class="field full">Наименование позиции<input required name="name" value="${esc(p.name)}" placeholder="Введите наименование"></label><label class="field">Срок выполнения<input required type="date" name="due" value="${p.due}"></label><label class="field">Исполнитель<input required name="owner" value="${esc(p.owner)}" placeholder="ФИО или должность"></label><label class="field">Процент выполнения<input required type="number" min="0" max="100" name="percent" value="${p.percent}"></label><label class="field">Фото<button type="button" class="secondary" id="choose-photo">Загрузить фото</button><img class="photo-preview" id="photo-preview" ${p.photo?'src="'+p.photo+'"':'hidden'}></label><label class="field full">Комментарий<textarea name="comment" rows="3" placeholder="Комментарий">${esc(p.comment)}</textarea></label></form><div class="modal-actions"><button class="secondary" id="cancel">Отмена</button><button class="primary" id="save-position">Сохранить</button></div>`);
  document.querySelector('#cancel').onclick=closeModal;
  document.querySelector('#choose-photo').onclick=()=>document.querySelector('#photo-file').click();
  document.querySelector('#save-position').onclick=()=>{const f=new FormData(document.querySelector('#position-form'));const item={id:id||Date.now().toString(),name:f.get('name').trim(),due:f.get('due'),owner:f.get('owner').trim(),comment:f.get('comment').trim(),percent:Math.min(100,Math.max(0,Number(f.get('percent'))||0)),photo:pendingPhoto};if(!item.name||!item.owner||!item.due)return; if(id)positions=positions.map(x=>x.id===id?item:x);else positions.push(item);save();closeModal();};
}
function modal(html){document.body.insertAdjacentHTML('beforeend',`<div class="modal-bg"><section class="modal">${html}</section></div>`);}
function closeModal(){document.querySelector('.modal-bg')?.remove();}
document.querySelector('#photo-file').onchange=e=>{const file=e.target.files[0]; if(!file)return; if(file.size>3*1024*1024){alert('Размер фото не должен превышать 3 МБ.');return;}const r=new FileReader();r.onload=()=>{pendingPhoto=r.result;const img=document.querySelector('#photo-preview');if(img){img.src=pendingPhoto;img.hidden=false;}};r.readAsDataURL(file);e.target.value='';};
function showPhoto(src){modal(`<h2>Фотография позиции</h2><img src="${src}" style="max-width:100%;max-height:65vh;display:block;margin:auto;border-radius:8px"><div class="modal-actions"><button class="primary" id="close-photo">Закрыть</button></div>`);document.querySelector('#close-photo').onclick=closeModal;}
function save(){store.set(key,positions);render();}
function exportExcel(){
  if(!window.XLSX){alert('Библиотека Excel загружается. Повторите через несколько секунд.');return;}
  const data=sorted().map((p,i)=>({'№':i+1,'Наименование позиции':p.name,'Срок выполнения':date(p.due),'Исполнитель':p.owner,'Комментарий':p.comment,'Процент выполнения':p.percent}));
  const summary=[['СУИСТ 2.0 — общая сводка'],['Дата выгрузки',new Date().toLocaleString('ru-RU')],['Всего позиций',positions.length],['Выполнено',positions.filter(p=>p.percent>=100).length],['Среднее выполнение',pct()+'%']];
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(data),sum=XLSX.utils.aoa_to_sheet(summary);ws['!cols']=[{wch:6},{wch:36},{wch:18},{wch:25},{wch:42},{wch:22}];sum['!cols']=[{wch:28},{wch:24}];XLSX.utils.book_append_sheet(wb,sum,'Общая сводка');XLSX.utils.book_append_sheet(wb,ws,'Позиции');XLSX.writeFile(wb,'СУИСТ_2.0_отчёт.xlsx');
}
document.querySelector('#excel-file').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!window.XLSX){alert('Библиотека Excel ещё загружается.');return;}const r=new FileReader();r.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'}),sheet=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:''});const fields=['Наименование позиции','Срок выполнения','Исполнитель','Комментарий','Процент выполнения'];if(!rows.length||!fields.slice(0,3).every(f=>Object.hasOwn(rows[0],f))){alert('Нужны столбцы: Наименование позиции, Срок выполнения, Исполнитель.');return;}if(!confirm(`Импортировать ${rows.length} позиций? Текущие позиции будут дополнены.`))return;const imported=rows.map((r,i)=>({id:(Date.now()+i).toString(),name:String(r['Наименование позиции']).trim(),due:excelDate(r['Срок выполнения']),owner:String(r['Исполнитель']).trim(),comment:String(r['Комментарий']||'').trim(),percent:Math.min(100,Math.max(0,Number(r['Процент выполнения'])||0)),photo:''})).filter(p=>p.name&&p.owner&&p.due);positions.push(...imported);save();alert(`Добавлено позиций: ${imported.length}`);}catch{alert('Не удалось прочитать файл Excel.');}};r.readAsArrayBuffer(file);e.target.value='';};
function excelDate(v){if(v instanceof Date)return v.toISOString().slice(0,10);if(typeof v==='number'&&window.XLSX)return XLSX.SSF.format('yyyy-mm-dd',v);const d=new Date(v);return isNaN(d)?'':d.toISOString().slice(0,10);}
async function makePpt(){
  if(!window.PptxGenJS){alert('Библиотека PowerPoint загружается. Повторите через несколько секунд.');return;}
  const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='СУИСТ 2.0';pptx.subject='Отчёт для руководителей';pptx.title='СУИСТ 2.0';
  const add=(title,text,accent='#1677c8')=>{const s=pptx.addSlide();s.background={color:'F6F9FB'};s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.32,fill:{color:accent},line:{color:accent}});s.addText(title,{x:.7,y:.65,w:11.8,h:.5,fontSize:25,bold:true,color:'103753'});s.addText(text,{x:.75,y:1.5,w:11.7,h:4.9,fontSize:17,color:'334E60',breakLine:false,margin:.08,fit:'shrink'});s.addText('СУИСТ 2.0 · '+new Date().toLocaleDateString('ru-RU'),{x:.75,y:7.05,w:8,h:.25,fontSize:9,color:'758897'});return s;};
  const total=positions.length,done=positions.filter(p=>p.percent>=100).length,late=positions.filter(p=>state(p)[1]==='late').length,work=total-done-late,near=sorted().filter(p=>p.percent<100).slice(0,5);
  add('СУИСТ 2.0','Общая презентация для руководителей\n\nДата формирования: '+new Date().toLocaleString('ru-RU'),'103753');
  add('Цель и назначение','Единая система для учёта, контроля сроков и визуального сопровождения позиций.\n\n• актуальная общая сводка\n• контроль процента выполнения\n• фотографии и комментарии по позициям');
  add('Общее количество позиций',`Всего в системе: ${total}\n\nСредний процент выполнения: ${pct()}%`,'1677c8');
  add('Выполнение в цифровом виде',`Выполнено: ${done}\nВ работе: ${work}\nТребует внимания: ${late}`,'188451');
  add('Выполнение в процентах',`Выполнено: ${total?Math.round(done/total*100):0}%\nВ работе: ${total?Math.round(work/total*100):0}%\nТребует внимания: ${total?Math.round(late/total*100):0}%`,'F0A21B');
  add('Общий процент выполнения',`Текущий уровень выполнения составляет ${pct()}%.\n\nЦелевой показатель: 100%.`,'188451');
  add('Ближайшие сроки',near.length?near.map(p=>`• ${p.name} — ${date(p.due)}, ${p.percent}%`).join('\n'):'Нет активных позиций.');
  add('Позиции, требующие внимания',positions.filter(p=>state(p)[1]==='late').length?positions.filter(p=>state(p)[1]==='late').map(p=>`• ${p.name} — срок ${date(p.due)}, ${p.percent}%`).join('\n'):'Просроченных позиций нет.','C74444');
  add('Фотографии ключевых позиций',positions.filter(p=>p.photo).length?`Загружено фотографий: ${positions.filter(p=>p.photo).length}\n\nФотографии доступны в карточках соответствующих позиций.`:'Фотографии пока не загружены. Добавьте их через карточки позиций.');
  add('Выводы и рекомендации',`• Продолжить контроль ${work} активных позиций.\n• Уделить внимание ${late} позициям со сроками.\n• Обеспечить актуальность фото и комментариев.\n• Текущий общий результат: ${pct()}%.`,'103753');
  await pptx.writeFile({fileName:'СУИСТ_2.0_презентация_для_руководителей.pptx'});
}
render();
