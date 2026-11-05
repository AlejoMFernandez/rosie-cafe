// ROSIE CAFÉ · demo
// Intro del sello, "Ahora en Rosie" (el reloj), la carta del mes (una sección por vez),
// "Armá tu torta" con seña, tienda para llevar, talleres y eventos (reservas del kit) y el mazo de fotos.
import { initKit } from '../kit/kit.js?v=1';
import { opcionesRetiro } from '../kit/core/encargos.js?v=1';

const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const desk = () => matchMedia('(min-width: 1024px)').matches;
const plata = (n) => '$' + Math.round(n).toLocaleString('es-AR');
const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const DIAS_N = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ---------- hora real de Rosie (Buenos Aires) ---------- */
function ahoraBA() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dow, min: Number(p.hour) * 60 + Number(p.minute) };
}
const abreHoy = (dow) => dow >= 3 || dow === 0; // miércoles a domingo

/* =========================================================
   INTRO · el sello
   ========================================================= */
function cargada(img) {
  if (!img || img.complete) return Promise.resolve();
  return new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
}
async function intro() {
  const el = $('.intro');
  if (!html.classList.contains('con-intro') || !el) { html.classList.add('listo'); el?.remove(); return; }
  const cel = innerWidth < 900;
  const recursos = Promise.race([Promise.all([document.fonts?.ready, cargada($('.hero__foto img'))]), esperar(2400)]);
  await esperar(120);
  el.classList.add('baja');
  await esperar(500);
  el.classList.add('pum');
  await Promise.all([esperar(cel ? 520 : 760), recursos]);
  el.classList.add('abre');
  html.classList.add('listo');
  await esperar(820);
  el.remove();
}
intro();

/* ---------- entradas al hacer scroll ---------- */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => {
  ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }) : null;
$$('.rv').forEach((el) => (io ? io.observe(el) : el.classList.add('visto')));

/* ---------- la píldora del panel no tapa los botones del hero en el celu ---------- */
const heroCtas = $('.hero__ctas');
if (io && heroCtas) new IntersectionObserver(([e]) => html.classList.toggle('en-hero', e.isIntersecting), { threshold: 0 }).observe(heroCtas);
const juegoEl = $('[data-juego]');
if (io && juegoEl) new IntersectionObserver(([e]) => html.classList.toggle('tapa-pill', e.isIntersecting), { threshold: 0 }).observe(juegoEl);

/* ---------- barra ---------- */
const barra = $('[data-barra]');
let rafBarra = 0;
addEventListener('scroll', () => {
  if (rafBarra) return;
  rafBarra = requestAnimationFrame(() => { barra.classList.toggle('solida', scrollY > 24); rafBarra = 0; });
}, { passive: true });
barra.classList.toggle('solida', scrollY > 24);
// link activo en desktop
const linksNav = $$('.barra__nav a');
if (io) {
  const ioNav = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    linksNav.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['ahora', 'carta', 'tortas', 'cosas', 'visitanos'].forEach((id) => { const s = document.getElementById(id); if (s) ioNav.observe(s); });
}

