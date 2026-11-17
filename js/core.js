/* Core: renderer, helpers, shared materials, vegetation, sky, sun and time of day. */
(function () {
'use strict';
var BB = window.BB, $ = BB.$, rng = BB.rng;
var canvas = BB.canvas = $('#scene');
if (!window.THREE || !THREE.OrbitControls || !THREE.RoundedBoxGeometry || !THREE.BufferGeometryUtils) { $('#nogl').hidden = false; $('#boot').hidden = true; BB.fail = true; return; }
var renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').hidden = false; $('#boot').hidden = true; BB.fail = true; return; }
BB.renderer = renderer;
BB.lite = /lite/.test(location.search);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
var MAXA = Math.min(8, renderer.capabilities.getMaxAnisotropy());

var scene = BB.scene = new THREE.Scene();
var camera = BB.camera = new THREE.PerspectiveCamera(38, 1, 1, 12000);
var controls = BB.controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI * 0.492; controls.minDistance = 30; controls.maxDistance = 1500;

var hemi = new THREE.HemisphereLight(0xffffff, 0x6b6457, 0.6); scene.add(hemi);
var sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.castShadow = true; var SM = BB.lite ? 1024 : window.innerWidth < 820 ? 2048 : 4096; sun.shadow.mapSize.set(SM, SM);
var sc = sun.shadow.camera; sc.left = -230; sc.right = 230; sc.top = 230; sc.bottom = -230; sc.near = 10; sc.far = 1400;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.45;
scene.add(sun); scene.add(sun.target);
var fill = new THREE.DirectionalLight(0xbfd4ff, 0.2); scene.add(fill);   // soft sky fill opposite the sun, no shadows
scene.fog = new THREE.Fog(0xcfe0ee, 900, 4200);
BB.hemi = hemi; BB.sun = sun;
BB.timeHooks = [];

/* ---------- canvas texture helpers ---------- */
function cnv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function ctex(c, rep) { var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXA; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function speckle(g, w, h, n, a, r) { for (var i = 0; i < n; i++) { var v = r() > 0.5 ? 255 : 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (a * r()) + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } }
function noiseTex(size, base, n, a, rep, seed) { var c = cnv(size, size), g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, size, size); speckle(g, size, size, n, a, rng(seed || 3)); return ctex(c, rep); }
var loader = new THREE.TextureLoader();
function photo(url, rep) { var t = loader.load(url); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXA; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
BB.cnv = cnv; BB.ctex = ctex; BB.speckle = speckle; BB.noiseTex = noiseTex; BB.photo = photo;
function S(o) { var m = new THREE.MeshStandardMaterial(o); if (o.envMapIntensity == null) m.envMapIntensity = 0.35; return m; }
BB.S = S;

function paverC() { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(8); g.fillStyle = '#a39c90'; g.fillRect(0, 0, 512, 512); for (var y = 0; y < 512; y += 32) for (var x = -64; x < 512; x += 64) { var o = (y / 32) % 2 ? 32 : 0, t = 164 + Math.floor(r() * 26); g.fillStyle = 'rgb(' + t + ',' + (t - 6) + ',' + (t - 18) + ')'; g.fillRect(x + o + 1, y + 1, 62, 30); } speckle(g, 512, 512, 3000, 0.05, r); return c; }
function roadC(lanes) { var c = cnv(512, 128), g = c.getContext('2d'), r = rng(13); g.fillStyle = '#3f4347'; g.fillRect(0, 0, 512, 128); speckle(g, 512, 128, 3500, 0.09, r); g.fillStyle = 'rgba(240,238,225,.85)'; if (lanes) { g.fillRect(40, 61, 180, 6); g.fillRect(296, 61, 180, 6); } g.fillStyle = 'rgba(240,238,225,.55)'; g.fillRect(0, 4, 512, 3); g.fillRect(0, 121, 512, 3); return c; }
function slatC() { var c = cnv(256, 256), g = c.getContext('2d'), r = rng(21); for (var x = 0; x < 256; x += 16) { var t = 128 + Math.floor(r() * 36); g.fillStyle = 'rgb(' + t + ',' + Math.floor(t * 0.74) + ',' + Math.floor(t * 0.53) + ')'; g.fillRect(x, 0, 13, 256); g.fillStyle = '#2a1f17'; g.fillRect(x + 13, 0, 3, 256); } return c; }
function stoneC() { var c = cnv(512, 512), g = c.getContext('2d'), r = rng(5); g.fillStyle = '#b9ab95'; g.fillRect(0, 0, 512, 512); for (var y = 0; y < 512; y += 64) for (var x = -128; x < 512; x += 128) { var o = (y / 64) % 2 ? 64 : 0, t = 196 + Math.floor(r() * 26); g.fillStyle = 'rgb(' + t + ',' + (t - 12) + ',' + (t - 32) + ')'; g.fillRect(x + o + 1, y + 1, 126, 62); } speckle(g, 512, 512, 2500, 0.06, r); return c; }
BB.paverC = paverC; BB.roadC = roadC; BB.slatC = slatC; BB.stoneC = stoneC;
BB.tex = function (c, rx, ry) { return ctex(c, [rx, ry]); };

var M = BB.M = {
  white: S({ color: 0xf1ede5, roughness: 0.85 }),
  paint: S({ color: 0xece6da, roughness: 0.9 }),
  taupe: S({ color: 0x8f897e, roughness: 0.9 }),
  char: S({ color: 0x2f3438, roughness: 0.55, metalness: 0.35 }),
  dark: S({ color: 0x33393e, roughness: 0.5, metalness: 0.4 }),
  stone: S({ map: ctex(stoneC(), [14, 3]), roughness: 0.85 }),
  slat: S({ map: ctex(slatC(), [1, 1]), roughness: 0.6 }),
  rail: S({ color: 0xcfe6ee, transparent: true, opacity: 0.26, roughness: 0.05, metalness: 0.6, depthWrite: false, envMapIntensity: 1.3 }),
  grass: S({ map: photo('tex/grass.jpg', [42, 34]), color: 0x7c8a63, roughness: 1 }),
  land: S({ map: noiseTex(512, '#6c7257', 9000, 0.12, [320, 320], 17), roughness: 1 }),
  paving: S({ map: ctex(paverC(), [1, 1]), roughness: 0.9 }),
  sand: S({ map: noiseTex(256, '#d8cbb2', 2500, 0.07, [0.3, 0.3], 23), roughness: 0.9 }),
  water: S({ color: 0x1593b4, roughness: 0.14, metalness: 0.2, envMapIntensity: 0.5, emissive: 0x1090b8, emissiveIntensity: 0 }),
  trunk: S({ color: 0x64503f, roughness: 1 }),
  leaf: S({ vertexColors: true, roughness: 0.95 }),
  lamp: S({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0 }),
  cream: S({ color: 0xf2ead8, roughness: 0.9, side: THREE.DoubleSide }),
  tyre: S({ color: 0x1b1d1f, roughness: 0.9 }),
  solar: S({ color: 0x1b2a4a, roughness: 0.2, metalness: 0.8, envMapIntensity: 1 }),
  hill: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, vertexColors: true }),
  hill2: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false, vertexColors: true })
};
(function () { var wn = loader.load('tex/water.jpg'); wn.wrapS = wn.wrapT = THREE.RepeatWrapping; wn.repeat.set(0.09, 0.09); M.water.normalMap = wn; M.water.normalScale.set(0.55, 0.55); BB.waterN = wn; })();
BB.timeHooks.push(function (t) { M.lamp.emissiveIntensity = t.night * 3; M.water.emissiveIntensity = t.night * 0.5; });

