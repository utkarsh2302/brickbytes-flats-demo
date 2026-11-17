/* Finishing pass: soft glow on bright light, gentle film grade, sharpening, vignette and fine grain. Falls back to a plain render when unavailable. */
(function () {
'use strict';
var BB = window.BB; if (BB.fail) return;
var R = BB.renderer, fx = BB.fx = { on: false, ready: false };
var can = !!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.UnrealBloomPass && R.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) && !/nofx/.test(location.search);
if (!can) { fx.render = function (s1, c1, s2, c2) { plain(s1, c1, s2, c2); }; fx.setSize = function () {}; fx.enable = function () {}; return; }

function plain(s1, c1, s2, c2) {
  R.setRenderTarget(null); R.render(s1, c1);
  if (s2) { R.autoClear = false; R.clearDepth(); R.render(s2, c2); R.autoClear = true; }
}

var rt = new THREE.WebGLMultisampleRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, encoding: THREE.sRGBEncoding });
rt.samples = 4;
var comp = new THREE.EffectComposer(R, rt);
var rpA = new THREE.RenderPass(BB.scene, BB.camera), rpB = new THREE.RenderPass(BB.scene, BB.camera);
rpB.clear = false; rpB.clearDepth = true; rpB.enabled = false;
var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.3, 0.7, 0.8);
var GRADE = {
  uniforms: { tDiffuse: { value: null }, px: { value: new THREE.Vector2(1 / 1024, 1 / 768) }, time: { value: 0 }, sat: { value: 1.08 }, con: { value: 1.06 }, vig: { value: 0.3 }, grain: { value: 0.018 }, sharp: { value: 0.3 }, warm: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: [
    'uniform sampler2D tDiffuse; uniform vec2 px; uniform float time, sat, con, vig, grain, sharp, warm; varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main(){',
    '  vec3 c = texture2D(tDiffuse, vUv).rgb;',
    '  vec3 n = (texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb + texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb) * 0.25;',
    '  c += (c - n) * sharp;',
    '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  c = mix(vec3(l), c, sat);',
    '  c = (c - 0.5) * con + 0.5;',
    '  c += vec3(-0.006, 0.0, 0.014) * (1.0 - smoothstep(0.0, 0.5, l)) * warm;',     // faintly cool shadows
    '  c *= mix(vec3(1.0), vec3(1.025, 1.0, 0.965), smoothstep(0.45, 1.0, l) * warm);',   // faintly warm highlights
    '  vec2 q = (vUv - 0.5) * vec2(1.0, 0.86);',
    '  c *= 1.0 - vig * smoothstep(0.38, 0.9, length(q));',
    '  c += (hash(vUv * 913.0 + time) - 0.5) * grain;',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'].join('\n')
};
var grade = new THREE.ShaderPass(GRADE);
comp.addPass(rpA); comp.addPass(rpB); comp.addPass(bloom); comp.addPass(grade);
fx.on = true; fx.ready = true; fx.bloom = bloom; fx.grade = grade.uniforms;
document.body.classList.add('fx');

fx.enable = function (v) { fx.on = !!v; document.body.classList.toggle('fx', fx.on); };
fx.setSize = function (w, h) {
  var pr = R.getPixelRatio(); comp.setPixelRatio(pr); comp.setSize(w, h);
  grade.uniforms.px.value.set(1 / (w * pr), 1 / (h * pr));
};
/* render one scene, or a second scene drawn over the first (the flat interior over the real view outside) */
fx.render = function (s1, c1, s2, c2, opt) {
  if (!fx.on) { plain(s1, c1, s2, c2); return; }
  rpA.scene = s1; rpA.camera = c1;
  rpB.enabled = !!s2; if (s2) { rpB.scene = s2; rpB.camera = c2; }
  var o = opt || {};
  bloom.strength = o.bloom == null ? 0.3 : o.bloom; bloom.threshold = o.threshold == null ? 0.8 : o.threshold; bloom.radius = o.radius == null ? 0.7 : o.radius;
  grade.uniforms.time.value = (performance.now() / 1000) % 10;
  grade.uniforms.vig.value = o.vig == null ? 0.3 : o.vig;
  comp.render();
};
})();
