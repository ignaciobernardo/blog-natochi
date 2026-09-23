/* Deterministic procedural paper. No texture photographs or image downloads. */
(() => {
  const PRESETS = [
    {name:'Celulosa',desc:'Grano fino y formación irregular de la pulpa.',base:[243,242,238],grain:3,cloud:2.8,fibers:500},
    {name:'Algodón',desc:'Fibras largas, blancas y poco contrastadas.',base:[246,244,238],grain:2,cloud:3.8,fibers:3600,long:1},
    {name:'Vergé',desc:'Líneas de corondel y trama de fabricación.',base:[243,241,233],grain:2.4,cloud:2,laid:1,fibers:600},
    {name:'Lino',desc:'Dos direcciones de fibra cruzadas.',base:[243,242,237],grain:2,cloud:2.2,linen:1,fibers:1000},
    {name:'Pulpa',desc:'Nubes de densidad bajo la superficie.',base:[238,237,231],grain:3.3,cloud:11,fibers:1300},
    {name:'Prensado frío',desc:'Relieve iluminado de lado, grano abierto.',base:[243,242,236],grain:2.8,cloud:4,relief:18,fibers:800},
    {name:'Prensado caliente',desc:'Superficie compacta, lisa y satinada.',base:[247,246,242],grain:1.3,cloud:1.8,satin:1,fibers:150},
    {name:'Periódico',desc:'Poros oscuros y fibras cortas de pulpa.',base:[229,228,219],grain:4.6,cloud:5,pores:1,fibers:3600},
    {name:'Trapo',desc:'Fibras mixtas y bordes de densidad desigual.',base:[241,239,229],grain:3.4,cloud:7,edge:1,fibers:2200,long:1},
    {name:'Escáner',desc:'Sombra lateral, bandas de lectura y polvo.',base:[242,242,240],grain:2.5,cloud:2,scan:1,dust:1,fibers:700},
    {name:'Offset',desc:'Poro fino y moteado de absorción.',base:[244,243,238],grain:3.1,cloud:3,pores:.5,fibers:1400},
    {name:'Litografía',desc:'Grano mineral, granular y algo más áspero.',base:[239,239,234],grain:5.8,cloud:3,relief:8,pores:.7,fibers:300},
    {name:'Pliegue',desc:'Una hoja doblada: sombra y cresta de luz.',base:[244,243,237],grain:2.8,cloud:3,fold:1,fibers:1400},
    {name:'Archivo cálido',desc:'Oxidación tenue, manchas y canto envejecido.',base:[239,234,220],grain:2.7,cloud:5,age:1,edge:1,fibers:1600},
    {name:'Archivo / 1972',desc:'Papel neutro, fibra corta, escaneo y poro roto.',base:[241,242,239],grain:2.4,cloud:3.6,scan:.65,relief:4,pores:.24,dust:.6,fibers:1500}
  ];
  function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
  function field(w,h,rng){const data=Float32Array.from({length:(w+1)*(h+1)},()=>rng()-.5);return(x,y)=>{x=Math.max(0,Math.min(.99999,x))*w;y=Math.max(0,Math.min(.99999,y))*h;const ix=x|0,iy=y|0;let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=iy*(w+1)+ix;return(data[a]*(1-fx)+data[a+1]*fx)*(1-fy)+(data[a+w+1]*(1-fx)+data[a+w+2]*fx)*fy;};}
  function render(canvas,id=15,seed=1972){
    const p=PRESETS[id-1]||PRESETS[14],c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,rng=random(seed+id*31);
    const large=field(9,7,rng),medium=field(70,52,rng),small=field(290,210,rng),image=c.createImageData(w,h),d=image.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const u=x/w,v=y/h,n=small(u,v),cloud=large(u,v),mid=medium(u,v);
      let tone=cloud*p.cloud+mid*2+(rng()-.5)*p.grain*2+n*p.grain;
      if(p.relief)tone+=(small(u+1/w,v)-n)*p.relief;
      if(p.laid)tone+=Math.sin(y*.91)*1.5+Math.sin(x*.032)*.7;
      if(p.linen)tone+=Math.sin(x*1.2)*Math.cos(y*.88)*2.5+Math.sin(y*.8)*1.5;
      if(p.satin)tone+=Math.cos((u+v*.13)*Math.PI)*1.4;
      if(p.scan)tone-=p.scan*(11*Math.exp(-u*23)+2.8*Math.exp(-(1-u)*40)+Math.sin(y*.025)*.38);
      if(p.edge)tone-=Math.pow(Math.abs(u-.5)*2,12)*6+Math.pow(Math.abs(v-.5)*2,18)*3;
      if(p.fold){const pos=u-.58-v*.023;tone-=5*Math.exp(-Math.abs(pos)*110);tone+=3*Math.exp(-Math.abs(pos-.009)*150);}
      if(p.pores&&n<-.30)tone-=(Math.abs(n)-.30)*p.pores*70;
      if(p.age)tone-=Math.max(0,cloud+.05)*9;
      const i=(y*w+x)*4;d[i]=p.base[0]+tone;d[i+1]=p.base[1]+tone;d[i+2]=p.base[2]+tone;d[i+3]=255;
    }
    c.putImageData(image,0,0);
    const scale=w/1120;
    c.save();c.scale(scale,h/800);
    for(let i=0;i<p.fibers;i++){
      const x=rng()*1120,y=rng()*800,len=(p.long?5:1.5)+rng()*(p.long?19:5),angle=rng()*Math.PI;
      c.strokeStyle=i%3?'rgba(100,96,84,.045)':'rgba(255,255,251,.17)';c.lineWidth=.25+rng()*.4;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(angle)*len*.6,y+Math.sin(angle)*len*.6+.6,x+Math.cos(angle)*len,y+Math.sin(angle)*len);c.stroke();
    }
    if(p.dust||p.age){for(let i=0;i<(p.age?130:75);i++){const x=rng()*1120,y=rng()*800,r=.12+rng()**5*(p.age?2.4:1.0);c.fillStyle=p.age?'rgba(98,78,47,.12)':'rgba(51,49,44,.16)';c.beginPath();c.ellipse(x,y,r,r*(.4+rng()),rng()*3,0,Math.PI*2);c.fill();}}
    c.restore();return canvas;
  }
  window.Paper={presets:PRESETS,render,random};
})();
