/* Interior: a furnished 3D flat built from the room layouts in data.js. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var rng = BB.rng, cnv = BB.cnv, ctex = BB.ctex, speckle = BB.speckle, canvas = BB.canvas;
var IN = BB.IN = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(38, 1, 0.05, 400), on: false, mode: 'doll', plan: null, g: null, cache: {}, furnished: true };
var ctl = IN.ctl = new THREE.OrbitControls(IN.cam, canvas); ctl.enabled = false; ctl.enableDamping = true; ctl.dampingFactor = 0.08;
var hemi = new THREE.HemisphereLight(0xffffff, 0x8a7f72, 0.6), sun = new THREE.DirectionalLight(0xffffff, 1);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
IN.scene.add(hemi); IN.scene.add(sun); IN.scene.add(sun.target);
(function () { var c = cnv(8, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1b2624'); gr.addColorStop(1, '#0a100f'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); IN.studio = ctex(c); })();

/* ---------- textures ---------- */
function rep(t, x, y) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; }
function marbleTex() {
  var c = cnv(1024, 1024), g = c.getContext('2d'), r = rng(9), i, k; g.fillStyle = '#efece5'; g.fillRect(0, 0, 1024, 1024);
  for (i = 0; i < 26; i++) { var x = r() * 1024, y = r() * 1024, a = r() * 6.3; g.strokeStyle = 'rgba(128,120,108,' + (0.03 + r() * 0.07) + ')'; g.lineWidth = 0.6 + r() * 3; g.beginPath(); g.moveTo(x, y); for (k = 0; k < 9; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 70; y += Math.sin(a) * 70; g.lineTo(x, y); } g.stroke(); }
  speckle(g, 1024, 1024, 5000, 0.035, r); g.fillStyle = 'rgba(90,84,74,.16)'; for (i = 0; i < 1024; i += 512) { g.fillRect(i, 0, 2, 1024); g.fillRect(0, i, 1024, 2); }
  return rep(ctex(c), 1, 1);
}
function tileTex() { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(4); g.fillStyle = '#dfe2e0'; g.fillRect(0, 0, 512, 512); speckle(g, 512, 512, 2500, 0.04, r); g.fillStyle = 'rgba(70,74,74,.28)'; for (var i = 0; i < 512; i += 154) { g.fillRect(i, 0, 2, 512); g.fillRect(0, i, 512, 2); } return rep(ctex(c), 1, 1); }
function deckTex() { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(6); for (var y = 0; y < 512; y += 40) { var t = 98 + Math.floor(r() * 34); g.fillStyle = 'rgb(' + t + ',' + Math.floor(t * 0.74) + ',' + Math.floor(t * 0.55) + ')'; g.fillRect(0, y, 512, 37); g.fillStyle = '#1d1611'; g.fillRect(0, y + 37, 512, 3); } g.strokeStyle = 'rgba(0,0,0,.08)'; for (var i = 0; i < 300; i++) { var yy = r() * 512; g.beginPath(); g.moveTo(r() * 512, yy); g.lineTo(r() * 512, yy + (r() - 0.5) * 3); g.stroke(); } return rep(ctex(c), 1, 1); }
function fabricTex() { var c = cnv(256, 256), g = c.getContext('2d'), r = rng(2); g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,.07)'; for (var i = 0; i < 256; i += 4) { g.fillRect(i, 0, 1.5, 256); g.fillRect(0, i, 256, 1.5); } speckle(g, 256, 256, 3000, 0.09, r); return rep(ctex(c), 3, 3); }
function grainTex() { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(12); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512); for (var i = 0; i < 420; i++) { var y = r() * 512; g.strokeStyle = 'rgba(60,35,15,' + (0.02 + r() * 0.06) + ')'; g.lineWidth = 0.5 + r() * 1.6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - 0.5) * 10, 340, y + (r() - 0.5) * 10, 512, y + (r() - 0.5) * 6); g.stroke(); } return rep(ctex(c), 1, 1); }
function rugTex(a, b) { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(15); g.fillStyle = a; g.fillRect(0, 0, 512, 512); g.strokeStyle = b; g.lineWidth = 5; g.strokeRect(26, 26, 460, 460); g.lineWidth = 2; g.strokeRect(40, 40, 432, 432); for (var y = 80; y < 440; y += 40) for (var x = 80; x < 440; x += 40) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.strokeRect(-9, -9, 18, 18); g.restore(); } speckle(g, 512, 512, 6000, 0.07, r); return ctex(c); }
function artTex(seed) { var c = cnv(256, 320), g = c.getContext('2d'), r = rng(seed), cols = ['#c9a36a', '#5f8a86', '#b5726a', '#e9e2d4', '#33474a', '#d8c9ae']; g.fillStyle = '#efe9dd'; g.fillRect(0, 0, 256, 320); for (var i = 0; i < 7; i++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.globalAlpha = 0.75; g.beginPath(); g.ellipse(r() * 256, r() * 320, 30 + r() * 90, 20 + r() * 70, r() * 3, 0, 6.3); g.fill(); } g.globalAlpha = 1; return ctex(c); }
var fab = fabricTex(), grain = grainTex();
function S(o) { return new THREE.MeshStandardMaterial(o); }
var IM = IN.M = {
  wall: S({ color: 0xe4dccd, roughness: 0.92 }),
  ceil: S({ color: 0xe9e6de, roughness: 1, side: THREE.DoubleSide }),
  base: S({ color: 0xcfc8bc, roughness: 0.9 }),
  glass: S({ color: 0xcfe8f0, transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.5, depthWrite: false }),
  marble: S({ map: marbleTex(), roughness: 0.16, metalness: 0.04 }),
  wood: S({ map: BB.photo('tex/wood.jpg', [1, 1]), color: 0xcfb99a, roughness: 0.5 }),
  deck: S({ map: deckTex(), roughness: 0.75 }),
  tile: S({ map: tileTex(), roughness: 0.28 }),
  sofa: S({ map: fab, bumpMap: fab, bumpScale: 0.004, color: 0x8b979a, roughness: 0.95 }),
  sofa2: S({ map: fab, bumpMap: fab, bumpScale: 0.004, color: 0xb7b0a2, roughness: 0.95 }),
  accent: S({ map: fab, color: 0xc98f52, roughness: 0.95 }),
  teal: S({ map: fab, color: 0x5d8580, roughness: 0.95 }),
  rose: S({ map: fab, color: 0xb9837a, roughness: 0.95 }),
  linen: S({ map: fab, color: 0xf3efe7, roughness: 1 }),
  curtain: S({ map: fab, color: 0xe9e2d3, roughness: 1, side: THREE.DoubleSide }),
  oak: S({ map: grain, color: 0xb9946a, roughness: 0.55 }),
  walnut: S({ map: grain, color: 0x70503b, roughness: 0.5 }),
  cabinet: S({ color: 0xe6dfd2, roughness: 0.55 }),
  cabDark: S({ color: 0x47525a, roughness: 0.5 }),
  white: S({ color: 0xf6f4ef, roughness: 0.18 }),
  stoneTop: S({ color: 0x2a2e31, roughness: 0.18, metalness: 0.2 }),
  metal: S({ color: 0xc9cdd0, roughness: 0.22, metalness: 0.95 }),
  black: S({ color: 0x121416, roughness: 0.35, metalness: 0.3 }),
  screen: S({ color: 0x0a0d12, roughness: 0.06, metalness: 0.6 }),
  mirror: S({ color: 0xdfe6e8, roughness: 0.02, metalness: 1 }),
  leaf: S({ color: 0x4a7f3f, roughness: 0.8, side: THREE.DoubleSide }),
  bush: S({ vertexColors: true, roughness: 0.95 }),
  pot: S({ color: 0xd8d1c4, roughness: 0.6 }),
  potDark: S({ color: 0x3a3f42, roughness: 0.6 }),
  gold: S({ color: 0xc9a468, roughness: 0.3, metalness: 0.85 }),
  shade: S({ color: 0xfff1d6, emissive: 0xffd49a, emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide }),
  rug: S({ map: rugTex('#cfc3ae', '#8a7b66'), roughness: 1 }),
  rug2: S({ map: rugTex('#a9b5ad', '#6e7f78'), roughness: 1 }),
  rug3: S({ map: rugTex('#c9b0a6', '#8f6f66'), roughness: 1 }),
  water: S({ color: 0xa9d3de, roughness: 0.05, metalness: 0.2 })
};
Object.keys(IM).forEach(function (k) { IM[k].envMapIntensity = k === 'metal' || k === 'gold' || k === 'glass' || k === 'mirror' ? 1 : k === 'marble' || k === 'stoneTop' || k === 'white' || k === 'tile' ? 0.55 : 0.28; });
var blobTex = (function () { var c = cnv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.6, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c); })();
var blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.85 });
var unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.translate(0, 0.5, 0);
var geoCache = {};
function rbGeo(w, h, d, r) { var k = [w, h, d, r].join('_'); if (!geoCache[k]) { var g = new THREE.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)); g.translate(0, h / 2, 0); geoCache[k] = g; } return geoCache[k]; }
function cyGeo(a, b, h, s) { var k = ['c', a, b, h, s].join('_'); if (!geoCache[k]) { var g = new THREE.CylinderGeometry(a, b, h, s || 24); g.translate(0, h / 2, 0); geoCache[k] = g; } return geoCache[k]; }
var frond = BB.palmGeo(5), bushGeo = BB.blob(0, 0, 0, 1, 0.8, 7, [0.2, 0.36, 0.18], 0.55);
function roomLabel(name, dims, small) {
  var c = cnv(512, 176), g = c.getContext('2d');
  g.font = '500 44px Outfit, Segoe UI, Arial, sans-serif'; var tw = Math.min(490, Math.max(g.measureText(name).width, 220) + 70), x = (512 - tw) / 2, rr = 30;
  g.fillStyle = 'rgba(8,14,12,.84)'; g.beginPath(); g.moveTo(x + rr, 14); g.arcTo(x + tw, 14, x + tw, 162, rr); g.arcTo(x + tw, 162, x, 162, rr); g.arcTo(x, 162, x, 14, rr); g.arcTo(x, 14, x + tw, 14, rr); g.closePath(); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f3f1ea'; g.fillText(name, 256, 64);
  g.font = '400 32px Outfit, Segoe UI, Arial, sans-serif'; g.fillStyle = '#d9c08f'; g.fillText(dims, 256, 120);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(c), transparent: true, depthTest: false })); var k = small ? 1.35 : 2.0; s.scale.set(k, k * 176 / 512, 1); s.renderOrder = 20; return s;
}

