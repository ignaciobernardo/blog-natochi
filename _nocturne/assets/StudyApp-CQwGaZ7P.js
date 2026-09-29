import{r as e}from"./rolldown-runtime-hePW80VL.js";import{a as t,i as n,n as r,o as i,r as a,t as o}from"./index-C0g-62gu.js";import{C as s,I as c,M as l,P as u,T as d,_ as f,c as p,f as m,h,j as g,k as _,m as v}from"./three-D2IPsu87.js";import{a as y,i as b,n as x,r as S}from"./PlanetScene-DfzS8HuA.js";var C=e(i(),1),w=[`dropout, 23yo, based in santiago de chile. focused on finding growth levers for: startups, ventures, and cool things ;).`,`over the last 6 years i've built businesses, communities and fun stuff at the places i've worked.`,`interests: ai safety, cognitive science, venture capital, community stuff & anything borges related.`],T={vortex:{title:`VÓRTICE`,subtitle:`La forma de la luz.`,caption:`02 / CORRIENTES DE LUZ`,hint:`Mueve el cursor para desviar el flujo`},profile:{title:`NATOCHI`,subtitle:`Un estudio en naranja.`,caption:`03 / TEXTO, FOTOGRAFÍA & GRANO`,hint:`Santiago de Chile · luz de San Francisco`},trails:{title:`ESTELAS`,subtitle:`Un instante que se alarga.`,caption:`04 / EXPOSICIÓN LENTA`,hint:`Mueve el cursor para inclinar la caída`}};function E(){let e=document.createElement(`canvas`),t=e.getContext(`2d`),n=new p(e);n.minFilter=f,n.generateMipmaps=!1;let r=0,i=0,a=-1,o={photo:[0,0,0,0],height:760};return{texture:n,draw:(s,c,l,u=!1)=>{if(!u&&s===r&&c===i&&l===a)return o;r=s,i=c,a=l;let d=Math.ceil(s*2),f=Math.ceil(c*2);(e.width!==d||e.height!==f)&&(n.dispose(),e.width=d,e.height=f),t.setTransform(2,0,0,2,0,0),t.clearRect(0,0,s,c),t.fillStyle=`#fff`,t.font=`400 16px Spectral`,t.textBaseline=`alphabetic`;let p=Math.min(360,s-48),m=(s-p)/2,h=(s<=700?146:Math.min(164,Math.max(130,c*.14)))+18;w.forEach((e,n)=>{let r=[],i=[];for(let n of e.split(` `))i.length&&t.measureText([...i,n].join(` `)).width>p&&(r.push(i),i=[]),i.push(n);i.length&&r.push(i),r.forEach((e,n)=>{if(n===r.length-1||e.length===1)t.fillText(e.join(` `),m,h-l);else{let n=e.reduce((e,n)=>e+t.measureText(n).width,0),r=(p-n)/(e.length-1),i=m;e.forEach(e=>{t.fillText(e,i,h-l),i+=t.measureText(e).width+r})}h+=26.4}),n<w.length-1&&(h+=17.6)});let g=h-18+40;return o={photo:[m,g,p,p*2/3],height:Math.max(c,g+p*2/3+135)},n.needsUpdate=!0,o}}}var D=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,O=`
  varying vec2 vUv;
  uniform sampler2D uReference;
  uniform vec2 uResolution, uPointer, uOffset;
  uniform float uTime, uAtmosphere, uHasReference, uComposition, uPublished, uHover;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (vUv - .5) * vec2(aspect, 1.0) * 2.0;
    float h = min(1.62, aspect * 1.64 / 1.205);
    if (uPublished > .5 && uResolution.x > 700.) h = 1.52;
    float verticalComposition = uPublished > .5 && uResolution.x <= 700. ? -.62 : -.03;
    vec2 paper = (p - vec2(uComposition, verticalComposition) - uPointer * .025 - uOffset) / vec2(h * 1.205, h) + .5;
    vec2 core = vec2(.46, .67);
    vec2 q = paper - core;
    float r = length(q);
    float a = atan(q.y, q.x);
    // Small continuous displacements give the supplied strokes a living flow
    // while retaining the asymmetric silhouette, open center, and swept tail.
    paper += vec2(sin(a * 3.0 - uTime * .26), cos(a * 2.0 + uTime * .21))
      * .0035 * smoothstep(.02, .22, r);
    float inPaper = step(0., paper.x) * step(paper.x, 1.) * step(0., paper.y) * step(paper.y, 1.);
    float ink = 1.0 - texture2D(uReference, clamp(paper, 0., 1.)).r;
    ink = pow(smoothstep(.13, .79, ink), 1.25) * inPaper;
    float spiral = pow(max(0., cos(a * 11.0 + log(r + .045) * 6.0)), 90.0) * smoothstep(.018, .10, r) * exp(-r * 2.8);
    ink = mix(spiral, ink, uHasReference);
    float phase = a * 3.0 + log(r + .065) * 5.8 - uTime * .75;
    float traveling = pow(max(0., sin(phase)), 9.0);
    float fragments = .55 + .45 * hash(floor(paper * vec2(1100., 900.)));
    float light = ink * (.45 + traveling * 5.5) * fragments;
    if (uPublished > .5) {
      float veil = uResolution.x > 700.
        ? mix(.2, 1., smoothstep(.20, .73, vUv.x))
        : mix(.15, .34, smoothstep(.05, .95, vUv.x));
      light *= veil * (1.0 + uHover * 1.4);
    }
    float haze = exp(-r * r * 30.0) * .024 * uAtmosphere * (1.0 + uHover * .55);
    float edgeFade = smoothstep(0., .09, min(min(paper.x, 1. - paper.x), min(paper.y, 1. - paper.y)));
    gl_FragColor = vec4(vec3(.016 + haze + light * edgeFade), 1.0);
  }
`,k=`
  attribute vec4 aParticle;
  attribute vec2 aDetails;
  uniform vec2 uResolution, uPointer;
  uniform float uTime;
  varying vec2 vUv;
  varying float vBrightness;
  void main() {
    vUv = uv;
    vBrightness = aDetails.x * mix(1.0, .23, smoothstep(-.65, 1.4, aParticle.x));
    float angle = uPointer.x * .09;
    vec2 dir = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * normalize(vec2(.64, -.77));
    vec2 across = vec2(-dir.y, dir.x);
    float along = fract(aParticle.y + uTime * .024 * aDetails.y) * 5.4 - 2.7;
    vec2 head = dir * along + across * aParticle.x;
    vec2 p = head + dir * (uv.y - 1.0) * aParticle.z + across * position.x * aParticle.w;
    gl_Position = vec4(p.x / (uResolution.x / uResolution.y), p.y, .0, 1.0);
  }
`,A=`
  varying vec2 vUv;
  varying float vBrightness;
  void main() {
    float x = (vUv.x - .5) * 2.;
    float head = exp(-x*x*8.0 - pow((vUv.y - .91) * 20., 2.));
    float filament = exp(-x*x*95.) * pow(vUv.y, 1.6) * (1. - smoothstep(.91, 1., vUv.y));
    float fringe = exp(-x*x*15.) * pow(vUv.y, 2.8) * .085;
    float broken = .68 + .32 * sin(vUv.y * 170. + vBrightness * 30.) * sin(vUv.y * 319.);
    float emission = (head + filament * .35 * broken + fringe) * vBrightness;
    if (emission < .0005) discard;
    gl_FragColor = vec4(vec3(emission), 1.0);
  }
`,j=`
  uniform vec2 uResolution;
  uniform float uAtmosphere;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - .5) * vec2(uResolution.x / uResolution.y, 1.) * 2.;
    float band = dot(p, normalize(vec2(.77, .64)));
    float haze = exp(-pow((band + 1.3) * 1.25, 2.)) * .14 * uAtmosphere;
    gl_FragColor = vec4(vec3(.016 + haze), 1.);
  }
`,M=`
  varying vec2 vUv;
  uniform sampler2D uText, uPhoto;
  uniform vec2 uResolution;
  uniform vec4 uPhotoRect;
  uniform float uScroll, uAmber, uAtmosphere, uPhotoLoaded;
  void main() {
    vec2 css = vec2(vUv.x, 1. - vUv.y) * uResolution;
    vec2 page = css + vec2(0., uScroll);
    vec2 photoUv = (page - uPhotoRect.xy) / max(uPhotoRect.zw, vec2(1.));
    float inPhoto = step(0., photoUv.x) * step(photoUv.x, 1.) * step(0., photoUv.y) * step(photoUv.y, 1.) * uPhotoLoaded;
    vec3 tint = mix(vec3(1.45), vec3(1.45, .14, .012), uAmber);
    float alpha = texture2D(uText, vUv).a;
    vec3 photo = texture2D(uPhoto, vec2(photoUv.x, 1. - photoUv.y)).rgb;
    float luma = dot(photo, vec3(.2126, .7152, .0722));
    photo = mix(vec3(luma), photo * vec3(1.04, .96, .89), uAmber);
    // Lift the photograph's dark jacket/bridge before ACES' toe, and keep the
    // camera flash below the bloom threshold. This is an artistic curve in
    // linear space; OutputPass performs the sole display-space conversion.
    photo = pow(max(photo, vec3(0.)), vec3(.65)) * .4;
    float halo = exp(-pow((css.x - uResolution.x * .5) / 330., 2.));
    vec3 background = vec3(.014) + mix(vec3(.002), vec3(.004, .0011, .0003), uAmber) * halo * uAtmosphere;
    vec3 color = mix(background, photo + vec3(.001), inPhoto);
    color = mix(color, tint, alpha);
    // Keep scrolling content clear of the fixed study navigation and controls.
    float topEdge = uResolution.x <= 700. ? 146. : 118.;
    float bottomEdge = uResolution.x <= 700. ? 120. : 86.;
    float contentMask = smoothstep(topEdge - 22., topEdge, css.y)
      * (1. - smoothstep(uResolution.y - bottomEdge, uResolution.y - bottomEdge + 22., css.y));
    color = mix(background, color, contentMask);
    gl_FragColor = vec4(color, 1.);
  }
`,N=a();function P(){let e=9473,t=()=>(e=Math.imul(e,1664525)+1013904223>>>0,e/4294967296),n=new s(1,1),r=new h;r.index=n.index,r.attributes={...n.attributes},r.instanceCount=820;let i=[],a=[];for(let e=0;e<r.instanceCount;e++){let e=t();i.push(-1.7+t()**1.8*3.3,t(),.16+t()**.8*1.15,.002+e**5*.038),a.push(.55+e**2*6,.55+e*.75)}return r.setAttribute(`aParticle`,new v(new Float32Array(i),4)),r.setAttribute(`aDetails`,new v(new Float32Array(a),2)),r}function F(e){let{gl:t,size:n}=y(),r=(0,C.useRef)(new u),i=(0,C.useRef)(0),a=(0,C.useRef)(0),o=(0,C.useRef)(new u),s=(0,C.useRef)(null),f=(0,C.useRef)(0),p=(0,C.useMemo)(()=>e.kind===`profile`?E():null,[e.kind]),h=(0,C.useMemo)(()=>e.kind===`trails`?P():null,[e.kind]),v=(0,C.useMemo)(()=>{let t=new m(new Uint8Array([255,255,255,0]),1,1,d);t.needsUpdate=!0;let n={uResolution:{value:new u(1,1)},uPointer:{value:new u},uOffset:{value:new u},uTime:{value:0},uAtmosphere:{value:.5},uHasReference:{value:0},uComposition:{value:0},uPublished:{value:0},uHover:{value:0},uReference:{value:t},uText:{value:p?.texture??t},uPhoto:{value:t},uPhotoRect:{value:new c(0,0,1,1)},uScroll:{value:0},uAmber:{value:1},uPhotoLoaded:{value:0}};return{background:new g({uniforms:n,vertexShader:D,fragmentShader:e.kind===`vortex`?O:e.kind===`profile`?M:j,toneMapped:!1,depthTest:!1,depthWrite:!1}),streaks:e.kind===`trails`?new g({uniforms:n,vertexShader:k,fragmentShader:A,side:2,transparent:!0,blending:2,depthTest:!1,depthWrite:!1,toneMapped:!1}):null,uniforms:n,placeholder:t}},[e.kind,p]);(0,C.useEffect)(()=>{if(!e.interactive&&!e.hoverable)return;let n=t.domElement,a=t=>{if(e.hoverable&&t.pointerType!==`touch`&&(i.current=1),!e.interactive)return;let a=n.getBoundingClientRect();if(r.current.set((t.clientX-a.left)/a.width*2-1,1-(t.clientY-a.top)/a.height*2),e.movable&&s.current?.id===t.pointerId){let e=2/a.height;o.current.x=Math.max(-1.2,Math.min(1.2,o.current.x+(t.clientX-s.current.x)*e)),o.current.y=Math.max(-1.2,Math.min(1.2,o.current.y-(t.clientY-s.current.y)*e)),s.current.x=t.clientX,s.current.y=t.clientY}},c=()=>{r.current.set(0,0),i.current=0},l=t=>{e.interactive&&e.movable&&(t.pointerType!==`mouse`||t.button===0)&&(n.setPointerCapture(t.pointerId),s.current={id:t.pointerId,x:t.clientX,y:t.clientY})},u=e=>{if(s.current?.id===e.pointerId){s.current=null,n.hasPointerCapture(e.pointerId)&&n.releasePointerCapture(e.pointerId);try{localStorage.setItem(`nocturne-41-offset-v1`,JSON.stringify(o.current.toArray()))}catch{}}};return n.addEventListener(`pointermove`,a),n.addEventListener(`pointerleave`,c),n.addEventListener(`pointerdown`,l),n.addEventListener(`pointerup`,u),n.addEventListener(`pointercancel`,u),()=>{n.removeEventListener(`pointermove`,a),n.removeEventListener(`pointerleave`,c),n.removeEventListener(`pointerdown`,l),n.removeEventListener(`pointerup`,u),n.removeEventListener(`pointercancel`,u)}},[t,e.interactive,e.hoverable,e.movable]),(0,C.useEffect)(()=>{if(e.movable||location.pathname.startsWith(`/41`))try{let e=JSON.parse(localStorage.getItem(`nocturne-41-offset-v1`)??`null`);Array.isArray(e)&&e.length===2&&e.every(e=>typeof e==`number`&&Number.isFinite(e))&&o.current.set(Math.max(-1.2,Math.min(1.2,e[0])),Math.max(-1.2,Math.min(1.2,e[1])))}catch{}},[e.movable]),(0,C.useEffect)(()=>{if(e.layoutReset){o.current.set(0,0);try{localStorage.removeItem(`nocturne-41-offset-v1`)}catch{}}},[e.layoutReset]),(0,C.useEffect)(()=>{let n=!0,r=()=>{n&&(e.telemetry.current.loaded=!0,e.onReady())};if(e.kind===`trails`){r();return}let i=`/_nocturne/media/${e.kind===`vortex`?`vortex-reference.png`:`natochi-golden-gate.webp`}`,a=new l().load(i,async i=>{if(!n){i.dispose();return}if(e.kind===`vortex`)v.uniforms.uReference.value=i,v.uniforms.uHasReference.value=1;else{if(i.colorSpace=_,v.uniforms.uPhoto.value=i,v.uniforms.uPhotoLoaded.value=1,await document.fonts.load(`400 16px Spectral`),!n)return;p?.draw(t.domElement.clientWidth,t.domElement.clientHeight,e.scroll.current,!0)}r()},void 0,r);return()=>{n=!1,a.dispose()}},[t,e.kind,v,p,e.onReady,e.telemetry,e.scroll]),(0,C.useEffect)(()=>()=>{v.background.dispose(),v.streaks?.dispose(),v.placeholder.dispose(),p?.texture.dispose(),h?.dispose()},[v,p,h]);let S=(0,C.useRef)(0);return b((t,s)=>{!e.paused&&!e.reducedMotion&&(f.current+=Math.min(s,.05)*e.settings.rotationSpeed/.008);let c=v.uniforms;if(c.uResolution.value.set(n.width,n.height),c.uPublished.value=+!!e.fullBleed,c.uComposition.value=e.fullBleed?n.width>700?n.width*.5/n.height:n.width*.2/n.height:0,a.current+=(i.current-a.current)*(e.reducedMotion?1:1-Math.exp(-Math.min(s,.05)*7)),c.uHover.value=a.current,e.paused||c.uPointer.value.lerp(r.current,e.reducedMotion?1:1-Math.exp(-s*5)),c.uOffset.value.copy(o.current),c.uTime.value=f.current,c.uAtmosphere.value=e.settings.atmosphere,c.uAmber.value=+!!e.amber,c.uScroll.value=e.scroll.current,p){let t=p.draw(n.width,n.height,e.scroll.current);c.uPhotoRect.value.fromArray(t.photo),t.height!==S.current&&(S.current=t.height,e.onContentHeight(t.height))}Object.assign(e.telemetry.current,{time:f.current,paused:e.paused,amber:e.amber,pointer:c.uPointer.value.toArray(),offset:c.uOffset.value.toArray(),scroll:e.scroll.current,photoRect:c.uPhotoRect.value.toArray()})}),(0,N.jsxs)(N.Fragment,{children:[(0,N.jsxs)(`mesh`,{frustumCulled:!1,renderOrder:0,children:[(0,N.jsx)(`planeGeometry`,{args:[2,2]}),(0,N.jsx)(`primitive`,{object:v.background,attach:`material`})]}),h&&v.streaks&&(0,N.jsx)(`mesh`,{geometry:h,material:v.streaks,frustumCulled:!1,renderOrder:1}),(0,N.jsx)(x,{settings:{...e.settings,freezeGrain:e.settings.freezeGrain||e.paused},reducedMotion:e.reducedMotion,telemetry:e.telemetry,bloomThreshold:e.kind===`profile`?.3:.8})]})}function I(e){return(0,N.jsx)(S,{dpr:[1,1.5],gl:{alpha:!1,antialias:!1,powerPreference:`high-performance`},onCreated:({gl:t})=>{t.domElement.setAttribute(`role`,`img`),t.domElement.setAttribute(`aria-label`,e.kind===`profile`?`Texto naranja y fotografía de Natochi con grano de película.`:e.kind===`vortex`?`Vórtice animado de luz siguiendo la silueta de referencia.`:`Estelas de luz diagonales con grano de película.`)},fallback:(0,N.jsx)(`div`,{className:`scene-error`,children:`Este estudio necesita WebGL 2.`}),children:(0,N.jsx)(F,{...e})})}function L(){let e=(0,C.useRef)(null),t=(0,C.useRef)(null);return(0,C.useLayoutEffect)(()=>{let n=()=>{if(!e.current||!t.current)return;let n=e.current.clientHeight,r=t.current.scrollHeight,i=Math.min(1,(n-24)/r);t.current.style.transform=`translateX(-50%) scale(${i})`,t.current.style.top=`${Math.max(12,(n-r*i)/2)}px`},r=new ResizeObserver(n);return r.observe(e.current),r.observe(t.current),document.fonts.ready.then(n),n(),()=>r.disconnect()},[]),(0,N.jsx)(`section`,{className:`vortex-biography`,"aria-label":`About Natochi`,ref:e,children:(0,N.jsxs)(`div`,{className:`vortex-biography-inner`,ref:t,children:[(0,N.jsxs)(`h1`,{children:[`natochi `,(0,N.jsx)(`span`,{className:`bio-emoticon`,children:"(╬`益´)"})]}),(0,N.jsxs)(`div`,{className:`bio-intro`,children:[(0,N.jsx)(`p`,{children:`dropout, 23yo, based in santiago de chile. focused on finding growth levers for: startups, ventures, and cool things ;).`}),(0,N.jsx)(`p`,{children:`over the last 6 years i've built businesses, communities and fun stuff at the places i've worked.`}),(0,N.jsx)(`p`,{children:`interests: ai safety, cognitive science, venture capital, community stuff & anything borges related.`})]}),(0,N.jsxs)(`div`,{className:`bio-now`,children:[(0,N.jsxs)(`p`,{children:[`~ currently @ `,(0,N.jsx)(`a`,{href:`https://platan.us/`,target:`_blank`,rel:`noopener noreferrer`,children:`platan.us`})]}),(0,N.jsx)(`p`,{children:`~ contracting @ kairos, m3 fellowship & helping run genstream.`})]}),(0,N.jsxs)(`section`,{"aria-labelledby":`bio-reading`,children:[(0,N.jsx)(`h2`,{id:`bio-reading`,children:`~ reading & watching...`}),(0,N.jsxs)(`div`,{className:`bio-reading`,children:[(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{children:`in search of lost time`}),(0,N.jsx)(`small`,{children:`marcel proust.`})]}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`span`,{children:`sōsō no frieren`}),(0,N.jsx)(`small`,{children:`kanehito yamada.`})]})]})]}),(0,N.jsxs)(`p`,{className:`bio-contact`,children:[(0,N.jsx)(`span`,{children:`[↗]:`}),` `,(0,N.jsx)(`a`,{href:`mailto:ernesto@indies.cl`,children:`Email`}),`, `,(0,N.jsx)(`a`,{href:`https://www.linkedin.com/in/natochi/`,target:`_blank`,rel:`noopener noreferrer`,children:`LinkedIn`}),`, `,(0,N.jsx)(`a`,{href:`https://x.com/natochi_`,target:`_blank`,rel:`noopener noreferrer`,children:`Twitter`})]})]})})}function R(e){return{...t,grainStrength:e===`profile`?.66:.8,bloom:e===`profile`?.16:e===`vortex`?.55:.23,atmosphere:e===`vortex`?.65:.45,contrast:1.12,exposure:1.05}}function z({kind:e,published:t=!1,tweak:i=!1}){let a=t?`nocturne-41-v1`:`nocturne-study-${e}-v1`,[s,c]=(0,C.useState)(()=>{let t=R(e);try{let e=JSON.parse(localStorage.getItem(a)??`{}`);for(let[r,i]of Object.entries(n))Number.isFinite(e[r])&&(t[r]=Math.max(i.min,Math.min(i.max,e[r])));typeof e.freezeGrain==`boolean`&&(t.freezeGrain=e.freezeGrain)}catch{}return t}),[l,u]=(0,C.useState)(!1),[d,f]=(0,C.useState)(!0),[p,m]=(0,C.useState)(!1),[h,g]=(0,C.useState)(0),[_,v]=(0,C.useState)(()=>matchMedia(`(prefers-reduced-motion: reduce)`).matches),y=(0,C.useRef)(0),[b,x]=(0,C.useState)(760),S=(0,C.useRef)({frame:0,seed:0,dpr:1,bloomScale:.5,bloomEnabled:!0,reducedMotion:_,texture:e,time:0,kind:e,paused:l,amber:d,loaded:!1}),E=(0,C.useCallback)(()=>m(!0),[]),D=T[e];return(0,C.useEffect)(()=>{let e=matchMedia(`(prefers-reduced-motion: reduce)`),t=()=>v(e.matches);return e.addEventListener(`change`,t),()=>e.removeEventListener(`change`,t)},[]),(0,C.useEffect)(()=>{let e=setTimeout(()=>{try{localStorage.setItem(a,JSON.stringify(s))}catch{}},150);return()=>clearTimeout(e)},[s,a]),(0,C.useEffect)(()=>(document.title=t?`natochi — vortex`:`${D.title} — Estudios de luz`,()=>{}),[D.title,t]),(0,N.jsxs)(`main`,{className:`experience study-experience study-${e} ${t?`published-vortex`:``} ${t&&i?`published-tweak`:``}`,lang:t?`en`:`es`,children:[(0,N.jsx)(`div`,{className:`scene`,children:(0,N.jsx)(I,{kind:e,settings:s,paused:l,amber:d,reducedMotion:_,telemetry:S,scroll:y,onReady:E,onContentHeight:x,interactive:!t||i,hoverable:t,movable:t&&i,layoutReset:h,fullBleed:t})}),t&&(0,N.jsx)(L,{}),e===`profile`&&(0,N.jsx)(`div`,{className:`profile-scroll`,onScroll:e=>{y.current=e.currentTarget.scrollTop},tabIndex:0,"aria-label":`Perfil de Natochi`,children:(0,N.jsx)(`article`,{className:`profile-semantic`,lang:`en`,style:{minHeight:b},children:(0,N.jsxs)(`div`,{className:`profile-copy`,children:[w.map(e=>(0,N.jsx)(`p`,{children:e},e)),(0,N.jsx)(`img`,{src:`/_nocturne/media/natochi-golden-gate.webp`,alt:`Natochi frente al Golden Gate iluminado de noche en San Francisco.`})]})})}),!t&&(0,N.jsxs)(`header`,{className:`identity`,children:[(0,N.jsxs)(`div`,{className:`wordmark`,children:[(0,N.jsx)(`span`,{className:`study-mark mark-${e}`,"aria-hidden":`true`}),(0,N.jsx)(`h1`,{children:D.title})]}),(0,N.jsx)(`p`,{children:D.subtitle})]}),!t&&(0,N.jsx)(o,{}),(!t||i)&&(0,N.jsx)(r,{settings:s,reducedMotion:_,onChange:(e,t)=>c(n=>({...n,[e]:t})),showMotion:e!==`profile`,motionLabel:`Velocidad del flujo`,atmosphereLabel:`Bruma luminosa`,onReset:()=>{c(R(e)),u(!1),f(!0),t&&g(e=>e+1)}}),!p&&!t&&(0,N.jsx)(`div`,{className:`loading-note`,role:`status`,children:`Revelando la luz`}),!t&&(0,N.jsxs)(`footer`,{className:`scene-footer study-footer`,children:[(0,N.jsxs)(`div`,{className:`scene-caption`,children:[(0,N.jsx)(`span`,{className:`small-caps`,children:D.caption}),e===`profile`?(0,N.jsx)(`a`,{href:`http://natochi.cv/9/`,target:`_blank`,rel:`noreferrer`,children:`Ver sitio original ↗`}):(0,N.jsx)(`span`,{className:`study-note`,children:`Grano, luz y movimiento`})]}),(0,N.jsxs)(`div`,{className:`study-actions`,children:[e===`profile`&&(0,N.jsxs)(`div`,{className:`tone-switch`,"aria-label":`Color de la luz`,children:[(0,N.jsxs)(`button`,{"aria-pressed":d,onClick:()=>f(!0),children:[(0,N.jsx)(`i`,{className:`amber-dot`}),`Naranja`]}),(0,N.jsxs)(`button`,{"aria-pressed":!d,onClick:()=>f(!1),children:[(0,N.jsx)(`i`,{}),`Blanco`]})]}),(0,N.jsx)(`button`,{className:`pause-button`,"aria-pressed":l,onClick:()=>u(!l),children:l?`▶ Reanudar`:`Ⅱ Pausar`})]}),(0,N.jsx)(`p`,{className:`interaction-hint`,children:_?`Movimiento reducido`:D.hint})]})]})}export{z as default};