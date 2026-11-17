/* Towers: each flat is a real facade module with recessed glazing, framed bay windows and a curved corner balcony. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var S = BB.S, M = BB.M, nb = BB.nb, merge = BB.merge, cnv = BB.cnv, ctex = BB.ctex, scene = BB.scene, rng = BB.rng;
var W = BB.W, D = BB.D, FH = BB.FH, POD = BB.POD, HW = W / 2, HD = D / 2;

/* materials */
var T = BB.TM = {
  wall: S({ map: BB.noiseTex(256, '#ddd4c3', 2600, 0.05, [3, 1], 41), roughness: 0.92 }),
  slab: S({ color: 0xfaf8f3, roughness: 0.75 }),
  frame: S({ color: 0x2b3034, roughness: 0.45, metalness: 0.5, envMapIntensity: 0.8 }),
  glass: S({ color: 0x3f5560, roughness: 0.05, metalness: 0.95, envMapIntensity: 1.5 }),
  lit: S({ color: 0x8a7a62, roughness: 0.2, metalness: 0.3, emissive: 0xffd49a, emissiveIntensity: 0, envMapIntensity: 0.9 }),
  lit2: S({ color: 0x7f8790, roughness: 0.2, metalness: 0.3, emissive: 0xfff0d8, emissiveIntensity: 0, envMapIntensity: 0.9 }),
  rail: S({ color: 0xa9cfd9, transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.6, depthWrite: false, envMapIntensity: 1.4, side: THREE.DoubleSide }),
  accent: S({ map: ctex(BB.slatC(), [2, 1]), roughness: 0.55 }),
  soffit: S({ map: ctex(BB.slatC(), [6, 6]), roughness: 0.6, emissive: 0xffc98a, emissiveIntensity: 0 }),
  core: S({ color: 0x2f4048, roughness: 0.08, metalness: 0.9, emissive: 0xffe2b0, emissiveIntensity: 0, envMapIntensity: 1.2 }),
  led: S({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0.15 }),
  glaz: S({ color: 0x86a3b0, roughness: 0.08, metalness: 0.85, emissive: 0xffd9a8, emissiveIntensity: 0, envMapIntensity: 1.2 }),
  planter: S({ color: 0x3a3f42, roughness: 0.7 }),
  beacon: S({ color: 0xff5a4a, emissive: 0xff3a2a, emissiveIntensity: 0 })
};
function tint(hex, em) { return [S({ map: T.wall.map, color: hex, emissive: hex, emissiveIntensity: em, roughness: 0.9 }), S({ color: hex, emissive: hex, emissiveIntensity: em * 0.8, roughness: 0.8 })]; }
BB.FM = { // flat material sets: [wall, slab]
  real: [T.wall, T.slab], available: tint(0x4fd89a, 0.2), hold: tint(0xffbe45, 0.2), sold: tint(0xee7268, 0.2),
  dim: (function () { var m = S({ color: 0x3b4247, roughness: 1 }); return [m, m]; })(),
  sel: (function () { var m = S({ color: 0xffd98a, emissive: 0xffb84d, emissiveIntensity: 0.75, roughness: 0.6 }); return [m, m]; })()
};
BB.timeHooks.push(function (t) {
  var dusk = t.night + (t.gold || 0) * 0.3;   // some lights are already on at sunset
  T.lit.emissiveIntensity = dusk * 1.25; T.lit2.emissiveIntensity = dusk * 0.8; T.core.emissiveIntensity = dusk * 0.75; T.led.emissiveIntensity = 0.15 + dusk * 2.2;
  T.glaz.emissiveIntensity = dusk * 1.1; T.soffit.emissiveIntensity = t.night * 0.28; T.beacon.emissiveIntensity = t.night * 2.5;
});

