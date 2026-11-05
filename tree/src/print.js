// Impresión: convierte la capa de tinta (un canvas 2D) en una serigrafía de
// tinta plateada sobre papel carbón, en un shader de WebGL.
//
// La capa de tinta usa dos canales (premultiplicados):
//   rojo  = tinta plena: tronco, ramas, hojas sueltas y texto.
//   verde = follaje: un campo suave (la suma de manchas gaussianas, una por
//           racimo) que se corta contra un ruido de hojas (una elipse
//           orientada por celda) y un ruido de huecos. Donde el campo es alto
//           queda una masa con agujeros chicos; donde baja, quedan hojas
//           sueltas: así sale el encaje.
// Al imprimir:
//   - el borde se corta nítido pero apenas irregular (la malla de la seda),
//   - la tinta tiene grano de arena: poros de un píxel donde no cargó, más
//     seguidos donde la capa quedó fina,
//   - el tono de la tinta varía apenas, grano por píxel, nunca sombreado,
//   - quedan motitas sueltas de plata sobre el papel y motas en el papel.
// Todo está anclado al mundo para que se mueva con el dibujo.

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uInk;
uniform sampler2D uLite;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCam;
uniform vec3 uPaper;
uniform vec3 uInkCol;
uniform float uRough;
uniform float uThresh;
uniform float uEdge;
uniform float uBleed;
uniform float uVoid;
uniform float uThin;
uniform float uPins;
uniform float uGrain;
uniform float uInkGrain;
uniform float uMottle;
uniform float uSpecks;
uniform float uStray;
uniform float uLeaf;
uniform float uLace;
uniform float uHoles;
uniform float uHoleScale;
uniform float uCap;
uniform float uLeafEdge;
uniform float uGain;
uniform float uTone;
uniform float uLiteCov;
uniform float uLiteText;
uniform float uDot;
uniform float uFrame;
uniform float uFrameW;
uniform vec2 uView;
uniform vec2 uPar;

float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vn(p);
    p = p * 2.03 + 7.1;
    a *= 0.5;
  }
  return s;
}
// mota redonda en una celda de lado 'cs', con probabilidad 'prob'
float speck(vec2 w, float cs, float prob, float r0, float r1, float seed) {
  vec2 cell = floor(w / cs);
  vec2 cp = (cell + vec2(h21(cell + seed), h21(cell + seed + 4.6))) * cs;
  float rad = r0 + (r1 - r0) * h21(cell + seed + 9.2) * h21(cell + seed + 2.7);
  float on = step(1.0 - prob, h21(cell + seed + 17.0));
  return on * (1.0 - smoothstep(rad - 0.4, rad + 0.4, length(w - cp)));
}

// hoja: elipse orientada al azar, una por celda; 1 en el centro de la hoja,
// 0 en el borde, negativo afuera (sigue bajando, para que el corte sea nítido
// también entre hojas)
float leafness(vec2 p, float S) {
  vec2 g = p / S;
  vec2 i = floor(g), f = fract(g);
  float best = -4.0;
  for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 cell = i + o;
      vec2 q = o + vec2(h21(cell + 1.3), h21(cell + 7.9)) - f;
      float a = h21(cell + 4.1) * 3.14159;
      vec2 u = vec2(cos(a), sin(a));
      float len = 0.68 + 0.38 * h21(cell + 9.7);
      float d = length(vec2(dot(q, u) / len, dot(q, vec2(-u.y, u.x)) / (len * 0.48)));
      best = max(best, 1.0 - d);
    }
  return best;
}

