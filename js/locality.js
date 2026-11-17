/* Locality: street grid with footpaths and crossings, plotted buildings, park and lake, school, mall, hospital, metro, traffic, hills. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var S = BB.S, M = BB.M, T = BB.TM, box = BB.box, instanced = BB.instanced, label = BB.label, cnv = BB.cnv, ctex = BB.ctex, scene = BB.scene, rng = BB.rng, nb = BB.nb, merge = BB.merge;
var r = rng(2026), i, j;

var base = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), M.land); base.rotation.x = -Math.PI / 2; base.position.y = -0.3; base.receiveShadow = true; scene.add(base);

/* ---------- street grid ---------- */
var XS = [], ZS = [];
for (i = 150; i <= 1110; i += 120) { XS.push(i); XS.unshift(-i); }
for (i = 126; i <= 1086; i += 120) ZS.push(i);
for (i = -118; i >= -1078; i -= 120) ZS.unshift(i);
function wX(x) { return Math.abs(x) === 150 ? 11 : 9; }
function wZ(z) { return z === 126 ? 18 : 9; }
var LEN = 2340;
XS.forEach(function (x) { var m = BB.road(LEN, wX(x), x, 4, Math.PI / 2); m.position.y = 0.05; });
ZS.forEach(function (z) { var m = box(LEN, 0.12, wZ(z), S({ map: ctex(z === 126 ? arterialC() : BB.roadC(true), [LEN / 12, 1]), roughness: 0.95 }), 0, 0.06, z, null, false); });
function arterialC() { var c = cnv(512, 256), g = c.getContext('2d'), rr = rng(14); g.fillStyle = '#3f4347'; g.fillRect(0, 0, 512, 256); BB.speckle(g, 512, 256, 6000, 0.09, rr); g.fillStyle = 'rgba(240,238,225,.8)'; [64, 192].forEach(function (y) { g.fillRect(40, y - 3, 180, 6); g.fillRect(296, y - 3, 180, 6); }); g.fillStyle = 'rgba(245,205,70,.85)'; g.fillRect(0, 118, 512, 4); g.fillRect(0, 134, 512, 4); g.fillStyle = 'rgba(240,238,225,.55)'; g.fillRect(0, 5, 512, 4); g.fillRect(0, 247, 512, 4); return c; }
// crossings with zebra stripes
var zc = cnv(256, 256), zg = zc.getContext('2d'); zg.fillStyle = '#3f4347'; zg.fillRect(0, 0, 256, 256); BB.speckle(zg, 256, 256, 2500, 0.09, rng(15)); zg.fillStyle = 'rgba(242,240,228,.9)';
for (i = 44; i < 216; i += 22) { zg.fillRect(i, 8, 11, 30); zg.fillRect(i, 218, 11, 30); zg.fillRect(8, i, 30, 11); zg.fillRect(218, i, 30, 11); }
var crossG = new THREE.PlaneGeometry(1, 1); crossG.rotateX(-Math.PI / 2); var cross = [];
XS.forEach(function (x) { ZS.forEach(function (z) { if (Math.hypot(x, z) < 900) cross.push([x, 0.135, z, wX(x) + 7, 0, 1, wZ(z) + 7]); }); });
instanced(crossG, S({ map: ctex(zc), roughness: 0.95 }), cross, null, false);
// arterial median with planting and twin lamps
box(LEN, 0.3, 1.4, M.paint, 0, 0.2, 126, null, false);
var med = [], mlamp = [], mpole = [], mpool = [];
for (i = -700; i <= 700; i += 5) { if (XS.some(function (x) { return Math.abs(x - i) < 12; }) || Math.abs(i) < 14) continue; med.push([i, 0.3, 126, 0.55 + r() * 0.2, r() * 6]); }
for (i = -660; i <= 660; i += 40) { if (XS.some(function (x) { return Math.abs(x - i) < 10; })) continue; mpole.push([i, 4.2, 126, 1, 0, 1.95, 1]); mlamp.push([i, 8.3, 123.2], [i, 8.3, 128.8]); mpool.push([i, 0.26, 121, 22], [i, 0.26, 131, 22]); }
instanced(BB.shrubGeo, M.leaf, med, null, false);
instanced(new THREE.CylinderGeometry(0.08, 0.12, 4.3, 6), M.dark, mpole, null, false); instanced(new THREE.BoxGeometry(0.5, 0.12, 6.4), M.dark, mpole.map(function (p) { return [p[0], 8.45, 126]; }), null, false);
instanced(new THREE.SphereGeometry(0.4, 10, 8), M.lamp, mlamp, null, false);
var apool = instanced(BB.poolGeo, BB.poolMat, mpool, null, false); apool.receiveShadow = false; apool.visible = false; BB.timeHooks.push(function (t) { apool.visible = t.night > 0.02; });

