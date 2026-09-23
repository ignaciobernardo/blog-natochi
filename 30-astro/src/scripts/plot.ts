const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
const reference = document.querySelector<HTMLImageElement>('main img')!;

async function initialize() {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return;
  const response = await fetch(canvas.dataset.source!);
  if (!response.ok) throw new Error(`Geometry: ${response.status}`);
  const points = new Float32Array(await response.arrayBuffer());
  const strandResponse = await fetch(canvas.dataset.source!.replace('cloud.bin', 'strands.bin'));
  if (!strandResponse.ok) throw new Error(`Strands: ${strandResponse.status}`);
  const strands = new Float32Array(await strandResponse.arrayBuffer());
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, `
    attribute vec3 position;
    attribute float ink;
    uniform mat3 rotation;
    uniform vec2 viewport;
    uniform float scale;
    uniform float pixelRatio;
    uniform float inkScale;
    varying float opacity;
    void main() {
      vec3 p = rotation * position;
      gl_Position = vec4(p.xy * scale * 2.0 / viewport, p.z / 4000.0, 1.0);
      gl_PointSize = max(1.0, scale * pixelRatio);
      opacity = ink * inkScale * min(1.0, scale * pixelRatio * scale * pixelRatio);
    }
  `));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying float opacity;
    void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, opacity); }
  `));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
  const strandBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strandBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strands, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, 'position');
  const ink = gl.getAttribLocation(program, 'ink');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(ink);
  gl.vertexAttribPointer(ink, 1, gl.FLOAT, false, 16, 12);
  const uniforms = Object.fromEntries(['rotation', 'viewport', 'scale', 'pixelRatio', 'inkScale'].map(key => [key, gl.getUniformLocation(program, key)]));
  gl.clearColor(1, 1, 1, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let yaw = 0, pitch = 0, zoom = 1, scheduled = false;
  const frame = [[53,233,120.5],[334,24,-120.5],[904,167,224.5],[717,444,465.5],
    [108,635,-224.5],[351,395,-465.5],[853,559,-120.5],[667,855,120.5]];
  function draw() {
    scheduled = false;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const physicalWidth = Math.round(width * ratio), physicalHeight = Math.round(height * ratio);
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
    }
    gl!.viewport(0, 0, canvas.width, canvas.height);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    gl!.uniformMatrix3fv(uniforms.rotation, false, new Float32Array([
      cy, sx*sy, -cx*sy,
      0, cx, sx,
      sy, -sx*cy, cx*cy,
    ]));
    gl!.uniform2f(uniforms.viewport, width, height);
    let extentX = 452, extentY = 441.5;
    for (const [x,y,z] of frame) {
      extentX = Math.max(extentX, Math.abs(cy*(x-452)+sy*z));
      extentY = Math.max(extentY, Math.abs(sx*sy*(x-452)+cx*(441.5-y)-sx*cy*z));
    }
    const fit = Math.min(452/extentX, 441.5/extentY);
    gl!.uniform1f(uniforms.scale, Math.min(width/904, height/883)*zoom*fit);
    gl!.uniform1f(uniforms.pixelRatio, ratio);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    gl!.vertexAttribPointer(position, 3, gl!.FLOAT, false, 16, 0);
    gl!.vertexAttribPointer(ink, 1, gl!.FLOAT, false, 16, 12);
    gl!.uniform1f(uniforms.inkScale, 1);
    gl!.drawArrays(gl!.POINTS, 0, points.length/4);
    // Join the lifted skeleton when viewed obliquely, so ink remains a
    // continuous trajectory even when adjacent samples spread in projection.
    const obliqueness = Math.min(1, (Math.abs(Math.sin(yaw))+Math.abs(Math.sin(pitch)))*4);
    if (obliqueness > 0) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, strandBuffer);
      gl!.vertexAttribPointer(position, 3, gl!.FLOAT, false, 16, 0);
      gl!.vertexAttribPointer(ink, 1, gl!.FLOAT, false, 16, 12);
      gl!.uniform1f(uniforms.inkScale, obliqueness);
      gl!.drawArrays(gl!.LINES, 0, strands.length/4);
    }
  }
  function redraw() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(draw); }
  }
  function reset() { yaw = 0; pitch = 0; zoom = 1; redraw(); }
  const clampZoom = (value: number) => Math.max(.45, Math.min(5, value));
  const pointers = new Map<number, {x: number; y: number}>();
  let pinchDistance = 0;
  const distance = () => {
    const [a,b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x-b.x, a.y-b.y) : 0;
  };
  canvas.addEventListener('pointerdown', event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    pinchDistance = distance();
  });
  canvas.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      yaw += (event.clientX-previous.x)*.006;
      pitch += (event.clientY-previous.y)*.006;
    } else {
      const next = distance();
      if (pinchDistance > 0) zoom = clampZoom(zoom*next/pinchDistance);
      pinchDistance = next;
    }
    redraw();
  });
  const release = (event: PointerEvent) => { pointers.delete(event.pointerId); pinchDistance = distance(); };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
    zoom = clampZoom(zoom*Math.exp(-delta*.001));
    redraw();
  }, { passive: false });
  canvas.addEventListener('dblclick', reset);
  canvas.addEventListener('keydown', event => {
    switch (event.key) {
      case 'ArrowLeft': yaw -= .08; break;
      case 'ArrowRight': yaw += .08; break;
      case 'ArrowUp': pitch -= .08; break;
      case 'ArrowDown': pitch += .08; break;
      case '+': case '=': zoom = clampZoom(zoom*1.1); break;
      case '-': zoom = clampZoom(zoom/1.1); break;
      case 'Home': case '0': reset(); break;
      default: return;
    }
    event.preventDefault();
    redraw();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    canvas.classList.remove('ready');
    reference.style.visibility = 'visible';
  });
  canvas.addEventListener('webglcontextrestored', () => window.location.reload());
  new ResizeObserver(redraw).observe(canvas);
  draw();
  canvas.classList.add('ready');
  reference.style.visibility = 'hidden';
}

initialize().catch(error => {
  console.error('The interactive plot could not be initialized.', error);
  canvas.hidden = true;
});