// cobertura de una capa de tinta: trazos plenos (rojo) y follaje (verde)
float coverOf(sampler2D T, vec2 uv, vec2 px, vec2 w) {
  vec4 c0 = texture2D(T, uv);
  vec4 cs = texture2D(T, uv + vec2(px.x, 0.0) * uBleed) + texture2D(T, uv - vec2(px.x, 0.0) * uBleed)
          + texture2D(T, uv + vec2(0.0, px.y) * uBleed) + texture2D(T, uv - vec2(0.0, px.y) * uBleed);
  float solid = c0.r * 0.5 + cs.r * 0.125;
  float th = uThresh + (vn(w * 0.9 + 11.0) - 0.5) * 0.14;
  float cov = smoothstep(th - uEdge, th + uEdge, solid);
  // follaje: campo + hojas - huecos, cortado nítido
  float F = min((c0.g * 0.6 + cs.g * 0.1) * uGain, uCap);
  if (F > 0.02) {
    float lf = leafness(w, uLeaf);
    float hn = fbm(w * uHoleScale + 23.0);
    float v = F + (clamp(lf, -0.6, 1.0) - 0.45) * uLace - (hn - 0.5) * uHoles;
    cov = max(cov, smoothstep(0.5 - uLeafEdge, 0.5 + uLeafEdge, v));
  }
  return cov;
}