/* ---------- menú del celu ---------- */
const menu = $('#menu');
const btnMenu = $('[data-menu-abrir]');
let scrollMenu = 0;
function abrirMenu() {
  scrollMenu = scrollY;
  menu.hidden = false; menu.classList.add('abierto');
  btnMenu.setAttribute('aria-expanded', 'true');
  html.classList.add('menu-abierto');
  document.body.style.cssText = `position:fixed;top:-${scrollMenu}px;left:0;right:0`;
  $('[data-menu-cerrar]').focus();
}
function cerrarMenu(destino) {
  menu.hidden = true; menu.classList.remove('abierto');
  btnMenu.setAttribute('aria-expanded', 'false');
  html.classList.remove('menu-abierto');
  document.body.style.cssText = '';
  html.style.scrollBehavior = 'auto';
  scrollTo(0, scrollMenu);
  html.style.scrollBehavior = '';
  if (destino) document.querySelector(destino)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
btnMenu.addEventListener('click', abrirMenu);
$('[data-menu-cerrar]').addEventListener('click', () => cerrarMenu());
$$('.menu__nav a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); cerrarMenu(a.getAttribute('href')); }));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });

/* =========================================================
   KIT
   ========================================================= */
const TAGS = { vegetariano: 'V', vegano: 'VG', singluten: 'SG' };
const tagsHTML = (p) => (p.etiquetas || []).filter((t) => TAGS[t]).map((t) => `<span class="it__tag" title="${t === 'singluten' ? 'Sin gluten (no apto celíacos)' : t}">${TAGS[t]}</span>`).join('');
const thumb = (src) => src ? src.replace('-700.webp', '-240.webp') : '';

function tarjeta(p, ctx) {
  const vars = (p.variantes || []).filter((v) => v && v.precio != null);
  const ops = (p.opciones || [])[0];
  const pedible = ctx.carrito && ctx.pedible(p);
  const conElegir = vars.length > 1 || ops;
  const precio = vars.length ? ctx.money(vars[0].precio) : (ctx.money(p.precio) ?? 'A confirmar');
  const desc = p.descripcion || '';
  const chipsVar = vars.length > 1 ? `<div class="tc__ops" role="radiogroup" aria-label="Tamaño" data-var-grupo>${vars.map((v, k) => `<button type="button" role="radio" aria-checked="${k === 0}" data-var="${esc(v.id)}" data-precio="${v.precio}">${esc(v.nombre)}</button>`).join('')}</div>` : '';
  const chipsOps = ops ? `<div class="tc__ops" role="radiogroup" aria-label="${esc(ops.nombre)}" data-op-grupo="${esc(ops.id)}">${ops.valores.map((v, k) => `<button type="button" role="radio" aria-checked="${k === 0}" data-op-val="${esc(v.id)}">${esc(v.nombre)}</button>`).join('')}</div>` : '';
  const accion = !pedible ? '<span class="tc__precio is-na">Hoy no hay</span>'
    : conElegir ? `<button type="button" class="tc__add" data-tc-add="${esc(p.id)}">A la bolsita</button>`
    : `<div class="tc__qty" data-kit-qty="${esc(p.id)}"></div>`;
  return `<figure class="tc__foto">${p.foto
      ? `<img src="${esc(ctx.asset(p.foto))}" alt="" width="700" height="525" loading="lazy" decoding="async" draggable="false">`
      : '<div class="tc__ph"><img src="img/tita-claro.svg" alt="" width="132" height="152"></div>'}</figure>
    <div class="tc__body">
      <h3 class="tc__nom">${esc(p.nombre)}</h3>
      ${tagsHTML(p) ? `<span class="tc__tags">${tagsHTML(p)}</span>` : ''}
      ${desc ? `<p class="tc__desc">${esc(desc)}</p>` : ''}
      ${chipsVar}${chipsOps}
    </div>
    <div class="tc__pie"><span class="tc__precio${p.precio == null && !vars.length ? ' is-na' : ''}" data-tc-precio>${esc(precio)}</span>${accion}</div>
    ${conElegir && pedible ? `<p class="tc__en" data-tc-n="${esc(p.id)}" aria-live="polite"></p>` : ''}`;
}

const kit = await initKit({
  config: 'cliente.json',
  imagenes: { lqip: 'img/lqip.json' },
  cartas: {
    'carta-kit': {
      itemClass: 'it',
      pedir: false,
      template: (p, ctx) => `<h3 class="it__nom">${esc(p.nombre)}${tagsHTML(p) ? `<span class="it__tags">${tagsHTML(p)}</span>` : ''}${p.foto ? '<span class="it__dot" aria-hidden="true"></span>' : ''}</h3>
        <span class="it__precio">${ctx.money(p.precio) ?? 'Consultar'}</span>
        ${p.descripcion ? `<p class="it__desc">${esc(p.descripcion)}</p>` : ''}
        ${p.disponible === false ? '<p class="it__desc"><b>Hoy no hay</b></p>' : ''}
        ${p.foto ? `<button type="button" class="it__ver" data-ver-foto aria-expanded="false"><img src="${esc(thumb(ctx.asset(p.foto)))}" alt="" width="26" height="26" loading="lazy">Ver foto</button>` : ''}`,
    },
    'tortas-kit': { itemClass: 'tc', template: tarjeta, filtro: (p) => p.id !== 't-cumple' },
    'llevar-kit': { itemClass: 'tc', template: tarjeta },
  },
  carrito: { label: 'Tu bolsita', fab: false },
  badge: true,
});

/* ---------- contador de la bolsita ---------- */
const nBolsa = $('[data-bolsa-n]');
const btnBolsa = $('.bolsa-btn');
function contar(bump) {
  const n = (kit.carrito?.lineas || []).reduce((s, l) => s + l.cant, 0);
  nBolsa.textContent = n; nBolsa.hidden = n === 0;
  if (bump) { btnBolsa.classList.remove('bump'); void btnBolsa.offsetWidth; btnBolsa.classList.add('bump'); }
  $$('[data-tc-n]').forEach((el) => {
    const k = (kit.carrito?.lineas || []).filter((l) => l.id === el.dataset.tcN).reduce((s, l) => s + l.cant, 0);
    el.textContent = k ? `${k} en la bolsita` : '';
  });
}
document.addEventListener('kit:carrito', (e) => contar(e.detail?.delta > 0));
kit.carrito?.listo?.then(() => contar());

// la píldora del panel se esconde con un popup abierto
new MutationObserver(() => html.classList.toggle('pop-abierto', !!document.querySelector('.kit-pop, .kit-sheet, .kit-drawer, [class*="kit-pop"][open]'))).observe(document.body, { childList: true });

/* ---------- tienda: tamaños, opciones y "A la bolsita" ---------- */
document.addEventListener('click', (e) => {
  const v = e.target.closest('[data-var]');
  if (v) {
    $$('[data-var]', v.parentElement).forEach((b) => b.setAttribute('aria-checked', String(b === v)));
    const it = v.closest('.kit-item');
    $('[data-tc-precio]', it).textContent = plata(Number(v.dataset.precio));
    return;
  }
  const op = e.target.closest('[data-op-val]');
  if (op) { $$('[data-op-val]', op.parentElement).forEach((b) => b.setAttribute('aria-checked', String(b === op))); return; }
  const add = e.target.closest('[data-tc-add]');
  if (add) {
    const it = add.closest('.kit-item');
    const opc = {};
    $$('[data-op-grupo]', it).forEach((g) => { const x = $('[aria-checked="true"]', g); if (x) opc[g.dataset.opGrupo] = x.dataset.opVal; });
    const vx = $('[data-var][aria-checked="true"]', it);
    kit.carrito.agregar(add.dataset.tcAdd, 1, { opc, ...(vx ? { variante: vx.dataset.var } : {}), origen: add });
  }
});

/* ---------- filas deslizables: arrastre con el mouse ---------- */
function arrastrable(el) {
  if (!el || el.dataset.drag) return;
  el.dataset.drag = '1';
  let x0 = 0, s0 = 0, activo = false, movio = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (getComputedStyle(el).overflowX === 'visible') return;
    activo = true; movio = false; x0 = e.clientX; s0 = el.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 6) { movio = true; el.classList.add('arrastrando'); }
    if (movio) { el.scrollLeft = s0 - dx; e.preventDefault(); }
  });
  addEventListener('pointerup', () => {
    if (!activo) return; activo = false;
    if (movio) {
      requestAnimationFrame(() => el.classList.remove('arrastrando'));
      const bloquear = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      el.addEventListener('click', bloquear, { capture: true, once: true });
      setTimeout(() => el.removeEventListener('click', bloquear, { capture: true }), 50);
    }
  });
  el.addEventListener('dragstart', (e) => e.preventDefault());
}
arrastrable($('[data-momentos]'));
arrastrable($('[data-afiches]'));
document.addEventListener('kit:carta', (e) => {
  if (e.detail.el.classList.contains('tienda-kit')) $$('.kit-carta__panel', e.detail.el).forEach(arrastrable);
  contar();
});

