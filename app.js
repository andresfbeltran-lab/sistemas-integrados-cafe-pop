'use strict';
/* Sin dependencias, peticiones de red ni módulos: compatible con file:// y hosting estático. */
(() => {
 const $ = (selector) => document.querySelector(selector);
 const data = window.SITE_DATA;
 const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const state = {stage:0, phase:0, filter:'Todos', shown:6, reviewed:new Set()};
 const storageKey = 'cafepop-reviewed-v1';
 let storageAvailable = true;
 try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) state.reviewed = new Set(saved.filter(id => data.risks.some(r => r.id === id)));
 } catch { storageAvailable = false; }

 $('#norm-cards').innerHTML = data.norms.map((n,i) => `<article class="norm-card" style="--accent:${n.color}"><span class="norm-icon" aria-hidden="true">${n.icon}</span><p class="norm-code">${escape(n.code)}</p><h3>${escape(n.title)}</h3><p>${escape(n.description)}</p><a class="text-link norm-read" href="#teoria-${[9000,9001,45001,14001][i]}">Leer la explicación completa →</a><details><summary>Así funciona en Café Pop</summary><p>${escape(n.practice)}</p><p>${escape(n.extra)}</p><a class="source" href="#referencias">${escape(n.source)}</a></details></article>`).join('');
 $('#system-rows').innerHTML = data.system.map((s,i)=>`<div class="system-row"><span>0${i+1}</span><div><h3>${escape(s[0])}</h3><p>${escape(s[1])}</p></div><small>CAP.<br>${s[2]}</small></div>`).join('');

 // Pestañas accesibles: flechas, Inicio/Fin y selección automática.
 function keyboardTabs(container, select) {
  container.addEventListener('keydown', event => {
   const tabs = [...container.querySelectorAll('[role="tab"]')];
   const index = tabs.indexOf(document.activeElement);
   if(index < 0) return;
   let next;
   if(event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index+1)%tabs.length;
   if(event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index+tabs.length-1)%tabs.length;
   if(event.key === 'Home') next = 0;
   if(event.key === 'End') next = tabs.length-1;
   if(next !== undefined) { event.preventDefault(); select(next); tabs[next].focus(); }
  });
 }
 $('#phva-tabs').innerHTML = data.phva.map((p,i)=>`<button id="phase-${i}" type="button" role="tab" aria-controls="phva-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span>0${i+1}</span>${p.name} <span aria-hidden="true">↗</span></button>`).join('');
 function phase(index){
  state.phase=index;
  $('#phva-tabs').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',i===index);b.tabIndex=i===index?0:-1;});
  const p=data.phva[index];
  $('#phva-panel').setAttribute('aria-labelledby',`phase-${index}`);
  $('#phva-panel').innerHTML=`<div><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p><a class="source" href="#referencias">${escape(p.source)}</a></div><dl><dt>Responsables</dt><dd>${escape(p.owner)}</dd><dt>Meta / criterio de seguimiento</dt><dd>${escape(p.goal)}</dd><dt>Evidencia esperada</dt><dd>${escape(p.evidence)}</dd></dl>`;
 }
 $('#phva-tabs').querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>phase(i)));
 keyboardTabs($('#phva-tabs'),phase); phase(0);

 $('#timeline').innerHTML=data.stages.map((s,i)=>`<button id="stage-${i}" type="button" role="tab" aria-controls="case-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span>${escape(s.time)}</span><b>${escape(s.label)}</b></button>`).join('');
 const explored = new Set();
 const selectedDecisions = new Map();
 function stage(index){
  state.stage=index;
  $('#timeline').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',i===index);b.tabIndex=i===index?0:-1;});
  const s=data.stages[index]; const decision=window.CASE_OPTIONS[index];
  $('#case-panel').setAttribute('aria-labelledby',`stage-${index}`);
  $('#case-panel').innerHTML=`<div class="case-story"><span class="pill">${escape(s.tag)}</span><h3>${escape(s.title)}</h3><p>${escape(s.story)}</p><details class="cause-disclosure"><summary>Identificar la causa sistémica</summary><p>${escape(s.cause)}</p></details></div><div class="case-solution"><p class="eyebrow">EXPLORA UNA DECISIÓN</p><h3>${escape(decision.question)}</h3><p class="decision-hint">Selecciona una alternativa para analizarla. Puedes comparar ambas.</p><div class="decision-options" role="group" aria-label="Alternativas para analizar">${decision.options.map((o,i)=>`<button type="button" data-choice="${i}" aria-pressed="false"><span aria-hidden="true">${i===0?'A':'B'}</span>${escape(o.label)}</button>`).join('')}</div><div id="decision-feedback" class="decision-feedback" role="status" aria-live="polite" aria-atomic="true"></div><details class="integrated-answer"><summary>Consultar la propuesta integrada</summary><h4>${escape(s.solution)}</h4><ul>${s.actions.map(a=>`<li>${escape(a)}</li>`).join('')}</ul><a class="source" href="#referencias">${escape(s.ref)}</a></details></div>`;
  function selectDecision(choice){
   selectedDecisions.set(index,choice);explored.add(index);
   $('#case-panel').querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.choice)===choice));
   $('#decision-feedback').textContent=decision.options[choice].feedback;
   $('#case-explored').textContent=`${explored.size} de ${data.stages.length} momentos explorados`;
  }
  $('#case-panel').querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>selectDecision(Number(b.dataset.choice))));
  if(selectedDecisions.has(index))selectDecision(selectedDecisions.get(index));
  $('#case-prev').disabled=index===0; $('#case-next').disabled=index===data.stages.length-1;
  $('#case-counter').textContent=`Paso ${index+1} de ${data.stages.length} · ${s.time}`;
 }
 $('#timeline').querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>stage(i)));
 $('#case-prev').addEventListener('click',()=>stage(Math.max(0,state.stage-1)));
 $('#case-next').addEventListener('click',()=>stage(Math.min(data.stages.length-1,state.stage+1)));
 keyboardTabs($('#timeline'),stage); stage(0);

 function persist(){try{localStorage.setItem(storageKey,JSON.stringify([...state.reviewed]));}catch{storageAvailable=false;} updateProgress();}
 function updateProgress(){
  $('#plan-count').textContent=`${state.reviewed.size} de ${data.risks.length} controles revisados`;
  $('#plan-progress').max=data.risks.length; $('#plan-progress').value=state.reviewed.size;
  $('#save-status').textContent=storageAvailable?'El progreso se guarda únicamente en este navegador.':'El navegador no permite guardar progreso; las marcas se mantienen durante esta sesión. Puedes descargar tus notas.';
 }
 const filters=['Todos',...new Set(data.risks.map(r=>r.category))];
 $('#risk-filters').innerHTML=filters.map((f,i)=>`<button type="button" aria-pressed="${i===0}">${escape(f)}</button>`).join('');
 function renderRisks(){
  $('#risk-grid').innerHTML=data.risks.filter(r=>state.filter==='Todos'||r.category===state.filter).map(r=>`<article class="risk-card"><span class="risk-category">${escape(r.category)}</span><h3>${escape(r.process)}</h3><p>${escape(r.risk)}</p><p class="risk-control"><strong>Control propuesto.</strong> ${escape(r.control)}</p><span class="source">${escape(r.ref)}</span><label><input type="checkbox" data-risk="${r.id}" ${state.reviewed.has(r.id)?'checked':''}> Ya revisé este control</label></article>`).join('');
  $('#risk-grid').querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{input.checked?state.reviewed.add(input.dataset.risk):state.reviewed.delete(input.dataset.risk);persist();}));
 }
 $('#risk-filters').querySelectorAll('button').forEach((b,i)=>b.addEventListener('click',()=>{state.filter=filters[i];$('#risk-filters').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderRisks();}));
 $('#reset-plan').addEventListener('click',()=>{if(state.reviewed.size && !confirm('¿Reiniciar las marcas de controles revisados?'))return;state.reviewed.clear();persist();renderRisks();});
 $('#export-plan').addEventListener('click',()=>{
  const lines=['CAFÉ POP · MIS NOTAS DE ESTUDIO','Simulación académica; estas marcas indican revisión del contenido, no implementación ni certificación.',`Fecha: ${new Date().toLocaleDateString('es-CO')}`,'',...data.risks.map(r=>`${state.reviewed.has(r.id)?'[REVISADO]':'[PENDIENTE]'} ${r.category} / ${r.process}\nRiesgo: ${r.risk}\nControl: ${r.control}\nReferencia: ${r.ref}\n`),'Fuente: Trabajo final sistemas integrados de calidad con IA (2026), tabla 7.'];
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='Cafe_Pop_Notas_de_estudio.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });renderRisks();updateProgress();

 // El glosario se inserta con textContent: la búsqueda nunca se interpreta como HTML.
 const glossary=[...window.GLOSSARY].sort((a,b)=>a.term.localeCompare(b.term,'es'));
 [...new Set(window.GLOSSARY.map(g=>g.category))].forEach(c=>{const option=document.createElement('option');option.value=c;option.textContent=c;$('#glossary-category').append(option);});
 function renderGlossary(){
  const query=normalize($('#glossary-search').value); const category=$('#glossary-category').value;
  const matches=glossary.filter(g=>(!category||g.category===category)&&normalize(`${g.term} ${g.definition}`).includes(query));
  const visible=matches.slice(0,state.shown);$('#glossary-list').replaceChildren();
  visible.forEach(g=>{const card=document.createElement('article');card.className='glossary-card';const tag=document.createElement('span');tag.textContent=g.category;const title=document.createElement('h3');title.textContent=g.term;const description=document.createElement('p');description.textContent=g.definition;card.append(tag,title,description);$('#glossary-list').append(card);});
  if(!matches.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent='No encontramos ese concepto. Prueba otra palabra o selecciona todos los temas.';$('#glossary-list').append(empty);}
  $('#glossary-count').textContent=`${matches.length} resultados · Mostrando ${visible.length} de ${matches.length} · ${glossary.length} entradas en total`;
  $('#show-more').hidden=visible.length>=matches.length;
 }
 for(const id of ['#glossary-search','#glossary-category'])$(id).addEventListener(id.includes('search')?'input':'change',()=>{state.shown=6;renderGlossary();});
 $('#show-more').addEventListener('click',()=>{state.shown+=6;renderGlossary();});renderGlossary();

 data.references.forEach(([citation,url])=>{const li=document.createElement('li');li.append(document.createTextNode(citation));if(url){const a=document.createElement('a');a.href=url;a.textContent=' Consultar fuente ↗';if(url.startsWith('https:')){a.target='_blank';a.rel='noopener';}li.append(a);}$('#reference-list').append(li);});
 document.querySelectorAll('a[href="#actualizacion-2026"]').forEach(link=>link.addEventListener('click',()=>{$('#actualizacion-2026').open=true;}));
 const dialog=$('#infographic-dialog');let modalTrigger=null;
 ['#open-infographic','#image-preview'].forEach(id=>$(id).addEventListener('click',()=>{modalTrigger=$(id);if(typeof dialog.showModal==='function')dialog.showModal();else window.open('assets/infografia.png','_blank');}));
 $('#close-infographic').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>modalTrigger?.focus());

 const toggle=$('.menu-toggle');const nav=$('#nav');
 function closeNav(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}
 toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open);});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeNav();toggle.focus();}});
 document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeNav();});
 window.matchMedia('(min-width: 761px)').addEventListener('change',closeNav);
 let scrollPending=false;
 function updateScroll(){
  const range=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=`${range>0?Math.min(100,Math.max(0,scrollY/range*100)):0}%`;
  const links=[...nav.querySelectorAll('a')];let current=null;
  for(const link of links){const section=document.querySelector(link.getAttribute('href'));if(section&&section.getBoundingClientRect().top<=160)current=link;}
  const theoryLinks=[...document.querySelectorAll('.theory-index a')];let theoryCurrent=null;for(const link of theoryLinks){const target=document.querySelector(link.getAttribute('href'));if(target&&target.getBoundingClientRect().top<=175)theoryCurrent=link;}theoryLinks.forEach(link=>{if(link===theoryCurrent)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  links.forEach(link=>{if(link===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});scrollPending=false;
 }
 window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});window.addEventListener('resize',updateScroll);updateScroll();
})();

