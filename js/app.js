/* App: state, filters, flat card, camera moves, picking, controls and the render loop. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var $ = BB.$, $$ = BB.$$, money = BB.money, num = BB.num, flats = BB.flats, byId = BB.byId, CONFIG = BB.CONFIG, STATUS_LABEL = BB.STATUS_LABEL;
var scene = BB.scene, camera = BB.camera, controls = BB.controls, renderer = BB.renderer, canvas = BB.canvas, M = BB.M, glass = BB.glass, towerInfo = BB.towerInfo, IN = BB.IN, outline = BB.outline, hoverLine = BB.hoverLine;
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var state = BB.state = { mode: 'real', sel: null, view: 'ext', short: [], labels: true, filter: { tower: 'all', type: 'all', status: 'all', budget: 200 } };
var ICO = {
  door: '<svg class="i" viewBox="0 0 24 24"><path d="M6 20.5V4.5h9l3 2v14"/><path d="M4 20.5h16"/><circle cx="14" cy="13" r=".6" fill="currentColor"/></svg>',
  view: '<svg class="i" viewBox="0 0 24 24"><path d="M3 18l5-7 4 5 3-4 6 6"/><circle cx="16.5" cy="7" r="2"/></svg>',
  star: '<svg class="i" viewBox="0 0 24 24"><path d="M12 4l2.4 5 5.5.7-4 3.8 1 5.4-4.9-2.7-4.9 2.7 1-5.4-4-3.8 5.5-.7z"/></svg>',
  share: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12v7h14v-7"/><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/></svg>',
  up: '<svg class="i" viewBox="0 0 24 24"><path d="M6 14l6-6 6 6"/></svg>', down: '<svg class="i" viewBox="0 0 24 24"><path d="M6 10l6 6 6-6"/></svg>'
};

/* ---------- saved on this device: holds and enquiries (demo storage, this browser only) ---------- */
var store = { get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
var holds = store.get('bb-flats-holds', {}), leads = store.get('bb-flats-leads', []);
Object.keys(holds).forEach(function (id) { if (byId[id] && byId[id].status === 'available') { byId[id].status = 'hold'; byId[id].heldHere = true; } });
function saveHolds() { var o = {}; flats.forEach(function (f) { if (f.heldHere) o[f.id] = 1; }); store.set('bb-flats-holds', o); }

/* ---------- filters, materials, counts ---------- */
function matches(f) {
  var q = state.filter;
  return (q.tower === 'all' || f.tower === q.tower) && (q.type === 'all' || f.type === q.type) && (q.status === 'all' || f.status === q.status) && (q.budget >= 200 || f.price <= q.budget * 1e5);
}
function pickBtn(p) { return '<button class="pick" data-id="' + p.id + '"><span><b>' + p.id + '</b> &nbsp;' + p.type + ', floor ' + p.floor + '</span><i>' + money(p.price) + '</i></button>'; }
function refresh() {
  var c = { all: 0, available: 0, hold: 0, sold: 0 }, m = 0;
  flats.forEach(function (f) {
    c.all++; c[f.status]++; var ok = matches(f); if (ok) m++;
    f.mesh.material = state.sel === f ? BB.FM.sel : !ok ? BB.FM.dim : state.mode === 'avail' ? BB.FM[f.status] : BB.FM.real;
    f.mesh.castShadow = ok;
  });
  $('#stats').innerHTML =
    '<div class="stat glass"><b>' + c.all + '</b><span><i class="dot all"></i>Total flats</span></div>' +
    '<div class="stat glass"><b>' + c.available + '</b><span><i class="dot ok"></i>Available</span></div>' +
    '<div class="stat glass"><b>' + c.hold + '</b><span><i class="dot hold"></i>On hold</span></div>' +
    '<div class="stat glass"><b>' + c.sold + '</b><span><i class="dot sold"></i>Sold</span></div>';
  $('#matchCount').textContent = m + (m === 1 ? ' flat matches' : ' flats match');
  renderPanel();
}

/* ---------- cost sheet, EMI, compare ---------- */
var EMI = { down: 20, years: 20, rate: 8.75 };
function cost(f) {
  var base = CONFIG.baseRate * f.sup, rise = Math.max(0, f.floor - 3) * CONFIG.floorRise * f.sup, prem = f.price - base - rise, park = 350000, club = 150000;
  var sub = f.price + park + club, gst = sub * 0.05, reg = f.price * 0.066;
  return { base: base, rise: rise, prem: prem, park: park, club: club, gst: gst, reg: reg, total: sub + gst + reg };
}
function costSheet(f) {
  var c = cost(f), row = function (a, b, cls) { return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + a + '</td><td>' + b + '</td></tr>'; };
  return '<details class="fold"><summary>Price breakup</summary><div class="in"><table class="sheet">' +
    row('Base price (' + num(f.sup) + ' sq ft x ₹' + num(CONFIG.baseRate) + ')', money(c.base)) + row('Floor rise, floor ' + f.floor, money(c.rise)) + row('Tower and view premium', money(c.prem)) +
    row('Covered parking', money(c.park)) + row('Club membership', money(c.club)) + row('GST at 5%', money(c.gst)) + row('Stamp duty and registration, about 6.6%', money(c.reg)) + row('All-in cost', money(c.total), 'tot') +
    '</table><p class="note">Sample charges for illustration. The live system uses the developer’s own cost sheet.</p></div></details>';
}
function emiVal(f) { var loan = cost(f).total * (1 - EMI.down / 100), r = EMI.rate / 1200, n = EMI.years * 12; return { loan: loan, emi: loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) }; }
function emiBox(f) {
  var e = emiVal(f);
  return '<details class="fold"' + (EMI.open ? ' open' : '') + ' id="emiFold"><summary>EMI calculator <span id="emiHead" style="margin-left:auto;margin-right:10px;color:var(--accent);font-weight:400">₹' + num(e.emi) + ' a month</span></summary><div class="in">' +
    '<div class="sl"><span>Down payment</span><b id="emiD">' + EMI.down + '%</b><input type="range" id="emiDown" min="10" max="60" step="5" value="' + EMI.down + '" aria-label="Down payment per cent"></div>' +
    '<div class="sl"><span>Loan period</span><b id="emiY">' + EMI.years + ' years</b><input type="range" id="emiYears" min="5" max="30" step="1" value="' + EMI.years + '" aria-label="Loan period in years"></div>' +
    '<div class="sl"><span>Interest rate</span><b id="emiR">' + EMI.rate.toFixed(2) + '%</b><input type="range" id="emiRate" min="7" max="12" step="0.05" value="' + EMI.rate + '" aria-label="Interest rate per cent"></div>' +
    '<p class="note" id="emiNote">Loan of ' + money(e.loan) + ' on the all-in cost. Illustration only.</p></div></details>';
}
function compareTable(list) {
  var rows = [['Type', function (f) { return f.type; }], ['Floor', function (f) { return f.floor + ' of ' + f.floors; }], ['Super area', function (f) { return num(f.sup); }], ['Carpet area', function (f) { return num(f.carpet); }], ['Facing', function (f) { return f.facing.replace('North', 'N').replace('South', 'S').replace('East', 'E').replace('West', 'W'); }], ['View', function (f) { return f.u.sz > 0 ? 'Garden' : 'City'; }], ['Rate / sq ft', function (f) { return '₹' + num(f.rate); }], ['Base price', function (f) { return money(f.price); }], ['All-in cost', function (f) { return money(cost(f).total); }], ['Status', function (f) { return STATUS_LABEL[f.status]; }]];
  return '<table class="cmp"><thead><tr><th></th>' + list.map(function (f) { return '<th>' + f.id + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td>' + list.map(function (f) { return '<td>' + r[1](f) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
}

/* ---------- panel ---------- */
function plateSVG(f) {
  var pos = { '02': [8, 8], '01': [104, 8], '03': [8, 80], '04': [104, 80] }, col = { available: '#3ecf8e', hold: '#f0b23e', sold: '#e2645a' }, s = '';
  ['02', '01', '03', '04'].forEach(function (n) {
    var u = byId[f.tower + '-' + f.floor + n], p = pos[n], on = u === f;
    s += '<g class="u" data-id="' + u.id + '" tabindex="0" role="button" aria-label="Flat ' + u.id + ', ' + u.type + ', ' + STATUS_LABEL[u.status] + '">' +
      '<rect x="' + p[0] + '" y="' + p[1] + '" width="88" height="62" rx="6" fill="' + col[u.status] + '" fill-opacity="' + (on ? 0.5 : 0.2) + '" stroke="' + (on ? '#dcb872' : 'rgba(255,255,255,.25)') + '" stroke-width="' + (on ? 2.5 : 1) + '"/>' +
      '<text x="' + (p[0] + 44) + '" y="' + (p[1] + 29) + '" text-anchor="middle" fill="#eef2f4" font-size="13" font-weight="500">' + u.id + '</text>' +
      '<text x="' + (p[0] + 44) + '" y="' + (p[1] + 45) + '" text-anchor="middle" fill="#9db0bb" font-size="10.5">' + u.type + '</text></g>';
  });
  return '<svg viewBox="0 0 230 150" role="group" aria-label="Floor ' + f.floor + ' plan">' + s +
    '<rect x="90" y="62" width="20" height="26" rx="3" fill="#38424a"/><text x="100" y="79" text-anchor="middle" fill="#9db0bb" font-size="7">LIFT</text>' +
    '<path d="M214 30 l-6 16 h12 z" fill="#dcb872"/><text x="214" y="60" text-anchor="middle" fill="#9db0bb" font-size="10">N</text>' +
    '<text x="214" y="124" text-anchor="middle" fill="#9db0bb" font-size="8">Garden</text><path d="M214 128 v10 m-4 -4 l4 4 l4 -4" stroke="#9db0bb" fill="none"/></svg>';
}
function renderPanel() {
  var f = state.sel, body = $('#pBody');
  document.body.classList.toggle('has-flat', !!(f || state.leads));
  if (state.leads && !f) {
    $('#pClose').hidden = false; $('#pMin').hidden = true; $('#pTitle').textContent = 'Enquiries'; $('#pSub').textContent = leads.length + (leads.length === 1 ? ' site visit booked' : ' site visits booked');
    body.innerHTML = (leads.length ? '<div class="picks">' + leads.slice().reverse().map(function (l) { return '<div class="lead"><b>' + esc(l.name) + ' &nbsp;<span>' + esc(l.phone) + '</span></b><span>Flat ' + l.flat + ', ' + l.type + ', ' + money(l.price) + '</span><span>Visit on ' + esc(l.date) + ', ' + esc(l.slot) + '</span></div>'; }).join('') + '</div><button class="btn" id="leadsClear">Clear all enquiries</button>' : '<p class="note">No site visits booked yet. Open a flat and choose Book a site visit.</p>') +
      '<p class="note">This is what the sales team sees. In this demo the list is saved in this browser only; the live system sends each enquiry to the CRM and the assigned associate.</p>';
    return;
  }
  $('#pClose').hidden = !f; $('#pMin').hidden = !f;
  if (!f) {
    $('#pTitle').textContent = 'Project overview'; $('#pSub').textContent = 'Tap any flat on a tower';
    var rows = '';
    Object.keys(CONFIG.types).forEach(function (t) {
      var list = flats.filter(function (x) { return x.type === t; }), av = list.filter(function (x) { return x.status === 'available'; });
      rows += '<tr><td>' + t + '</td><td>' + num(CONFIG.types[t].sup) + ' sq ft</td><td>' + (av.length ? money(Math.min.apply(null, av.map(function (x) { return x.price; }))) : 'Sold out') + '</td><td>' + av.length + '</td></tr>';
    });
    var picks = flats.filter(function (x) { return x.status === 'available' && matches(x); }).sort(function (a, b) { return a.price - b.price; }).slice(0, 4), sl = state.short.map(function (id) { return byId[id]; });
    body.innerHTML =
      (sl.length ? '<div><h2 style="margin-bottom:8px">Your shortlist</h2><div class="picks">' + sl.map(pickBtn).join('') + '</div></div>' : '') +
      (sl.length > 1 ? '<details class="fold" open><summary>Compare shortlisted flats</summary><div class="in">' + compareTable(sl.slice(0, 3)) + '</div></details>' : '') +
      '<table class="inv"><thead><tr><th>Type</th><th>Super area</th><th>From</th><th>Available</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div><h2 style="margin-bottom:8px">Lowest priced available' + (picks.length ? '' : ': none for this filter') + '</h2><div class="picks">' + picks.map(pickBtn).join('') + '</div></div>' +
      '<div class="legend"><span><i class="dot ok"></i>Available</span><span><i class="dot hold"></i>On hold</span><span><i class="dot sold"></i>Sold</span></div>' +
      '<p class="note">Sample inventory and prices for demonstration. Switch to Availability to colour every flat by status.</p>' +
      '<p class="note">Presenter keys: 1 to 8 jump between views, 9 switches day and night, P plays the tour full screen, H hides the panels.</p>';
    return;
  }
  var sh = state.short.indexOf(f.id) >= 0;
  $('#pTitle').textContent = 'Flat ' + f.id; $('#pSub').textContent = f.type + ', Tower ' + f.tower + ', floor ' + f.floor + ' of ' + f.floors;
  body.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div class="price">' + money(f.price) + '<small>₹' + num(f.rate) + ' per sq ft, base price</small></div><span class="pill ' + f.status + '"><i class="dot ' + f.status + '"></i>' + STATUS_LABEL[f.status] + '</span></div>' +
    '<dl class="facts"><div><dt>Super area</dt><dd>' + num(f.sup) + ' sq ft</dd></div><div><dt>Carpet area</dt><dd>' + num(f.carpet) + ' sq ft</dd></div>' +
    '<div><dt>Facing</dt><dd>' + f.facing + '</dd></div><div><dt>View</dt><dd>' + f.view + '</dd></div>' +
    '<div><dt>Sunlight</dt><dd>' + (f.u.sx > 0 ? 'Morning sun' : 'Evening sun') + '</dd></div><div><dt>Balcony</dt><dd>Curved corner deck</dd></div></dl>' +
    '<div class="actions"><button class="btn primary" id="inBtn">Step inside in 3D</button><button class="btn" id="balBtn">View from balcony</button></div>' +
    costSheet(f) + emiBox(f) +
    '<div class="plate"><div class="plate-top"><span>Floor ' + f.floor + ' plan</span><span class="stepper"><button class="icon-btn" data-step="-1" aria-label="Go one floor down"' + (f.floor <= 1 ? ' disabled' : '') + '>&#8595;</button><button class="icon-btn" data-step="1" aria-label="Go one floor up"' + (f.floor >= f.floors ? ' disabled' : '') + '>&#8593;</button></span></div>' + plateSVG(f) + '</div>' +
    '<div class="actions"><button class="btn" id="holdBtn"' + (f.status !== 'available' && !f.heldHere ? ' disabled' : '') + '>' + (f.status === 'available' ? 'Hold for 24 hours' : f.heldHere ? 'Release hold' : f.status === 'hold' ? 'Already on hold' : 'Sold') + '</button><button class="btn" id="visitBtn">Book a site visit</button></div>' +
    (state.form ? '<form class="form" id="visitForm"><label>Full name<input id="vName" required autocomplete="name"></label><label>Mobile number<input id="vPhone" required inputmode="tel" autocomplete="tel" pattern="[0-9+ ]{8,15}"></label><div class="two"><label>Date<input id="vDate" type="date" required></label><label>Time<select id="vSlot"><option>10:00 am</option><option>12:00 noon</option><option>3:00 pm</option><option>5:00 pm</option></select></label></div><div class="actions"><button class="btn primary" type="submit">Confirm visit</button><button class="btn" type="button" id="visitCancel">Cancel</button></div><p class="note">Demo: saved in this browser only. Nothing is sent anywhere.</p></form>' : '') +
    '<div class="actions"><button class="btn" id="shortBtn" aria-pressed="' + sh + '">' + (sh ? '★ Shortlisted' : '☆ Add to shortlist') + '</button>' +
    '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('Flat ' + f.id + ', ' + f.type + ', ' + num(f.sup) + ' sq ft, ' + money(f.price) + ', floor ' + f.floor + ', ' + $('#projName').textContent.trim()) + '">Share on WhatsApp</a></div>' +
    '<p class="note">Holds and site visits are saved in this browser for the demo. Nothing is sent anywhere.</p>';
}

/* ---------- camera moves ---------- */
var tween = null, tour = null;
function fit() { var a = camera.aspect; return a < 0.7 ? 1.9 : a < 1.1 ? 1.4 : 1; }
function fly(pos, target, ms, cam, ctl) {
  cam = cam || camera; ctl = ctl || controls;
  if (reduceMotion || ms === 0) { cam.position.copy(pos); ctl.target.copy(target); tween = null; return; }
  tween = { cam: cam, ctl: ctl, p0: cam.position.clone(), t0: ctl.target.clone(), p1: pos, t1: target, s: null, ms: ms || 1300 };
}
BB.fit = fit; BB.fly = fly; BB.stopTween = function () { tween = null; };
function view(name, ms) {
  var k = fit();
  if (name === 'all') return fly(new THREE.Vector3(70 * k, 92 * k, 262 * k), new THREE.Vector3(0, 20, 8), ms);
  if (name === 'top') return fly(new THREE.Vector3(0, 340 * k, 8), new THREE.Vector3(0, 0, 6), ms);
  var t = towerInfo[name]; if (!t) return;
  var d = new THREE.Vector3(Math.sin(t.rot) + 0.45, 0, Math.cos(t.rot)).normalize();
  fly(new THREE.Vector3(t.x + d.x * 172 * k, t.H * 0.7 + 16, t.z + d.z * 172 * k), new THREE.Vector3(t.x, t.H * 0.46, t.z), ms);
}
var v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
function focusFlat(f) {
  var t = towerInfo[f.tower]; v1.copy(f.wpos);
  v2.set(v1.x - t.x, 0, v1.z - t.z).normalize();
  var k = fit(), d = 112 * k;
  fly(new THREE.Vector3(v1.x + v2.x * d, v1.y + 24 * k, v1.z + v2.z * d), v1.clone(), 1100);
}
function select(f, move) {
  state.sel = f || null; state.form = false; if (f) state.leads = false;
  if (f) { BB.attachLine(outline, f); if (state.view === 'ext') { $('#panel').classList.remove('min'); if (move !== false) focusFlat(f); } }
  else { outline.visible = false; if (outline.parent) outline.parent.remove(outline); scene.add(outline); }
  refresh();
  if (!f) leaveSpecial(); else if (state.view === 'int') openInterior(f); else if (state.view === 'bal') balconyView(f);
}
function stopTour() { if (tour) { tour = null; $('#tourBtn').setAttribute('aria-pressed', 'false'); $('#tourBtn').textContent = 'Take the tour'; } }
function startTour() {
  var shots = ['all', 'A', 'B', 'C', 'pool', 'club', 'garden', 'park', 'locality'], i = 0;
  tour = { next: function () { var s = shots[i % shots.length]; if (POI[s] || s === 'locality') { poi(s); if (tween) tween.ms = 5200; } else view(s, 5200); i++; } };
  $('#tourBtn').setAttribute('aria-pressed', 'true'); $('#tourBtn').textContent = 'Stop the tour'; tour.next();
}
var POI = { pool: [-32, 42, 1], club: [36, 46, 1], garden: [0, 62, 1.2], play: [74, 34, 0.8], park: [-20, 188, 2.6], mall: [-210, 186, 2.6], school: [196, 186, 2.6], hospital: [330, -40, 2.6], metro: [390, 186, 2.6] };
function poi(name) {
  var k = fit();
  if (name === 'locality') return fly(new THREE.Vector3(120 * k, 520 * k, 860 * k), new THREE.Vector3(0, 0, 90), 2200);
  var p = POI[name], s = p[2] * k; fly(new THREE.Vector3(p[0] + 26 * s, 30 * s, p[1] + 52 * s), new THREE.Vector3(p[0], 2, p[1]), 1800);
}
function orbitTo(dAz, zoom, north) {
  var o = camera.position.clone().sub(controls.target), r = Math.hypot(o.x, o.z), a = north ? 0 : Math.atan2(o.x, o.z) + dAz, z = zoom || 1;
  fly(new THREE.Vector3(controls.target.x + Math.sin(a) * r * z, controls.target.y + o.y * z, controls.target.z + Math.cos(a) * r * z), controls.target.clone(), 600);
}

/* ---------- inside the flat, and the view from its balcony ---------- */
function special(kind, title) {
  stopTour(); tween = null; state.view = kind; $('#tip').hidden = true; hoverLine.visible = false;
  document.body.classList.add('special'); document.body.classList.toggle('mode-int', kind === 'int'); document.body.classList.toggle('mode-bal', kind === 'bal');
  $('#ibar').hidden = false; $('#iTitle').textContent = title; $('#panel').classList.add('min'); $('#filters').classList.remove('open');
}
function resetExt() { IN.lookCtl(controls, false); controls.minDistance = 30; controls.maxDistance = 1500; controls.maxPolarAngle = Math.PI * 0.492; camera.fov = 38; camera.updateProjectionMatrix(); }
function openInterior(f) {
  if (state.view === 'bal') resetExt();
  special('int', 'Inside flat ' + f.id + ', ' + f.type + ', ' + num(f.carpet) + ' sq ft carpet');
  controls.enabled = false; IN.open(f); setIMode(IN.mode);
  $('#iRooms').innerHTML = IN.rooms().filter(function (r) { return r.kind !== 'passage' && r.kind !== 'store' && r.kind !== 'utility'; }).map(function (r) { return '<button class="seg" data-room="' + r.name + '">' + r.name + '</button>'; }).join('');
}
function balconyView(f) {
  var t = towerInfo[f.tower], u = f.u;
  special('bal', 'From the balcony of flat ' + f.id + ', floor ' + f.floor);
  IN.on = false; IN.ctl.enabled = false; controls.enabled = true; IN.stopTour(); document.body.classList.remove('mode-walk'); $('#mini').hidden = true; $('#cap').hidden = true;
  var dir = new THREE.Vector3(Math.sin(t.rot) * u.sz, 0, Math.cos(t.rot) * u.sz), c = Math.cos(t.rot), s = Math.sin(t.rot), lx = u.sx * 10.4, lz = u.sz * (BB.D / 2 + 0.95);
  var pos = new THREE.Vector3(t.x + lx * c + lz * s, f.y0 + 1.9, t.z - lx * s + lz * c);
  camera.fov = 64; camera.updateProjectionMatrix(); camera.position.copy(pos); controls.target.copy(pos).addScaledVector(dir, 0.2); controls.target.y -= 0.025; IN.lookCtl(controls, true); controls.update();
}
function leaveSpecial() {
  if (state.view === 'ext') return;
  state.view = 'ext'; IN.on = false; IN.ctl.enabled = false; controls.enabled = true; tween = null; resetExt();
  IN.stopTour(); $('#mini').hidden = true; $('#cap').hidden = true;
  document.body.classList.remove('special', 'mode-int', 'mode-bal', 'mode-walk'); $('#ibar').hidden = true; $('#panel').classList.remove('min');
  if (state.sel) focusFlat(state.sel); else view('all');
}
function setIMode(m, room) {
  IN.setMode(m, room); var wk = m === 'walk'; document.body.classList.toggle('mode-walk', wk); $('#mini').hidden = !wk; $('#cap').hidden = !wk;
  $$('[data-imode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.imode === m)); });
}
IN.onRoom = function (r) { $('#capT').textContent = r.name; $('#capS').textContent = BB.feet(r.x1 - r.x0) + ' x ' + BB.feet(r.z1 - r.z0); $$('[data-room]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.room === r.name)); }); };
IN.onTour = function (on) { var b = $('#iTour'); b.setAttribute('aria-pressed', String(on)); b.innerHTML = on ? '&#9632; Stop tour' : '&#9654; Guided tour'; };
var miniT = null;
$('#miniC').addEventListener('click', function (e) { if (!miniT) return; var r = this.getBoundingClientRect(), x = (e.clientX - r.left) * this.width / r.width, z = (e.clientY - r.top) * this.height / r.height; if (miniT.mirror) x = miniT.w - x; IN.stopTour(); IN.walkTo((x - miniT.ox) / miniT.s, (z - miniT.oz) / miniT.s, null, true); });
var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function setRay(ev, cam) { var r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); }
function inTap(ev) {
  setRay(ev, IN.cam); var h = ray.intersectObjects(IN.g.floors, false)[0]; if (!h) return; var rm = h.object.userData.room;
  if (IN.mode === 'walk') {
    IN.stopTour(); IN.walkTo(IN.mx(h.point.x), h.point.z);
  } else {
    var c = new THREE.Vector3(IN.mx((rm.x0 + rm.x1) / 2), 0.5, (rm.z0 + rm.z1) / 2), dd = c.clone().sub(IN.ctl.target); fly(IN.cam.position.clone().add(dd), c, 700, IN.cam, IN.ctl);
  }
}

/* ---------- picking ---------- */
var down = null, hoverEvt = null;
function hit(ev) {
  setRay(ev, camera); var hits = ray.intersectObjects(BB.flatMeshes, false);
  for (var i = 0; i < hits.length; i++) { var f = hits[i].object.userData.flat; if (matches(f)) return f; }
  return null;
}
canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: performance.now() }; tween = null; stopTour(); $('#tip').hidden = true; });
canvas.addEventListener('pointerup', function (e) {
  if (!down) return; var d = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (d > 7 || dt > 600) return;
  if (IN.on) return inTap(e);
  if (state.view !== 'ext') return;
  var f = hit(e); if (f) select(f);
});
canvas.addEventListener('pointermove', function (e) {
  if (IN.on && IN.mode === 'walk' && down && (e.buttons || e.pointerType !== 'mouse')) { IN.look(e.clientX - (down.lx == null ? down.x : down.lx), e.clientY - (down.ly == null ? down.y : down.ly)); down.lx = e.clientX; down.ly = e.clientY; return; }
  if (e.pointerType === 'mouse' && !e.buttons && state.view === 'ext') hoverEvt = e;
});
var keys = {};
window.addEventListener('keydown', function (e) { var t = (e.target.tagName || '').toLowerCase(); if (t === 'input' || e.target.isContentEditable) return; keys[e.key.toLowerCase()] = true; if (IN.on && IN.mode === 'walk' && /^arrow/.test(e.key.toLowerCase())) e.preventDefault(); });
window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('pointerleave', function () { hoverEvt = null; $('#tip').hidden = true; canvas.classList.remove('hot'); hoverLine.visible = false; });
function doHover() {
  if (!hoverEvt) return; var e = hoverEvt; hoverEvt = null;
  var f = hit(e), tip = $('#tip'); canvas.classList.toggle('hot', !!f);
  if (f && f !== state.sel) BB.attachLine(hoverLine, f); else hoverLine.visible = false;
  if (!f) { tip.hidden = true; return; }
  var r = $('#app').getBoundingClientRect();
  tip.innerHTML = '<b>' + f.id + '</b> &nbsp;' + f.type + ' &nbsp;' + money(f.price) + ' &nbsp;<i class="dot ' + f.status + '"></i> ' + STATUS_LABEL[f.status];
  tip.style.left = Math.min(e.clientX - r.left, r.width - 300) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.hidden = false;
}

/* ---------- controls ---------- */
var toastTimer = null;
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 4200); }
function afterFilter() { if (state.sel && !matches(state.sel)) select(null); else refresh(); }
$$('.chips').forEach(function (grp) {
  grp.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.filter[grp.dataset.group] = b.dataset.v;
    $$('.chips[data-group="' + grp.dataset.group + '"] button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    afterFilter(); if (grp.dataset.group === 'tower') view(b.dataset.v === 'all' ? 'all' : b.dataset.v);
  });
});
function budgetLabel() { var v = +$('#budget').value; $('#budgetOut').textContent = v >= 200 ? 'Any budget' : 'Up to ' + money(v * 1e5); }
$('#budget').addEventListener('input', function () { state.filter.budget = +this.value; budgetLabel(); afterFilter(); });
$('#resetFilters').addEventListener('click', function () {
  state.filter = { tower: 'all', type: 'all', status: 'all', budget: 200 }; $('#budget').value = 200; budgetLabel();
  $$('.chips button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.v === 'all')); }); refresh();
});
$('#filterToggle').addEventListener('click', function () { var o = $('#filters').classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); this.textContent = o ? 'Close' : 'Filters'; });
var pendingHour = null, hiQ = true;
function setQuality(hi) { // Fast: lower pixel density and a smaller shadow map, for laptops without a strong graphics chip
  hiQ = hi; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hi ? 2 : 1.5));
  var sz = hi ? (window.innerWidth < 820 ? 2048 : 4096) : 2048; BB.sun.shadow.mapSize.set(sz, sz); if (BB.sun.shadow.map) { BB.sun.shadow.map.dispose(); BB.sun.shadow.map = null; }
  var b = $('#qualBtn'); b.setAttribute('aria-pressed', String(hi)); b.textContent = hi ? 'Quality: High' : 'Quality: Fast'; resize();
}
$('#dock').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  if (b.dataset.mode) { state.mode = b.dataset.mode; $$('[data-mode]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); refresh(); }
  else if (b.dataset.time) { pendingHour = +b.dataset.time; $$('[data-time]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
  else if (b.dataset.view) { stopTour(); view(b.dataset.view); }
  else if (b.dataset.poi) { stopTour(); poi(b.dataset.poi); }
  else if (b.id === 'tourBtn') { if (tour) { stopTour(); tween = null; } else startTour(); }
  else if (b.id === 'qualBtn') setQuality(!hiQ);
  else if (b.id === 'leadsBtn') { state.leads = !state.leads; if (state.leads && state.sel) select(null); else renderPanel(); }
  else if (b.id === 'labelsBtn') { state.labels = !state.labels; BB.labels.visible = state.labels; b.setAttribute('aria-pressed', String(state.labels)); }
});
$('#pClose').addEventListener('click', function () { if (state.leads && !state.sel) { state.leads = false; renderPanel(); } else select(null); });
$('#pMin').addEventListener('click', function () { $('#panel').classList.toggle('min'); });
function cardAct(e) {
  var t = e.target, pick = t.closest('[data-id]'), step = t.closest('[data-step]'), b = t.closest('button'), f = state.sel, nf;
  if (pick) { nf = byId[pick.dataset.id]; if (nf) { if (!matches(nf)) toast('Flat ' + nf.id + ' is outside the current filter. Reset the filter to open it.'); else select(nf); } return; }
  if (step && f) { nf = byId[f.tower + '-' + (f.floor + (+step.dataset.step)) + f.unit]; if (nf) { if (!matches(nf)) toast('Flat ' + nf.id + ' is outside the current filter.'); else select(nf); } return; }
  if (!b || !f) return;
  if (b.id === 'inBtn') { openInterior(f); toast('Drag to turn the flat. Tap a room to centre it, or choose Walk inside.'); }
  else if (b.id === 'balBtn') { balconyView(f); toast('This is the outlook from floor ' + f.floor + '. Drag to look around.'); }
  else if (b.id === 'shortBtn') { var ix = state.short.indexOf(f.id); if (ix >= 0) state.short.splice(ix, 1); else state.short.push(f.id); refresh(); }
  else if (b.id === 'holdBtn' && f.heldHere) { f.status = 'available'; f.heldHere = false; saveHolds(); refresh(); toast('Hold released on flat ' + f.id + '.'); }
  else if (b.id === 'holdBtn' && f.status === 'available') { f.status = 'hold'; f.heldHere = true; saveHolds(); var id = f.id; if (!matches(f)) select(null); else refresh(); toast('Flat ' + id + ' is on hold. In the live system every associate sees it locked at once.'); }
  else if (b.id === 'visitBtn') { state.form = !state.form; renderPanel(); if (state.form) { var dd = new Date(Date.now() + 864e5), el = $('#vDate'); el.value = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2); $('#vName').focus(); } }
  else if (b.id === 'visitCancel') { state.form = false; renderPanel(); }
}
$('#pBody').addEventListener('click', cardAct);
$('#pBody').addEventListener('click', function (e) { if (e.target.id === 'leadsClear') { leads = []; store.set('bb-flats-leads', leads); renderPanel(); $('#leadsBtn').textContent = 'Enquiries'; } });
$('#pBody').addEventListener('submit', function (e) {
  if (e.target.id !== 'visitForm') return; e.preventDefault(); var f = state.sel; if (!f) return;
  var d = $('#vDate').value.split('-'), nice = d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : $('#vDate').value;
  leads.push({ name: $('#vName').value.trim(), phone: $('#vPhone').value.trim(), date: nice, slot: $('#vSlot').value, flat: f.id, type: f.type, price: f.price }); store.set('bb-flats-leads', leads);
  state.form = false; renderPanel(); $('#leadsBtn').textContent = 'Enquiries (' + leads.length + ')'; toast('Site visit booked for flat ' + f.id + ' on ' + nice + '. See it under Enquiries in the bottom bar.');
});
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
$('#pBody').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('g.u')) { e.preventDefault(); cardAct(e); } });
$('#ibar').addEventListener('click', function (e) {
  var b = e.target.closest('button'); if (!b) return;
  if (b.id === 'iBack') leaveSpecial();
  else if (b.dataset.imode) { setIMode(b.dataset.imode); if (b.dataset.imode === 'walk') toast('Drag to look around. Tap the floor or the plan to walk there, or start the guided tour.'); }
  else if (b.id === 'iFurn') { IN.furnished = !IN.furnished; IN.g.fur.visible = IN.furnished; b.setAttribute('aria-pressed', String(IN.furnished)); b.textContent = IN.furnished ? 'Furnished' : 'Bare shell'; }
  else if (b.id === 'iStyle') { b.textContent = 'Style: ' + IN.nextStyle(); }
  else if (b.id === 'iTour') { if (IN.wk.tour) IN.stopTour(); else { if (IN.mode !== 'walk') setIMode('walk'); IN.startTour(); b.setAttribute('aria-pressed', 'true'); b.innerHTML = '&#9632; Stop tour'; } }
  else if (b.dataset.room) { var rm0 = IN.rooms().filter(function (r) { return r.name === b.dataset.room; })[0]; if (IN.mode === 'walk') { IN.stopTour(); IN.goRoom(rm0, true); } else IN.setMode(IN.mode, rm0); }
});
function toggleUI() { var on = document.body.classList.toggle('clean'), b = $('#uiToggle'); b.setAttribute('aria-pressed', String(on)); b.querySelector('span').textContent = on ? 'Show panels' : 'Hide panels'; }
$('#uiToggle').addEventListener('click', toggleUI);
window.addEventListener('keydown', function (e) {
  var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
  if (e.key === 'Escape' && state.view !== 'ext') leaveSpecial();
  else if ((e.key === 'h' || e.key === 'H') && !typing) toggleUI();
  else if (!typing && state.view === 'ext' && /^[1-9]$/.test(e.key)) { stopTour(); var sc = ['all', 'A', 'B', 'C', 'pool', 'club', 'park', 'locality'][+e.key - 1]; if (e.key === '9') $('[data-time="' + (BB.time.night > 0.5 ? '8.6' : '20.5') + '"]').click(); else if (POI[sc] || sc === 'locality') poi(sc); else view(sc); }
  else if ((e.key === 'p' || e.key === 'P') && !typing && state.view === 'ext') { if (!document.body.classList.contains('clean')) toggleUI(); if (!tour) startTour(); }
});
$('#goFlat').addEventListener('submit', function (e) {
  e.preventDefault(); var v = $('#goFlatIn').value.trim().toUpperCase().replace(/\s+/g, '').replace(/^([ABC])-?(\d+)$/, '$1-$2'), f = byId[v];
  if (!f) { toast('No flat numbered ' + ($('#goFlatIn').value.trim() || 'that') + '. Try a number like B-1203.'); return; }
  if (!matches(f)) $('#resetFilters').click(); select(f);
});
$('#pBody').addEventListener('input', function (e) {
  var t = e.target, f = state.sel; if (!f || !/^emi/.test(t.id)) return;
  if (t.id === 'emiDown') EMI.down = +t.value; if (t.id === 'emiYears') EMI.years = +t.value; if (t.id === 'emiRate') EMI.rate = +t.value;
  var v = emiVal(f); $('#emiD').textContent = EMI.down + '%'; $('#emiY').textContent = EMI.years + ' years'; $('#emiR').textContent = EMI.rate.toFixed(2) + '%';
  $('#emiHead').textContent = '₹' + num(v.emi) + ' a month'; $('#emiNote').textContent = 'Loan of ' + money(v.loan) + ' on the all-in cost. Illustration only.';
});
$('#pBody').addEventListener('toggle', function (e) { if (e.target.id === 'emiFold') EMI.open = e.target.open; }, true);
if (leads.length) $('#leadsBtn').textContent = 'Enquiries (' + leads.length + ')';
var nameEl = $('#projName');
try { var saved = localStorage.getItem('bb-flats-demo-name'); if (saved) nameEl.textContent = saved; } catch (e) {}
nameEl.addEventListener('input', function () { try { localStorage.setItem('bb-flats-demo-name', nameEl.textContent.trim()); } catch (e) {} });
nameEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });

/* ---------- resize and render loop ---------- */
function resize() {
  var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); IN.cam.aspect = w / h; IN.cam.updateProjectionMatrix();
  document.documentElement.style.setProperty('--dock-h', $('#dock').offsetHeight + 'px');
}
window.addEventListener('resize', resize);
var fpsN = 0, fpsT0 = performance.now() + 14000;
function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
BB.onTime = function () { IN.lights(); };
function loop(now) {
  requestAnimationFrame(loop);
  if (pendingHour != null) { BB.setHour(pendingHour); pendingHour = null; }
  if (tween) {
    if (tween.s == null) tween.s = now;
    var k = Math.min(1, (now - tween.s) / tween.ms), e = ease(k);
    tween.cam.position.lerpVectors(tween.p0, tween.p1, e); tween.ctl.target.lerpVectors(tween.t0, tween.t1, e);
    if (k >= 1) { var th = tween.then; tween = null; if (th) th(); else if (tour) tour.next(); }
  }
  doHover();
  if (BB.waterN) { BB.waterN.offset.x += 0.0005; BB.waterN.offset.y += 0.0003; }
  for (var ti = 0; ti < BB.tick.length; ti++) BB.tick[ti](now / 1000);
  renderer.toneMappingExposure = IN.on ? Math.min(BB.time.exp, 0.62) : BB.time.exp;
  var dt = Math.min(0.1, (now - (loop.last || now)) / 1000); loop.last = now;
  if (fpsN >= 0 && now > fpsT0) { fpsN++; if (now - fpsT0 > 6000) { var fps = fpsN / ((now - fpsT0) / 1000); fpsN = -1; if (fps < 12 && hiQ && !BB.lite) { setQuality(false); toast('Switched to Fast quality for a smoother view. Tap Quality in the bottom bar to go back to High.'); } } }
  if (IN.on) {
    if (IN.mode === 'walk') {
      var kf = (keys.arrowup || keys.w ? 1 : 0) - (keys.arrowdown || keys.s ? 1 : 0), ks = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), kt = (keys.arrowleft ? 1 : 0) - (keys.arrowright ? 1 : 0);
      if (kt) IN.look(kt * 9, 0); if (kf || ks) IN.keyMove(kf, ks, dt);
      IN.update(dt, now / 1000); miniT = IN.miniMap($('#miniC'));
    } else IN.ctl.update();
    if (IN.mode === 'walk' && state.sel) {
      var tg = towerInfo[state.sel.tower].group; IN.syncBackdrop(state.sel);
      tg.visible = false; BB.labels.visible = false; renderer.render(scene, IN.bgCam); tg.visible = true; BB.labels.visible = state.labels;
      renderer.autoClear = false; renderer.clearDepth(); IN.scene.background = null; renderer.render(IN.scene, IN.cam); renderer.autoClear = true;
    } else { IN.scene.background = IN.studio; renderer.render(IN.scene, IN.cam); }
  } else {
    controls.update();
    var fd = camera.position.distanceTo(controls.target), fn = Math.min(1700, Math.max(260, fd * 1.15 + 40)); scene.fog.near += (fn - scene.fog.near) * 0.08; scene.fog.far = scene.fog.near + 1500;   // haze begins just beyond what you are looking at
    renderer.render(scene, camera);
  }
}
resize(); BB.setHour(17.4); view('all', 0);
var intro = false;
function endIntro() { if (!intro) return; intro = false; document.body.classList.remove('clean', 'intro'); $('#introCap').hidden = true; var b = $('#uiToggle'); b.setAttribute('aria-pressed', 'false'); b.querySelector('span').textContent = 'Hide panels'; }
if (!reduceMotion && (!BB.lite || /intro/.test(location.search))) { // opening flythrough: over the locality, across the park, around the towers, then home
  var k0 = fit(), home = camera.position.clone(), homeT = controls.target.clone(), V = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  var shots = [[V(-420 * k0, 150 * k0, 620 * k0), V(0, 30, 60), 0], [V(-150 * k0, 70 * k0, 330 * k0), V(0, 26, 40), 4200], [V(150 * k0, 44 * k0, 190 * k0), V(0, 34, -10), 4600], [home, homeT, 3600]], si = 0;
  intro = true; document.body.classList.add('clean', 'intro'); $('#introCap').hidden = false;
  var step = function () { if (!intro) return; si++; if (si >= shots.length) { endIntro(); return; } fly(shots[si][0], shots[si][1], shots[si][2]); if (tween) tween.then = step; };
  camera.position.copy(shots[0][0]); controls.target.copy(shots[0][1]); BB.startIntro = step;
  canvas.addEventListener('pointerdown', endIntro); window.addEventListener('keydown', endIntro);
}
controls.update(); budgetLabel(); refresh();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
requestAnimationFrame(loop);
requestAnimationFrame(function () { requestAnimationFrame(function () { if (BB.startIntro) BB.startIntro(); $('#boot').classList.add('done'); setTimeout(function () { $('#boot').hidden = true; }, 900); }); });
})();