/* =========================================================
   LA CARTA DEL MES: una sección por vez
   ========================================================= */
const COMER = new Set(['desayunos', 'almuerzos', 'todahora', 'pasteleria', 'promos']);
const DOS_COLUMNAS = new Set(['calientes', 'frias', 'vinos', 'promos']);
const fotoImg = $('[data-foto-img]');
const fotoNom = $('[data-foto-nom]');
function armarCarta(el, categorias = []) {
  const tabs = $$('.kit-tab', el);
  const lista = $('.kit-tabs', el);
  if (lista && !$('.grupo-lbl', lista)) {
    const prim = tabs.find((t) => COMER.has(t.dataset.cat));
    const primT = tabs.find((t) => !COMER.has(t.dataset.cat));
    const temp = document.createElement('span'); temp.className = 'grupo-lbl grupo-temporada'; temp.setAttribute('aria-hidden', 'true'); temp.textContent = 'Primavera 2026';
    lista.prepend(temp);
    if (prim) { const s = document.createElement('span'); s.className = 'grupo-lbl'; s.setAttribute('aria-hidden', 'true'); s.textContent = 'COMER'; prim.before(s); }
    if (primT) { const s = document.createElement('span'); s.className = 'grupo-lbl'; s.setAttribute('aria-hidden', 'true'); s.textContent = 'TOMAR'; primT.before(s); }
  }
  $$('.kit-carta__panel', el).forEach((panel, i) => {
    const cat = panel.id.split('-p-').pop();
    const info = categorias.find((c) => c.id === cat) || {};
    const items = $$('.kit-item', panel);
    const cab = document.createElement('div');
    cab.className = 'carta-cab';
    cab.innerHTML = `<h3 class="carta-cab__t">${esc(tabs[i]?.textContent.trim() || info.nombre || '')}</h3><span class="carta-cab__n">${items.length} opciones</span>${info.bajada ? `<p class="carta-cab__sub">${esc(info.bajada)}</p>` : ''}`;
    const cont = document.createElement('div');
    cont.className = 'carta-items' + (DOS_COLUMNAS.has(cat) ? ' carta-items--dos' : '');
    items.forEach((it) => cont.appendChild(it));
    const prev = tabs[i - 1], next = tabs[i + 1];
    const nav = document.createElement('div');
    nav.className = 'carta-nav';
    nav.innerHTML = `<button type="button" data-prev ${prev ? '' : 'disabled'}>← ${prev ? esc(prev.textContent.trim()) : 'Anterior'}</button><button type="button" data-next ${next ? '' : 'disabled'}>${next ? esc(next.textContent.trim()) : 'Siguiente'} →</button>`;
    nav.querySelector('[data-prev]').addEventListener('click', () => irA(prev));
    nav.querySelector('[data-next]').addEventListener('click', () => irA(next));
    panel.replaceChildren(cab, cont, nav);
  });
  centrarTab(el);
}
function centrarTab(el) {
  const on = $('.kit-tab.is-on', el); const lista = $('.kit-tabs', el);
  if (!on || !lista || desk()) return;
  lista.scrollTo({ left: on.offsetLeft - (lista.clientWidth - on.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
}
function irA(tab) {
  if (!tab) return;
  tab.click();
  const el = $('#carta-kit');
  const top = el.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * 0.5) scrollTo({ top: scrollY + top - (desk() ? 110 : 76), behavior: reduce ? 'auto' : 'smooth' });
}
const kitCarta = $('#carta-kit');
document.addEventListener('kit:carta', (e) => { if (e.detail.el.id === 'carta-kit') armarCarta(e.detail.el, e.detail.categorias); });
if (kitCarta && $('.kit-carta__panel', kitCarta) && !$('.carta-cab', kitCarta)) armarCarta(kitCarta, await kit.store.getCategorias());
kitCarta.addEventListener('click', (e) => {
  if (e.target.closest('.kit-tab')) { centrarTab(kitCarta); return; }
  const ver = e.target.closest('[data-ver-foto]');
  if (!ver) return;
  const it = ver.closest('.kit-item');
  const abierto = $('.it__fotobig', it);
  if (abierto) { abierto.remove(); ver.setAttribute('aria-expanded', 'false'); ver.lastChild.textContent = 'Ver foto'; return; }
  const fig = document.createElement('figure'); fig.className = 'it__fotobig';
  fig.innerHTML = `<img src="${esc(it.dataset.photo)}" alt="" width="700" height="525" loading="lazy" decoding="async">`;
  ver.after(fig); ver.setAttribute('aria-expanded', 'true'); ver.lastChild.textContent = 'Ocultar foto';
});
// desktop: la foto del plato en el óvalo fijo
let rafFoto = 0, ultimo = null;
kitCarta.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const it = e.target.closest('.kit-item');
  if (!it || it === ultimo) return;
  cancelAnimationFrame(rafFoto);
  rafFoto = requestAnimationFrame(() => {
    ultimo?.classList.remove('hover'); ultimo = it; it.classList.add('hover');
    const src = it.dataset.photo;
    if (!src || fotoImg.dataset.src === src) return;
    fotoImg.dataset.src = src;
    fotoImg.classList.add('cambia');
    const nom = $('.it__nom', it)?.firstChild?.textContent.trim() || '';
    setTimeout(() => { fotoImg.src = src; fotoNom.textContent = nom; cargada(fotoImg).then(() => fotoImg.classList.remove('cambia')); }, 170);
  });
});
kitCarta.addEventListener('pointerleave', () => { ultimo?.classList.remove('hover'); ultimo = null; });