function build(type) {
  var p = BB.PLANS[type], g = new THREE.Group(), walls = new THREE.Group(), fur = new THREE.Group(), labels = new THREE.Group(), walk = new THREE.Group(), floors = [], T = 0.12;
  g.add(walls); g.add(fur); g.add(walk); walk.visible = false;
  function add(m, par, cast) { m.castShadow = cast !== false; m.receiveShadow = true; (par || fur).add(m); return m; }
  function R(w, h, d, r, mat, x, y, z, ry, rz) { var m = new THREE.Mesh(rbGeo(w, h, d, r), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz; return add(m); }
  function B(w, h, d, mat, x, y, z, par) { var m = new THREE.Mesh(unitBox, mat); m.scale.set(w, h, d); m.position.set(x, y, z); return add(m, par); }
  function C(a, b, h, mat, x, y, z, s) { var m = new THREE.Mesh(cyGeo(a, b, h, s), mat); m.position.set(x, y, z); return add(m); }
  function legs(x, z, w, d, h, mat, rad) { [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { C(rad || 0.022, rad || 0.022, h, mat, x + q[0] * (w / 2 - 0.05), 0, z + q[1] * (d / 2 - 0.05), 8); }); }
  function shadow(x, z, w, d) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blobMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z); m.renderOrder = 2; fur.add(m); }
  function plant(x, z, s, dark) { s = s || 1; C(0.2 * s, 0.15 * s, 0.38 * s, dark ? IM.potDark : IM.pot, x, 0, z, 20); var m = new THREE.Mesh(frond, BB.M.palm); m.scale.setScalar(0.24 * s); m.position.set(x, 0.36 * s, z); m.rotation.y = x * 3; add(m); shadow(x, z, 0.9 * s, 0.9 * s); }
  function lamp(x, y, z, s) { s = s || 1; C(0.07 * s, 0.09 * s, 0.03, IM.gold, x, y, z, 16); C(0.012, 0.012, 0.26 * s, IM.gold, x, y, z, 8); var m = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.15 * s, 0.2 * s, 20, 1, true), IM.shade); m.position.set(x, y + 0.34 * s, z); fur.add(m); }
  function chair(x, z, ry, mat) { var q = new THREE.Group(); q.position.set(x, 0, z); q.rotation.y = ry; fur.add(q);
    function a(m) { m.castShadow = true; m.receiveShadow = true; q.add(m); return m; }
    var s = a(new THREE.Mesh(rbGeo(0.46, 0.08, 0.46, 0.035), mat)); s.position.y = 0.42;
    var b = a(new THREE.Mesh(rbGeo(0.44, 0.46, 0.06, 0.03), mat)); b.position.set(0, 0.5, -0.21); b.rotation.x = -0.12;
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (k) { var l = a(new THREE.Mesh(cyGeo(0.017, 0.013, 0.43, 8), IM.walnut)); l.position.set(k[0] * 0.19, 0, k[1] * 0.19); });
  }
  function bed(xh, zc, w, len, duvet) {
    var cx = xh - len / 2 - 0.1;
    shadow(cx, zc, len + 0.9, w + 0.9);
    R(len + 0.1, 0.2, w + 0.1, 0.03, IM.walnut, cx, 0.1, zc); legs(cx, zc, len, w, 0.1, IM.black, 0.03);
    R(len, 0.24, w, 0.09, IM.linen, cx, 0.3, zc);
    R(len * 0.7, 0.13, w + 0.14, 0.06, duvet, xh - len - 0.1 + len * 0.35, 0.47, zc); R(0.26, 0.15, w + 0.16, 0.07, IM.linen, xh - len * 0.3 - 0.2, 0.47, zc);
    R(0.14, 1.12, w + 0.3, 0.06, IM.sofa2, xh - 0.07, 0, zc);
    [-1, 1].forEach(function (s) {
      R(0.2, 0.44, w * 0.42, 0.09, IM.linen, xh - 0.3, 0.56, zc + s * w * 0.24, 0, 0.5); R(0.16, 0.34, w * 0.34, 0.07, duvet, xh - 0.52, 0.56, zc + s * w * 0.22, 0, 0.55);
      R(0.44, 0.38, 0.42, 0.02, IM.oak, xh - 0.28, 0.1, zc + s * (w / 2 + 0.36)); legs(xh - 0.28, zc + s * (w / 2 + 0.36), 0.44, 0.42, 0.1, IM.black); lamp(xh - 0.28, 0.48, zc + s * (w / 2 + 0.36), 0.9);
    });
  }
  function wardrobe(x, z, len, depth, alongX) {
    var w = alongX ? len : depth, d = alongX ? depth : len; B(w, 2.15, d, IM.cabinet, x, 0, z);
    var n = Math.max(2, Math.round(len / 0.55));
    for (var i = 1; i < n; i++) { var o = -len / 2 + len * i / n; if (alongX) B(0.008, 2.1, 0.01, IM.black, x + o, 0.02, z + d / 2 + 0.002); else B(0.01, 2.1, 0.008, IM.black, x + w / 2 + 0.002, 0.02, z + o); }
    for (i = 0; i < n; i++) { var h = -len / 2 + len * (i + 0.5) / n + (i % 2 ? -0.2 : 0.2) * (len / n); if (alongX) B(0.014, 0.5, 0.02, IM.gold, x + h, 0.9, z + d / 2 + 0.01); else B(0.02, 0.5, 0.014, IM.gold, x + w / 2 + 0.01, 0.9, z + h); }
  }
  // floors and labels
  p.rooms.concat([p.balcony]).forEach(function (r) {
    var w = r.x1 - r.x0, d = r.z1 - r.z0, geo = new THREE.PlaneGeometry(w, d), uv = geo.attributes.uv, k = r.floor === 'wood' ? 0.42 : r.floor === 'marble' ? 0.5 : r.floor === 'deck' ? 0.8 : 0.65;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * k, uv.getY(i) * d * k);
    var m = new THREE.Mesh(geo, IM[r.floor]); m.rotation.x = -Math.PI / 2; m.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); m.receiveShadow = true; m.userData.room = r; g.add(m); floors.push(m);
    if (r.kind !== 'passage') { var s = roomLabel(r.name, BB.feet(w) + ' x ' + BB.feet(d), w < 2.6 || d < 2); s.position.set((r.x0 + r.x1) / 2, 2.25, (r.z0 + r.z1) / 2); s.userData.px = (r.x0 + r.x1) / 2; labels.add(s); }
  });
  var base = new THREE.Mesh(rbGeo(p.W + 0.6, 0.34, p.D + 2.3, 0.05), IM.base); base.position.set(p.W / 2, -0.35, (p.D + 1.7) / 2); base.receiveShadow = true; g.add(base);
  // walls from room edges, minus doors, openings and glazing
  function seg(axis, c, a, b, mat, th) { if (b - a < 0.03) return; var m = new THREE.Mesh(unitBox, mat); if (axis === 'x') { m.scale.set(b - a, 1, th); m.position.set((a + b) / 2, 0, c); } else { m.scale.set(th, 1, b - a); m.position.set(c, 0, (a + b) / 2); } m.castShadow = mat !== IM.glass; m.receiveShadow = true; walls.add(m); }
  p.rooms.forEach(function (r) {
    [['x', r.z0, r.x0, r.x1], ['x', r.z1, r.x0, r.x1], ['z', r.x0, r.z0, r.z1], ['z', r.x1, r.z0, r.z1]].forEach(function (e) {
      var cuts = p.gaps.filter(function (q) { return q.axis === e[0] && Math.abs(q.c - e[1]) < 1e-6 && q.b > e[2] && q.a < e[3]; }).sort(function (m, n) { return m.a - n.a; });
      var at = e[2] - T / 2;
      cuts.forEach(function (q) { seg(e[0], e[1], at, Math.max(at, q.a), IM.wall, T); at = Math.max(at, q.b); });
      seg(e[0], e[1], at, e[3] + T / 2, IM.wall, T);
    });
  });
  var wave = new THREE.PlaneGeometry(0.6, 1, 24, 1), wp = wave.attributes.position; for (var wi = 0; wi < wp.count; wi++) wp.setZ(wi, 0.022 * Math.sin(wp.getX(wi) * 44) + 0.008 * Math.sin(wp.getX(wi) * 97)); wave.translate(0, 0.5, 0); wave.computeVertexNormals();
  p.gaps.forEach(function (q) {
    if (q.type === 'glass') {
      seg(q.axis, q.c, q.a, q.b, IM.glass, 0.03);
      var fr = function (a, b, y, h) { var m = new THREE.Mesh(unitBox, IM.black); if (q.axis === 'x') { m.scale.set(b - a, h, 0.05); m.position.set((a + b) / 2, y, q.c); } else { m.scale.set(0.05, h, b - a); m.position.set(q.c, y, (a + b) / 2); } walls.add(m); };
      fr(q.a, q.a + 0.04, 0, 1); fr(q.b - 0.04, q.b, 0, 1); fr((q.a + q.b) / 2 - 0.02, (q.a + q.b) / 2 + 0.02, 0, 1); fr(q.a, q.b, 0, 0.02);
      if (q.axis === 'x' && q.c > 3.5) [q.a + 0.32, q.b - 0.32].forEach(function (x) { var m = new THREE.Mesh(wave, IM.curtain); m.position.set(x, 0, q.c - 0.14); m.scale.y = 0.93; m.castShadow = true; walls.add(m); });
    }
    if (q.type === 'door') { var len = q.b - q.a, m = new THREE.Mesh(unitBox, IM.walnut); if (q.axis === 'x' && q.c === 0) { m.scale.set(len, 0.74, 0.05); m.position.set((q.a + q.b) / 2, 0, 0); } else { m.scale.set(0.045, 0.74, len); m.position.set(q.a + 0.03, 0, q.c + q.swing * len / 2); } m.castShadow = true; walls.add(m); B(0.03, 0.02, 0.12, IM.gold, q.a + 0.07, 1.0, q.c + q.swing * (len - 0.12)); }
  });
  // balcony rail
  var b = p.balcony; [[(b.x0 + b.x1) / 2, b.z1, b.x1 - b.x0, 0.03], [b.x0, (b.z0 + b.z1) / 2, 0.03, b.z1 - b.z0], [b.x1, (b.z0 + b.z1) / 2, 0.03, b.z1 - b.z0]].forEach(function (q) { var r1 = B(q[2], 1.02, q[3], IM.glass, q[0], 0, q[1], g); r1.castShadow = false; B(q[2] + 0.05, 0.04, q[3] + 0.05, IM.black, q[0], 1.02, q[1], g); });
  var ceil = new THREE.Mesh(new THREE.PlaneGeometry(p.W, p.D), IM.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.set(p.W / 2, 2.86, p.D / 2); walk.add(ceil);
  var roof = new THREE.Mesh(unitBox, IM.ceil); roof.scale.set(p.W + 0.3, 0.2, p.D + 0.3); roof.position.set(p.W / 2, 2.87, p.D / 2); roof.castShadow = true; walk.add(roof);
  var fans = []; function fan(x, z) { var q = new THREE.Group(); q.position.set(x, 2.52, z); walk.add(q); var rod = new THREE.Mesh(cyGeo(0.02, 0.02, 0.34, 8), IM.metal); rod.position.y = 0; walk.add(rod); rod.position.set(x, 2.52, z); var hub = new THREE.Mesh(cyGeo(0.11, 0.11, 0.09, 20), IM.metal); hub.position.y = -0.06; q.add(hub); for (var b = 0; b < 3; b++) { var bl = new THREE.Mesh(rbGeo(0.62, 0.012, 0.13, 0.005), IM.walnut); bl.position.set(Math.cos(b * 2.094) * 0.4, -0.03, Math.sin(b * 2.094) * 0.4); bl.rotation.y = -b * 2.094; q.add(bl); } fans.push(q); }
  var artN = 0; function art(x, z, w, h, axis) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: artTex(60 + artN++), roughness: 0.9 })); m.position.set(x, 1.55, z); if (axis === 'x+') m.rotation.y = Math.PI / 2; if (axis === 'x-') m.rotation.y = -Math.PI / 2; if (axis === 'z-') m.rotation.y = Math.PI; walk.add(m); var f = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.08, h + 0.08), IM.black); f.position.copy(m.position); f.rotation.copy(m.rotation); f.translateZ(-0.006); walk.add(f); }
  function spot(x, z) { var m = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), IM.shade); m.rotation.x = Math.PI / 2; m.position.set(x, 2.85, z); walk.add(m); }

  p.rooms.forEach(function (r) {
    var cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, w = r.x1 - r.x0, d = r.z1 - r.z0, k = r.kind, i;
    if (k !== 'passage' && k !== 'store') { spot(cx - w / 4, cz); spot(cx + w / 4, cz); }
    if (k === 'living' || k === 'bed' || k === 'master') fan(cx, cz + (k === 'living' ? 0.2 : 0.35));
    if (k === 'living') {
      var zc = cz + 0.2, sx = r.x1 - 3.45;
      B(2.9, 0.014, 3.5, IM.rug, r.x1 - 2.35, 0.004, zc); shadow(sx + 0.4, zc, 3.4, 3.6);
      R(1.0, 0.18, 1.72, 0.06, IM.sofa, sx, 0.1, zc - 0.41); R(2.3, 0.18, 0.88, 0.06, IM.sofa, sx + 0.65, 0.1, zc + 0.86);
      R(0.2, 0.74, 2.6, 0.08, IM.sofa, sx - 0.52, 0.1, zc + 0.02); R(1.0, 0.5, 0.22, 0.09, IM.sofa, sx, 0.1, zc - 1.38); R(0.9, 0.5, 0.2, 0.09, IM.sofa, sx - 0.05, 0.1, zc + 1.4);
      R(0.8, 0.2, 0.82, 0.08, IM.sofa, sx + 0.08, 0.27, zc - 0.84); R(0.8, 0.2, 0.82, 0.08, IM.sofa, sx + 0.08, 0.27, zc); R(2.2, 0.2, 0.82, 0.08, IM.sofa, sx + 0.72, 0.27, zc + 0.86);
      [-0.84, 0, 0.86].forEach(function (o) { R(0.24, 0.5, 0.76, 0.1, IM.sofa, sx - 0.32, 0.44, zc + o, 0, 0.14); });
      R(0.14, 0.4, 0.42, 0.06, IM.accent, sx - 0.12, 0.47, zc - 1.0, 0.3, 0.3); R(0.14, 0.38, 0.4, 0.06, IM.teal, sx - 0.14, 0.47, zc + 0.5, -0.2, 0.3); R(0.14, 0.36, 0.38, 0.06, IM.linen, sx + 1.55, 0.47, zc + 1.02, 1.3, 0.25);
      for (i = 0; i < 4; i++) C(0.025, 0.02, 0.1, IM.black, sx + (i % 2 ? 0.4 : -0.4), 0, zc + (i < 2 ? -1.2 : 1.15), 8);
      C(0.5, 0.5, 0.04, IM.walnut, sx + 1.45, 0.36, zc - 0.5, 36); [0, 2.1, 4.2].forEach(function (a) { C(0.014, 0.014, 0.36, IM.black, sx + 1.45 + Math.cos(a) * 0.36, 0, zc - 0.5 + Math.sin(a) * 0.36, 8); });
      C(0.3, 0.3, 0.03, IM.marble, sx + 1.95, 0.27, zc - 0.95, 30); C(0.014, 0.014, 0.27, IM.gold, sx + 1.95, 0, zc - 0.95, 8);
      R(0.26, 0.03, 0.2, 0.01, IM.teal, sx + 1.38, 0.4, zc - 0.56, 0.3); R(0.24, 0.025, 0.18, 0.01, IM.linen, sx + 1.38, 0.43, zc - 0.56, 0.1); C(0.05, 0.07, 0.16, IM.white, sx + 1.62, 0.4, zc - 0.35, 16);
      R(0.42, 0.36, 2.4, 0.02, IM.oak, r.x1 - 0.3, 0.14, zc); legs(r.x1 - 0.3, zc, 0.42, 2.4, 0.14, IM.black); B(0.035, 0.84, 1.5, IM.screen, r.x1 - 0.09, 0.72, zc); B(0.1, 0.07, 0.9, IM.black, r.x1 - 0.3, 0.5, zc);
      R(0.34, 0.72, 1.3, 0.02, IM.walnut, r.x0 + 0.26, 0.08, zc - 0.5); lamp(r.x0 + 0.26, 0.8, zc - 0.9, 1.1); C(0.07, 0.05, 0.22, IM.white, r.x0 + 0.26, 0.8, zc - 0.2, 16);
      var ac = new THREE.Group(); ac.position.set(r.x0 + 0.85, 0, r.z1 - 0.95); ac.rotation.y = 2.4; fur.add(ac);
      [[0.74, 0.22, 0.7, 0.09, 0, 0.2, 0], [0.74, 0.5, 0.18, 0.08, 0, 0.3, -0.3], [0.14, 0.34, 0.7, 0.06, -0.36, 0.3, 0], [0.14, 0.34, 0.7, 0.06, 0.36, 0.3, 0]].forEach(function (q) { var m = new THREE.Mesh(rbGeo(q[0], q[1], q[2], q[3]), IM.sofa2); m.position.set(q[4], q[5], q[6]); m.castShadow = true; m.receiveShadow = true; ac.add(m); });
      shadow(r.x0 + 0.85, r.z1 - 0.95, 1.3, 1.3);
      plant(r.x0 + 0.45, r.z0 + 0.5, 1.5, true); plant(r.x1 - 0.42, r.z1 - 0.5, 1.2);
      C(0.14, 0.16, 0.02, IM.black, r.x0 + 0.5, 0, r.z1 - 0.35, 20); C(0.012, 0.012, 1.5, IM.black, r.x0 + 0.5, 0, r.z1 - 0.35, 8); var fs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 24, 1, true), IM.shade); fs.position.set(r.x0 + 0.5, 1.6, r.z1 - 0.35); fur.add(fs);
      art(r.x0 + 0.07, zc - 0.5, 1.0, 1.25, 'x+'); B(0.03, 1.5, 2.9, IM.walnut, r.x1 - 0.078, 0, zc);
    } else if (k === 'dining') {
      var tx = r.x1 - 0.86, tz = 1.02;
      shadow(tx, tz, 2.3, 2.3); R(0.9, 0.05, 1.6, 0.02, IM.walnut, tx, 0.72, tz); legs(tx, tz, 0.86, 1.56, 0.72, IM.walnut, 0.03);
      [-0.38, 0.38].forEach(function (o) { chair(tx - 0.5, tz + o, Math.PI / 2, IM.sofa2); chair(tx + 0.5, tz + o, -Math.PI / 2, IM.sofa2); });
      C(0.06, 0.09, 0.2, IM.white, tx, 0.77, tz, 16); var fl = new THREE.Mesh(bushGeo, IM.bush); fl.scale.setScalar(0.14); fl.position.set(tx, 1.06, tz); fur.add(fl);
      [-0.4, 0, 0.4].forEach(function (o) { C(0.004, 0.004, 1.0, IM.black, tx, 1.86, tz + o, 6); var m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.16, 20, 1, true), IM.shade); m.position.set(tx, 1.8, tz + o); fur.add(m); });
    } else if (k === 'kitchen') {
      B(0.6, 0.84, d - 0.2, IM.cabinet, r.x0 + 0.36, 0, cz); R(0.64, 0.04, d - 0.16, 0.015, IM.stoneTop, r.x0 + 0.36, 0.84, cz);
      var kl = w - 1.5, kx = r.x0 + 0.66 + kl / 2; B(kl, 0.84, 0.6, IM.cabinet, kx, 0, r.z0 + 0.36); R(kl + 0.04, 0.04, 0.64, 0.015, IM.stoneTop, kx, 0.84, r.z0 + 0.36);
      for (i = 0; i < 4; i++) { var z1 = r.z0 + 0.3 + (d - 0.4) * (i + 0.5) / 4; B(0.012, 0.014, 0.22, IM.black, r.x0 + 0.665, 0.7, z1); B(0.004, 0.8, 0.006, IM.black, r.x0 + 0.661, 0.02, r.z0 + 0.1 + (d - 0.2) * i / 4); }
      B(0.44, 0.012, 0.6, IM.screen, r.x0 + 0.36, 0.882, cz + 0.55); [[-0.1, -0.14], [0.1, -0.14], [-0.1, 0.14], [0.1, 0.14]].forEach(function (q) { var t = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 20), IM.metal); t.rotation.x = Math.PI / 2; t.position.set(r.x0 + 0.36 + q[0], 0.9, cz + 0.55 + q[1]); fur.add(t); });
      B(0.4, 0.01, 0.5, IM.metal, r.x0 + 0.36, 0.883, cz - 0.6); var tap = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.011, 8, 16, Math.PI), IM.metal); tap.position.set(r.x0 + 0.14, 0.98, cz - 0.6); tap.rotation.y = 0; fur.add(tap); C(0.011, 0.011, 0.1, IM.metal, r.x0 + 0.04, 0.88, cz - 0.6, 8);
      B(0.5, 0.1, 0.62, IM.metal, r.x0 + 0.33, 1.62, cz + 0.55); B(0.2, 0.5, 0.2, IM.metal, r.x0 + 0.2, 1.72, cz + 0.55);
      B(kl, 0.7, 0.34, IM.cabDark, kx, 1.5, r.z0 + 0.23);
      R(0.7, 1.86, 0.66, 0.03, IM.metal, r.x1 - 0.42, 0, r.z0 + 0.4); B(0.02, 0.6, 0.02, IM.black, r.x1 - 0.7, 0.9, r.z0 + 0.745);
      C(0.09, 0.07, 0.12, IM.white, kx + 0.2, 0.88, r.z0 + 0.36, 16); R(0.3, 0.02, 0.22, 0.008, IM.oak, kx - 0.3, 0.88, r.z0 + 0.36, 0.2);
    } else if (k === 'bed' || k === 'master') {
      var m = k === 'master', bw = m ? 1.9 : 1.6, bz = cz + 0.35, dv = m ? IM.teal : (r.name === 'Bedroom 2' ? IM.rose : IM.accent);
      B(2.6, 0.014, bw + 1.3, m ? IM.rug2 : IM.rug3, r.x1 - 1.55, 0.004, bz);
      bed(r.x1 - 0.07, bz, bw, 2.05, dv); art(r.x1 - 0.07, bz, 1.2, 0.7, 'x-');
      if (m) { wardrobe(r.x0 + 0.37, r.z0 + 1.1 + (d - 1.6) / 2, d - 1.6, 0.62, false); R(0.44, 0.2, 1.3, 0.07, IM.sofa2, r.x1 - 2.62, 0.2, bz); legs(r.x1 - 2.62, bz, 0.44, 1.3, 0.2, IM.gold); }
      else { wardrobe(r.x0 + 1.4 + (w - 1.6) / 2, r.z0 + 0.37, w - 1.6, 0.62, true);
        R(0.56, 0.04, 1.2, 0.015, IM.oak, r.x0 + 0.36, 0.72, r.z1 - 1.05); legs(r.x0 + 0.36, r.z1 - 1.05, 0.54, 1.18, 0.72, IM.black); chair(r.x0 + 0.92, r.z1 - 1.05, -Math.PI / 2, IM.sofa2);
        B(0.3, 0.012, 0.22, IM.metal, r.x0 + 0.4, 0.762, r.z1 - 1.05); var ls = B(0.012, 0.2, 0.3, IM.screen, r.x0 + 0.26, 0.77, r.z1 - 1.05); ls.rotation.z = 0.25; lamp(r.x0 + 0.3, 0.76, r.z1 - 0.6, 0.8); }
      plant(r.x0 + 0.4, r.z1 - 0.38, 1.1);
    } else if (k === 'bath') {
      B(0.92, 0.32, 0.5, IM.walnut, r.x0 + 0.58, 0.46, r.z0 + 0.32); R(0.96, 0.04, 0.54, 0.015, IM.white, r.x0 + 0.58, 0.78, r.z0 + 0.32); C(0.19, 0.13, 0.12, IM.white, r.x0 + 0.58, 0.82, r.z0 + 0.34, 28);
      var bt = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 14, Math.PI), IM.metal); bt.position.set(r.x0 + 0.58, 0.9, r.z0 + 0.14); bt.rotation.y = Math.PI / 2; fur.add(bt);
      var mr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), IM.mirror); mr.position.set(r.x0 + 0.58, 1.5, r.z0 + 0.07); walk.add(mr);
      R(0.4, 0.38, 0.56, 0.13, IM.white, r.x0 + 0.42, 0, r.z1 - 0.44, Math.PI / 2); R(0.42, 0.03, 0.5, 0.012, IM.white, r.x0 + 0.44, 0.38, r.z1 - 0.44, Math.PI / 2); R(0.18, 0.4, 0.42, 0.05, IM.white, r.x0 + 0.16, 0.36, r.z1 - 0.44);
      var sd = Math.min(d - 0.2, 1.1); B(0.9, 0.03, sd, IM.stoneTop, r.x1 - 0.52, 0.004, r.z0 + 0.06 + sd / 2); var sg = B(0.025, 2.0, sd, IM.glass, r.x1 - 0.99, 0, r.z0 + 0.06 + sd / 2); sg.castShadow = false;
      C(0.012, 0.012, 0.35, IM.metal, r.x1 - 0.52, 2.0, r.z0 + 0.12, 8); C(0.11, 0.11, 0.02, IM.metal, r.x1 - 0.52, 1.98, r.z0 + 0.4, 20);
      if (d > 2.5) { R(0.8, 0.56, 1.66, 0.16, IM.white, r.x1 - 0.48, 0, r.z0 + 2.05); R(0.6, 0.02, 1.44, 0.009, IM.water, r.x1 - 0.48, 0.55, r.z0 + 2.05); R(0.6, 0.016, 0.9, 0.006, IM.linen, r.x0 + 1.5, 0.004, r.z0 + 1.6); }
    } else if (k === 'pooja') {
      B(1.0, 0.5, 0.46, IM.walnut, cx, 0, r.z0 + 0.3); B(0.9, 0.9, 0.36, IM.oak, cx, 0.5, r.z0 + 0.25); var ar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.36, 24, 1, false, 0, Math.PI), IM.oak); ar.rotation.x = Math.PI / 2; ar.rotation.z = Math.PI / 2; ar.position.set(cx, 1.4, r.z0 + 0.25); fur.add(ar);
      C(0.07, 0.04, 0.1, IM.gold, cx - 0.25, 0.5, r.z0 + 0.5, 16); C(0.07, 0.04, 0.1, IM.gold, cx + 0.25, 0.5, r.z0 + 0.5, 16); var di = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), IM.shade); di.position.set(cx, 0.56, r.z0 + 0.5); fur.add(di); C(0.06, 0.03, 0.04, IM.gold, cx, 0.5, r.z0 + 0.5, 14);
      B(1.1, 0.014, 0.8, IM.rug3, cx, 0.004, r.z0 + 1.05);
    } else if (k === 'study') {
      R(1.5, 0.04, 0.62, 0.015, IM.oak, cx + 0.35, 0.72, r.z0 + 0.4); legs(cx + 0.35, r.z0 + 0.4, 1.46, 0.58, 0.72, IM.black); chair(cx + 0.35, r.z0 + 1.02, Math.PI, IM.sofa);
      B(0.32, 0.012, 0.22, IM.metal, cx + 0.3, 0.762, r.z0 + 0.42); var sc = B(0.32, 0.21, 0.012, IM.screen, cx + 0.3, 0.77, r.z0 + 0.3); sc.rotation.x = -0.2; lamp(cx + 0.9, 0.76, r.z0 + 0.3, 0.8);
      B(0.36, 1.8, 1.1, IM.walnut, r.x0 + 0.26, 0, r.z0 + 0.66); for (i = 0; i < 4; i++) { B(0.05, 0.012, 1.02, IM.oak, r.x0 + 0.45, 0.3 + i * 0.4, r.z0 + 0.66); for (var bk = 0; bk < 7; bk++) B(0.16, 0.2 + (bk * 37 % 9) * 0.01, 0.045, [IM.teal, IM.accent, IM.linen, IM.rose, IM.sofa][(bk + i) % 5], r.x0 + 0.4, 0.312 + i * 0.4, r.z0 + 0.24 + bk * 0.07); }
    } else if (k === 'utility') {
      R(0.62, 0.86, 0.62, 0.03, IM.white, r.x0 + 0.42, 0, r.z0 + 0.4); var dr = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 24), IM.screen); dr.rotation.x = Math.PI / 2; dr.position.set(r.x0 + 0.42, 0.46, r.z0 + 0.72); fur.add(dr);
      B(0.9, 0.84, 0.6, IM.cabinet, r.x0 + 1.25, 0, r.z0 + 0.38); R(0.94, 0.04, 0.64, 0.015, IM.stoneTop, r.x0 + 1.25, 0.84, r.z0 + 0.38); B(0.4, 1.8, 0.9, IM.cabinet, r.x1 - 0.3, 0, r.z0 + 0.55);
    } else if (k === 'store') {
      for (i = 0; i < 4; i++) B(w - 0.3, 0.03, 0.4, IM.oak, cx, 0.2 + i * 0.5, r.z0 + 0.3); B(0.03, 1.8, 0.4, IM.oak, r.x0 + 0.17, 0, r.z0 + 0.3); B(0.03, 1.8, 0.4, IM.oak, r.x1 - 0.17, 0, r.z0 + 0.3);
      [[-0.4, 0.23, IM.accent], [0.2, 0.23, IM.sofa2], [-0.1, 0.73, IM.teal], [0.45, 0.73, IM.linen], [-0.45, 1.23, IM.sofa2]].forEach(function (q) { R(0.4, 0.26, 0.3, 0.02, q[2], cx + q[0], q[1], r.z0 + 0.3); });
    } else if (k === 'passage') {
      B(w - 1.2, 0.012, 0.7, IM.rug2, cx, 0.004, cz); art(cx, r.z0 + 0.07, 0.6, 0.8, '');
    }
  });
  // balcony furniture and planters
  [0.85, 2.3].forEach(function (o, i) { var q = new THREE.Group(); q.position.set(b.x0 + o, 0, b.z0 + 0.85); q.rotation.y = i ? -0.35 : 0.35; fur.add(q); [[0.62, 0.14, 0.62, 0.05, 0, 0.26, 0], [0.62, 0.42, 0.12, 0.05, 0, 0.36, -0.27], [0.1, 0.2, 0.6, 0.04, -0.3, 0.36, 0], [0.1, 0.2, 0.6, 0.04, 0.3, 0.36, 0]].forEach(function (s) { var m = new THREE.Mesh(rbGeo(s[0], s[1], s[2], s[3]), s[1] === 0.14 ? IM.linen : IM.walnut); m.position.set(s[4], s[5], s[6]); m.castShadow = true; q.add(m); }); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (s) { var m = new THREE.Mesh(cyGeo(0.02, 0.02, 0.28, 8), IM.black); m.position.set(s[0] * 0.26, 0, s[1] * 0.26); q.add(m); }); });
  C(0.26, 0.26, 0.03, IM.walnut, b.x0 + 1.58, 0.42, b.z0 + 1.05, 28); C(0.02, 0.02, 0.42, IM.black, b.x0 + 1.58, 0, b.z0 + 1.05, 8); C(0.05, 0.04, 0.09, IM.white, b.x0 + 1.58, 0.45, b.z0 + 1.05, 14);
  [[b.x1 - 0.75, b.z1 - 0.3, 1.3], [b.x0 + 0.3, b.z1 - 0.75, 0.3]].forEach(function (q) { var along = q[2] > 1; R(along ? 1.3 : 0.4, 0.42, along ? 0.4 : 1.3, 0.03, IM.potDark, q[0], 0, q[1]); for (var i = -1; i <= 1; i++) { var m = new THREE.Mesh(bushGeo, IM.bush); m.scale.set(0.3, 0.3, 0.3); m.position.set(q[0] + (along ? i * 0.4 : 0), 0.58, q[1] + (along ? 0 : i * 0.4)); m.castShadow = true; fur.add(m); } });
  plant(b.x1 - 0.4, b.z0 + 0.4, 1.3);
  var jx = b.x1 - 1.55, jz = b.z0 + 0.72; // jhoola swing
  [-0.75, 0.75].forEach(function (o) { C(0.03, 0.03, 2.1, IM.black, jx + o, 0, jz, 10); [-0.2, 0.2].forEach(function (z2) { C(0.007, 0.007, 1.55, IM.gold, jx + o * 0.72, 0.52, jz + z2, 6); }); });
  R(1.56, 0.05, 0.05, 0.02, IM.black, jx, 2.08, jz); R(1.2, 0.07, 0.5, 0.03, IM.walnut, jx, 0.46, jz); R(1.2, 0.36, 0.06, 0.03, IM.walnut, jx, 0.5, jz - 0.24); R(1.1, 0.08, 0.42, 0.04, IM.accent, jx, 0.53, jz + 0.02);
  var lamps = [];
  p.rooms.forEach(function (r) { if (r.kind === 'living' || r.kind === 'master' || r.kind === 'kitchen' || r.kind === 'bed' || r.kind === 'dining') { var l = new THREE.PointLight(0xffdcb0, 0.2, 8, 1.6); l.position.set((r.x0 + r.x1) / 2, 2.3, (r.z0 + r.z1) / 2); g.add(l); lamps.push(l); } });
  return { root: g, walls: walls, fur: fur, labels: labels, walk: walk, floors: floors, lamps: lamps, fans: fans };
}