/* rounded rectangle on the ground plane, per-corner radius: [x0z0, x1z0, x1z1, x0z1] */
function rr(x0, z0, x1, z1, r) {
  var s = new THREE.Shape();
  s.moveTo(x0 + r[0], z0); s.lineTo(x1 - r[1], z0); s.quadraticCurveTo(x1, z0, x1, z0 + r[1]); s.lineTo(x1, z1 - r[2]); s.quadraticCurveTo(x1, z1, x1 - r[2], z1);
  s.lineTo(x0 + r[3], z1); s.quadraticCurveTo(x0, z1, x0, z1 - r[3]); s.lineTo(x0, z0 + r[0]); s.quadraticCurveTo(x0, z0, x0 + r[0], z0); return s;
}
function slabOf(shape, top, thick, hole) { // extruded flat piece: top surface at y = top
  if (hole) shape.holes.push(hole);
  var g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 7 }); g.rotateX(Math.PI / 2); g.translate(0, top, 0); return g;
}
BB.rr = rr; BB.slabOf = slabOf;

/* one flat (a quadrant of the floor plate) as lists of geometry per material */
function quadrant(sx, sz, withPlanter) {
  var G = { wall: [], slab: [], frame: [], glassA: [], glassB: [], rail: [], accent: [], soffit: [], core: [], planter: [] };
  function q(list, xa, xb, ya, yb, za, zb) { list.push(nb(xb - xa, yb - ya, zb - za, sx * (xa + xb) / 2, (ya + yb) / 2, sz * (za + zb) / 2)); }
  var Y0 = 0.3, Y1 = FH;
  q(G.slab, 0, HW + 0.18, 0, Y0, 0, HD + 0.18);                     // floor slab edge
  q(G.wall, 0.8, HW - 0.3, Y0, Y1, 0, HD - 0.3);                    // solid body behind the facade
  q(G.core, 0, 0.8, Y0, Y1, HD - 1.5, HD - 1.45);                   // glazed lift lobby slot
  q(G.frame, 0, 0.8, Y0 + 1.4, Y0 + 1.47, HD - 1.5, HD - 1.42);
  // front: pier, framed bedroom bay, timber panel, corner glazing, corner column
  q(G.wall, 0.8, 2.0, Y0, Y1, HD - 0.3, HD);
  q(G.wall, 2.0, 6.2, Y0, 1.1, HD - 0.3, HD); q(G.wall, 2.0, 6.2, 2.78, Y1, HD - 0.3, HD); q(G.glassA, 2.0, 6.2, 1.1, 2.78, HD - 0.26, HD - 0.2);
  q(G.frame, 1.94, 6.26, 2.72, 2.8, HD - 0.3, HD + 0.2); q(G.frame, 1.94, 6.26, 1.06, 1.14, HD - 0.3, HD + 0.2); q(G.frame, 1.94, 2.02, 1.06, 2.8, HD - 0.3, HD + 0.2); q(G.frame, 6.18, 6.26, 1.06, 2.8, HD - 0.3, HD + 0.2);
  q(G.frame, 4.07, 4.13, 1.14, 2.72, HD - 0.3, HD - 0.14); q(G.frame, 2.02, 6.18, 2.2, 2.24, HD - 0.28, HD - 0.16);
  q(G.wall, 6.2, 6.5, Y0, Y1, HD - 0.3, HD); q(G.accent, 6.5, 7.4, Y0, Y1, HD - 0.3, HD + 0.03); q(G.wall, 7.4, 7.6, Y0, Y1, HD - 0.3, HD);
  q(G.glassB, 7.6, HW - 0.5, Y0, 3.02, HD - 0.3, HD - 0.24); q(G.wall, 7.6, HW - 0.5, 3.02, Y1, HD - 0.3, HD);
  for (var mx = 7.6; mx < HW - 0.4; mx += 1.225) q(G.frame, mx - 0.03, mx + 0.03, Y0, 3.02, HD - 0.32, HD - 0.2);
  q(G.frame, 7.6, HW - 0.5, 2.36, 2.4, HD - 0.31, HD - 0.21);
  q(G.wall, HW - 0.5, HW, Y0, Y1, HD - 0.5, HD);
  // side: corner glazing, pier, framed window, louvre panel, small frosted window
  q(G.glassB, HW - 0.3, HW - 0.24, Y0, 3.02, 5.6, HD - 0.5); q(G.wall, HW - 0.3, HW, 3.02, Y1, 5.6, HD - 0.5);
  for (var mz = 5.6; mz < HD - 0.4; mz += 1.3) q(G.frame, HW - 0.32, HW - 0.2, Y0, 3.02, mz - 0.03, mz + 0.03);
  q(G.frame, HW - 0.31, HW - 0.21, 2.36, 2.4, 5.6, HD - 0.5);
  q(G.wall, HW - 0.3, HW, Y0, Y1, 4.9, 5.6);
  q(G.wall, HW - 0.3, HW, Y0, 1.1, 2.5, 4.9); q(G.wall, HW - 0.3, HW, 2.78, Y1, 2.5, 4.9); q(G.glassA, HW - 0.26, HW - 0.2, 1.1, 2.78, 2.5, 4.9);
  q(G.frame, HW - 0.3, HW + 0.2, 2.72, 2.8, 2.44, 4.96); q(G.frame, HW - 0.3, HW + 0.2, 1.06, 1.14, 2.44, 4.96); q(G.frame, HW - 0.3, HW + 0.2, 1.06, 2.8, 2.44, 2.52); q(G.frame, HW - 0.3, HW + 0.2, 1.06, 2.8, 4.88, 4.96);
  q(G.frame, HW - 0.3, HW - 0.14, 1.14, 2.72, 3.67, 3.73);
  q(G.wall, HW - 0.3, HW, Y0, Y1, 2.2, 2.5);
  q(G.frame, HW - 0.3, HW + 0.02, Y0 + 0.2, Y1 - 0.25, 1.15, 2.2); for (var ly = 0.7; ly < 2.9; ly += 0.16) q(G.accent, HW - 0.02, HW + 0.05, ly, ly + 0.07, 1.15, 2.2);
  q(G.wall, HW - 0.3, HW, Y0, Y1, 0, 1.15); q(G.glassA, HW - 0.02, HW + 0.02, 1.75, 2.5, 0.35, 0.95); q(G.frame, HW - 0.01, HW + 0.05, 1.7, 1.76, 0.3, 1.0);
  // curved corner balcony: slab, timber soffit, glass rail, handrail
  var x0 = Math.min(sx * 7.3, sx * (HW + 1.75)), x1 = Math.max(sx * 7.3, sx * (HW + 1.75)), z0 = Math.min(sz * 4.9, sz * (HD + 1.75)), z1 = Math.max(sz * 4.9, sz * (HD + 1.75));
  var big = 1.7, sm = 0.12, rad = [sx < 0 && sz < 0 ? big : sm, sx > 0 && sz < 0 ? big : sm, sx > 0 && sz > 0 ? big : sm, sx < 0 && sz > 0 ? big : sm], inr = rad.map(function (v) { return Math.max(0.05, v - 0.05); });
  G.slab.push(slabOf(rr(x0, z0, x1, z1, rad), Y0, 0.2));
  G.soffit.push(slabOf(rr(x0 + 0.12, z0 + 0.12, x1 - 0.12, z1 - 0.12, inr), Y0 - 0.2, 0.03));
  G.rail.push(slabOf(rr(x0 + 0.08, z0 + 0.08, x1 - 0.08, z1 - 0.08, inr), Y0 + 1.08, 1.02, rr(x0 + 0.12, z0 + 0.12, x1 - 0.12, z1 - 0.12, inr)));
  G.frame.push(slabOf(rr(x0 + 0.04, z0 + 0.04, x1 - 0.04, z1 - 0.04, rad), Y0 + 1.14, 0.06, rr(x0 + 0.16, z0 + 0.16, x1 - 0.16, z1 - 0.16, inr)));
  if (withPlanter) { q(G.planter, 7.5, 9.6, Y0, Y0 + 0.42, HD + 1.2, HD + 1.6); }
  return G;
}
var QUADS = {};
BB.UNITS.forEach(function (u) { [0, 1].forEach(function (v) { var G = quadrant(u.sx, u.sz, v === 1), o = {}; Object.keys(G).forEach(function (k) { o[k] = merge(G[k]); }); o.flat = THREE.BufferGeometryUtils.mergeBufferGeometries([o.wall, o.slab], true); QUADS[u.n + v] = o; }); });