/* =========================================================
   AHORA EN ROSIE · el reloj (?momento=desayuno|almuerzo|merienda|cerrado)
   ========================================================= */
function momentoActual() {
  const q = new URLSearchParams(location.search).get('momento');
  if (['desayuno', 'almuerzo', 'merienda', 'cerrado'].includes(q)) return q;
  const { dow, min } = ahoraBA();
  if (!abreHoy(dow) || min < 600 || min >= 1200) return 'cerrado';
  if (min < 750) return 'desayuno';
  if (min < 960) return 'almuerzo';
  return 'merienda';
}
const TITULOS = {
  desayuno: ['Ahora: desayunos', 'Hasta las 12:30 hs salen los huevos revueltos con medialuna y el plato completo, con café y jugo.'],
  almuerzo: ['Ahora: almuerzos', 'De 12:30 a 16:00 hs. Pasá por un mbejú, la Caesar o el sándwich 3.0.'],
  merienda: ['Ahora: merienda y vinito', 'Hasta las 20:00 hs: medialunas, vasca, galletas y algo rico para tomar.'],
  cerrado: ['Ahora: Tita descansa', 'Volvemos pronto. Mientras, mirá la carta o dejá encargada tu torta.'],
};
function pintarAhora() {
  const m = momentoActual();
  $$('[data-momento]').forEach((el) => el.classList.toggle('es-ahora', el.dataset.momento === m));
  $('[data-ahora-titulo]').textContent = TITULOS[m][0];
  $('[data-ahora-sub]').textContent = TITULOS[m][1];
  const { dow, min } = ahoraBA();
  const ejec = $('[data-ejecutivo]');
  if (ejec && dow >= 3 && dow <= 5) ejec.textContent = 'Hoy hay menú ejecutivo: principal + bebida + postre o café, $27.000. Y el sándwich 3.0, la Caesar o el mbejú.';
  const abierto = abreHoy(dow) && min >= 600 && min < 1200;
  const dd = $('[data-estado]');
  if (dd) dd.innerHTML = abierto ? `<span class="estado">Abierto · cierra a las 20:00 hs</span>` : `<span class="estado estado--off">Cerrado · abrimos ${proximaApertura(dow, min)}</span>`;
  const ct = $('[data-cerrado-txt]');
  if (ct && !abierto) ct.textContent = `Abrimos ${proximaApertura(dow, min)}. Mientras, dejá encargada tu torta o lo que te quieras llevar.`;
  const chip = $('[data-estado-chip]');
  if (chip) chip.textContent = abierto ? 'Abierto · hasta las 20:00 hs' : 'Mié a dom · 10:00 a 20:00 hs';
  if (!desk()) {
    const fila = $('[data-momentos]'); const on = $('.momento.es-ahora', fila);
    if (fila && on && !fila.dataset.movida) { fila.scrollLeft = on.getBoundingClientRect().left - fila.getBoundingClientRect().left + fila.scrollLeft - parseFloat(getComputedStyle(fila).paddingLeft); fila.dataset.movida = '1'; }
  }
}
function proximaApertura(dow, min) {
  if (abreHoy(dow) && min < 600) return 'hoy a las 10:00 hs';
  for (let k = 1; k <= 7; k++) { const d = (dow + k) % 7; if (abreHoy(d)) return `${k === 1 ? 'mañana' : 'el ' + DIAS_N[d].toLowerCase()} a las 10:00 hs`; }
  return 'pronto';
}
pintarAhora();
setInterval(pintarAhora, 60 * 1000);
$$('[data-ir-cat]').forEach((b) => b.addEventListener('click', () => {
  const tab = $(`#carta-kit .kit-tab[data-cat="${b.dataset.irCat}"]`);
  if (tab) tab.click();
  $('#carta').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* =========================================================
   ARMÁ TU TORTA · un juego de 5 pasos, uno por vez
   ========================================================= */
const ID_TORTA = 't-cumple';
const BORDO = '#5A0F1C';
const FICHAS = {
  bizcocho: { t: 'Elegí el bizcocho', pista: 'Tocá un bizcocho o arrastralo a la torta', v: {
    cacao: { n: 'Cacao', s: 'Nube de avellanas', c: '#6B3A2A' },
    vainilla: { n: 'Vainilla', s: 'Nube de avellanas', c: '#E2BD7E' },
    coco: { n: 'Coco', s: 'Chiffón', c: '#F2E4C4' } } },
  crema: { t: '¿Con qué crema?', pista: 'Ahora la crema que la cubre', v: {
    queso: { n: 'Crema de queso', c: '#FFF8F2' },
    chantilly: { n: 'Chantilly', s: 'De vainilla', c: '#FFEFCF' } } },
  relleno: { t: 'El relleno', pista: 'Lo que va entre los pisos', v: {
    ddl: { n: 'Dulce de leche', c: '#C98A3E' },
    frambuesa: { n: 'Frambuesa', c: '#B8324A' },
    ambos: { n: 'Los dos', c: 'split' } } },
  extras: { t: 'Sumale extras', pista: 'Tocá los que quieras (o ninguno)', v: {
    cremoso: { n: 'Cremoso de choco', c: '#3A1E16' },
    frutas: { n: 'Frutillas', c: '#C0283E' },
    ganache: { n: 'Piso de ganache', c: '#7A4A2E' } } },
  dia: { t: '¿Cuándo la retirás?', pista: 'Mínimo 48 hs · lunes y martes cerrado' },
};
const ORDEN = ['bizcocho', 'crema', 'relleno', 'extras', 'dia'];
const torta = { opc: {}, extras: new Set(), fecha: null, franja: null, paso: 0, vistos: new Set([0]) };
let prodTorta = null;
let diasTorta = [];
const svg = $('[data-torta-svg]');
const escena = $('[data-escena]');
const fichasEl = $('[data-fichas]');
const pasosEl = $('[data-pasos]');

/* ---------- la torta (SVG con trazo de sticker, como sus ilustraciones) ---------- */
const CX = 160, RX = 108, RY = 24, BASE = 262;
function banda(y1, y2, fill, extra = '') {
  const x0 = CX - RX, x1 = CX + RX;
  return `<path d="M${x0},${y1} L${x0},${y2} A${RX},${RY} 0 0 0 ${x1},${y2} L${x1},${y1} A${RX},${RY} 0 0 1 ${x0},${y1} Z" fill="${fill}" stroke="${BORDO}" stroke-width="3" stroke-linejoin="round" ${extra}/>`;
}
function puntoBorde(t, k = 1, dy = 0, top) { return [CX + RX * k * Math.cos(t), top + RY * k * Math.sin(t) + dy]; }
function merengue(x, y, c, s = 1) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})"><path d="M-13,7 C-15,-4 -6,-9 -2,-17 C1,-12 3,-10 6,-9 C12,-6 15,0 13,7 Z" fill="${c}" stroke="${BORDO}" stroke-width="2.6" stroke-linejoin="round"/><path d="M-7,3 C-6,-3 -2,-6 0,-11" fill="none" stroke="${BORDO}" stroke-width="1.8" stroke-linecap="round" opacity=".55"/></g>`;
}
function frutilla(x, y, r = 0) {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})"><path d="M0,13 C-9,6 -11,-1 -9,-5 C-7,-9 -2,-9 0,-7 C2,-9 7,-9 9,-5 C11,-1 9,6 0,13 Z" fill="#D8344B" stroke="${BORDO}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="-3" cy="0" r="1" fill="#FFE7A8"/><circle cx="3" cy="2" r="1" fill="#FFE7A8"/><circle cx="0" cy="6" r="1" fill="#FFE7A8"/><path d="M-6,-7 L-2,-11 L0,-7 L2,-11 L6,-7" fill="#5C8049" stroke="${BORDO}" stroke-width="2" stroke-linejoin="round"/></g>`;
}
function arandano(x, y) { return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="#3E4B8A" stroke="${BORDO}" stroke-width="2.2"/><circle cx="${(x - 1.6).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.3" fill="#fff" opacity=".6"/>`; }
function florcita(x, y) { return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-5" rx="3.4" ry="5" fill="#F5C1A2" stroke="${BORDO}" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#E2BD7E" stroke="${BORDO}" stroke-width="1.6"/></g>`; }

