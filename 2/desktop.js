'use strict';
const $ = id => document.getElementById(id);
const canvas = $('output'), ctx = canvas.getContext('2d');
const source = document.createElement('canvas');
let sourceName = 'spheres', topLayer = 25;
function spheres() {
  source.width = 640; source.height = 336;
  const c = source.getContext('2d'), data = c.createImageData(640,336);
  const balls = [[465,255,77],[397,127,115],[211,164,158],[239,177,76],[583,281,7]];
  for (let y=0;y<336;y++) for (let x=0;x<640;x++) {
    let v=255;
    for(const [cx,cy,r] of balls){
      const nx=(x-cx)/r, ny=(y-cy)/r, d=nx*nx+ny*ny;
      if(d>1) continue;
      const nz=Math.sqrt(1-d);
      const light=Math.max(0, .48-nx*.52+ny*.55-nz*.48);
      v=Math.min(255, 12+light*285);
      if(r===76 && Math.hypot(nx-.32,ny+.43)<.095) v=245;
    }
    const i=(y*640+x)*4; data.data[i]=data.data[i+1]=data.data[i+2]=v; data.data[i+3]=255;
  }
  c.putImageData(data,0,0); sourceName='spheres'; render();
}
function render(){
  const pixel=+$('pixel').value, w=Math.max(1,Math.round(source.width/pixel)),h=Math.max(1,Math.round(source.height/pixel));
  const small=document.createElement('canvas');small.width=w;small.height=h;
  const c=small.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,w,h);c.drawImage(source,0,0,w,h);
  const image=c.getImageData(0,0,w,h), values=new Float32Array(w*h);
  const brightness=+$('brightness').value*2.55,contrast=+$('contrast').value/100;
  for(let i=0;i<values.length;i++)values[i]=Math.max(0,Math.min(255,((image.data[i*4]*.299+image.data[i*4+1]*.587+image.data[i*4+2]*.114)-128)*contrast+128+brightness));
  const method=$('algorithm').value, bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  let seed=123456789;
  function spread(x,y,error,weight){if(x>=0&&x<w&&y>=0&&y<h)values[y*w+x]+=error*weight;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,old=values[i];let threshold=128;
    if(method==='noise'){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;threshold=((seed>>>0)/4294967296)*255;}
    if(method==='bayer')threshold=(bayer[(y%4)*4+x%4]+.5)*16;
    const value=old>=threshold?255:0,error=old-value;
    if(method==='floyd'){spread(x+1,y,error,7/16);spread(x-1,y+1,error,3/16);spread(x,y+1,error,5/16);spread(x+1,y+1,error,1/16);}
    if(method==='atkinson'){for(const [dx,dy] of [[1,0],[2,0],[-1,1],[0,1],[1,1],[0,2]])spread(x+dx,y+dy,error,1/8);}
    const final=$('invert').checked?255-value:value;
    image.data[i*4]=image.data[i*4+1]=image.data[i*4+2]=final===255?221:0;image.data[i*4+3]=255;
  }
  c.putImageData(image,0,0);canvas.width=source.width;canvas.height=source.height;ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,canvas.width,canvas.height);
  for(const id of ['brightness','contrast','pixel'])$(id+'-value').value=$(id).value;
  $('status').textContent=`${canvas.width} × ${canvas.height} · procesamiento local`;
}
function openEditor(){ $('editor').hidden=false;$('editor').style.zIndex=++topLayer;if(innerWidth<=650)$('editor').scrollIntoView({behavior:'smooth',block:'center'}); }
$('edit').onclick=$('icon').onclick=$('more').onclick=openEditor;
$('close').onclick=()=>{$('editor').hidden=true;$('edit').focus();};
$('demo').onclick=()=>{reset();};
function reset(){ loadVersion++;HTMLFormElement.prototype.reset.call($('controls'));spheres(); }
$('reset').onclick=reset;
$('controls').onsubmit=e=>e.preventDefault();
for(const id of ['brightness','contrast','pixel','algorithm','invert'])$(id).addEventListener('input',render);
let loadVersion=0;
async function load(file){
  if(!file)return;
  if(!file.type.startsWith('image/')){$('status').textContent='Selecciona un archivo de imagen.';return;}
  const version=++loadVersion;
  try{
    const bitmap=await createImageBitmap(file);
    if(version!==loadVersion){bitmap.close();return;}
    const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));source.width=Math.max(1,Math.round(bitmap.width*scale));source.height=Math.max(1,Math.round(bitmap.height*scale));
    const c=source.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,source.width,source.height);c.drawImage(bitmap,0,0,source.width,source.height);bitmap.close();sourceName=file.name.replace(/\.[^.]+$/,'');render();
  }catch{$('status').textContent='No se pudo abrir la imagen. Prueba con PNG, JPG o WebP.';}
}
$('upload').onchange=e=>load(e.target.files[0]);
const graphics=document.querySelector('.graphics');
graphics.ondragover=e=>{e.preventDefault();graphics.classList.add('dragging');};
graphics.ondragleave=()=>graphics.classList.remove('dragging');
graphics.ondrop=e=>{e.preventDefault();graphics.classList.remove('dragging');openEditor();load(e.dataTransfer.files[0]);};
$('download').onclick=()=>canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=sourceName+'-dither.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
for(const win of document.querySelectorAll('.window')){
  win.addEventListener('pointerdown',()=>{win.style.zIndex=++topLayer;});
  const bar=win.querySelector('header');
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||innerWidth<=650)return;
    const scale=$('desktop').getBoundingClientRect().width/1152, x=e.clientX,y=e.clientY,left=win.offsetLeft,top=win.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move=ev=>{win.style.left=Math.max(0,Math.min(1152-win.offsetWidth,left+(ev.clientX-x)/scale))+'px';win.style.top=Math.max(0,Math.min(900-30,top+(ev.clientY-y)/scale))+'px';};
    const end=()=>{bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',end);bar.removeEventListener('pointercancel',end);};
    bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
  });
}
function resize(){const scale=innerWidth>650?Math.min(innerWidth/1152,innerHeight/900):1;$('desktop').style.transform=`scale(${scale})`;document.body.style.height=innerWidth>650?`${900*scale}px`:'auto';}
addEventListener('resize',resize);resize();spheres();