/* ---------- geometry helpers ---------- */
function box(w, h, d, mat, x, y, z, parent, cast) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
  m.castShadow = cast !== false; m.receiveShadow = true; (parent || scene).add(m); return m;
}
var dummy = new THREE.Object3D();
function instanced(geo, mat, list, parent, cast) { // list item: [x, y, z, s, rotY, sy, sz]
  var im = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach(function (p, i) { dummy.position.set(p[0], p[1], p[2]); dummy.rotation.set(0, p[4] || 0, 0); var s = p[3] == null ? 1 : p[3]; dummy.scale.set(s, p[5] == null ? s : p[5], p[6] == null ? s : p[6]); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
  im.castShadow = cast !== false; im.receiveShadow = true; (parent || scene).add(im); return im;
}
function nb(w, h, d, x, y, z) { var g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z); return g; }   // non-indexed box for merging
function merge(list) { return list.length ? THREE.BufferGeometryUtils.mergeBufferGeometries(list) : null; }
BB.box = box; BB.instanced = instanced; BB.nb = nb; BB.merge = merge; BB.unit = new THREE.BoxGeometry(1, 1, 1); BB.dummy = dummy;
BB.labels = new THREE.Group(); scene.add(BB.labels);
BB.label = function (text, small, pin) {
  var c = cnv(512, 128), g = c.getContext('2d');
  g.font = '500 46px Outfit, Segoe UI, Arial, sans-serif';
  var tw = Math.min(490, g.measureText(text).width + 60), x = (512 - tw) / 2, rr = 38;
  g.fillStyle = pin ? 'rgba(220,184,114,.95)' : 'rgba(8,14,18,.8)'; g.beginPath(); g.moveTo(x + rr, 26); g.arcTo(x + tw, 26, x + tw, 102, rr); g.arcTo(x + tw, 102, x, 102, rr); g.arcTo(x, 102, x, 26, rr); g.arcTo(x, 26, x + tw, 26, rr); g.closePath(); g.fill();
  g.fillStyle = pin ? '#1a1408' : '#f3f1ea'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(c), transparent: true, depthTest: false, fog: false }));
  var k = small ? 17 : 22; s.scale.set(k, k / 4, 1); s.renderOrder = 20; BB.labels.add(s); return s;
};