function dibujarTorta(anim = null) {
  const bz = FICHAS.bizcocho.v[torta.opc.bizcocho]?.c || '#6B3A2A';
  const cr = FICHAS.crema.v[torta.opc.crema]?.c || '#FFF8F2';
  const rl = torta.opc.relleno;
  const cremoso = torta.extras.has('cremoso'), ganache = torta.extras.has('ganache'), frutas = torta.extras.has('frutas');
  const capas = [{ id: 'bz1', h: 50, c: bz, pat: true }, { id: 'rl1', h: 12, c: rl === 'ambos' ? 'url(#rl-ambos)' : (FICHAS.relleno.v[rl]?.c || '#C98A3E') }];
  if (cremoso) capas.push({ id: 'cremoso', h: 9, c: '#3A1E16' });
  capas.push({ id: 'bz2', h: ganache ? 36 : 46, c: bz, pat: true });
  if (ganache) { capas.push({ id: 'ganache', h: 14, c: '#7A4A2E' }); capas.push({ id: 'bz3', h: 30, c: bz, pat: true }); }
  capas.push({ id: 'cobertura', h: 16, c: cr });
  let y = BASE, out = '';
  const grupos = [];
  capas.forEach((k, i) => {
    const y2 = y, y1 = y - k.h; y = y1;
    grupos.push(`<g class="t-capa" data-capa="${k.id}" style="--k:${i}">${banda(y1, y2, k.c)}${k.pat ? banda(y1, y2, 'url(#puntos)', 'stroke="none"') : ''}</g>`);
  });
  const top = y;
  // tapa (elipse) + picos alrededor + frutas en el centro, de atrás para adelante
  const N = 11, picos = [];
  for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2 + 0.15; const [px, py] = puntoBorde(t, 0.9, -2, top); picos.push({ t, px, py }); }
  const atras = picos.filter((p) => Math.sin(p.t) < 0).sort((a, b) => a.py - b.py);
  const adelante = picos.filter((p) => Math.sin(p.t) >= 0).sort((a, b) => a.py - b.py);
  let deco = '';
  if (frutas) {
    const pos = [[-38, -4, -12], [0, -9, 4], [38, -3, 14], [-18, 6, 8], [20, 7, -8]];
    deco += pos.map(([dx, dy, r], i) => `<g class="t-fruta" style="--k:${i}">${frutilla(CX + dx, top + dy - 6, r)}</g>`).join('');
    deco += [[-56, 2], [56, 3], [-2, 12], [-28, -12], [30, -13]].map(([dx, dy], i) => `<g class="t-fruta" style="--k:${i + 5}">${arandano(CX + dx, top + dy - 2)}</g>`).join('');
  } else {
    deco += [[-26, -2], [0, 4], [26, -2]].map(([dx, dy], i) => `<g class="t-fruta" style="--k:${i}">${florcita(CX + dx, top + dy - 2)}</g>`).join('');
  }
  out += `<defs>
      <pattern id="puntos" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="rgba(255,246,241,.22)"/></pattern>
      <linearGradient id="rl-ambos" x1="0" x2="1"><stop offset="0" stop-color="#C98A3E"/><stop offset=".5" stop-color="#C98A3E"/><stop offset=".5" stop-color="#B8324A"/><stop offset="1" stop-color="#B8324A"/></linearGradient>
    </defs>
    <ellipse cx="${CX}" cy="${BASE + 8}" rx="142" ry="26" fill="#FFF6F1" stroke="${BORDO}" stroke-width="3"/>
    <ellipse cx="${CX}" cy="${BASE + 4}" rx="118" ry="18" fill="rgba(90,15,28,.12)"/>
    <g class="t-cuerpo">${grupos.join('')}</g>
    <g class="t-tapa" data-tapa>
      <ellipse cx="${CX}" cy="${top}" rx="${RX}" ry="${RY}" fill="${cr}" stroke="${BORDO}" stroke-width="3"/>
      ${atras.map((p) => merengue(p.px, p.py, cr, 0.95)).join('')}
      <g class="t-deco">${deco}</g>
      ${adelante.map((p) => merengue(p.px, p.py, cr, 1.08)).join('')}
    </g>`;
  svg.innerHTML = out;
  if (reduce || !anim) return;
  const animar = (sel) => $$(sel, svg).forEach((g) => g.classList.add('cae'));
  if (anim === 'bizcocho') { animar('.t-capa'); $('[data-tapa]', svg).classList.add('cae', 'tarde'); }
  else if (anim === 'relleno') $$('[data-capa^="rl"]', svg).forEach((g) => g.classList.add('brilla'));
  else if (anim === 'crema') animar('[data-tapa]');
  else if (anim === 'frutas') animar('.t-fruta');
  else if (anim === 'cremoso' || anim === 'ganache') { $$(`[data-capa="${anim}"]`, svg).forEach((g) => g.classList.add('brilla')); svg.classList.remove('rebota'); void svg.getBoundingClientRect(); svg.classList.add('rebota'); }
}