var flatMeshes = BB.flatMeshes = [], towerInfo = BB.towerInfo = {};
var edge = new THREE.EdgesGeometry(new THREE.BoxGeometry(HW + 0.4, FH, HD + 0.4));
var outline = BB.outline = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true })); outline.renderOrder = 15; outline.visible = false;
var hoverLine = BB.hoverLine = new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0xe6c98a, depthTest: false, transparent: true })); hoverLine.renderOrder = 14; hoverLine.visible = false;
BB.attachLine = function (line, f) { f.mesh.add(line); line.position.set(f.u.sx * HW / 2, FH / 2, f.u.sz * HD / 2); line.visible = true; };

BB.CONFIG.towers.forEach(function (t) {
  var g = new THREE.Group(); g.position.set(t.x, 0, t.z); g.rotation.y = t.rot; scene.add(g);
  var H = t.floors * FH, top = POD + H, r = rng(t.id.charCodeAt(0) * 13), st = { frame: [], glass: [], lit: [], lit2: [], rail: [], accent: [], soffit: [], core: [], planter: [] }, bushes = [];
  function add(list, geo, y) { if (geo) { var c = geo.clone(); c.translate(0, y, 0); list.push(c); } }
  var c0 = Math.cos(t.rot), s0 = Math.sin(t.rot);
  for (var f = 1; f <= t.floors; f++) {
    var y0 = POD + (f - 1) * FH;
    BB.UNITS.forEach(function (u) {
      var flat = BB.byId[t.id + '-' + f + u.n], v = flat.variant === 1 ? 1 : 0, Q = QUADS[u.n + v], m = new THREE.Mesh(Q.flat, BB.FM.real);
      m.position.y = y0; m.castShadow = true; m.receiveShadow = true; m.userData.flat = flat; flat.mesh = m; g.add(m); flatMeshes.push(m);
      var lx = u.sx * HW / 2, lz = u.sz * HD / 2; flat.wpos = new THREE.Vector3(t.x + lx * c0 + lz * s0, y0 + FH / 2, t.z - lx * s0 + lz * c0); flat.y0 = y0;
      add(st.frame, Q.frame, y0); add(st.rail, Q.rail, y0); add(st.accent, Q.accent, y0); add(st.soffit, Q.soffit, y0); add(st.core, Q.core, y0); add(st.planter, Q.planter, y0);
      var a = r(), b = r(); add(a < 0.3 ? st.lit : a < 0.42 ? st.lit2 : st.glass, Q.glassA, y0); add(b < 0.42 ? st.lit : b < 0.55 ? st.lit2 : st.glass, Q.glassB, y0);
      if (v) { [7.9, 8.6, 9.2].forEach(function (px, i) { bushes.push([u.sx * px, y0 + 0.92, u.sz * (HD + 1.4), 0.34 + (i % 2) * 0.08, i]); }); }
    });
  }
  function mesh(list, mat, cast) { var geo = merge(list); if (!geo) return; var m = new THREE.Mesh(geo, mat); m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m; }
  mesh(st.frame, T.frame); mesh(st.glass, T.glass, false); mesh(st.lit, T.lit, false); mesh(st.lit2, T.lit2, false); mesh(st.accent, T.accent, false); mesh(st.soffit, T.soffit, false); mesh(st.core, T.core, false); mesh(st.planter, T.planter);
  var rm = mesh(st.rail, T.rail, false); if (rm) rm.renderOrder = 3;
  if (bushes.length) BB.instanced(BB.shrubGeo, M.leaf, bushes, g, false);

  /* crown: roof slab, glass parapet, sky-deck canopy on slim columns, lift core with lit letter */
  var B = function (w, h, d, mat, x, y, z, cast) { return BB.box(w, h, d, mat, x, y, z, g, cast); };
  B(W + 0.5, 0.4, D + 0.5, T.slab, 0, top + 0.2, 0);
  [[0, HD + 0.1, W + 0.3, 0.05], [0, -(HD + 0.1), W + 0.3, 0.05], [HW + 0.1, 0, 0.05, D + 0.3], [-(HW + 0.1), 0, 0.05, D + 0.3]].forEach(function (p) { B(p[2], 1.1, p[3], T.rail, p[0], top + 0.95, p[1], false); B(p[2] + 0.06, 0.06, p[3] + 0.06, T.frame, p[0], top + 1.53, p[1], false); });
  B(7, 5.4, 5.6, M.char, 0, top + 3.1, -1.5); B(7.5, 0.25, 6.1, T.slab, 0, top + 5.92, -1.5);
  [1, -1].forEach(function (s) {
    var cs = slabOf(rr(s > 0 ? 3.6 : -(HW + 1.6), -(HD + 1.2), s > 0 ? HW + 1.6 : -3.6, HD + 1.2, [1.2, 1.2, 1.2, 1.2]), top + 4.5, 0.32), cm = new THREE.Mesh(cs, T.slab); cm.castShadow = true; g.add(cm);
    var sf = new THREE.Mesh(slabOf(rr(s > 0 ? 3.9 : -(HW + 1.3), -(HD + 0.9), s > 0 ? HW + 1.3 : -3.9, HD + 0.9, [1, 1, 1, 1]), top + 4.18, 0.04), T.soffit); g.add(sf);
    var ld = new THREE.Mesh(slabOf(rr(s > 0 ? 3.7 : -(HW + 1.5), -(HD + 1.1), s > 0 ? HW + 1.5 : -3.7, HD + 1.1, [1.1, 1.1, 1.1, 1.1]), top + 4.2, 0.07, rr(s > 0 ? 3.85 : -(HW + 1.35), -(HD + 0.95), s > 0 ? HW + 1.35 : -3.85, HD + 0.95, [1, 1, 1, 1])), T.led); g.add(ld);
    [[HW - 0.6, HD - 0.6], [HW - 0.6, -(HD - 0.6)], [5, HD - 0.6], [5, -(HD - 0.6)]].forEach(function (p) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.8, 12), T.frame); c.position.set(s * p[0], top + 2.3, p[1]); c.castShadow = true; g.add(c); });
    for (var i = 0; i < 4; i++) { var sp = B(1.7, 0.05, 2.9, M.solar, s * (6.2 + i * 1.9), top + 4.6, 0, false); sp.rotation.x = -0.12; }
  });
  var lc = cnv(256, 256), lg = lc.getContext('2d'); lg.fillStyle = '#2f3438'; lg.fillRect(0, 0, 256, 256); lg.font = '400 190px Marcellus, Georgia, serif'; lg.fillStyle = '#f6e3b8'; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillText(t.id, 128, 138);
  var lt = ctex(lc), lm = S({ map: lt, emissiveMap: lt, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.5 }); BB.timeHooks.push(function (tm) { lm.emissiveIntensity = 0.2 + tm.night * 1.5; });
  [1, -1].forEach(function (s) { var p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), lm); p.position.set(0, top + 3.7, -1.5 + s * 2.82); if (s < 0) p.rotation.y = Math.PI; g.add(p); });
  var bc = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), T.beacon); bc.position.set(0, top + 6.4, -1.5); g.add(bc);

  /* podium: stone base, colonnade with glazed lobby, fascia, canopy, garden terrace */
  var PW = W + 16, PD = D + 14, pz = PD / 2;
  B(PW, 0.5, PD, M.stone, 0, 0.25, 0); B(PW - 1, POD - 1.7, PD - 6, M.paint, 0, 0.5 + (POD - 1.7) / 2, 0);
  B(PW, 1.2, PD, T.slab, 0, POD - 0.6, 0); B(PW + 0.3, 0.12, PD + 0.3, M.char, 0, POD - 1.26, 0, false);
  B(PW - 3, POD - 1.8, 0.25, T.glaz, 0, 0.5 + (POD - 1.8) / 2, pz - 3, false); B(PW - 3, POD - 1.8, 0.25, T.glaz, 0, 0.5 + (POD - 1.8) / 2, -(pz - 3), false);
  B(0.25, POD - 1.8, PD - 6, T.glaz, PW / 2 - 0.6, 0.5 + (POD - 1.8) / 2, 0, false); B(0.25, POD - 1.8, PD - 6, T.glaz, -(PW / 2 - 0.6), 0.5 + (POD - 1.8) / 2, 0, false);
  var cols = []; for (var cx = -(PW / 2 - 1); cx <= PW / 2 - 0.9; cx += (PW - 2) / 9) { cols.push([cx, 0.5 + (POD - 1.7) / 2, pz - 0.9, 0.75, 0, POD - 1.7, 0.75], [cx, 0.5 + (POD - 1.7) / 2, -(pz - 0.9), 0.75, 0, POD - 1.7, 0.75]); }
  BB.instanced(BB.unit, M.paint, cols, g);
  var mul = []; for (var gx = -(PW / 2 - 2); gx <= PW / 2 - 2; gx += 2.2) mul.push([gx, 0.5 + (POD - 1.8) / 2, pz - 2.86, 0.07, 0, POD - 1.8, 0.07], [gx, 0.5 + (POD - 1.8) / 2, -(pz - 2.86), 0.07, 0, POD - 1.8, 0.07]);
  BB.instanced(BB.unit, T.frame, mul, g, false);
  B(13, 0.3, 6.5, M.char, 0, POD - 2.1, pz + 2.2); B(12.6, 0.06, 6.1, T.soffit, 0, POD - 2.28, pz + 2.2, false); B(0.3, POD - 2.3, 0.3, T.frame, -5.8, (POD - 2.3) / 2, pz + 5); B(0.3, POD - 2.3, 0.3, T.frame, 5.8, (POD - 2.3) / 2, pz + 5);
  B(11, 0.18, 2.2, M.stone, 0, 0.09, pz + 1.1, false);
  var sc0 = cnv(512, 96), sg0 = sc0.getContext('2d'); sg0.fillStyle = '#f6f3ec'; sg0.fillRect(0, 0, 512, 96); sg0.font = '400 50px Marcellus, Georgia, serif'; sg0.fillStyle = '#2b3034'; sg0.textAlign = 'center'; sg0.textBaseline = 'middle'; sg0.fillText('T O W E R   ' + t.id, 256, 50);
  var sgn = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.2), S({ map: ctex(sc0), roughness: 0.6 })); sgn.position.set(0, POD - 0.6, pz + 0.02); g.add(sgn);
  // terrace: glass parapet, planting, small trees
  [[0, pz - 0.1, PW - 0.2, 0.05], [0, -(pz - 0.1), PW - 0.2, 0.05], [PW / 2 - 0.1, 0, 0.05, PD - 0.2], [-(PW / 2 - 0.1), 0, 0.05, PD - 0.2]].forEach(function (p) { B(p[2], 1.0, p[3], T.rail, p[0], POD + 0.5, p[1], false); });
  var tb = []; for (var k = 0; k < 44; k++) { var side = k % 4, u2 = (r() - 0.5), px = side < 2 ? u2 * (PW - 4) : (side === 2 ? 1 : -1) * (PW / 2 - 2.2 - r() * 1.6), pz2 = side < 2 ? (side === 0 ? 1 : -1) * (pz - 2 - r() * 1.6) : u2 * (PD - 4); tb.push([px, POD - 0.25, pz2, 0.9 + r() * 0.7, r() * 6]); }
  BB.instanced(BB.shrubGeo, M.leaf, tb, g);
  B(PW - 1.5, 0.04, 3.6, M.grass, 0, POD + 0.02, pz - 2.4, false); B(PW - 1.5, 0.04, 3.6, M.grass, 0, POD + 0.02, -(pz - 2.4), false);
  BB.plantTrees([[-(PW / 2 - 3), pz - 2.6, 0.55, 1, 5], [PW / 2 - 3, pz - 2.6, 0.55, 2, 3], [-(PW / 2 - 3), -(pz - 2.6), 0.55, 3, 4], [PW / 2 - 3, -(pz - 2.6), 0.55, 4, 0]].map(function (q) { return q; }), (function () { var tg = new THREE.Group(); tg.position.y = POD; g.add(tg); return tg; })());
  var lb = BB.label('Tower ' + t.id); lb.position.set(t.x, top + 16, t.z);
  var pv = BB.box(PW + 16, 0.14, PD + 14, S({ map: ctex(BB.paverC(), [14, 12]), roughness: 0.9 }), 0, 0.08, 0, g, false);
  towerInfo[t.id] = { x: t.x, z: t.z, H: top, rot: t.rot, group: g, PW: PW, PD: PD };
});
scene.add(outline); scene.add(hoverLine);
})();
