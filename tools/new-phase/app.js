const $ = (id) => document.getElementById(id);
const preview = $('preview');
const fields = ['text','format','layout','scale','tracking','condense','pitch','weight','threshold','grain','paper','ink'];
const formats = {square:[1200,1200],landscape:[1600,900],portrait:[1080,1350]};
let customFont = null;
let fontUrl = null;
let queued = false;

function settings(){
  return Object.fromEntries(fields.map(id=>[id,$(id).value]));
}
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function escapeXml(s){return s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function name(){return ($('text').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30)||'phase-lines');}

function paper(ctx,w,h,color,grain){
  const base=rgb(color), image=ctx.createImageData(w,h), d=image.data;
  let seed=142857;
  for(let i=0;i<d.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=(((seed>>>16)&255)-128)/128*grain*.55;
    d[i]=clamp(base[0]+n,0,255);d[i+1]=clamp(base[1]+n,0,255);d[i+2]=clamp(base[2]+n,0,255);d[i+3]=255;
  }
  ctx.putImageData(image,0,0);
}
function editorial(ctx,w,h,ink){
  const sx=w/1200, sy=h/1200, k=Math.min(sx,sy);
  ctx.save();ctx.fillStyle=ink;ctx.textBaseline='top';ctx.font=`700 ${29*k}px Arial, sans-serif`;
  const blocks=[['NEW PHASE IS','A DECORATIVE','DISPLAY','TYPEFACE.'],['INSPIRED BY MEDIE-','VAL LETTERING AND','ARCHITECTURAL','RHYTHM.'],['AN EXPERIMENTAL','FONT WITH A','TRANSITION','EFFECT.']];
  [64,420,842].forEach((x,i)=>blocks[i].forEach((line,j)=>ctx.fillText(line,x*sx,(65+j*29)*sy)));
  ctx.font=`700 ${27*k}px Arial, sans-serif`;ctx.fillText('BY SOFTULKA',64*sx,528*sy);
  ctx.font=`700 ${25*k}px Arial, sans-serif`;
  const footer=['A','SIMPLE','SHAPE','WITH','A','HALFTONE','TEXTURE.'];
  const xs=[64,155,336,508,663,752,982];
  footer.forEach((word,i)=>ctx.fillText(word,xs[i]*sx,1111*sy));
  ctx.restore();
}
function measureLine(ctx,line,size,tracking,condense){
  ctx.font=`800 ${size}px "Bodoni Moda Local", Georgia, serif`;
  const chars=Array.from(line);
  return (chars.reduce((a,ch)=>a+ctx.measureText(ch).width,0)+Math.max(0,chars.length-1)*size*tracking/100)*condense;
}
function textMask(w,h,s){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const lines=(s.text.toUpperCase().split('\n').slice(0,4).map(x=>x.trim()).filter(Boolean));
  if(!lines.length)return {canvas,mask:ctx.getImageData(0,0,w,h),lines};
  const poster=s.layout==='poster';
  const region=poster?{x:.055*w,y:.4975*h,w:.89*w,h:.415*h}:{x:.055*w,y:.12*h,w:.89*w,h:.76*h};
  const condense=Number(s.condense)/100, tracking=Number(s.tracking);
  const scale=Number(s.scale)/100;
  let size=Math.min(h*.76/lines.length,w*1.2);
  while(size>20){
    const lineH=size*.77;
    if(lines.every(line=>measureLine(ctx,line,size,tracking,condense)<=region.w*scale)&&lines.length*lineH<=region.h*scale)break;
    size-=2;
  }
  const lineH=size*.77, blockH=lines.length*lineH;
  const startY=region.y+(region.h-blockH)/2;
  ctx.fillStyle='#000';ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.lineWidth=size*.045;
  ctx.textBaseline='alphabetic';ctx.font=`800 ${size}px "Bodoni Moda Local", Georgia, serif`;
  lines.forEach((line,i)=>{
    const width=measureLine(ctx,line,size,tracking,condense);
    const x=region.x+(region.w-width)/2;
    const baseline=startY+i*lineH+size*.74;
    ctx.save();ctx.translate(x,0);ctx.scale(condense,1);
    let cursor=0;
    for(const ch of Array.from(line)){ctx.strokeText(ch,cursor,baseline);ctx.fillText(ch,cursor,baseline);cursor+=ctx.measureText(ch).width+size*tracking/100;}
    ctx.restore();
  });
  return {canvas,mask:ctx.getImageData(0,0,w,h),lines};
}
function barsFromMask(mask,w,h,s,ratio){
  const data=mask.data, pitch=Number(s.pitch)*ratio, bar=Math.max(1,pitch*Number(s.weight)/100);
  const threshold=Number(s.threshold)/100*255;
  const rects=[];
  for(let x=pitch*.28;x<w;x+=pitch){
    const sampleX=Math.floor(x+bar*.5), x0=Math.round(x), x1=Math.min(w,Math.round(x+bar));
    if(x1<=x0||sampleX>=w)continue;
    let start=-1;
    for(let y=0;y<=h;y++){
      let active=false;
      if(y<h){
        for(let dx=-2;dx<=2;dx++){
          const xx=sampleX+Math.round(dx*ratio);
          if(xx>=0&&xx<w&&data[(y*w+xx)*4+3]>=threshold){active=true;break;}
        }
      }
      if(active&&start<0)start=y;
      if(!active&&start>=0){
        if(y-start>=Math.max(1,ratio*.8))rects.push([x0,start,x1-x0,y-start]);
        start=-1;
      }
    }
  }
  return rects;
}
function fitPreview(){
  const wrap=document.querySelector('.preview-wrap');
  const w=preview.width,h=preview.height;
  const width=Math.max(1,wrap.clientWidth-48),height=Math.max(1,wrap.clientHeight-48);
  const factor=Math.min(width/w,height/h);
  preview.style.width=`${Math.floor(w*factor)}px`;
  preview.style.height=`${Math.floor(h*factor)}px`;
}
function render(w,h,s,canvas,vector=false){
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  const ratio=w/formats[s.format][0];
  paper(ctx,w,h,s.paper,Number(s.grain));
  if(s.layout==='poster')editorial(ctx,w,h,s.ink);
  const {canvas:maskCanvas,mask,lines}=textMask(w,h,s);
  if(customFont){
    // The supplied font may already contain its own stripe pattern.
    const source=maskCanvas.getContext('2d');source.clearRect(0,0,w,h);
    const region=s.layout==='poster'?{y:.475*h,h:.43*h}:{y:.12*h,h:.76*h};
    let size=Math.min(region.h/Math.max(lines.length,1)*.91,w*.7);
    source.fillStyle=s.ink;source.font=`${size}px "Phase Custom"`;source.textAlign='center';source.textBaseline='middle';
    while(lines.some(line=>source.measureText(line).width>w*.89)&&size>20){size-=2;source.font=`${size}px "Phase Custom"`;}
    lines.forEach((line,i)=>source.fillText(line,w/2,region.y+region.h/2+(i-(lines.length-1)/2)*size*.96));
    ctx.drawImage(maskCanvas,0,0);
    return {rects:[],direct:true};
  }
  const rects=barsFromMask(mask,w,h,s,ratio);
  ctx.fillStyle=s.ink;
  for(const [x,y,bh,rh] of rects)ctx.fillRect(x,y,bh,rh);
  return {rects,direct:false};
}
function refresh(){
  queued=false;const s=settings(),[w,h]=formats[s.format];
  $('dimensionLabel').textContent=`${w} × ${h} PX`;
  const outputs={scale:v=>`${v}%`,tracking:v=>`${v>0?'+':''}${v}%`,condense:v=>`${v}%`,pitch:v=>`${v} px`,weight:v=>`${v}%`,threshold:v=>`${v}%`,grain:v=>`${v}%`};
  for(const [key,format] of Object.entries(outputs))$(key+'Val').textContent=format(Number(s[key]));
  render(w,h,s,preview);
  fitPreview();
  $('svg').disabled=!!customFont;
  $('svg').title=customFont?'La fuente cargada se exporta como PNG':'Exportar líneas vectoriales';
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(refresh);}}
fields.forEach(id=>$(id).addEventListener('input',schedule));
$('png').addEventListener('click',()=>{
  const s=settings(),[fw,fh]=formats[s.format],out=document.createElement('canvas');
  render(fw*2,fh*2,s,out);
  out.toBlob(blob=>{if(blob)download(blob,`${name()}.png`);},'image/png');
  $('status').textContent=`PNG exportado · ${fw*2} × ${fh*2} px`;
});
$('svg').addEventListener('click',()=>{
  if(customFont)return;
  const s=settings(),[w,h]=formats[s.format],canvas=document.createElement('canvas');
  const {rects}=render(w,h,s,canvas,true);
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>${escapeXml(s.text)}</title><rect width="100%" height="100%" fill="${s.paper}"/>`;
  if(s.layout==='poster'){
    const blocks=[['NEW PHASE IS','A DECORATIVE','DISPLAY','TYPEFACE.'],['INSPIRED BY MEDIE-','VAL LETTERING AND','ARCHITECTURAL','RHYTHM.'],['AN EXPERIMENTAL','FONT WITH A','TRANSITION','EFFECT.']];
    const sx=w/1200,sy=h/1200,k=Math.min(sx,sy);
    svg+=`<g fill="${s.ink}" font-family="Arial,sans-serif" font-weight="700">`;
    [64,420,842].forEach((x,i)=>blocks[i].forEach((line,j)=>svg+=`<text x="${x*sx}" y="${(89+j*29)*sy}" font-size="${29*k}">${escapeXml(line)}</text>`));
    svg+=`<text x="${64*sx}" y="${550*sy}" font-size="${27*k}">BY SOFTULKA</text>`;
    ['A','SIMPLE','SHAPE','WITH','A','HALFTONE','TEXTURE.'].forEach((word,i)=>svg+=`<text x="${[64,155,336,508,663,752,982][i]*sx}" y="${1133*sy}" font-size="${25*k}">${word}</text>`);
    svg+='</g>';
  }
  svg+=`<g fill="${s.ink}">`+rects.map(([x,y,bw,bh])=>`<rect x="${x}" y="${y}" width="${bw}" height="${bh}"/>`).join('')+'</g></svg>';
  download(new Blob([svg],{type:'image/svg+xml'}),`${name()}.svg`);
  $('status').textContent=`SVG exportado · ${w} × ${h} px`;
});
$('fontFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(customFont)document.fonts.delete(customFont);
    if(fontUrl)URL.revokeObjectURL(fontUrl);
    fontUrl=URL.createObjectURL(file);
    const face=new FontFace('Phase Custom',`url("${fontUrl}")`);
    await face.load();document.fonts.add(face);customFont=face;
    $('fontName').textContent=file.name;$('removeFont').hidden=false;
    $('svg').disabled=true;
    $('status').textContent='Fuente local cargada · exporta en PNG';schedule();
  }catch(error){$('status').textContent='No pude abrir la fuente. Usa OTF, TTF o WOFF.';}
});
$('removeFont').addEventListener('click',()=>{
  if(customFont)document.fonts.delete(customFont);
  customFont=null;if(fontUrl)URL.revokeObjectURL(fontUrl);fontUrl=null;
  $('fontFile').value='';$('fontName').textContent='Cargar tu fuente (OTF / TTF / WOFF)';$('removeFont').hidden=true;
  $('svg').disabled=false;
  $('status').textContent='Fuente original restablecida';schedule();
});
document.fonts.ready.then(schedule);
new ResizeObserver(fitPreview).observe(document.querySelector('.preview-wrap'));
refresh();