/* ---------- fichas y pasos ---------- */
const swatch = (c) => c === 'split' ? 'background:linear-gradient(90deg,#C98A3E 0 50%,#B8324A 50% 100%)' : `background:${c}`;
function pintarPasos() {
  pasosEl.innerHTML = ORDEN.map((g, i) => `<li><button type="button" class="pp${i === torta.paso ? ' on' : ''}${torta.vistos.has(i) && i !== torta.paso ? ' hecho' : ''}" data-ir="${i}" aria-current="${i === torta.paso ? 'step' : 'false'}" aria-label="Paso ${i + 1}: ${FICHAS[g].t}"><span>${i + 1}</span></button></li>`).join('');
}
function pintarFichas(entrar = true) {
  const g = ORDEN[torta.paso];
  $('[data-paso-t]').textContent = `${torta.paso + 1}. ${FICHAS[g].t}`;
  $('[data-pista]').textContent = FICHAS[g].pista;
  fichasEl.dataset.grupo = g;
  if (g === 'dia') {
    fichasEl.innerHTML = diasTorta.map((c) => `<button type="button" class="ficha-dia" role="radio" aria-checked="${c.f === torta.fecha}" data-fecha="${c.f}" data-franja="${c.franja || ''}" ${c.ok ? '' : 'disabled'}><span>${DIAS_C[c.d.getDay()]}</span><b>${c.d.getDate()}</b></button>`).join('');
  } else {
    const extras = g === 'extras';
    const precio = (id) => { const a = (prodTorta?.adicionales || []).find((x) => x.id === id); return a ? `+${plata(a.precio)}` : ''; };
    fichasEl.innerHTML = Object.entries(FICHAS[g].v).map(([id, f], i) => {
      const on = extras ? torta.extras.has(id) : torta.opc[g] === id;
      return `<button type="button" class="ficha" style="--i:${i}" ${extras ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`} data-g="${g}" data-v="${id}">
        <span class="ficha__bola" style="${swatch(f.c)}" aria-hidden="true">${on ? '<i class="ficha__ok"></i>' : ''}</span>
        <span class="ficha__n">${esc(f.n)}</span><span class="ficha__s">${esc(extras ? precio(id) : f.s || '')}</span></button>`;
    }).join('');
  }
  fichasEl.classList.toggle('entra', entrar && !reduce);
  if (entrar && !reduce) { void fichasEl.offsetWidth; fichasEl.classList.add('entra'); }
  const ultimo = torta.paso === ORDEN.length - 1;
  $('[data-sig]').hidden = ultimo;
  $('[data-reservar-torta]').classList.toggle('lista', ultimo);
  pintarPasos();
}
function irPaso(i) {
  torta.paso = Math.max(0, Math.min(ORDEN.length - 1, i));
  torta.vistos.add(torta.paso);
  pintarFichas();
}
let auto = 0;
function elegir(g, v, desdeArrastre = false) {
  clearTimeout(auto);
  if (g === 'extras') { torta.extras.has(v) ? torta.extras.delete(v) : torta.extras.add(v); dibujarTorta(torta.extras.has(v) ? v : null); }
  else { torta.opc[g] = v; dibujarTorta(g); }
  pintarFichas(false);
  pintarPlata();
  if (g !== 'extras') auto = setTimeout(() => irPaso(torta.paso + 1), desdeArrastre ? 450 : 650);
}

async function leerTorta() {
  prodTorta = (await kit.store.getProductos()).find((p) => p.id === ID_TORTA) || null;
  if (!prodTorta) { $('[data-juego]')?.setAttribute('hidden', ''); return; }
  for (const gr of prodTorta.opciones || []) if (!gr.valores.some((v) => v.id === torta.opc[gr.id])) torta.opc[gr.id] = gr.valores[0].id;
  for (const id of [...torta.extras]) if (!(prodTorta.adicionales || []).some((a) => a.id === id)) torta.extras.delete(id);
  if (!torta.iniciada) { torta.extras.add('frutas'); torta.iniciada = true; }
  calcularDias();
  dibujarTorta(null);
  pintarFichas(false);
  pintarPlata();
}
function lineaTorta() { return { opc: { ...torta.opc }, extras: [...torta.extras] }; }
function pintarPlata() {
  if (!prodTorta) return;
  let total = Number(prodTorta.precio) || 0;
  const det = [];
  for (const gr of prodTorta.opciones || []) { const v = gr.valores.find((x) => x.id === torta.opc[gr.id]); if (v) { det.push(v.nombre); if (v.precio) total += Number(v.precio); } }
  for (const a of prodTorta.adicionales || []) if (torta.extras.has(a.id)) { total += Number(a.precio) || 0; det.push(FICHAS.extras.v[a.id]?.n.toLowerCase() || a.nombre.toLowerCase()); }
  $('[data-total]').textContent = `Total ${plata(total)}`;
  $('[data-sena]').textContent = `Seña ${plata(total * 0.5)}`;
  const d = det.join(' · ');
  $('[data-detalle]').textContent = d.charAt(0).toUpperCase() + d.slice(1) + (torta.fecha ? ` · retirás el ${fechaCorta(torta.fecha)}` : '');
}
const fechaCorta = (f) => { const dt = new Date(f + 'T12:00:00'); return `${DIAS_N[dt.getDay()].toLowerCase()} ${dt.getDate()}/${dt.getMonth() + 1}`; };
function calcularDias() {
  let dias = [];
  try {
    const r = opcionesRetiro({ horarios: kit.config.horarios, encargo: kit.config.pedidos?.encargo, tz: kit.tz, productos: [prodTorta], categorias: kit.config.carta?.categorias || [], lineas: [{ id: ID_TORTA, cant: 1 }] });
    dias = r.dias || [];
  } catch (err) { console.warn('[rosie] días de retiro', err); }
  const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  diasTorta = [];
  for (let k = 0; k < 21 && diasTorta.length < 8; k++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + k);
    if (!abreHoy(d.getDay())) continue;
    const f = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fr = dias.find((x) => x.fecha === f)?.franjas?.find((x) => x.disponible);
    diasTorta.push({ f, d, ok: !!fr, franja: fr?.id || null });
  }
  if (torta.fecha && !diasTorta.some((c) => c.f === torta.fecha && c.ok)) torta.fecha = null;
  if (!torta.fecha) { const pri = diasTorta.find((c) => c.ok); if (pri) { torta.fecha = pri.f; torta.franja = pri.franja; } }
}

/* ---------- toques y arrastre (dedo y mouse) ---------- */
let drag = null;
fichasEl.addEventListener('pointerdown', (e) => {
  const f = e.target.closest('.ficha'); if (!f || e.button > 0) return;
  drag = { f, id: e.pointerId, x: e.clientX, y: e.clientY, mov: false, ghost: null };
});
addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.mov) {
    if (Math.hypot(dx, dy) < 10) return;
    drag.mov = true;
    const bola = $('.ficha__bola', drag.f);
    const r = bola.getBoundingClientRect();
    drag.ghost = bola.cloneNode(true); drag.ghost.className = 'ficha__bola ficha__ghost';
    drag.ghost.style.width = r.width + 'px'; drag.ghost.style.height = r.height + 'px';
    document.body.appendChild(drag.ghost);
    drag.ox = r.width / 2; drag.oy = r.height / 2;
    escena.classList.add('espera');
  }
  drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px, ${e.clientY - drag.oy}px) rotate(${dx / 12}deg)`;
  const r = escena.getBoundingClientRect();
  escena.classList.toggle('apunta', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
  e.preventDefault();
}, { passive: false });
function soltarFicha(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { f, mov, ghost } = drag; drag = null;
  escena.classList.remove('espera');
  if (!mov) return; // fue un toque: lo maneja el click
  const dentro = escena.classList.contains('apunta');
  escena.classList.remove('apunta');
  ghost?.remove();
  f.dataset.arrastrado = '1';
  if (dentro) elegir(f.dataset.g, f.dataset.v, true);
}
addEventListener('pointerup', soltarFicha);
addEventListener('pointercancel', soltarFicha);
fichasEl.addEventListener('click', (e) => {
  const f = e.target.closest('.ficha');
  if (f) { if (f.dataset.arrastrado) { delete f.dataset.arrastrado; return; } elegir(f.dataset.g, f.dataset.v); return; }
  const d = e.target.closest('.ficha-dia');
  if (d && !d.disabled) { torta.fecha = d.dataset.fecha; torta.franja = d.dataset.franja; $$('.ficha-dia', fichasEl).forEach((b) => b.setAttribute('aria-checked', String(b === d))); pintarPlata(); }
});
fichasEl.addEventListener('dragstart', (e) => e.preventDefault());
pasosEl.addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) { clearTimeout(auto); irPaso(Number(b.dataset.ir)); } });
$('[data-sig]').addEventListener('click', () => { clearTimeout(auto); irPaso(torta.paso + 1); });
$('[data-reservar-torta]').addEventListener('click', (e) => {
  if (!prodTorta) return;
  kit.carrito.agregar(ID_TORTA, 1, { ...lineaTorta(), origen: e.currentTarget });
  if (torta.fecha && torta.franja && kit.carrito.setRetiro) { try { kit.carrito.setRetiro({ fecha: torta.fecha, franja: torta.franja }); } catch (_) { /* el checkout lo pide */ } }
  setTimeout(() => kit.carrito.abrir(), reduce ? 0 : 650);
});
await leerTorta();
kit.store.onChange?.(leerTorta);

