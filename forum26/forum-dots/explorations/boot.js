// Only original Forum artwork. No Chronicle, Inscription, Hellenize or startup animation.
(function(){
  const F=window.Forum;
  if(!F)return;
  document.querySelectorAll('[data-ex-art]').forEach(el=>{
    const {exArt:type,name,tone}=el.dataset;
    if(type==='glyph')el.innerHTML=F.glyphSVG(name,{pitch:14,dot:6,color:'var(--dot-lit)'});
    if(type==='arch')F.ArchWindow(el,{scene:name,tone:tone||'night',caption:'',note:'',pitch:6,dot:3.5,animate:false});
    if(type==='icarus')F.IcarusField(el,{pitch:8,dot:4,rows:44,animate:false});
  });
  document.querySelectorAll('[data-ex-frieze]').forEach(el=>F.Frieze(el,{pattern:el.dataset.exFrieze,pitch:5,dot:2.8,color:'var(--dot-dim)',framed:false}));
  const assembly=document.querySelector('[data-ex-assembly]');
  if(assembly)F.Assembly(assembly,{tone:'night'});
  const footerAssembly=document.querySelector('[data-ex-footer-assembly]');
  if(footerAssembly)F.Assembly(footerAssembly,{tone:'night',bottom:'meander',pitch:3,dot:2.3,bandPitch:3,bandDot:2});
  const pediment=document.querySelector('[data-ex-pediment]');
  if(pediment)F.Pediment(pediment,{revealDuration:3000,revealEasing:'linear',twinkleInterval:320});
  document.querySelectorAll('[data-ex-procession]').forEach(el=>{
    F.Procession(el,{tone:'night',figures:JSON.parse(el.dataset.figures),animate:false});
  });
  document.querySelectorAll('[data-ex-footer], [data-ex-footer-copy]').forEach(el=>{
    F.DotField(el,{glyphs:['column','amphora','olive'],rows:24,pitch:6,dot:3.5,animate:false,seed:9,label:'Columnas, ánfora y olivo en una franja de puntos cuadrados'});
    if(el.hasAttribute('aria-hidden'))el.querySelector('canvas')?.setAttribute('aria-hidden','true');
  });
  if(new URLSearchParams(location.search).has('preview'))document.querySelector('.ex-versions')?.remove();
  const hours=document.querySelectorAll('.ex-hours a');
  if(hours.length&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){hours.forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});
    },{rootMargin:'-15% 0px -65% 0px'});
    document.querySelectorAll('[data-session]').forEach(el=>observer.observe(el));
  }
})();