IN.lookCtl = function (c, on) {
  if (on) { c.minDistance = c.maxDistance = 0.2; c.enableZoom = false; c.enablePan = false; c.rotateSpeed = -0.45; c.minPolarAngle = Math.PI * 0.26; c.maxPolarAngle = Math.PI * 0.74; }
  else { c.enableZoom = true; c.enablePan = true; c.rotateSpeed = 1; c.minPolarAngle = 0; }
};
IN.lights = function () {
  var t = BB.time; IN.scene.environment = BB.scene.environment;
  sun.color.copy(BB.sun.color); sun.intensity = t.day > 0.02 ? BB.sun.intensity * 0.3 : 0.08; hemi.color.set(t.night > 0.6 ? 0xffe3c2 : 0xfff6ea); hemi.intensity = 0.26 + 0.2 * t.day + 0.1 * t.night;
  var wk = IN.mode === 'walk'; if (IN.g) IN.g.lamps.forEach(function (l) { l.intensity = (wk ? 0.5 : 0.25) + t.night * 0.55; });
  if (wk) { hemi.intensity *= 0.82; sun.intensity = t.day > 0.02 ? BB.sun.intensity * 0.6 : 0.08; }
  IM.shade.emissiveIntensity = 0.45 + t.night * 0.9;
};
/* ---------- walking: first-person look, door-aware paths, guided tour ---------- */
var WK = IN.wk = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, path: [], turnTo: null, speed: 2.2, tour: null, room: null, bob: 0, idle: 0 };
function allRooms() { return IN.plan.rooms.concat([IN.plan.balcony]); }
function roomAt(x, z) { var rs = allRooms(); for (var i = 0; i < rs.length; i++) { var r = rs[i]; if (x >= r.x0 - 0.01 && x <= r.x1 + 0.01 && z >= r.z0 - 0.01 && z <= r.z1 + 0.01) return r; } return null; }
function links(p) {
  if (p.links) return p.links; var L = [];
  p.gaps.forEach(function (g) {
    if (g.type !== 'door' && g.type !== 'open') return; var m = (g.a + g.b) / 2, A, B, pa, pb;
    if (g.axis === 'x') { A = roomAt(m, g.c - 0.3); B = roomAt(m, g.c + 0.3); pa = [m, g.c - 0.55]; pb = [m, g.c + 0.55]; } else { A = roomAt(g.c - 0.3, m); B = roomAt(g.c + 0.3, m); pa = [g.c - 0.55, m]; pb = [g.c + 0.55, m]; }
    if (A && B && A !== B) L.push({ a: A, b: B, pa: pa, pb: pb, g: g });
  });
  p.links = L; return L;
}
function route(from, to) { // breadth-first search through doors; returns the links to cross, in order
  if (from === to) return []; var L = links(IN.plan), prev = new Map(), q = [from]; prev.set(from, null);
  while (q.length) { var r = q.shift(); if (r === to) break; L.forEach(function (l) { var o = l.a === r ? l.b : l.b === r ? l.a : null; if (o && !prev.has(o)) { prev.set(o, { r: r, l: l }); q.push(o); } }); }
  if (!prev.has(to)) return null; var out = [], c = to; while (prev.get(c)) { out.unshift({ l: prev.get(c).l, into: c }); c = prev.get(c).r; } return out;
}
function focusOf(r) { // where to stand in a room, and what to look at
  var cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  switch (r.kind) {
    case 'living': return [r.x0 + 1.0, r.z0 + 0.8, r.x1 - 0.8, r.z1 - 0.6];
    case 'dining': return [r.x0 + 0.55, r.z1 - 0.45, r.x1 - 0.8, r.z0 + 1.0];
    case 'kitchen': return [r.x1 - 0.55, r.z1 - 0.7, r.x0 + 0.4, r.z0 + 0.6];
    case 'bed': case 'master': return [r.x0 + 0.8, r.z0 + 0.95, r.x1 - 1.0, cz + 1.0];
    case 'balcony': return [cx + 0.2, r.z0 + 0.75, cx + 1.5, r.z1 + 12];
    case 'passage': return [cx, cz, r.x1, cz];
    default: return [cx, r.z1 - 0.5, cx, r.z0 + 0.3];
  }
}
function mx(x) { return IN.mirror ? IN.plan.W - x : x; }
IN.mx = mx;
function yawTo(dx, dz) { return Math.atan2(-dx, -dz); }
function angDiff(a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
IN.walkTo = function (x, z, look, fast) {
  var to = roomAt(x, z), from = roomAt(WK.pos.x, WK.pos.z); if (!to || !from) return;
  x = Math.min(to.x1 - 0.35, Math.max(to.x0 + 0.35, x)); z = Math.min(to.z1 - 0.35, Math.max(to.z0 + 0.35, z));
  var rt = route(from, to); if (!rt) return; var pts = [], cur = from;
  rt.forEach(function (s) { var fwd = s.l.b === s.into; pts.push(fwd ? s.l.pa : s.l.pb, fwd ? s.l.pb : s.l.pa); cur = s.into; });
  pts.push([x, z]); WK.path = pts; WK.turnTo = look ? look : null; WK.speed = fast ? 3.0 : 2.2;
};
IN.goRoom = function (r, fast) { var f = focusOf(r); IN.walkTo(f[0], f[1], [f[2], f[3]], fast); };
IN.place = function (r) { var f = focusOf(r); WK.pos.set(f[0], 1.55, f[1]); WK.yaw = yawTo(f[2] - f[0], f[3] - f[1]); WK.pitch = -0.04; WK.path = []; WK.turnTo = null; WK.room = null; };
IN.look = function (dx, dy) { WK.yaw += dx * 0.0042 * (IN.mirror ? -1 : 1); WK.pitch = Math.max(-0.7, Math.min(0.6, WK.pitch + dy * 0.0034)); WK.turnTo = null; WK.idle = 0; if (WK.tour) IN.stopTour(); };
IN.keyMove = function (f, s, dt) { // forward and strafe, with walls respected: rooms are only left through a door or opening
  if (IN.mirror) s = -s;
  var fx = -Math.sin(WK.yaw), fz = -Math.cos(WK.yaw), nx = WK.pos.x + (fx * f - fz * s) * 2.2 * dt, nz = WK.pos.z + (fz * f + fx * s) * 2.2 * dt;
  var cur = roomAt(WK.pos.x, WK.pos.z), nxt = roomAt(nx, nz); if (!nxt || !cur) return;
  if (nxt !== cur) { var ok = links(IN.plan).some(function (l) { if (!((l.a === cur && l.b === nxt) || (l.b === cur && l.a === nxt))) return false; var g = l.g, t = g.axis === 'x' ? nx : nz; return t > g.a + 0.12 && t < g.b - 0.12; }); if (!ok) return; }
  else { nx = Math.min(cur.x1 - 0.22, Math.max(cur.x0 + 0.22, nx)); nz = Math.min(cur.z1 - 0.22, Math.max(cur.z0 + 0.22, nz)); var n2 = roomAt(nx, nz); if (n2 !== cur) return; }
  if (nxt !== cur) { WK.pos.x = nx; WK.pos.z = nz; } else { WK.pos.x = nx; WK.pos.z = nz; }
  WK.path = []; WK.turnTo = null; WK.bob += 2.2 * dt * 3.2; if (WK.tour) IN.stopTour();
};
IN.startTour = function () {
  var order = ['living', 'dining', 'kitchen', 'bed', 'study', 'pooja', 'master', 'balcony'], list = [];
  order.forEach(function (k) { allRooms().forEach(function (r) { if (r.kind === k) list.push(r); }); });
  WK.tour = { list: list, ix: 0, wait: 0, dir: 1 }; IN.goRoom(list[0]);
};
IN.stopTour = function () { if (WK.tour) { WK.tour = null; if (IN.onTour) IN.onTour(false); } };
IN.update = function (dt, now) {
  var moving = false;
  if (WK.path.length) {
    var t = WK.path[0], dx = t[0] - WK.pos.x, dz = t[1] - WK.pos.z, d = Math.hypot(dx, dz), step = WK.speed * dt; moving = true;
    if (d <= step) { WK.pos.x = t[0]; WK.pos.z = t[1]; WK.path.shift(); } else { WK.pos.x += dx / d * step; WK.pos.z += dz / d * step; WK.bob += step * 3.2; if (d > 0.25) WK.yaw += angDiff(yawTo(dx, dz), WK.yaw) * Math.min(1, dt * 4.5); }
    WK.pitch += (-0.04 - WK.pitch) * Math.min(1, dt * 3);
  } else if (WK.turnTo) {
    var want = yawTo(WK.turnTo[0] - WK.pos.x, WK.turnTo[1] - WK.pos.z), df = angDiff(want, WK.yaw); WK.yaw += df * Math.min(1, dt * 3.2); if (Math.abs(df) < 0.015) WK.turnTo = null;
  } else if (WK.tour) {
    var T = WK.tour; T.wait += dt; WK.yaw += Math.sin(T.wait * 0.9) * 0.22 * dt;
    if (T.wait > 4.2) { T.ix++; T.wait = 0; if (T.ix >= T.list.length) IN.stopTour(); else IN.goRoom(T.list[T.ix]); }
  }
  IN.cam.position.set(mx(WK.pos.x), 1.55 + Math.sin(WK.bob) * 0.012, WK.pos.z); IN.cam.rotation.set(WK.pitch, IN.mirror ? -WK.yaw : WK.yaw, 0);
  var r = roomAt(WK.pos.x, WK.pos.z); if (r && r !== WK.room) { WK.room = r; if (IN.onRoom) IN.onRoom(r); }
  if (IN.g && IN.g.fans) IN.g.fans.forEach(function (f) { f.rotation.y = now * 5; });
};
var MINI = { marble: '#d9d5cc', wood: '#b48a5e', tile: '#c3c9c8', deck: '#7a5a42' };
IN.miniMap = function (cv) { // returns the transform used, so a tap on the plan can be turned back into metres
  var p = IN.plan, g = cv.getContext('2d'), w = cv.width, h = cv.height, s = Math.min((w - 12) / p.W, (h - 12) / (p.D + 1.7)), ox = (w - p.W * s) / 2, oz = (h - (p.D + 1.7) * s) / 2;
  g.clearRect(0, 0, w, h);
  g.save(); if (IN.mirror) { g.translate(w, 0); g.scale(-1, 1); }
  allRooms().forEach(function (r) { g.fillStyle = MINI[r.floor]; g.globalAlpha = r === WK.room ? 1 : 0.62; g.fillRect(ox + r.x0 * s, oz + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s); g.globalAlpha = 1; g.strokeStyle = '#10171c'; g.lineWidth = 1.6; g.strokeRect(ox + r.x0 * s, oz + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s); });
  g.strokeStyle = '#d9d5cc'; g.lineWidth = 2.4; p.gaps.forEach(function (q) { if (q.type === 'glass') return; g.beginPath(); if (q.axis === 'x') { g.moveTo(ox + (q.a + 0.06) * s, oz + q.c * s); g.lineTo(ox + (q.b - 0.06) * s, oz + q.c * s); } else { g.moveTo(ox + q.c * s, oz + (q.a + 0.06) * s); g.lineTo(ox + q.c * s, oz + (q.b - 0.06) * s); } g.stroke(); });
  if (WK.path.length) { g.strokeStyle = '#dcb872'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(ox + WK.pos.x * s, oz + WK.pos.z * s); WK.path.forEach(function (q) { g.lineTo(ox + q[0] * s, oz + q[1] * s); }); g.stroke(); g.setLineDash([]); }
  var cx = ox + WK.pos.x * s, cz = oz + WK.pos.z * s, a = WK.yaw;
  g.fillStyle = 'rgba(220,184,114,.45)'; g.beginPath(); g.moveTo(cx, cz); g.arc(cx, cz, 22, -Math.PI / 2 - a - 0.5, -Math.PI / 2 - a + 0.5); g.closePath(); g.fill();
  g.fillStyle = '#dcb872'; g.beginPath(); g.arc(cx, cz, 4.2, 0, 6.3); g.fill(); g.strokeStyle = '#10171c'; g.lineWidth = 1.5; g.stroke(); g.restore();
  return { s: s, ox: ox, oz: oz, w: w, mirror: IN.mirror };
};
IN.setMode = function (m, room) {
  IN.mode = m; BB.stopTween(); IN.stopTour(); var p = IN.plan, g = IN.g, cx = p.W / 2, cz = (p.D + 1.7) / 2, dist = Math.max(p.W * 1.5, 18) * BB.fit();
  g.walls.scale.y = m === 'walk' ? 2.86 : 1.5; g.walk.visible = m === 'walk'; g.labels.visible = m !== 'walk' && BB.state.labels;
  if (m === 'walk') {
    IN.cam.fov = 62; ctl.enabled = false; IN.cam.rotation.order = 'YXZ'; sun.position.set(mx(p.W / 2 - 7), 9.5, p.D + 16);
    IN.place(room || p.rooms[0]); IN.update(0, 0);
  } else {
    IN.cam.rotation.order = 'XYZ'; ctl.enabled = true; sun.position.set(p.W / 2 - 9, 22, p.D / 2 + 15);
    IN.cam.fov = 38; IN.lookCtl(ctl, false); ctl.minDistance = 3; ctl.maxDistance = 95; ctl.maxPolarAngle = Math.PI * 0.46;
    if (room) { cx = (room.x0 + room.x1) / 2; cz = (room.z0 + room.z1) / 2; dist *= 0.5; }
    cx = mx(cx); ctl.target.set(cx, 0.5, cz);
    if (m === 'plan') IN.cam.position.set(cx, dist * 1.12, cz + 0.02); else IN.cam.position.set(cx + p.W * 0.14, dist * 0.9, cz + dist * 0.88);
    ctl.update();
  }
  IN.cam.updateProjectionMatrix(); IN.lights();
};
IN.open = function (f) {
  if (IN.g) IN.scene.remove(IN.g.root);
  if (!IN.cache[f.type]) IN.cache[f.type] = build(f.type);
  if (IN.g) IN.scene.remove(IN.g.labels);
  IN.g = IN.cache[f.type]; IN.plan = BB.PLANS[f.type]; IN.mirror = f.u.sx < 0; IN.scene.add(IN.g.root); IN.scene.add(IN.g.labels); IN.g.fur.visible = IN.furnished;
  IN.g.root.scale.x = IN.mirror ? -1 : 1; IN.g.root.position.x = IN.mirror ? IN.plan.W : 0; IN.g.labels.children.forEach(function (sp) { sp.position.x = mx(sp.userData.px); });
  var p = IN.plan, s = Math.max(p.W, p.D) / 2 + 4, c = sun.shadow.camera; c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 1; c.far = 90; c.updateProjectionMatrix();
  sun.position.set(p.W / 2 - 9, 22, p.D / 2 + 15); sun.target.position.set(p.W / 2, 0, p.D / 2);
  IN.on = true; IN.lights(); IN.setMode(IN.mode);
};
var STYLES = [
  ['Warm',    { wood: 0xcfb99a, sofa: 0x8b979a, wall: 0xe2dbcf, cabinet: 0xe6dfd2, oak: 0xb9946a, walnut: 0x70503b, rug: 0xffffff, teal: 0x5d8580 }],
  ['Modern',  { wood: 0x8f8a84, sofa: 0x444d53, wall: 0xe4e4e1, cabinet: 0x3c4449, oak: 0x9d9388, walnut: 0x2f2a27, rug: 0xc9ced0, teal: 0x8a6f4c }],
  ['Classic', { wood: 0xa87850, sofa: 0xb7a889, wall: 0xece2cf, cabinet: 0xf0e9dc, oak: 0x9a6a42, walnut: 0x54301f, rug: 0xe9d3bd, teal: 0x7a3f3a }]
], styleI = 0;
IN.nextStyle = function () { styleI = (styleI + 1) % STYLES.length; var s = STYLES[styleI][1]; Object.keys(s).forEach(function (k) { IM[k].color.setHex(s[k]); }); return STYLES[styleI][0]; };
IN.rooms = function () { var p = IN.plan; return p.rooms.concat([p.balcony]); };
/* Camera for the real outside view: places the interior camera at the flat's true position in the project. */
var bg = IN.bgCam = new THREE.PerspectiveCamera(60, 1, 0.5, 9000), qy = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();
IN.syncBackdrop = function (f) {
  var t = BB.towerInfo[f.tower], p = IN.plan, rot = t.rot + (f.u.sz > 0 ? 0 : Math.PI), FD = BB.D / 2 - 0.1;
  vp.copy(f.wpos); var fy = f.y0 + 0.3;
  var lx = IN.cam.position.x - p.W / 2, lz = IN.cam.position.z - (p.D - FD / 2), c = Math.cos(rot), s = Math.sin(rot);
  bg.position.set(vp.x + lx * c + lz * s, fy + IN.cam.position.y, vp.z - lx * s + lz * c);
  qy.setFromAxisAngle(yAxis, rot); bg.quaternion.copy(qy).multiply(IN.cam.quaternion);
  bg.fov = IN.cam.fov; bg.aspect = IN.cam.aspect; bg.updateProjectionMatrix();
};
})();