// "Las otras tortas": desde cuándo se retira si encargás hoy
const prox = $('[data-proximo]');
try {
  const r = opcionesRetiro({ horarios: kit.config.horarios, encargo: kit.config.pedidos?.encargo, tz: kit.tz, productos: [prodTorta], categorias: kit.config.carta?.categorias || [], lineas: [{ id: ID_TORTA, cant: 1 }] });
  const d = (r.dias || []).find((x) => x.franjas.some((f) => f.disponible));
  if (d && prox) prox.innerHTML = `Si encargás hoy, la retirás desde el <b>${fechaCorta(d.fecha)}</b>`;
} catch (_) { /* queda el texto fijo */ }

/* =========================================================
   PASAN COSAS: el taller (evento del panel) y las consultas de eventos
   ========================================================= */
let evento = null;
async function pintarEvento() {
  const lista = kit.eventos?.proximos?.() || [];
  evento = lista.find((x) => x.reserva) || lista[0] || null;
  const card = $('[data-afiche-evento]');
  if (!evento) { card.hidden = true; return; }
  card.hidden = false;
  const dt = new Date(evento.fecha + 'T12:00:00');
  $('[data-ev-fecha]').textContent = `${DIAS_N[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1} · ${evento.hora} hs`;
  $('[data-ev-nom]').textContent = evento.nombre;
  $('[data-ev-desc]').textContent = evento.descripcion || '';
  const cupo = $('[data-ev-cupo]');
  const btn = $('[data-ev-anotarme]');
  if (!evento.reserva) { cupo.textContent = 'Por orden de llegada'; btn.hidden = true; return; }
  try {
    const t = (await kit.reservas.turnos(evento.fecha, 1)).find((x) => x.hora === evento.hora);
    if (t) { cupo.textContent = t.libres > 0 ? `Quedan ${t.libres} lugares${evento.precio ? ' · ' + plata(evento.precio) : ''}` : 'Cupo completo'; btn.disabled = !(t.libres > 0); }
  } catch (_) { cupo.innerHTML = '&nbsp;'; }
}
document.addEventListener('kit:eventos', pintarEvento);
pintarEvento();
kit.store.onChange?.(pintarEvento);
$('[data-ev-anotarme]').addEventListener('click', () => {
  if (!evento) return;
  kit.reservas.abrir({ fecha: evento.fecha, hora: evento.hora, personas: 1 });
  // el día del taller puede quedar fuera de la fila de días: lo traemos a la vista
  setTimeout(() => {
    const d = document.querySelector('.kit-resv .kit-chip--day.is-on');
    d?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, 120);
});
$('[data-consultar-evento]').addEventListener('click', () => kit.reservas.abrir({ hora: '12:30', personas: 20 }));

/* =========================================================
   LA MESA VERDE: mazo de fotos en el celu
   ========================================================= */
const mazo = $('[data-mazo]');
const fotos = $$('.foto-g', mazo);
let orden = fotos.map((_, i) => i);
let vistas = 1;
function pintarMazo() {
  if (desk() || matchMedia('(min-width: 900px)').matches) { fotos.forEach((f) => { f.style.zIndex = ''; f.style.removeProperty('--pos'); f.classList.remove('lejos'); }); return; }
  orden.forEach((idx, pos) => {
    const f = fotos[idx];
    f.style.zIndex = String(fotos.length - pos);
    f.style.setProperty('--pos', String(Math.min(pos, 3)));
    f.classList.toggle('lejos', pos > 3);
  });
  $('[data-mazo-n]').textContent = `${vistas} / ${fotos.length}`;
}
function tirar(dir = 1) {
  const f = fotos[orden[0]];
  f.classList.remove('arrastra');
  f.classList.add('vuela');
  f.style.transform = `translate(${dir * 130}%, -6%) rotate(${dir * 24}deg)`;
  setTimeout(() => {
    f.classList.remove('vuela'); f.style.transform = '';
    orden.push(orden.shift());
    vistas = vistas % fotos.length + 1;
    pintarMazo();
  }, reduce ? 0 : 380);
}
let dx0 = 0, dy0 = 0, arr = null;
mazo.addEventListener('pointerdown', (e) => {
  if (matchMedia('(min-width: 900px)').matches) return;
  const f = fotos[orden[0]];
  if (!f.contains(e.target)) return;
  arr = { f, id: e.pointerId, x: e.clientX, y: e.clientY, mov: false };
  dx0 = e.clientX; dy0 = e.clientY;
});
mazo.addEventListener('pointermove', (e) => {
  if (!arr || e.pointerId !== arr.id) return;
  const dx = e.clientX - dx0, dy = e.clientY - dy0;
  if (!arr.mov) { if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return; arr.mov = true; arr.f.classList.add('arrastra'); try { mazo.setPointerCapture(e.pointerId); } catch (_) { /* nada */ } }
  arr.f.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx / 14}deg)`;
});
function soltar(e) {
  if (!arr) return;
  const dx = e.clientX - dx0;
  const f = arr.f; const mov = arr.mov; arr = null;
  if (!mov) return;
  if (Math.abs(dx) > 70) tirar(Math.sign(dx));
  else { f.classList.remove('arrastra'); f.style.transform = ''; }
}
mazo.addEventListener('pointerup', soltar);
mazo.addEventListener('pointercancel', soltar);
$('[data-mazo-sig]').addEventListener('click', () => tirar(1));
pintarMazo();
addEventListener('resize', pintarMazo, { passive: true });