/* ---------- vegetation: leafy trees (leaf cards around a dark core), flowering trees, palms, shrubs ---------- */
function n3(x, y, z) { return Math.sin(x * 1.7 + y * 2.3) * Math.cos(z * 1.9 - y * 1.3) * 0.6 + Math.sin(x * 3.3 - z * 2.9 + y * 0.9) * 0.4; }
function blob(cx, cy, cz, rad, sq, seed, base, shade0, det) {
  var g = new THREE.IcosahedronGeometry(1, det == null ? 2 : det), p = g.attributes.position, nrm = g.attributes.normal, col = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (var i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize(); var k = rad * (1 + 0.2 * n3(v.x * 2.4 + seed, v.y * 2.4, v.z * 2.4 + seed * 0.7));
    nrm.setXYZ(i, v.x, v.y, v.z); p.setXYZ(i, cx + v.x * k, cy + v.y * k * sq, cz + v.z * k);
    var sh = shade0 + (1 - shade0) * Math.min(1, Math.max(0, 0.5 + v.y * 0.55)) + 0.06 * n3(v.x * 6, v.y * 6 + seed, v.z * 6);
    col[i * 3] = base[0] * sh; col[i * 3 + 1] = base[1] * sh; col[i * 3 + 2] = base[2] * sh;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
}
BB.blob = blob;
function leafTex(seed, cols, flowers) {
  var c = cnv(256, 256), g = c.getContext('2d'), r = rng(seed);
  for (var i = 0; i < 150; i++) {
    var a = r() * 6.283, d = Math.sqrt(r()) * 104, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, l = 12 + r() * 13;
    g.save(); g.translate(x, y); g.rotate(r() * 6.283); g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.ellipse(0, 0, l, l * 0.42, 0, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-l, 0); g.lineTo(l, 0); g.stroke(); g.restore();
  }
  if (flowers) for (i = 0; i < 90; i++) { var a2 = r() * 6.283, d2 = Math.sqrt(r()) * 100; g.fillStyle = flowers[Math.floor(r() * flowers.length)]; g.beginPath(); g.arc(128 + Math.cos(a2) * d2, 128 + Math.sin(a2) * d2, 5 + r() * 6, 0, 6.283); g.fill(); }
  var t = ctex(c); return t;
}
function cardCanopy(seed, spread, height) {
  var r = rng(seed), pos = [], nor = [], uv = [], col = [], centres = [[0, height, 0, spread]], n = 4 + Math.floor(r() * 3), i;
  for (i = 0; i < n; i++) { var a = i / n * 6.283 + r(), d = spread * (0.45 + r() * 0.45); centres.push([Math.cos(a) * d, height - 0.9 + r() * 1.9, Math.sin(a) * d, spread * (0.5 + r() * 0.3)]); }
  var X = new THREE.Vector3(), Y = new THREE.Vector3(), N = new THREE.Vector3(), P = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  centres.forEach(function (c) {
    var cards = Math.round(13 + c[3] * 5);
    for (var k = 0; k < cards; k++) {
      var u = r() * 6.283, v = Math.acos(1 - r() * 1.75), rad = c[3] * (0.72 + r() * 0.36), s = 1.0 + r() * 0.9;
      N.set(Math.sin(v) * Math.cos(u), Math.cos(v) * 0.9, Math.sin(v) * Math.sin(u)).normalize(); P.set(c[0] + N.x * rad, c[1] + N.y * rad * 0.8, c[2] + N.z * rad);
      X.set(r() - 0.5, r() - 0.5, r() - 0.5).cross(N).normalize(); Y.crossVectors(N, X).normalize(); X.lerp(N, (r() - 0.5) * 0.9).normalize(); Y.crossVectors(N, X).normalize();
      var sh = 0.55 + 0.45 * Math.min(1, Math.max(0, 0.45 + N.y * 0.6)) + (r() - 0.5) * 0.16, nx = N.x * 0.6, ny = N.y * 0.6 + 0.4, nz = N.z * 0.6;
      [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(function (q) {
        pos.push(P.x + (X.x * q[0] + Y.x * q[1]) * s, P.y + (X.y * q[0] + Y.y * q[1]) * s, P.z + (X.z * q[0] + Y.z * q[1]) * s); nor.push(nx, ny, nz); uv.push(q[2], q[3]); col.push(sh, sh, sh);
      });
    }
  });
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  var cores = centres.map(function (c, k) { return blob(c[0], c[1], c[2], c[3] * 0.78, 0.8, seed + k, [0.1, 0.19, 0.09], 0.5, 1); });
  return { cards: g, core: merge(cores) };
}
function trunkGeo() {
  var a = new THREE.CylinderGeometry(0.16, 0.3, 4.4, 8); a.translate(0, 2.2, 0);
  var b = new THREE.CylinderGeometry(0.07, 0.13, 2.4, 6); b.translate(0, 1.2, 0); b.rotateZ(0.7); b.translate(0, 3.0, 0);
  var c = new THREE.CylinderGeometry(0.07, 0.12, 2.2, 6); c.translate(0, 1.1, 0); c.rotateZ(-0.6); c.rotateY(1.2); c.translate(0, 3.3, 0);
  var d = new THREE.CylinderGeometry(0.06, 0.11, 2.0, 6); d.translate(0, 1.0, 0); d.rotateZ(0.55); d.rotateY(-2.1); d.translate(0, 3.5, 0);
  return THREE.BufferGeometryUtils.mergeBufferGeometries([a, b, c, d]);
}
var KINDS = [
  { tex: leafTex(3, ['#3d6b2c', '#4a7a33', '#2f5a26', '#5a8a3c']), seed: 31, spread: 2.5, h: 5.6 },
  { tex: leafTex(7, ['#35602b', '#2c5225', '#446f31', '#527f3a']), seed: 48, spread: 2.9, h: 6.2 },
  { tex: leafTex(11, ['#5a8a3a', '#6a983f', '#4d7c34', '#7aa648']), seed: 65, spread: 2.2, h: 5.2 },
  { tex: leafTex(15, ['#3f6d2e', '#4a7a33', '#35602b'], ['#e4572e', '#f08a24', '#d93a2b']), seed: 82, spread: 2.7, h: 5.4 },   // gulmohar
  { tex: leafTex(19, ['#4a7a33', '#5a8a3c', '#3d6b2c'], ['#f2c230', '#f7d94c', '#e9b020']), seed: 99, spread: 2.3, h: 5.2 },   // amaltas
  { tex: leafTex(23, ['#3d6b2c', '#4a7a33'], ['#e05a9c', '#f07ab4', '#c9408a']), seed: 116, spread: 2.0, h: 4.6 }              // bougainvillea
];
KINDS.forEach(function (k) {
  var c = cardCanopy(k.seed, k.spread, k.h); k.cards = c.cards; k.core = c.core;
  k.mat = S({ map: k.tex, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true, roughness: 0.9, envMapIntensity: 0.25 });
  k.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: k.tex, alphaTest: 0.42 });
});
var coreMat = S({ vertexColors: true, roughness: 1, envMapIntensity: 0.2 }), trunkG = trunkGeo();
/* list item: [x, z, scale, rotY, kind]. kind 0-2 green, 3-5 flowering; omitted picks by position. */
BB.plantTrees = function (list, parent, cast) {
  var by = KINDS.map(function () { return []; }), tr = [], r = rng(list.length + 7);
  list.forEach(function (t) { var k = t[4] == null ? (r() < 0.82 ? Math.floor(r() * 3) : 3 + Math.floor(r() * 3)) : t[4]; by[k].push([t[0], 0, t[1], t[2], t[3] || 0]); tr.push([t[0], 0, t[1], t[2], t[3] || 0]); });
  by.forEach(function (l, k) {
    if (!l.length) return; var K = KINDS[k], im = instanced(K.cards, K.mat, l, parent, cast); im.customDepthMaterial = K.depth;
    var col = new THREE.Color(); l.forEach(function (q, i) { col.setRGB(0.86 + r() * 0.3, 0.88 + r() * 0.26, 0.8 + r() * 0.3); im.setColorAt(i, col); });
    instanced(K.core, coreMat, l, parent, cast);
  });
  instanced(trunkG, M.trunk, tr, parent, cast);
};
function frondTex() {
  var c = cnv(128, 512), g = c.getContext('2d'); g.strokeStyle = '#2f5a22'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 506); g.lineTo(64, 6); g.stroke();
  for (var y = 500; y > 10; y -= 9) { var t = (500 - y) / 490, w = 58 * Math.sin(Math.PI * (0.08 + 0.9 * t)); g.strokeStyle = ['#3f7230', '#4b8038', '#366a2a'][Math.floor(y / 9) % 3]; g.lineWidth = 5; g.beginPath(); g.moveTo(64, y); g.lineTo(64 - w, y - 16 - 10 * t); g.moveTo(64, y); g.lineTo(64 + w, y - 16 - 10 * t); g.stroke(); }
  return ctex(c);
}
function palmGeo(seed) {
  var r = rng(seed), parts = [], n = 13;
  for (var k = 0; k < n; k++) {
    var g = new THREE.PlaneGeometry(1, 1, 2, 9), p = g.attributes.position, len = 3.8 + r() * 1.3, pitch = 0.15 + r() * 0.7, yaw = k / n * Math.PI * 2 + r() * 0.3, droop = 1.5 + r() * 1.5;
    for (var i = 0; i < p.count; i++) {
      var x = p.getX(i), t = p.getY(i) + 0.5, f = len * t;
      var lx = x * 1.5, ly = f * Math.sin(pitch) - droop * t * t - Math.abs(x) * 0.5, lz = f * Math.cos(pitch);
      p.setXYZ(i, lx * Math.cos(yaw) + lz * Math.sin(yaw), ly, -lx * Math.sin(yaw) + lz * Math.cos(yaw));
    }
    g.computeVertexNormals(); parts.push(g);
  }
  return THREE.BufferGeometryUtils.mergeBufferGeometries(parts);
}
BB.palmGeo = palmGeo;
var ftex = frondTex();
M.palm = S({ map: ftex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.85, envMapIntensity: 0.25 });
var palmDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: ftex, alphaTest: 0.35 });
var pcurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.25, 3, 0.05), new THREE.Vector3(0.5, 6, 0.15), new THREE.Vector3(0.45, 8.6, 0.2)]);
var ptg = new THREE.TubeGeometry(pcurve, 10, 0.2, 7), pfg = palmGeo(9); pfg.translate(0.45, 8.5, 0.2);
BB.plantPalms = function (list, parent) { var l = list.map(function (t) { return [t[0], 0, t[1], t[2], t[3] || 0]; }); instanced(ptg, M.trunk, l, parent); var im = instanced(pfg, M.palm, l, parent); im.customDepthMaterial = palmDepth; };
BB.shrubGeo = blob(0, 0.55, 0, 0.8, 0.75, 3, [0.19, 0.32, 0.16], 0.55, 2);