// Lectura compacta: enlaces profundos, expansión conjunta e impresión completa.
(() => {
 const chapters=[...document.querySelectorAll('.chapter-disclosure')];
 const button=document.getElementById('toggle-theory');
 const sync=()=>{const all=chapters.every(d=>d.open);button.setAttribute('aria-expanded',String(all));button.textContent=all?'Contraer las cuatro normas −':'Expandir las cuatro normas +';};
 button.addEventListener('click',()=>{const expand=!chapters.every(d=>d.open);chapters.forEach(d=>d.open=expand);sync();});
 chapters.forEach(d=>d.addEventListener('toggle',sync));
 function reveal(hash){if(!hash||hash==='#')return;const target=document.getElementById(decodeURIComponent(hash.slice(1)));if(!target)return;const own=target.querySelector('.chapter-disclosure');if(own)own.open=true;let ancestor=target.closest('details');while(ancestor){ancestor.open=true;ancestor=ancestor.parentElement.closest('details');}}
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>reveal(a.hash)));
 window.addEventListener('hashchange',()=>reveal(location.hash));reveal(location.hash);
 let printState=[];
 window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(d=>[d,d.open]);printState.forEach(([d])=>d.open=true);});
 window.addEventListener('afterprint',()=>{printState.forEach(([d,open])=>d.open=open);sync();});
 sync();
})();
