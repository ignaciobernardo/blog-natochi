(function(){function e(e=1,t=1){if(typeof OffscreenCanvas==`function`)return new OffscreenCanvas(e,t);let n=document.createElement(`canvas`);return n.width=e,n.height=t,n}function t(e){let t=e.trim().replace(/^#/,``),n=t.length===3?t.split(``).map(e=>`${e}${e}`).join(``):t,r=Number.parseInt(n.slice(0,6),16);return!Number.isFinite(r)||n.length<6?[0,0,0]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}function n(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Glyph Flow could not create a WebGL shader.`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`Unknown shader compile error.`;throw e.deleteShader(r),Error(`Glyph Flow shader compile failed: ${t}`)}return r}function r(e){let t=n(e,e.VERTEX_SHADER,`#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`),r=n(e,e.FRAGMENT_SHADER,`#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTextTexture;
uniform sampler2D uNoiseTexture;
uniform vec2 uResolution;
uniform vec2 uOutputSize;
uniform vec2 uTileOffset;
uniform vec2 uLogicalSize;
uniform vec2 uTextTextureSize;
uniform vec3 uBackground;
uniform vec3 uForeground;
uniform float uCoverage;
uniform float uCycles;
uniform float uDetail;
uniform float uDrift;
uniform float uGrain;
uniform float uIncludeBackground;
uniform float uProgress;
uniform float uScale;
uniform float uSeed;
uniform float uSoftness;
uniform float uWarp;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32 + uSeed * 0.001);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  return texture(uNoiseTexture, (p + 0.5) / 256.0).r;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.56;
  mat2 rotateScale = mat2(1.72, 1.05, -1.05, 1.72);

  for (int octave = 0; octave < 5; octave += 1) {
    if (float(octave) >= uDetail) {
      break;
    }
    value += valueNoise(p) * amplitude;
    p = rotateScale * p + vec2(7.13, 3.71);
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  float theta = uProgress * TAU * uCycles;
  vec2 orbit = vec2(cos(theta), sin(theta));
  vec2 aspect = vec2(uLogicalSize.x / max(uLogicalSize.y, 1.0), 1.0);
  vec2 outputPixel = uTileOffset + vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 outputUv = vec2(
    outputPixel.x / max(uOutputSize.x, 1.0),
    1.0 - outputPixel.y / max(uOutputSize.y, 1.0)
  );
  vec2 position = (outputUv - 0.5) * aspect * uScale * 2.1;
  vec2 seedOffset = vec2(uSeed * 0.0071, uSeed * 0.0113);
  vec2 motionOffset = orbit * uDrift;

  vec2 warpPosition = position * 0.72 + seedOffset + motionOffset;
  vec2 warpLow = texture(uNoiseTexture, (warpPosition + 0.5) / 256.0).rg;
  vec2 warpHigh = texture(
    uNoiseTexture,
    (warpPosition * 2.03 + vec2(5.7, -3.4) + 0.5) / 256.0
  ).ba;
  vec2 warpVector = warpLow * 0.68 + warpHigh * 0.32;
  vec2 warped = position + (warpVector - 0.5) * uWarp * 2.8;
  float field = fbm(warped + motionOffset * 1.35 + seedOffset * 0.21);

  float threshold = mix(0.80, 0.28, uCoverage);
  float mask = smoothstep(threshold - uSoftness, threshold + uSoftness, field);
  float edge = 1.0 - smoothstep(0.03, 0.24, abs(field - threshold));

  vec2 logicalPixel = vec2(outputUv.x, 1.0 - outputUv.y) * uLogicalSize;
  vec2 textUv = logicalPixel / max(uTextTextureSize, vec2(1.0));
  float glyph = texture(uTextTexture, textUv).a;

  vec2 grainCell = floor(outputPixel * 0.58);
  float randomValue = hash21(grainCell + orbit * 41.0);
  float dustGate = step(1.0 - uGrain * (0.035 + edge * 0.13), randomValue);
  float dust = dustGate * mix(0.18, 0.72, edge);
  float fineGrain = (randomValue - 0.5) * uGrain * 0.08;
  float ink = clamp(glyph * max(mask + fineGrain, dust), 0.0, 1.0);

  if (uIncludeBackground > 0.5) {
    vec3 color = mix(uBackground, uForeground, ink);
    outColor = vec4(color, 1.0);
  } else {
    outColor = vec4(uForeground, ink);
  }
}
`),i=e.createProgram();if(!i)throw Error(`Glyph Flow could not create a WebGL program.`);if(e.attachShader(i,t),e.attachShader(i,r),e.linkProgram(i),e.deleteShader(t),e.deleteShader(r),!e.getProgramParameter(i,e.LINK_STATUS)){let t=e.getProgramInfoLog(i)??`Unknown shader link error.`;throw e.deleteProgram(i),Error(`Glyph Flow shader link failed: ${t}`)}return i}var i=class{buffer;canvas;gl;noiseTexture;program;textTexture;uniformLocations=new Map;textTextureInfo=null;constructor(e,t={}){let n=e.getContext(`webgl2`,{alpha:!0,antialias:!1,depth:!1,preserveDrawingBuffer:t.preserveDrawingBuffer??!1,premultipliedAlpha:!1,stencil:!1});if(!n)throw Error(`Glyph Flow requires a browser with WebGL2 support.`);this.canvas=e,this.gl=n,this.program=r(n);let i=n.createBuffer();if(!i)throw Error(`Glyph Flow could not create its fullscreen geometry.`);this.buffer=i,n.bindBuffer(n.ARRAY_BUFFER,i),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let a=n.getAttribLocation(this.program,`aPosition`);n.enableVertexAttribArray(a),n.vertexAttribPointer(a,2,n.FLOAT,!1,0,0);let o=n.createTexture();if(!o)throw Error(`Glyph Flow could not create its text texture.`);this.textTexture=o,n.bindTexture(n.TEXTURE_2D,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.REPEAT),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.REPEAT),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR);let s=n.createTexture();if(!s)throw Error(`Glyph Flow could not create its procedural noise texture.`);this.noiseTexture=s;let c=new Uint8Array(256*256*4),l=2654435769;for(let e=0;e<256*256;e+=1){l^=l<<13,l^=l>>>17,l^=l<<5;let t=e*4;for(let e=0;e<4;e+=1)l^=l<<13,l^=l>>>17,l^=l<<5,c[t+e]=l>>>24}n.bindTexture(n.TEXTURE_2D,s),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.REPEAT),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.REPEAT),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,256,256,0,n.RGBA,n.UNSIGNED_BYTE,c)}dispose(e=!1){this.gl.deleteBuffer(this.buffer),this.gl.deleteTexture(this.noiseTexture),this.gl.deleteTexture(this.textTexture),this.gl.deleteProgram(this.program),e&&this.gl.getExtension(`WEBGL_lose_context`)?.loseContext()}render(e,n={}){let r=this.gl;this.ensureTextTexture(e),r.viewport(0,0,this.canvas.width,this.canvas.height),r.useProgram(this.program),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.textTexture),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.noiseTexture),this.uniform1f(`uCoverage`,e.coverage),this.uniform1f(`uCycles`,e.cycles),this.uniform1f(`uDetail`,e.detail),this.uniform1f(`uDrift`,e.drift),this.uniform1f(`uGrain`,e.grain),this.uniform1f(`uIncludeBackground`,+!!e.includeBackground),this.uniform1f(`uProgress`,e.progress),this.uniform1f(`uScale`,e.scale),this.uniform1f(`uSeed`,e.seed),this.uniform1f(`uSoftness`,e.softness),this.uniform1f(`uWarp`,e.warp),this.uniform2f(`uResolution`,this.canvas.width,this.canvas.height),this.uniform2f(`uOutputSize`,n.outputWidth??this.canvas.width,n.outputHeight??this.canvas.height),this.uniform2f(`uTileOffset`,n.offsetX??0,n.offsetY??0),this.uniform2f(`uLogicalSize`,e.logicalWidth,e.logicalHeight),this.uniform2f(`uTextTextureSize`,this.textTextureInfo?.width??1,this.textTextureInfo?.height??1);let[i,a,o]=t(e.background),[s,c,l]=t(e.foreground);this.uniform3f(`uBackground`,i,a,o),this.uniform3f(`uForeground`,s,c,l),r.uniform1i(this.getUniformLocation(`uTextTexture`),0),r.uniform1i(this.getUniformLocation(`uNoiseTexture`),1),r.drawArrays(r.TRIANGLES,0,3)}ensureTextTexture(t){let n=t.glyphContent.trim()||`GLYPH FLOW / `,r=[n,t.glyphSize,t.glyphSpacing,t.seed].join(`|`);if(this.textTextureInfo?.key===r)return;let i=e().getContext(`2d`);if(!i)throw Error(`Glyph Flow could not create a text raster context.`);let a=Math.max(6,Math.round(t.glyphSize)),o=`${Math.max(500,Math.min(700,520+t.seed%3*80))} ${a}px ui-monospace, "SFMono-Regular", "Hiragino Sans", monospace`;i.font=o;let s=`${n} `,c=Math.max(48,Math.ceil(i.measureText(s).width)),l=Math.min(2048,c),u=Math.max(a+1,Math.round(t.glyphSpacing)),d=u*2,f=e(l,d),p=f.getContext(`2d`);if(!p)throw Error(`Glyph Flow could not rasterize its text texture.`);p.clearRect(0,0,l,d),p.fillStyle=`#FFFFFF`,p.font=o,p.textBaseline=`top`;let m=(e,t)=>{for(let n=t-c;n<l+c;n+=c)p.fillText(s,n,e)};m(0,0),m(u,-(c*(t.seed%31/47+.21)));let h=this.gl;h.activeTexture(h.TEXTURE0),h.bindTexture(h.TEXTURE_2D,this.textTexture),h.pixelStorei(h.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0),h.texImage2D(h.TEXTURE_2D,0,h.RGBA,h.RGBA,h.UNSIGNED_BYTE,f),this.textTextureInfo={height:d,key:r,width:l}}uniform1f(e,t){this.gl.uniform1f(this.getUniformLocation(e),t)}uniform2f(e,t,n){this.gl.uniform2f(this.getUniformLocation(e),t,n)}uniform3f(e,t,n,r){this.gl.uniform3f(this.getUniformLocation(e),t,n,r)}getUniformLocation(e){return this.uniformLocations.has(e)||this.uniformLocations.set(e,this.gl.getUniformLocation(this.program,e)),this.uniformLocations.get(e)??null}};self.onmessage=async e=>{let{height:t,mimeType:n,quality:r,settings:a,width:o}=e.data,s=new OffscreenCanvas(o,t),c=s.getContext(`2d`);if(!c)throw Error(`Glyph Flow could not create the worker export surface.`);let l=Math.min(t,Math.max(48,Math.min(192,Math.floor(18e4/o)))),u=new OffscreenCanvas(o,l),d=new i(u,{preserveDrawingBuffer:!0});try{for(let e=0;e<t;e+=l){let n=Math.min(l,t-e);u.height!==n&&(u.height=n),d.render(a,{offsetY:e,outputHeight:t,outputWidth:o});let r=u.transferToImageBitmap();try{c.drawImage(r,0,e,o,n)}finally{r.close()}await new Promise(e=>setTimeout(e,0))}let e=await s.convertToBlob({quality:r,type:n});self.postMessage({blob:e,type:`complete`})}finally{d.dispose(!0),self.close()}}})();