/* ---------- sky dome with sun, haze and drifting clouds; stars, moon; time of day ---------- */
var SKY_V = 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w; }';
var SKY_F = [
  'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 gnd; uniform vec3 sunDir; uniform vec3 sunCol; uniform vec3 cloudLit; uniform vec3 cloudSh; uniform float glow; uniform float cover; uniform float time;',
  'varying vec3 vDir;',
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }',
  'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }',
  'void main(){',
  '  vec3 d = normalize(vDir); float h = d.y;',
  '  float hh = clamp(h, 0.0, 1.0);',
  '  vec3 col = mix(hor, mid, smoothstep(0.0, 0.2, hh)); col = mix(col, top, smoothstep(0.1, 0.72, hh));',
  '  col = mix(col, gnd, smoothstep(0.0, -0.12, h));',
  '  float sd = max(dot(d, normalize(sunDir)), 0.0);',
  '  float az = max(dot(normalize(d.xz + 1e-4), normalize(sunDir.xz + 1e-4)), 0.0);',
  '  col += hor * exp(-abs(h) * 7.0) * (0.25 + 0.9 * az * az) * glow;',                 // warm haze band near the horizon, strongest toward the sun
  '  col += sunCol * (pow(sd, 900.0) * 6.0 + pow(sd, 60.0) * 0.5 + pow(sd, 6.0) * 0.16 * (0.4 + glow));',
  '  if (h > 0.0) {',
  '    vec2 uv = d.xz / (h + 0.16) * 0.55 + vec2(time * 0.006, time * 0.002);',
  '    float n = fbm(uv * 2.3), n2 = fbm(uv * 6.1 + 11.0);',
  '    float c = smoothstep(0.52, 0.88, n + n2 * 0.2) * smoothstep(0.015, 0.12, h) * cover;',
  '    float wisp = smoothstep(0.55, 0.9, fbm(vec2(uv.x * 0.7, uv.y * 2.6) + 40.0)) * 0.35 * smoothstep(0.1, 0.5, h) * cover;',
  '    float lit = 0.45 + 0.55 * smoothstep(0.3, 0.8, n2 + (n - 0.6) * 0.8);',
  '    col = mix(col, mix(cloudSh, cloudLit, lit), clamp(c * 0.92 + wisp, 0.0, 1.0));',
  '  }',
  '  gl_FragColor = vec4(col, 1.0);',
  '  #include <tonemapping_fragment>',
  '  #include <encodings_fragment>',
  '  gl_FragColor.rgb += (hash(gl_FragCoord.xy + time) - 0.5) / 160.0;',
  '}'].join('\n');
var skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, gnd: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, cloudLit: { value: new THREE.Color() }, cloudSh: { value: new THREE.Color() }, glow: { value: 0 }, cover: { value: 1 }, time: { value: 0 } };
var skyMat = new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, fog: false });
var dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), skyMat); dome.scale.setScalar(9000); dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
var envScene = new THREE.Scene(), envDome = new THREE.Mesh(dome.geometry, skyMat); envDome.scale.setScalar(900); envScene.add(envDome);
var pmrem = new THREE.PMREMGenerator(renderer), envRT = null;
var starGeo = new THREE.BufferGeometry(), sp2 = [], sr = rng(99);
for (var si = 0; si < 1100; si++) { var u1 = sr() * Math.PI * 2, v1 = Math.acos(sr() * 0.97), R = 6000; sp2.push(Math.cos(u1) * Math.sin(v1) * R, Math.cos(v1) * R, Math.sin(u1) * Math.sin(v1) * R); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3));
var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
function glowTex(inner) { var c = cnv(256, 256), g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 2, 128, 128, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(inner, 'rgba(255,255,255,.55)'); gr.addColorStop(0.45, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return ctex(c); }
BB.glowTex = glowTex;
var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(0.2), transparent: true, depthWrite: false, fog: false, opacity: 0, color: 0xe6edff })); moon.scale.set(520, 520, 1); moon.position.set(-2400, 4300, -5000); scene.add(moon);
function sstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function mix3(out, n, g, d, day, high) { return out.setRGB(n[0], n[1], n[2]).lerp(cB.setRGB(g[0] + (d[0] - g[0]) * high, g[1] + (d[1] - g[1]) * high, g[2] + (d[2] - g[2]) * high), day); }
var cA = new THREE.Color(), cB = new THREE.Color(), sunDir = new THREE.Vector3();
var PALS = { // [night, golden hour, full day], linear values before tone mapping
  top: [[0.004, 0.007, 0.022], [0.1, 0.2, 0.62], [0.13, 0.38, 1.25]],
  mid: [[0.008, 0.013, 0.04], [0.8, 0.55, 0.66], [0.36, 0.62, 1.3]],
  hor: [[0.02, 0.03, 0.075], [1.9, 0.86, 0.4], [0.86, 1.06, 1.4]],
  gnd: [[0.012, 0.016, 0.03], [0.5, 0.36, 0.3], [0.5, 0.6, 0.7]],
  sun: [[0, 0, 0], [3.4, 1.5, 0.6], [3.2, 3.0, 2.6]],
  cl:  [[0.03, 0.04, 0.075], [2.0, 1.1, 0.8], [3.0, 3.0, 3.0]],
  cs:  [[0.012, 0.016, 0.035], [0.42, 0.3, 0.46], [1.5, 1.62, 1.85]]
};
BB.time = { hour: 11, night: 0, day: 1, exp: 0.6, high: 1 };
BB.hillGeos = [];
BB.hillTint = function (k, top, base) { var g = BB.hillGeos[k]; if (!g) return; var p = g.attributes.position, c = g.attributes.color; for (var q = 0; q < p.count; q++) { var t = p.getY(q) > 0 ? top : base; c.setXYZ(q, t.r, t.g, t.b); } c.needsUpdate = true; };
BB.setHour = function (h) {
  var d = (h - 6) / 12, elev = Math.max(-24, 64 * Math.sin(Math.PI * d)), er = elev * Math.PI / 180, az = Math.PI * d;
  sunDir.set(Math.cos(er) * Math.cos(az), Math.sin(er), Math.cos(er) * (0.4 + 0.6 * Math.sin(Math.max(0, Math.min(Math.PI, az))))).normalize();
  var day = sstep(-3, 9, elev), night = 1 - sstep(-9, 3, elev), high = sstep(3, 34, elev), gold = day * (1 - high);
  mix3(skyU.top.value, PALS.top[0], PALS.top[1], PALS.top[2], day, high); mix3(skyU.mid.value, PALS.mid[0], PALS.mid[1], PALS.mid[2], day, high); mix3(skyU.hor.value, PALS.hor[0], PALS.hor[1], PALS.hor[2], day, high); mix3(skyU.gnd.value, PALS.gnd[0], PALS.gnd[1], PALS.gnd[2], day, high);
  mix3(skyU.sunCol.value, PALS.sun[0], PALS.sun[1], PALS.sun[2], day, high); mix3(skyU.cloudLit.value, PALS.cl[0], PALS.cl[1], PALS.cl[2], day, high); mix3(skyU.cloudSh.value, PALS.cs[0], PALS.cs[1], PALS.cs[2], day, high);
  skyU.sunDir.value.copy(sunDir); skyU.glow.value = 0.25 + gold * 0.75; skyU.cover.value = 0.8;
  if (day > 0.02) { sun.position.copy(sunDir).multiplyScalar(620); sun.color.copy(cA.set(0xff8f4a).lerp(cB.set(0xfff3e0), high)); sun.intensity = 2.3 * day * (0.5 + 0.5 * high); }
  else { sun.position.set(-200, 460, -300); sun.color.set(0x8ea6ff); sun.intensity = 0.4; }
  fill.position.set(-sunDir.x * 300, 220, -sunDir.z * 300); fill.color.copy(cA.set(0x5f78c0).lerp(cB.set(0xbfd6ff), day)); fill.intensity = 0.1 + 0.2 * day + gold * 0.1;
  hemi.color.copy(cA.set(0x27355e).lerp(cB.set(0xcfe0ff), day)); hemi.groundColor.copy(cA.set(0x0d1018).lerp(cB.set(0x7a7263), day)); hemi.intensity = 0.4 + 0.3 * day;
  scene.fog.color.copy(skyU.hor.value).lerp(skyU.top.value, 0.08).multiplyScalar(0.82);
  stars.material.opacity = night * 0.9; moon.material.opacity = night * 0.9;
  cA.copy(skyU.hor.value).lerp(skyU.top.value, 0.4).multiplyScalar(0.62); BB.hillTint(0, cA, scene.fog.color); cA.copy(skyU.hor.value).lerp(skyU.top.value, 0.5).multiplyScalar(0.44).lerp(cB.setRGB(0.1, 0.16, 0.1), 0.2 * day); BB.hillTint(1, cA, scene.fog.color);
  BB.time = { hour: h, night: night, day: day, exp: 0.5 + night * 0.55 - gold * 0.02, elev: elev, high: high, gold: gold };
  var rt = pmrem.fromScene(envScene, 0.02); if (envRT) envRT.dispose(); envRT = rt; scene.environment = rt.texture;
  BB.timeHooks.forEach(function (f) { f(BB.time); });
};
BB.tick = [];   // per-frame hooks: fn(seconds)
BB.tick.push(function (t) { skyU.time.value = t; });
})();
