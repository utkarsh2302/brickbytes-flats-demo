/* Project landscape inside the boundary wall: roads, plaza, pool, club house, gardens, play areas, lighting. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var S = BB.S, M = BB.M, T = BB.TM, box = BB.box, instanced = BB.instanced, label = BB.label, cnv = BB.cnv, ctex = BB.ctex, scene = BB.scene, rng = BB.rng, towerInfo = BB.towerInfo, D = BB.D;
var r = rng(77), i;
var pav = function (rx, ry) { return S({ map: ctex(BB.paverC(), [rx, ry]), roughness: 0.9 }); };
var slatTall = S({ map: ctex(BB.slatC(), [1, 6]), roughness: 0.6 });
BB.carList = [];   // [x, z, rotY, colourIndex]

function ribbon(pts, width, y, mat, closed) {
  var curve = new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], 0, p[1]); }), !!closed), n = pts.length * 14, len = curve.getLength(), pos = [], uv = [], nor = [], idx = [];
  for (var k = 0; k <= n; k++) {
    var t = k / n, p = curve.getPoint(t), tg = curve.getTangent(t), nx = -tg.z, nz = tg.x;
    pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2); uv.push(0, t * len / 3, width / 3, t * len / 3); nor.push(0, 1, 0, 0, 1, 0);
    if (k < n) { var a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  var m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
}
function flatShape(pts, mat, x, y, z, s) {
  var sh = new THREE.Shape(); sh.splineThru(pts.concat([pts[0]]).map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
  var g = new THREE.ShapeGeometry(sh, 28); g.rotateX(Math.PI / 2); g.scale(s, 1, s);
  var m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m;
}
BB.ribbon = ribbon; BB.flatShape = flatShape;
var dbl = function (m) { m.side = THREE.DoubleSide; return m; };
var pathMat = dbl(pav(1, 1)), trackMat = dbl(S({ map: BB.noiseTex(256, '#a8563f', 2500, 0.08, [1, 1], 31), roughness: 0.95 })), sandD = dbl(M.sand), whiteD = dbl(S({ color: 0xf1ede5, roughness: 0.6 })), waterD = dbl(M.water);

var lawn = new THREE.Mesh(new THREE.PlaneGeometry(252, 200), M.grass); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.02, 6); lawn.receiveShadow = true; scene.add(lawn);
// boundary wall with piers and a gate gap
[[-67, 106, 118, 0.35], [67, 106, 118, 0.35], [0, -94, 252, 0.35], [-126, 6, 0.35, 200], [126, 6, 0.35, 200]].forEach(function (p) { box(p[2], 2.1, p[3], M.paint, p[0], 1.05, p[1]); box(p[2] + 0.1, 0.12, p[3] + 0.1, M.char, p[0], 2.16, p[1], null, false); });
var piers = []; for (var px = -120; px <= 120; px += 12) { if (Math.abs(px) > 10) piers.push([px, 1.2, 106, 0.6, 0, 2.4, 0.6]); piers.push([px, 1.2, -94, 0.6, 0, 2.4, 0.6]); } for (var pz = -88; pz <= 100; pz += 12) piers.push([-126, 1.2, pz, 0.6, 0, 2.4, 0.6], [126, 1.2, pz, 0.6, 0, 2.4, 0.6]);
instanced(BB.unit, M.stone, piers);
// internal roads
function road(len, wid, x, z, rot, lanes) { var m = box(len, 0.12, wid, S({ map: ctex(BB.roadC(lanes !== false), [len / 12, 1]), roughness: 0.95 }), x, 0.08, z, null, false); m.rotation.y = rot || 0; return m; }
BB.road = road;
road(240, 7, 0, 87, 0); road(240, 7, 0, -84, 0); road(178, 7, -117, 1.5, Math.PI / 2); road(178, 7, 117, 1.5, Math.PI / 2); road(30, 9, 0, 105, Math.PI / 2);
// gate with guard cabin and name wall
box(2.6, 7.5, 2.6, M.stone, -8, 3.75, 106); box(2.6, 7.5, 2.6, M.stone, 8, 3.75, 106); box(22, 0.9, 3.4, M.char, 0, 8.0, 106); box(21.6, 0.08, 3.0, M.slat, 0, 7.5, 106, null, false);
box(4, 3, 4, M.paint, -13.5, 1.5, 102); box(4.8, 0.25, 4.8, M.char, -13.5, 3.1, 102); box(3.2, 1.4, 0.1, T.glaz, -13.5, 1.9, 104.05, null, false);
var nw = cnv(1024, 128), ng = nw.getContext('2d'); ng.fillStyle = '#d9cdb8'; ng.fillRect(0, 0, 1024, 128); ng.font = '400 70px Marcellus, Georgia, serif'; ng.fillStyle = '#2b3034'; ng.textAlign = 'center'; ng.textBaseline = 'middle'; ng.fillText('S K Y L I N E   R E S I D E N C E S', 512, 68);
box(18, 2.4, 0.5, M.stone, 20, 1.2, 108.4); var nwm = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.9), S({ map: ctex(nw), roughness: 0.7 })); nwm.position.set(20, 1.25, 108.67); scene.add(nwm);
// promenade, plaza, fountain
box(170, 0.12, 7, pav(42, 2), 0, 0.08, 9, null, false);
var plaza = new THREE.Mesh(new THREE.CircleGeometry(12.5, 56), pav(8, 8)); plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.15, 9); plaza.receiveShadow = true; scene.add(plaza);
var fb = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.5, 0.7, 48), M.stone); fb.position.set(0, 0.5, 9); fb.castShadow = true; scene.add(fb);
var fw = new THREE.Mesh(new THREE.CircleGeometry(3.9, 40), M.water); fw.rotation.x = -Math.PI / 2; fw.position.set(0, 0.87, 9); scene.add(fw);
var fc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 0.5, 28), M.stone); fc.position.set(0, 1.1, 9); scene.add(fc);
var jets = []; for (var j0 = 0; j0 < 10; j0++) { var jm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.06, 1.8, 8), M.rail); jm.position.set(Math.cos(j0 * 0.628) * 2.7, 1.75, 9 + Math.sin(j0 * 0.628) * 2.7); scene.add(jm); jets.push(jm); }
var jc = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 3.0, 8), M.rail); jc.position.set(0, 2.85, 9); scene.add(jc); jets.push(jc);
BB.tick.push(function (t) { jets.forEach(function (m, k) { m.scale.y = 0.75 + 0.25 * Math.sin(t * 2.2 + k * 0.7); }); });
// garden paths and a jogging track loop
ribbon([[-78, 14], [-98, 30], [-96, 60], [-62, 76], [-20, 70], [0, 74], [24, 70], [64, 76], [98, 60], [100, 30], [80, 14]], 2.8, 0.1, trackMat);
ribbon([[0, 21], [-4, 40], [0, 60], [0, 84]], 3.2, 0.11, pathMat);
ribbon([[-52, 20], [-58, 28], [-60, 36]], 2.2, 0.11, pathMat); ribbon([[30, 20], [34, 26], [36, 30]], 2.4, 0.11, pathMat); ribbon([[52, 20], [62, 24], [70, 26]], 2.2, 0.11, pathMat);
var jl = label('Jogging track', true); jl.position.set(-60, 7, 78);
// pool with organic outline, deck, coping, moving water, loungers and umbrellas
var pp = [[-20, -6], [-6, -9], [10, -8], [21, -3], [22, 4], [13, 9], [2, 6], [-8, 9], [-19, 7], [-24, 0]];
flatShape(pp, sandD, -32, 0.17, 42, 1.34); flatShape(pp, whiteD, -32, 0.25, 42, 1.07); flatShape(pp, waterD, -32, 0.33, 42, 1.0);
var kp = new THREE.Mesh(new THREE.CircleGeometry(4.2, 40), M.water); kp.rotation.x = -Math.PI / 2; kp.position.set(-3, 0.33, 47); scene.add(kp);
var kr = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.9, 40), whiteD); kr.rotation.x = -Math.PI / 2; kr.position.set(-3, 0.31, 47); scene.add(kr);
var lg = new THREE.RoundedBoxGeometry(0.75, 0.16, 2.0, 2, 0.07), lb = new THREE.RoundedBoxGeometry(0.75, 0.12, 0.8, 2, 0.05), lo = [], lbk = [], um = [], up = [];
[[-54, 53, 0.5], [-51, 55, 0.4], [-48, 56.5, 0.25], [-24, 57, -0.1], [-21, 57, -0.1], [-18, 56.5, -0.2], [-60.5, 34, 1.3], [-61, 37.5, 1.4], [-9, 30, 2.9], [-12, 29.4, 2.9]].forEach(function (p, k) {
  lo.push([p[0], 0.48, p[1], 1, p[2]]); lbk.push([p[0] - Math.sin(p[2]) * 1.15, 0.72, p[1] - Math.cos(p[2]) * 1.15, 1, p[2]]);
  if (k % 3 === 0) { um.push([p[0] + 1.6, 2.9, p[1] + 0.4]); up.push([p[0] + 1.6, 1.5, p[1] + 0.4]); }
});
instanced(lg, M.white, lo); instanced(lb, M.white, lbk); instanced(new THREE.ConeGeometry(2.3, 0.75, 24, 1, true), M.cream, um); instanced(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), M.dark, up, null, false);
var pl = label('Swimming pool', true); pl.position.set(-32, 8, 42);
// club house
var cg = new THREE.Group(); cg.position.set(36, 0, 46); scene.add(cg);
box(31, 0.5, 20, M.stone, 0, 0.25, 0, cg); box(24, 4.6, 0.3, T.glaz, -1, 2.8, 7, cg, false); box(0.3, 4.6, 13, T.glaz, -13, 2.8, 0.5, cg, false);
box(24, 4.6, 0.4, M.paint, -1, 2.8, -6, cg); box(6, 5.4, 14.5, slatTall, 12, 3.2, 0.2, cg); box(23.4, 4.4, 12.6, M.paint, -1, 2.7, 0.5, cg, false);
box(34, 0.45, 23, M.char, -0.5, 5.35, 1.5, cg); box(33.4, 0.08, 22.4, T.soffit, -0.5, 5.1, 1.5, cg, false);
var cmul = []; for (var cx2 = -13; cx2 <= 11; cx2 += 2) cmul.push([cx2, 2.8, 7.02, 0.08, 0, 4.6, 0.36]); instanced(BB.unit, T.frame, cmul, cg, false);
[[-15, 11.5], [-5, 11.5], [5, 11.5], [15, 11.5]].forEach(function (p) { var c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.6, 14), T.frame); c.position.set(p[0], 2.8, p[1]); c.castShadow = true; cg.add(c); });
var cl = label('Club house', true); cl.position.set(36, 13, 46);
var gl = label('Central garden', true); gl.position.set(0, 8, 64);
// tennis court with fence posts
var ct = cnv(256, 512), cgx = ct.getContext('2d');
cgx.fillStyle = '#3f7f58'; cgx.fillRect(0, 0, 256, 512); cgx.fillStyle = '#3a6ea5'; cgx.fillRect(38, 60, 180, 392);
cgx.strokeStyle = '#fff'; cgx.lineWidth = 3; cgx.strokeRect(38, 60, 180, 392); cgx.strokeRect(62, 60, 132, 392); cgx.strokeRect(62, 160, 132, 192);
cgx.beginPath(); cgx.moveTo(128, 160); cgx.lineTo(128, 352); cgx.moveTo(30, 256); cgx.lineTo(226, 256); cgx.stroke(); BB.speckle(cgx, 256, 512, 1500, 0.05, rng(4));
var court = new THREE.Mesh(new THREE.PlaneGeometry(15, 30), S({ map: ctex(ct), roughness: 0.9 })); court.rotation.x = -Math.PI / 2; court.position.set(98, 0.08, -46); court.receiveShadow = true; scene.add(court);
box(0.06, 0.95, 9.4, M.cream, 98, 0.5, -46); var fp = []; for (var fz = -62; fz <= -30; fz += 4) fp.push([90, 1.6, fz, 0.07, 0, 3.2, 0.07], [106, 1.6, fz, 0.07, 0, 3.2, 0.07]); instanced(BB.unit, M.char, fp, null, false);
var tl = label('Tennis', true); tl.position.set(98, 7, -46);
// children's play area
var kg = new THREE.Group(); kg.position.set(74, 0, 34); scene.add(kg);
function km(c) { return S({ color: c, roughness: 0.6 }); }
var kfl = new THREE.Mesh(new THREE.CircleGeometry(9.5, 44), km(0x2f8f86)); kfl.rotation.x = -Math.PI / 2; kfl.position.y = 0.09; kfl.receiveShadow = true; kg.add(kfl);
var kf2 = new THREE.Mesh(new THREE.CircleGeometry(4.2, 36), km(0xe39a3c)); kf2.rotation.x = -Math.PI / 2; kf2.position.set(-3, 0.1, 2); kf2.receiveShadow = true; kg.add(kf2);
var red = km(0xd9483b), yel = km(0xf2c230), blu = km(0x2f6fb8);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 10), blu); m.position.set(3 + q[0] * 0.85, 1.6, -2 + q[1] * 0.85); m.castShadow = true; kg.add(m); });
var kpl = new THREE.Mesh(new THREE.RoundedBoxGeometry(2, 0.14, 2, 2, 0.05), yel); kpl.position.set(3, 1.9, -2); kpl.castShadow = true; kg.add(kpl);
var kroof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.0, 4), red); kroof.rotation.y = Math.PI / 4; kroof.position.set(3, 3.7, -2); kroof.castShadow = true; kg.add(kroof);
var ksl = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.9, 0.1, 4.4, 2, 0.04), red); ksl.position.set(3, 1.0, 1.9); ksl.rotation.x = 0.44; ksl.castShadow = true; kg.add(ksl);
var kbar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 10), blu); kbar.rotation.z = Math.PI / 2; kbar.position.set(-3, 2.6, 2); kbar.castShadow = true; kg.add(kbar);
[[-5.1, 0.9, 0.3], [-5.1, 3.1, -0.3], [-0.9, 0.9, 0.3], [-0.9, 3.1, -0.3]].forEach(function (q) { var m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), blu); m.position.set(q[0], 1.3, q[1]); m.rotation.x = q[2]; m.castShadow = true; kg.add(m); });
[-3.9, -2.1].forEach(function (x0) { var s0 = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.6, 0.06, 0.3, 2, 0.02), yel); s0.position.set(x0, 0.7, 2); kg.add(s0); [-0.26, 0.26].forEach(function (o) { var c0 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.9, 6), M.dark); c0.position.set(x0 + o, 1.65, 2); kg.add(c0); }); });
var kl = label('Kids play', true); kl.position.set(74, 8, 34);
// gazebo, yoga deck
var gz = new THREE.Group(); gz.position.set(-84, 0, 68); scene.add(gz);
var gd = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.0, 0.35, 8), M.stone); gd.position.y = 0.18; gd.receiveShadow = true; gz.add(gd);
for (var gq = 0; gq < 8; gq++) { var gp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.9, 10), M.white); gp.position.set(Math.cos(gq * 0.785 + 0.39) * 3.3, 1.8, Math.sin(gq * 0.785 + 0.39) * 3.3); gp.castShadow = true; gz.add(gp); }
var gr2 = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.9, 8), M.char); gr2.position.y = 4.2; gr2.castShadow = true; gz.add(gr2);
var yd = new THREE.Mesh(new THREE.CircleGeometry(7, 40), S({ map: ctex(BB.slatC(), [6, 6]), roughness: 0.7 })); yd.rotation.x = -Math.PI / 2; yd.position.set(60, 0.12, 62); yd.receiveShadow = true; scene.add(yd);
var yl = label('Yoga deck', true); yl.position.set(60, 6, 62);
// visitor parking bay
box(74, 0.1, 6.2, pav(18, 2), 0, 0.07, -77.4, null, false);
[-33, -25.5, -18, -10.5, -3, 4.5, 19.5, 27, 34.5].forEach(function (x, k) { BB.carList.push([x, -77.4, k % 3 === 1 ? -Math.PI / 2 : Math.PI / 2, k]); });
[[-84, 85.4, 0], [-50, 88.6, Math.PI], [70, 85.4, 0], [-118.6, -30, Math.PI / 2], [115.4, 48, -Math.PI / 2], [-64, -82.4, 0], [74, -85.6, Math.PI]].forEach(function (c, k) { BB.carList.push([c[0], c[1], c[2], k + 2]); });
// planting
function blocked(x, z) {
  for (var k in towerInfo) { var t = towerInfo[k]; if (Math.abs(x - t.x) < t.PW / 2 + 9 && Math.abs(z - t.z) < t.PD / 2 + 9) return true; }
  if (Math.hypot((x + 32) / 1.5, z - 42) < 24) return true;
  if (Math.abs(x - 36) < 21 && Math.abs(z - 47) < 16) return true;
  if (Math.abs(z - 9) < 7 && Math.abs(x) < 90) return true;
  if (Math.hypot(x, z - 9) < 16) return true;
  if (Math.abs(x) < 6 && z > 9 && z < 122) return true;
  if (Math.abs(z - 87) < 6 || Math.abs(z + 84) < 9 || Math.abs(Math.abs(x) - 117) < 6) return true;
  if (Math.abs(x - 98) < 11 && Math.abs(z + 46) < 18) return true;
  if (Math.hypot(x - 74, z - 34) < 12 || Math.hypot(x + 84, z - 68) < 7 || Math.hypot(x - 60, z - 62) < 9) return true;
  if (Math.abs(x) > 123 || z > 103 || z < -91) return true;
  return false;
}
var trees = [], guard = 0;
while (trees.length < 115 && guard++ < 8000) { var x = -122 + r() * 244, z = -90 + r() * 192; if (blocked(x, z)) continue; trees.push([x, z, 0.8 + r() * 0.6, r() * 6.3]); }
BB.plantTrees(trees);
var palms = [];
for (var qx = -78; qx <= 78; qx += 13) { if (Math.abs(qx) < 16) continue; palms.push([qx, 14.6, 0.95 + r() * 0.25, r() * 6]); palms.push([qx + 6, 3.5, 0.95 + r() * 0.25, r() * 6]); }
[[-63, 30], [-61, 53], [-8, 27], [-37, 63], [-2, 59], [14, 28], [56, 64], [-11, 101], [11, 101], [-11, 94], [11, 94]].forEach(function (p) { palms.push([p[0], p[1], 1 + r() * 0.3, r() * 6]); });
BB.plantPalms(palms);
var sh = [];
for (var hx = -82; hx <= 82; hx += 2.2) { if (Math.abs(hx) < 14) continue; sh.push([hx, 0, 13.1, 0.75 + r() * 0.25, r() * 6]); sh.push([hx, 0, 4.9, 0.75 + r() * 0.25, r() * 6]); }
for (i = 0; i < 90; i++) { var qx2 = -120 + r() * 240, qz2 = -88 + r() * 188; if (!blocked(qx2, qz2)) sh.push([qx2, 0, qz2, 0.7 + r() * 0.9, r() * 6]); }
for (var wx = -122; wx <= 122; wx += 3.1) { if (Math.abs(wx) > 12) sh.push([wx, 0, 104.4, 0.9, r() * 6]); sh.push([wx, 0, -92.4, 0.9, r() * 6]); }
instanced(BB.shrubGeo, M.leaf, sh);
var fl = [], fcols = [[1, 0.45, 0.6], [1, 0.82, 0.3], [0.98, 0.96, 0.92], [0.85, 0.35, 0.75], [1, 0.55, 0.3]];
for (var fa = 0; fa < 60; fa++) { var ang0 = fa / 60 * Math.PI * 2, rr0 = 13.6 + (fa % 2) * 0.9; if (Math.abs(Math.sin(ang0)) < 0.28) continue; fl.push([Math.cos(ang0) * rr0, 0, 9 + Math.sin(ang0) * rr0, 0.8 + r() * 0.4, r() * 6]); }
for (i = 0; i < 70; i++) { var bx0 = -100 + r() * 200, bz0 = 18 + r() * 60; if (!blocked(bx0, bz0)) fl.push([bx0, 0, bz0, 0.6 + r() * 0.5, r() * 6]); }
var fim = instanced(BB.blob(0, 0.3, 0, 0.5, 0.6, 9, [1, 1, 1], 0.72, 1), M.leaf, fl, null, false), fc0 = new THREE.Color(); fl.forEach(function (q, k) { var c0 = fcols[k % fcols.length]; fc0.setRGB(c0[0], c0[1], c0[2]); fim.setColorAt(k, fc0); });
// benches
var bSeat = [], bBack = [], bLeg = [];
for (var bx2 = -72; bx2 <= 72; bx2 += 13) { if (Math.abs(bx2 + 6.5) < 15) continue; bSeat.push([bx2 + 6.5, 0.44, 12.1]); bBack.push([bx2 + 6.5, 0.6, 12.36]); bLeg.push([bx2 + 5.75, 0.22, 12.1, 0.1, 0, 0.44, 0.44], [bx2 + 7.25, 0.22, 12.1, 0.1, 0, 0.44, 0.44]); }
instanced(new THREE.RoundedBoxGeometry(1.9, 0.1, 0.5, 2, 0.04), M.slat, bSeat); instanced(new THREE.RoundedBoxGeometry(1.9, 0.5, 0.08, 2, 0.03), M.slat, bBack); instanced(BB.unit, M.dark, bLeg);
// lamps with warm light pools at night
var lamps = [], poles = [];
for (var lx2 = -78; lx2 <= 78; lx2 += 13) { lamps.push([lx2 - 3, 4.3, 5.8]); poles.push([lx2 - 3, 2.1, 5.8]); }
for (var rx = -100; rx <= 100; rx += 25) { lamps.push([rx, 6.2, 91.6]); poles.push([rx, 3.1, 91.6, 1, 0, 1.45, 1]); lamps.push([rx, 6.2, -88.6]); poles.push([rx, 3.1, -88.6, 1, 0, 1.45, 1]); }
[[-90, 30], [-92, 58], [-40, 72], [20, 68], [64, 74], [96, 44], [-20, 30], [-44, 58], [0, 44]].forEach(function (p) { lamps.push([p[0], 3.4, p[1]]); poles.push([p[0], 1.7, p[1], 1, 0, 0.8, 1]); });
BB.siteLamps = lamps;
instanced(new THREE.SphereGeometry(0.34, 12, 8), M.lamp, lamps, null, false);
instanced(new THREE.CylinderGeometry(0.06, 0.09, 4.3, 6), M.dark, poles, null, false);
var poolMat = new THREE.MeshBasicMaterial({ map: BB.glowTex(0.2), color: 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
var pgeo = new THREE.PlaneGeometry(1, 1); pgeo.rotateX(-Math.PI / 2);
var pools = instanced(pgeo, poolMat, lamps.map(function (l) { return [l[0], 0.24, l[2], 15]; }), null, false); pools.receiveShadow = false; pools.visible = false;
BB.poolGeo = pgeo; BB.poolMat = poolMat;
BB.timeHooks.push(function (t) { poolMat.opacity = t.night * 0.55; pools.visible = t.night > 0.02; });
})();