/* ---------- facade texture: 8 x 8 bays, with a matching night map ---------- */
function bays(seed, style) {
  var c = cnv(1024, 1024), e = cnv(1024, 1024), g = c.getContext('2d'), eg = e.getContext('2d'), rr = rng(seed), B = 128;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024); eg.fillStyle = '#000'; eg.fillRect(0, 0, 1024, 1024);
  for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) {
    var X = x * B, Y = y * B, door = style === 1 && rr() < 0.35, wx = X + (door ? 30 : 34), ww = door ? 68 : 60, wy = Y + (door ? 26 : 34), wh = door ? 88 : 56;
    g.fillStyle = 'rgba(0,0,0,.10)'; g.fillRect(X, Y + B - 7, B, 7);                       // floor band
    g.fillStyle = 'rgba(0,0,0,.26)'; g.fillRect(wx - 6, wy - 9, ww + 12, 7);              // sunshade shadow
    g.fillStyle = '#d9d5cc'; g.fillRect(wx - 7, wy - 13, ww + 14, 5);                     // sunshade
    g.fillStyle = '#3a4046'; g.fillRect(wx, wy, ww, wh);
    var gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#9fb6c2'); gr.addColorStop(1, '#465a66'); g.fillStyle = gr; g.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);
    var cur = rr(); if (cur < 0.45) { g.fillStyle = 'rgba(236,226,208,.7)'; g.fillRect(wx + 3, wy + 3, (ww - 6) * (0.3 + rr() * 0.3), wh - 6); }
    g.fillStyle = '#3a4046'; g.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
    if (door) { g.strokeStyle = '#4a5056'; g.lineWidth = 2; for (var k = 0; k < 9; k++) { g.beginPath(); g.moveTo(wx - 8 + k * 11, wy + wh - 30); g.lineTo(wx - 8 + k * 11, wy + wh + 2); g.stroke(); } g.fillStyle = '#4a5056'; g.fillRect(wx - 10, wy + wh - 32, ww + 20, 3); g.fillStyle = '#e9e6de'; g.fillRect(wx - 12, wy + wh, ww + 24, 6); }
    else { g.fillStyle = '#eeebe3'; g.fillRect(wx - 4, wy + wh, ww + 8, 4); if (rr() < 0.22) { g.fillStyle = '#c9ccc9'; g.fillRect(wx + ww + 6, wy + wh - 16, 18, 14); } }
    if (rr() < 0.36) { var lg = eg.createLinearGradient(0, wy, 0, wy + wh); lg.addColorStop(0, rr() > 0.4 ? '#ffd9a2' : '#fff0d8'); lg.addColorStop(1, '#b97a3a'); eg.fillStyle = lg; eg.fillRect(wx + 3, wy + 3, ww - 6, wh - 6); eg.fillStyle = '#000'; eg.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); }
  }
  BB.speckle(g, 1024, 1024, 9000, 0.035, rr); g.fillStyle = 'rgba(236,234,228,.5)'; g.fillRect(0, 0, 1024, 1024);
  var m = ctex(c, [1, 1]), em = ctex(e, [1, 1]); return S({ map: m, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughness: 0.88, envMapIntensity: 0.3 });
}
var cityMats = [bays(40, 0), bays(41, 1)];
BB.timeHooks.push(function (t) { cityMats.forEach(function (m) { m.emissiveIntensity = t.night * 0.7; }); });
var PAL = [[0.6, 0.54, 0.43], [0.64, 0.62, 0.57], [0.62, 0.46, 0.33], [0.6, 0.39, 0.32], [0.45, 0.52, 0.56], [0.58, 0.47, 0.27], [0.5, 0.5, 0.48], [0.54, 0.31, 0.22], [0.52, 0.56, 0.45], [0.66, 0.58, 0.44], [0.7, 0.66, 0.6]];
PAL = PAL.map(function (c) { return [c[0] * 0.3 + 0.47, c[1] * 0.3 + 0.46, c[2] * 0.3 + 0.44]; });   // the surroundings are kept muted so the project stands out
var L = { near: [[], []], far: [[], []], white: [], tank: [], dark: [] };
function building(x, z, w, d, floors, colIx, style) {
  var h = floors * 3.2 + 0.5, g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv, n = g.attributes.position.count, col = new Float32Array(n * 3), c = PAL[colIx % PAL.length], uo = Math.floor(r() * 8) / 8, vo = Math.floor(r() * 8) / 8, rf = [[0.5, 0.49, 0.47], [0.53, 0.48, 0.45], [0.47, 0.48, 0.49], [0.55, 0.54, 0.51]][Math.floor(r() * 4)];
  for (var k = 0; k < n; k++) {
    var face = Math.floor(k / 6);
    if (face === 2 || face === 3) { uv.setXY(k, 0.002, 0.002); col[k * 3] = rf[0]; col[k * 3 + 1] = rf[1]; col[k * 3 + 2] = rf[2]; }
    else { var fw = face < 2 ? d : w; uv.setXY(k, uo + uv.getX(k) * Math.max(1, Math.round(fw / 3.4)) / 8, vo + uv.getY(k) * floors / 8); col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.translate(x, h / 2 + 0.2, z);
  var dist = Math.hypot(x, z); (dist < 560 ? L.near : L.far)[style].push(g);
  var top = h + 0.2;
  if (dist < 900) {
    L.white.push(nb(w + 0.5, 0.3, d + 0.5, x, top + 0.15, z));
    if (r() < 0.7) { var tx = x + (r() - 0.5) * w * 0.5, tz = z + (r() - 0.5) * d * 0.5; var cy = new THREE.CylinderGeometry(0.95, 1.0, 1.5, 12).toNonIndexed(); cy.translate(tx, top + 1.6, tz); L.tank.push(cy); L.white.push(nb(2.3, 0.55, 2.3, tx, top + 0.55, tz)); }
    if (floors > 2) L.dark.push(nb(3.2, 2.6, 3.4, x - w * 0.25, top + 1.5, z - d * 0.2));
    if (floors >= 4 && dist < 620) for (var f = 1; f < floors; f++) { L.white.push(nb(w * 0.82, 0.14, 1.2, x, 0.2 + f * 3.2, z + d / 2 + 0.6)); if (f % 2) L.white.push(nb(1.2, 0.14, d * 0.6, x + w / 2 + 0.6, 0.2 + f * 3.2, z)); }
  }
}
/* ---------- blocks ---------- */
var slabs = [], plots = [], plotCol = [], nearTrees = [], farTrees = [], parked = [];
var X2 = XS.slice(), Z2 = ZS.slice();
function special(xa, xb, za, zb) { // returns a name for blocks that are not ordinary housing
  if (xa === -150 && xb === 150 && za === -118) return 'site';
  if (xa === -150 && xb === 150 && za === 126) return 'park';
  if (xa === 150 && za === 126) return 'school';
  if (xb === -150 && za === 126) return 'mall';
  if (xa === 270 && za === -118) return 'hospital';
  return null;
}
for (i = 0; i < X2.length - 1; i++) for (j = 0; j < Z2.length - 1; j++) {
  var xa = X2[i], xb = X2[i + 1], za = Z2[j], zb = Z2[j + 1];
  var x0 = xa + wX(xa) / 2 + 0.3, x1 = xb - wX(xb) / 2 - 0.3, z0 = za + wZ(za) / 2 + 0.3, z1 = zb - wZ(zb) / 2 - 0.3, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, bw = x1 - x0, bd = z1 - z0, dist = Math.hypot(cx, cz), sp = special(xa, xb, za, zb);
  if (dist > 1250 || sp === 'site') continue;
  slabs.push([cx, 0.1, cz, bw, 0, 0.2, bd]);
  if (sp === 'park') continue;
  plots.push([cx, 0.215, cz, bw - 5, 0, 1, bd - 5]); plotCol.push(r() < 0.4 ? [0.5, 0.55, 0.42] : [0.58, 0.55, 0.49]);
  if (sp) continue;
  var cols = Math.max(1, Math.round((bw - 8) / 27)), rows = Math.max(1, Math.round((bd - 8) / 27)), cw = (bw - 8) / cols, cd = (bd - 8) / rows, tallish = Math.abs(cz - 126) < 190 || Math.abs(Math.abs(cx) - 150) < 70;
  for (var a = 0; a < cols; a++) for (var b = 0; b < rows; b++) {
    var px = x0 + 4 + cw * (a + 0.5), pz = z0 + 4 + cd * (b + 0.5), q = r();
    if (q < (dist < 700 ? 0.07 : 0.2)) { if (dist < 520) nearTrees.push([px, pz, 0.8 + r() * 0.5, r() * 6]); else farTrees.push([px, pz]); continue; }
    var k = r(), nearSite = dist < 520, floors = k < 0.55 ? 2 + Math.floor(r() * 2) : k < (nearSite ? 0.93 : 0.84) ? 4 + Math.floor(r() * 2) : k < (tallish && !nearSite ? 0.95 : 0.985) ? 6 + Math.floor(r() * 4) : (nearSite ? 7 : 12 + Math.floor(r() * 7));
    if (xa >= -150 && xb <= 270 && za === -118 && floors > 9) floors = 6 + Math.floor(r() * 3);   // keep the east and west neighbours modest
    var w = cw * (floors < 4 ? 0.5 + r() * 0.2 : 0.62 + r() * 0.2), d = cd * (floors < 4 ? 0.5 + r() * 0.2 : 0.62 + r() * 0.2);
    building(px + (r() - 0.5) * 2, pz + (r() - 0.5) * 2, w, d, floors, Math.floor(r() * PAL.length), r() < 0.5 ? 0 : 1);
    if (dist < 520 && r() < 0.35) nearTrees.push([px + w / 2 + 2.2, pz + d / 2 + 2, 0.6 + r() * 0.35, r() * 6]);
    if (dist < 600 && r() < 0.3) parked.push([px - w / 2 - 2.4, pz + (r() - 0.5) * d * 0.6, r() < 0.5 ? 0 : Math.PI]);
  }
}
var sim = instanced(BB.unit, S({ color: 0x8f8b83, roughness: 0.95 }), slabs, null, false);
var pim = instanced(crossG, S({ map: BB.noiseTex(256, '#ffffff', 3000, 0.12, [18, 18], 9), roughness: 1 }), plots, null, false), pc = new THREE.Color(); plotCol.forEach(function (c, k) { pc.setRGB(c[0], c[1], c[2]); pim.setColorAt(k, pc); });
// verge and footpath between the project wall and the surrounding roads
[[0, 111.6, 289, 10.6], [0, -103.8, 289, 19], [135.2, 4, 18.4, 215], [-135.2, 4, 18.4, 215]].forEach(function (p) { box(p[2], 0.2, p[3], S({ color: 0x8f8b83, roughness: 0.95 }), p[0], 0.1, p[1], null, false); });
box(18, 0.24, 11, S({ map: ctex(BB.roadC(false), [1, 1]), roughness: 0.95 }), 0, 0.1, 111.6, null, false);
for (i = -138; i <= 138; i += 9) { if (Math.abs(i) > 14) nearTrees.push([i, 112.5, 0.75 + r() * 0.3, r() * 6]); nearTrees.push([i, -104, 0.8 + r() * 0.3, r() * 6]); }
for (i = -100; i <= 104; i += 9) { nearTrees.push([136, i, 0.8 + r() * 0.3, r() * 6]); nearTrees.push([-136, i, 0.8 + r() * 0.3, r() * 6]); }
function mm(list, mat, cast) { var g = merge(list); if (!g) return; var m = new THREE.Mesh(g, mat); m.castShadow = !!cast; m.receiveShadow = true; scene.add(m); return m; }

/* ---------- street trees ---------- */
function along(isX, c, w) {
  for (var t = -640; t <= 640; t += 24 + r() * 6) {
    var cl = (isX ? ZS : XS).some(function (v) { return Math.abs(v - t) < 13; }); if (cl) continue;
    [-1, 1].forEach(function (s) {
      var x = isX ? c + s * (w / 2 + 2.3) : t, z = isX ? t : c + s * (w / 2 + 2.3), d = Math.hypot(x, z);
      if (Math.abs(x) < 146 && z > -112 && z < 122) return;
      if (d < 470) nearTrees.push([x, z, 0.75 + r() * 0.35, r() * 6]); else if (d < 1000) farTrees.push([x, z]);
    });
  }
}
XS.forEach(function (x) { if (Math.abs(x) < 800) along(true, x, wX(x)); }); ZS.forEach(function (z) { if (Math.abs(z) < 800 && z !== 126) along(false, z, wZ(z)); });

/* ---------- city park with a lake, opposite the main gate ---------- */
(function () {
  var px0 = -144, px1 = 144, pz0 = 135.5, pz1 = 241;
  var lawn = new THREE.Mesh(new THREE.PlaneGeometry(px1 - px0 - 4, pz1 - pz0 - 4), S({ map: BB.photo('tex/grass.jpg', [46, 17]), color: 0x8d9872, roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.215, (pz0 + pz1) / 2); lawn.receiveShadow = true; scene.add(lawn);
  var lk = [[-34, -14], [-10, -20], [16, -16], [36, -6], [38, 8], [20, 18], [-2, 14], [-22, 20], [-38, 10], [-42, -2]];
  var w2 = S({ color: 0x2f8fae, roughness: 0.05, metalness: 0.25, envMapIntensity: 1.5, side: THREE.DoubleSide, normalMap: BB.waterN, normalScale: new THREE.Vector2(0.4, 0.4) });
  BB.flatShape(lk, S({ color: 0xcdbf9f, roughness: 0.95, side: THREE.DoubleSide }), -34, 0.23, 188, 1.12); BB.flatShape(lk, w2, -34, 0.25, 188, 1.0);
  var pm = S({ map: ctex(BB.paverC(), [1, 1]), roughness: 0.9, side: THREE.DoubleSide });
  BB.ribbon([[-138, 140], [-100, 150], [-84, 176], [-92, 210], [-60, 232], [-10, 226], [30, 232], [80, 226], [120, 236], [138, 222]], 3, 0.24, pm);
  BB.ribbon([[0, 137], [6, 160], [30, 176], [70, 180], [110, 170], [138, 176]], 2.6, 0.24, pm);
  BB.ribbon([[16, 196], [40, 204], [70, 200]], 2.2, 0.24, pm);
  var tr = [], guard = 0; while (tr.length < 95 && guard++ < 4000) { var x = px0 + 4 + r() * (px1 - px0 - 8), z = pz0 + 4 + r() * (pz1 - pz0 - 8); if (Math.hypot((x + 34) / 1.25, z - 188) < 44) continue; tr.push([x, z, 0.85 + r() * 0.7, r() * 6]); }
  BB.plantTrees(tr);
  var gz = new THREE.Group(); gz.position.set(60, 0.2, 196); scene.add(gz);
  var gd = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.4, 10), M.stone); gd.position.y = 0.2; gz.add(gd);
  for (var q = 0; q < 10; q++) { var gp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 10), M.white); gp.position.set(Math.cos(q * 0.628) * 4, 2, Math.sin(q * 0.628) * 4); gp.castShadow = true; gz.add(gp); }
  var gr = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.2, 10), S({ color: 0x8a4a36, roughness: 0.8 })); gr.position.y = 4.7; gr.castShadow = true; gz.add(gr);
  var lb = label('City park · 100 m', true, true); lb.position.set(-30, 16, 190);
})();
/* ---------- school ---------- */
(function () {
  var cx = 210, cz = 186; building(cx - 20, cz - 26, 64, 13, 3, 0, 0); building(cx - 46, cz + 4, 13, 46, 3, 0, 0); building(cx + 6, cz + 4, 13, 46, 3, 0, 0);
  var gnd = new THREE.Mesh(new THREE.PlaneGeometry(40, 34), S({ color: 0x9a6a48, roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.position.set(cx - 20, 0.225, cz + 8); gnd.receiveShadow = true; scene.add(gnd);
  var tk = new THREE.Mesh(new THREE.RingGeometry(11, 13.5, 48), S({ color: 0xb85a40, roughness: 1 })); tk.rotation.x = -Math.PI / 2; tk.scale.set(1.25, 1, 1); tk.position.set(cx - 20, 0.235, cz + 8); scene.add(tk);
  var fl = new THREE.Mesh(new THREE.CircleGeometry(11, 40), S({ color: 0x6f9a55, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.scale.set(1.25, 1, 1); fl.position.set(cx - 20, 0.23, cz + 8); scene.add(fl);
  box(50, 2, 0.25, M.paint, cx, 1.2, 244.5); var lb = label('School · 250 m', true, true); lb.position.set(cx - 14, 22, cz - 20);
})();
/* ---------- mall ---------- */
(function () {
  var cx = -210, cz = 186, g = new THREE.Group(); g.position.set(cx, 0.2, cz); scene.add(g);
  box(78, 17, 56, S({ color: 0xd9d4c9, roughness: 0.8 }), 0, 8.5, 6, g); box(60, 13, 0.6, T.glaz, -4, 8, -22.2, g, false); box(0.6, 13, 40, T.glaz, 39.2, 8, 4, g, false);
  box(82, 1.2, 60, M.char, 0, 17.6, 6, g); box(30, 9, 30, T.glaz, -12, 22.5, 6, g, false); box(32, 0.8, 32, M.char, -12, 27.4, 6, g);
  var sc = cnv(512, 128), sg = sc.getContext('2d'); sg.fillStyle = '#20262a'; sg.fillRect(0, 0, 512, 128); sg.font = '500 76px Outfit, Arial, sans-serif'; sg.fillStyle = '#ffd98a'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('CITY MALL', 256, 68);
  var st = ctex(sc), sm = S({ map: st, emissiveMap: st, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.5 }); BB.timeHooks.push(function (t) { sm.emissiveIntensity = 0.3 + t.night * 1.6; });
  var sp = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), sm); sp.position.set(22, 12.5, -22.6); sp.rotation.y = Math.PI; g.add(sp);
  for (var k = 0; k < 14; k++) parked.push([cx - 34 + k * 5.2, cz - 36, Math.PI / 2]);
  var lb = label('City Mall · 300 m', true, true); lb.position.set(cx, 40, cz);
})();
/* ---------- hospital ---------- */
(function () {
  var cx = 330, cz = -40; building(cx, cz, 60, 22, 7, 1, 0); building(cx - 20, cz + 26, 22, 30, 5, 1, 0); building(cx + 22, cz + 24, 18, 26, 4, 1, 0);
  var sc = cnv(256, 256), sg = sc.getContext('2d'); sg.fillStyle = '#ffffff'; sg.fillRect(0, 0, 256, 256); sg.fillStyle = '#d93a32'; sg.fillRect(100, 40, 56, 176); sg.fillRect(40, 100, 176, 56);
  var st = ctex(sc), sm = S({ map: st, emissiveMap: st, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.6 }); BB.timeHooks.push(function (t) { sm.emissiveIntensity = 0.25 + t.night * 1.3; });
  [[cx - 30.2, -Math.PI / 2], [cx + 30.2, Math.PI / 2]].forEach(function (p) { var m = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), sm); m.position.set(p[0], 19, cz); m.rotation.y = p[1]; scene.add(m); });
  var m2 = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), sm); m2.position.set(cx, 19, cz + 11.2); scene.add(m2);
  var lb = label('Hospital · 400 m', true, true); lb.position.set(cx, 36, cz);
})();
/* ---------- elevated metro along the eastern road, with a station and a moving train ---------- */
(function () {
  var mx = 390, deck = S({ color: 0xbfbab0, roughness: 0.9 });
  box(7.5, 1.3, 2000, deck, mx, 10.6, 0); box(0.3, 1.1, 2000, deck, mx - 3.6, 11.8, 0, null, false); box(0.3, 1.1, 2000, deck, mx + 3.6, 11.8, 0, null, false);
  var piers = []; for (var z = -980; z <= 980; z += 30) piers.push([mx, 5.1, z, 1.6, 0, 10.2, 1.6]); instanced(BB.unit, deck, piers);
  box(16, 0.6, 76, deck, mx, 11.3, 186); box(17, 0.5, 78, M.char, mx, 18.2, 186); box(15, 6, 0.4, T.glaz, mx, 14.8, 148.5, null, false); box(15, 6, 0.4, T.glaz, mx, 14.8, 223.5, null, false);
  for (var k = 0; k < 6; k++) { box(0.5, 6.6, 0.5, M.char, mx - 7.6, 14.6, 152 + k * 13.6); box(0.5, 6.6, 0.5, M.char, mx + 7.6, 14.6, 152 + k * 13.6); }
  box(6, 11, 9, S({ color: 0xd9d4c9, roughness: 0.85 }), mx - 11, 5.7, 186); box(6, 11, 9, S({ color: 0xd9d4c9, roughness: 0.85 }), mx + 11, 5.7, 186);
  var train = new THREE.Group(), body = S({ color: 0xe9ecee, roughness: 0.35, metalness: 0.5, envMapIntensity: 0.9 }), band = S({ color: 0x1f6fb2, roughness: 0.4 }), win = S({ color: 0x1c262c, roughness: 0.1, metalness: 0.8, emissive: 0xffe9c0, emissiveIntensity: 0 });
  BB.timeHooks.push(function (t) { win.emissiveIntensity = t.night * 0.9; });
  for (k = 0; k < 4; k++) { var c = new THREE.Mesh(new THREE.RoundedBoxGeometry(3, 3.4, 20.6, 3, 0.5), body); c.position.set(0, 1.9, k * 21.4); c.castShadow = true; train.add(c); box(3.04, 0.5, 20, band, 0, 1.0, k * 21.4, train, false); box(3.06, 1.1, 18.6, win, 0, 2.5, k * 21.4, train, false); }
  train.position.set(mx, 11.3, 0); scene.add(train);
  BB.tick.push(function (t) { var p = (t * 16) % 2600; train.position.z = p < 2000 ? -1000 + p : (p < 2300 ? 1000 : -1000); train.visible = p < 2000; });
  var lb = label('Metro station · 450 m', true, true); lb.position.set(mx, 30, 186);
})();