void main() {
  vec2 dev = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec2 w = dev / uDpr + uCam;

  // borde: se lee la tinta un poco corrida, con ruido de dos escalas
  vec2 d1 = vec2(vn(w * 0.5), vn(w * 0.5 + 31.7)) - 0.5;
  vec2 d2 = vec2(vn(w * 2.2 + 3.1), vn(w * 2.2 + 8.9)) - 0.5;
  vec2 off = (d1 * 1.4 + d2 * 0.7) * uRough;
  vec2 px = vec2(uDpr) / uRes;
  vec2 uv = vUv + vec2(off.x, -off.y) * px;

  // píxel del dispositivo anclado al papel (no a la pantalla): todo el grano
  // se mueve con la hoja. La cámara va redondeada al píxel, así que esto cae
  // siempre en la misma grilla.
  vec2 wp = floor(w * uDpr);

  // tinta plena: ramas, follaje y texto
  float cov = coverOf(uInk, uv, px, w);

  // fotos (canal azul): medio tono de puntos, como una serigrafía de foto.
  // La trama está anclada al papel (se mueve con la foto), girada 22,5°, y
  // cada punto sale un poco irregular. Se lee con el mismo corrimiento que
  // el resto, así que el borde de la foto también queda áspero.
  float tone = texture2D(uInk, uv).b;
  if (tone > 0.004) {
    vec2 q = mat2(0.9239, 0.3827, -0.3827, 0.9239) * w / uDot;
    vec2 f = fract(q) - 0.5;
    float t = clamp(pow(tone, 1.1) * uTone, 0.0, 1.0);
    float rad = sqrt(t / 3.14159) + (vn(w * 0.8 + 5.0) - 0.5) * 0.1 + (h21(floor(q) + 9.0) - 0.5) * 0.06;
    float aa = 0.8 / (uDot * uDpr);
    float dotc = 1.0 - smoothstep(rad - aa, rad + aa, length(f));
    cov = max(cov, dotc);
  }

  // tinta escasa (segunda capa): lo que se puede abrir pero no abriste. Es la
  // misma tinta, pero la malla deja pasar más o menos la mitad
  float lite = coverOf(uLite, uv, px, w);
  if (lite > 0.0) cov = max(cov, lite * step(h21(wp + 41.0), uLiteCov));
  // el texto en tinta escasa (azul de la segunda capa) carga algo más, para
  // que siga leyéndose
  float lt = texture2D(uLite, uv).b;
  if (lt > 0.0) cov = max(cov, smoothstep(uThresh - uEdge, uThresh + uEdge, lt) * step(h21(wp + 43.0), uLiteText));

  // capa fina: zonas grandes donde la tinta cargó menos
  float thin = smoothstep(0.42, 0.78, fbm(w * 0.011 + 9.0));
  // grano de arena: poros de un píxel del dispositivo (anclados al mundo) y
  // algunos redondos más grandes
  float sand = h21(floor(w * uDpr) + 3.0);
  float pore = step(1.0 - uVoid * (0.45 + uThin * thin), sand);
  float pin = speck(w, 7.0, uPins * (0.6 + 2.0 * thin), 0.3, 0.95, 51.0);
  cov *= 1.0 - max(pore * 0.75, pin * 0.9);

  // papel carbón: plano, con grano fino y alguna mota
  // el papel (con su grano, sus motas y las motitas de plata sueltas) se
  // corre apenas con el mouse: la tinta queda quieta encima, como un
  // recorte apoyado sobre la hoja. uPar viene en píxeles enteros del
  // dispositivo, así el grano no titila.
  vec2 wb = w + uPar;
  vec2 wbp = floor(wb * uDpr);
  float grain = (h21(wbp) - 0.5) * uGrain;
  float mott = (fbm(wb * 0.004) - 0.5) * uMottle;
  vec3 paper = uPaper * (1.0 + grain + mott);
  paper *= 1.0 - speck(wb, 11.0, uSpecks * 14.0, 0.35, 1.3, 13.0) * 0.35;
  // motitas de plata que saltaron de la malla
  float stray = speck(wb, 17.0, uStray, 0.3, 0.9, 77.0);

  // tinta: un solo tono, con grano por píxel (sin sombreado)
  float ig = (h21(wp + 19.0) - 0.5) * uInkGrain + (vn(w * 1.6 + 5.0) - 0.5) * uInkGrain * 0.7;
  vec3 ink = uInkCol * (1.0 + ig - thin * 0.035);

  float k = clamp(max(cov, stray * 0.85), 0.0, 1.0);
  vec3 col = mix(paper, ink, k);

  // Marco de la página, fijo en la pantalla (no se mueve con la hoja).
  //   1 marco: un marco negro alrededor del papel, como las láminas de la
  //     referencia, con un bisel apenas más claro y su sombra sobre el papel
  //   2 rasgado: el pliego tiene el borde rasgado y se apoya sobre una
  //     superficie más oscura, con sombra hacia abajo y a la derecha
  // (3, el pliego de imprenta con marcas de corte, se dibuja en la tinta)
  if (uFrame > 0.5 && uFrame < 2.5) {
    vec2 sp = dev / uDpr;
    vec2 V = uView;
    float dL = sp.x, dR = V.x - sp.x, dT = sp.y, dB = V.y - sp.y;
    float F = uFrameW;
    vec3 back = uPaper * 0.42;
    back *= 1.0 + (h21(floor(dev) + 61.0) - 0.5) * 0.12 + (vn(sp * 0.04 + 3.0) - 0.5) * 0.1;
    if (uFrame < 1.5) {
      float d = min(min(dL, dR), min(dT, dB));
      float inside = smoothstep(F - 0.5, F + 0.5, d);
      // bisel: una línea más clara en el labio interno del marco
      back += uPaper * 0.22 * (1.0 - smoothstep(0.0, 1.4, abs(d - (F - 1.6))));
      col *= 1.0 - 0.38 * exp(-max(d - F, 0.0) / 6.0) * inside;
      col = mix(back, col, inside);
    } else {
      // borde rasgado: cada lado con su ruido, de dos escalas y con fibras
      float eL = F + 6.0 * vn(vec2(sp.y * 0.045, 1.0)) + 2.5 * vn(vec2(sp.y * 0.35, 2.0)) + 1.2 * h21(floor(vec2(sp.y * 1.3, 3.0)));
      float eR = F + 6.0 * vn(vec2(sp.y * 0.045, 4.0)) + 2.5 * vn(vec2(sp.y * 0.35, 5.0)) + 1.2 * h21(floor(vec2(sp.y * 1.3, 6.0)));
      float eT = F + 6.0 * vn(vec2(sp.x * 0.045, 7.0)) + 2.5 * vn(vec2(sp.x * 0.35, 8.0)) + 1.2 * h21(floor(vec2(sp.x * 1.3, 9.0)));
      float eB = F + 6.0 * vn(vec2(sp.x * 0.045, 10.0)) + 2.5 * vn(vec2(sp.x * 0.35, 11.0)) + 1.2 * h21(floor(vec2(sp.x * 1.3, 12.0)));
      float m = min(min(dL - eL, dR - eR), min(dT - eT, dB - eB));
      float inside = smoothstep(-0.5, 0.5, m);
      // el borde del papel, donde está rasgado, es más fino y más claro
      col *= 1.0 + 0.12 * (1.0 - smoothstep(0.0, 2.5, m)) * inside;
      // sombra del pliego sobre la superficie, hacia abajo y a la derecha
      float ms = min(min(dL - eL + 3.0, dR - eR - 4.0), min(dT - eT + 3.0, dB - eB - 5.0));
      back *= 1.0 - 0.55 * exp(-max(-ms, 0.0) / 5.0);
      col = mix(back, col, inside);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const KEYS = ['rough', 'thresh', 'edge', 'bleed', 'void', 'thin', 'pins', 'grain', 'inkGrain', 'mottle', 'specks', 'stray', 'leaf', 'lace', 'holes', 'holeScale', 'cap', 'leafEdge', 'gain', 'tone', 'liteCov', 'liteText', 'dot', 'frame', 'frameW'];
const uname = (k) => 'u' + k[0].toUpperCase() + k.slice(1);

export function createPrinter(canvas, look) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return fallback(canvas, look);
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const mkTex = () => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const tex = mkTex();
  const texLite = mkTex();
  let liteEmpty = false;
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const U = {};
  for (const n of ['uInk', 'uLite', 'uView', 'uPar', 'uRes', 'uDpr', 'uCam', 'uPaper', 'uInkCol', ...KEYS.map(uname)]) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(U.uInk, 0);
  gl.uniform1i(U.uLite, 1);
  gl.uniform3fv(U.uPaper, hex(look.paper));
  gl.uniform3fv(U.uInkCol, hex(look.ink));
  for (const k of KEYS) gl.uniform1f(U[uname(k)], look[k]);
  return {
    gl: true,
    // cambia un parámetro (por ejemplo el tamaño de hoja al cambiar la pantalla)
    set(k, v) {
      gl.useProgram(prog);
      gl.uniform1f(U[uname(k)], v);
    },
    // ink: tinta plena (y fotos en el azul); lite: tinta escasa
    render(ink, cam, dpr, lite, par = { x: 0, y: 0 }) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uPar, par.x, par.y);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texLite);
      // sin capa escasa: una textura vacía de 1 px, que no cuesta subir
      if (lite) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lite);
        liteEmpty = false;
      } else if (!liteEmpty) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
        liteEmpty = true;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ink);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uView, canvas.width / dpr, canvas.height / dpr);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform2f(U.uCam, cam.x, cam.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

// Sin WebGL: la capa de tinta se tiñe de plata y se apoya sobre el papel.
function fallback(canvas, look) {
  const ctx = canvas.getContext('2d');
  let tint = null;
  return {
    gl: false,
    set() {},
    render(ink, cam, dpr, lite) {
      if (!tint || tint.width !== ink.width || tint.height !== ink.height) {
        tint = document.createElement('canvas');
        tint.width = ink.width;
        tint.height = ink.height;
      }
      const t = tint.getContext('2d');
      t.globalCompositeOperation = 'source-over';
      t.clearRect(0, 0, tint.width, tint.height);
      t.drawImage(ink, 0, 0);
      if (lite) {
        t.globalAlpha = 0.5;
        t.drawImage(lite, 0, 0);
        t.globalAlpha = 1;
      }
      t.globalCompositeOperation = 'source-in';
      t.fillStyle = look.ink;
      t.fillRect(0, 0, tint.width, tint.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = look.paper;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tint, 0, 0);
    },
  };
}
