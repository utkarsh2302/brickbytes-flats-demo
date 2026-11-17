/* Project data (sample). Change these values for a real project. */
(function () {
'use strict';
var BB = window.BB = {};
BB.$ = function (s) { return document.querySelector(s); };
BB.$$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

var CONFIG = BB.CONFIG = {
  baseRate: 6400,            // rupees per sq ft
  floorRise: 30,             // extra per sq ft for every floor above the 3rd
  gardenPremium: 250,        // extra per sq ft for pool and garden facing flats
  towers: [
    { id: 'A', floors: 14, x: -52, z: -22, rot: 0.22 },
    { id: 'B', floors: 18, x: 0,   z: -36, rot: 0 },
    { id: 'C', floors: 14, x: 52,  z: -22, rot: -0.22 }
  ],
  types: { '2 BHK': {}, '3 BHK': {}, '4 BHK': {} }   // areas are measured from the flat layouts below
};
BB.UNITS = [ // position on the floor plate: x east (+), z south (+)
  { n: '01', sx: 1,  sz: -1, facing: 'North-East' },
  { n: '02', sx: -1, sz: -1, facing: 'North-West' },
  { n: '03', sx: -1, sz: 1,  facing: 'South-West' },
  { n: '04', sx: 1,  sz: 1,  facing: 'South-East' }
];
BB.STATUS_LABEL = { available: 'Available', hold: 'On hold', sold: 'Sold' };
BB.W = 26; BB.D = 20; BB.FH = 3.2; BB.POD = 7;

BB.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
BB.money = function (v) { return v >= 1e7 ? '₹' + (v / 1e7).toFixed(2) + ' Cr' : '₹' + (v / 1e5).toFixed(1) + ' L'; };
BB.num = function (v) { return Math.round(v).toLocaleString('en-IN'); };
BB.feet = function (m) { var i = Math.round(m * 39.3701); return Math.floor(i / 12) + "'" + (i % 12) + '"'; };

/* Flat layouts in metres. x runs along the frontage, z from the entrance (0) to the balcony. */
var PLANS = BB.PLANS = {};
function makePlan(type) {
  var beds = +type.charAt(0), big = beds > 2, L = big ? 5.6 : 5.2, kw = big ? 3.0 : 2.8, Dp = big ? 7.4 : 7.0, B = 3.0, P = 1.8;
  var rooms = [], gaps = [], sec = beds - 1, xm = L + sec * 3.6, Wt = xm + 3.8;
  function room(name, kind, x0, z0, x1, z1, floor) { rooms.push({ name: name, kind: kind, x0: x0, z0: z0, x1: x1, z1: z1, floor: floor }); }
  function gap(axis, c, a, b, type, swing) { gaps.push({ axis: axis, c: c, a: a, b: b, type: type, swing: swing || 1 }); }
  room('Living room', 'living', 0, B, L, Dp, 'marble');
  room('Dining', 'dining', kw, 0, L, B, 'marble');
  room('Kitchen', 'kitchen', 0, 0, kw, B, 'tile');
  room('Passage', 'passage', L, P, xm + 1.0, B, 'marble');
  for (var i = 0; i < sec; i++) { var x0 = L + i * 3.6; room('Bedroom ' + (i + 2), 'bed', x0, B, x0 + 3.6, Dp, 'wood'); gap('x', B, x0 + 0.3, x0 + 1.15, 'door', 1); gap('x', Dp, x0 + 0.7, x0 + 2.9, 'glass'); }
  room('Master bedroom', 'master', xm, B, Wt, Dp, 'wood'); gap('x', B, xm + 0.12, xm + 0.92, 'door', 1); gap('x', Dp, xm + 0.7, xm + 3.1, 'glass');
  room('Master bath', 'bath', xm + 1.0, 0, Wt, B, 'tile'); gap('x', B, xm + 1.7, xm + 2.5, 'door', -1);
  var small = beds === 2 ? [['Bathroom', 'bath', 2.2], ['Utility', 'utility', 2.4]] :
    beds === 3 ? [['Bathroom', 'bath', 2.2], ['Bathroom 2', 'bath', 2.0], ['Pooja room', 'pooja', 2.0], ['Store', 'store', 2.0]] :
    [['Bathroom', 'bath', 2.2], ['Bathroom 2', 'bath', 2.2], ['Pooja room', 'pooja', 2.2], ['Study', 'study', 3.0], ['Store', 'store', 2.2]];
  var sx = L; small.forEach(function (q) { room(q[0], q[1], sx, 0, sx + q[2], P, q[1] === 'study' ? 'wood' : 'tile'); gap('x', P, sx + q[2] / 2 - 0.4, sx + q[2] / 2 + 0.4, 'door', -1); sx += q[2]; });
  gap('x', B, kw, L, 'open'); gap('z', kw, 0.7, 2.3, 'open'); gap('z', L, P + 0.1, B - 0.1, 'open');
  gap('x', 0, kw + 0.15, kw + 1.05, 'door', 1);
  gap('x', Dp, 0.3, L / 2 - 0.9, 'glass'); gap('x', Dp, L / 2 - 0.9, L / 2 + 0.9, 'open'); gap('x', Dp, L / 2 + 0.9, L - 0.3, 'glass');
  gap('z', 0, 0.8, 2.2, 'glass');
  var area = 0; rooms.forEach(function (r) { area += (r.x1 - r.x0) * (r.z1 - r.z0); });
  return { rooms: rooms, gaps: gaps, balcony: { name: 'Balcony', kind: 'balcony', x0: 0, z0: Dp, x1: L, z1: Dp + 1.7, floor: 'deck' }, W: Wt, D: Dp, L: L, kw: kw, area: area };
}
Object.keys(CONFIG.types).forEach(function (t) {
  var p = PLANS[t] = makePlan(t), carpet = Math.round(p.area * 10.7639 / 5) * 5;
  CONFIG.types[t] = { carpet: carpet, sup: Math.round(carpet / 0.68 / 10) * 10 };
});

var flats = BB.flats = [], byId = BB.byId = {};
(function () {
  var r = BB.rng(20261117);
  CONFIG.towers.forEach(function (t) {
    for (var f = 1; f <= t.floors; f++) {
      BB.UNITS.forEach(function (u) {
        var type = t.id === 'B' ? (f > t.floors - 2 ? '4 BHK' : '3 BHK') : (u.sx > 0 ? '3 BHK' : '2 BHK');
        var garden = u.sz > 0;
        var rate = CONFIG.baseRate + (t.id === 'B' ? 200 : 0) + Math.max(0, f - 3) * CONFIG.floorRise + (garden ? CONFIG.gardenPremium : 0) + (type === '4 BHK' ? 300 : 0);
        var x = r(), soldCut = 0.30 + (f <= 5 ? 0.14 : 0) + (garden ? 0.06 : 0);
        var status = x < soldCut ? 'sold' : (x < soldCut + 0.09 ? 'hold' : 'available');
        var id = t.id + '-' + f + u.n;
        var flat = { id: id, tower: t.id, floor: f, floors: t.floors, unit: u.n, u: u, type: type, sup: CONFIG.types[type].sup, carpet: CONFIG.types[type].carpet,
          facing: u.facing, view: garden ? 'Pool and central garden' : 'Open city view', rate: rate, price: rate * CONFIG.types[type].sup,
          status: status, variant: Math.floor(r() * 3), mesh: null };
        flats.push(flat); byId[id] = flat;
      });
    }
  });
})();
})();