[0, 1].forEach(function (s) { mm(L.near[s], cityMats[s], true); mm(L.far[s], cityMats[s], false); });
mm(L.white, S({ color: 0x9a978f, roughness: 0.9 }), false); mm(L.tank, S({ color: 0x5c5f61, roughness: 0.6 }), false); mm(L.dark, S({ color: 0xbdb8ad, roughness: 0.9 }), false);

/* ---------- trees, cars ---------- */
BB.plantTrees(nearTrees);
var ftg = BB.blob(0, 5.2, 0, 3.0, 0.85, 4, [0.2, 0.33, 0.15], 0.5, 1), fim = instanced(ftg, M.leaf, farTrees.map(function (p) { return [p[0], 0, p[1], 0.8 + r() * 0.6, r() * 6]; }), null, false), fcol = new THREE.Color();
farTrees.forEach(function (p, k) { fcol.setRGB(0.8 + r() * 0.4, 0.85 + r() * 0.3, 0.7 + r() * 0.4); fim.setColorAt(k, fcol); });
instanced(new THREE.CylinderGeometry(0.2, 0.3, 4, 6), M.trunk, farTrees.map(function (p) { return [p[0], 2, p[1]]; }), null, false);

function paint(g, c) { var n = g.attributes.position.count, a = new Float32Array(n * 3); for (var k = 0; k < n; k++) { a[k * 3] = c[0]; a[k * 3 + 1] = c[1]; a[k * 3 + 2] = c[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
var cs = new THREE.Shape(); cs.moveTo(-2.15, 0.32); cs.lineTo(-2.2, 0.72); cs.quadraticCurveTo(-2.1, 0.86, -1.55, 0.9); cs.quadraticCurveTo(-1.1, 1.38, -0.5, 1.42); cs.lineTo(0.55, 1.42); cs.quadraticCurveTo(1.05, 1.36, 1.45, 0.94); cs.quadraticCurveTo(2.1, 0.86, 2.2, 0.66); cs.lineTo(2.18, 0.32); cs.closePath();
var bodyG = new THREE.ExtrudeGeometry(cs, { depth: 1.62, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.09, bevelSegments: 3, curveSegments: 10 }); bodyG.translate(0, 0, -0.81);
var ws = new THREE.Shape(); ws.moveTo(-1.42, 0.93); ws.quadraticCurveTo(-1.02, 1.33, -0.5, 1.36); ws.lineTo(0.52, 1.36); ws.quadraticCurveTo(0.98, 1.3, 1.3, 0.95); ws.closePath();
var winG = new THREE.ExtrudeGeometry(ws, { depth: 1.84, bevelEnabled: false, curveSegments: 8 }); winG.translate(0, 0, -0.92);
var parts = [paint(bodyG, [1, 1, 1]), paint(winG, [0.1, 0.12, 0.14])];
[[-1.35, 0.86], [1.35, 0.86], [-1.35, -0.86], [1.35, -0.86]].forEach(function (w) { var g = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(w[0], 0.33, w[1]); parts.push(paint(g, [0.07, 0.07, 0.08])); });
[[2.2, 0.55, 0.62], [2.2, 0.55, -0.62]].forEach(function (p) { parts.push(paint(nb(0.06, 0.16, 0.34, p[0], p[1], p[2]), [1.6, 1.5, 1.2])); });
[[-2.2, 0.62, 0.64], [-2.2, 0.62, -0.64]].forEach(function (p) { parts.push(paint(nb(0.06, 0.14, 0.3, p[0], p[1], p[2]), [1.3, 0.12, 0.1])); });
var carG = merge(parts), carCols = [0xb23a30, 0xf2f2ee, 0x27323d, 0x9aa3a8, 0x24588f, 0x6b5b4a, 0xd9d4c8, 0x14181c, 0x7a1f24, 0xc9a14a];
var movers = [];
function lane(isX, c, off, dir, n) { for (var k = 0; k < n; k++) movers.push({ isX: isX, c: c + off, dir: dir, p: -700 + r() * 1400, v: 9 + r() * 6 }); }
ZS.forEach(function (z) { if (Math.abs(z) > 520) return; if (z === 126) { lane(false, z, -5.6, 1, 7); lane(false, z, -2.6, 1, 5); lane(false, z, 2.6, -1, 5); lane(false, z, 5.6, -1, 7); } else { lane(false, z, -2.2, 1, 3); lane(false, z, 2.2, -1, 3); } });
XS.forEach(function (x) { if (Math.abs(x) > 520) return; lane(true, x, 2.3, 1, 3); lane(true, x, -2.3, -1, 3); });
var all = BB.carList.map(function (c) { return [c[0], 0.12, c[1], 1, c[2]]; }).concat(parked.map(function (c) { return [c[0], 0.26, c[1], 1, c[2]]; }));
var NP = all.length, cars = new THREE.InstancedMesh(carG, S({ vertexColors: true, roughness: 0.32, metalness: 0.55, envMapIntensity: 0.9 }), NP + movers.length), cc = new THREE.Color(), dm = BB.dummy;
all.forEach(function (p, k) { dm.position.set(p[0], p[1], p[2]); dm.rotation.set(0, p[4], 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); cars.setMatrixAt(k, dm.matrix); });
for (i = 0; i < NP + movers.length; i++) { cc.setHex(carCols[Math.floor(r() * carCols.length)]); cars.setColorAt(i, cc); }
cars.castShadow = true; cars.receiveShadow = true; cars.frustumCulled = false; scene.add(cars);
var last = 0;
BB.tick.push(function (t) {
  var dt = Math.min(0.1, t - last); last = t;
  movers.forEach(function (m, k) { m.p += m.v * m.dir * dt; if (m.p > 720) m.p = -720; if (m.p < -720) m.p = 720; dm.position.set(m.isX ? m.c : m.p, 0.14, m.isX ? m.p : m.c); dm.rotation.set(0, m.isX ? (m.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (m.dir > 0 ? 0 : Math.PI), 0); dm.scale.set(1, 1, 1); dm.updateMatrix(); cars.setMatrixAt(NP + k, dm.matrix); });
  cars.instanceMatrix.needsUpdate = true;
});

/* ---------- distant hills ---------- */
var hg = new THREE.CylinderGeometry(3000, 3000, 1, 160, 1, true), hp = hg.attributes.position;
for (i = 0; i < hp.count; i++) { var ang = Math.atan2(hp.getZ(i), hp.getX(i)); hp.setY(i, hp.getY(i) > 0 ? 70 + 90 * Math.abs(Math.sin(ang * 3.1 + 1)) + 46 * Math.sin(ang * 9.7) + 22 * Math.sin(ang * 23) : -10); }
hg.computeVertexNormals(); scene.add(new THREE.Mesh(hg, M.hill));
var hg2 = new THREE.CylinderGeometry(2300, 2300, 1, 120, 1, true), hp2 = hg2.attributes.position;
for (i = 0; i < hp2.count; i++) { var a2 = Math.atan2(hp2.getZ(i), hp2.getX(i)); hp2.setY(i, hp2.getY(i) > 0 ? 24 + 46 * Math.abs(Math.sin(a2 * 4.3 + 2)) + 18 * Math.sin(a2 * 13) : -10); }
hg2.computeVertexNormals(); scene.add(new THREE.Mesh(hg2, M.hill2));
})();
