(function(){
  var F=window.Forum;
  if(!F)return;
  var pediment=document.querySelector('[data-sp-pediment]');
  if(pediment)F.Pediment(pediment,{tone:'fill',revealDuration:3000,revealEasing:'linear',twinkleInterval:320});
  document.querySelectorAll('[data-sp-frieze]').forEach(function(el){F.Frieze(el,{pattern:el.dataset.spFrieze,pitch:4,dot:2.4,color:'var(--dot-dim)',framed:false});});
  var procession=document.querySelector('[data-sp-procession]');
  if(procession)F.Procession(procession,{tone:'night',figures:JSON.parse(procession.dataset.figures),animate:false,background:'none'});
  var footer=document.querySelector('[data-sp-dots]');
  if(footer)F.DotField(footer,{glyphs:['column','amphora','olive'],rows:20,pitch:6,dot:3.5,animate:false,seed:9,label:'Columnas, ánfora y olivo en puntos cuadrados'});
})();
