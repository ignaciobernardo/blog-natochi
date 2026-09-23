/* Geometry reconstructed from the supplied blue reference. The historic binary
   inscriptions follow Wm. Robert Johnston's original map transcription (2007):
   https://www.johnstonsarchive.net/astro/pulsarmap.html, table 1.
   Positions are artwork coordinates, not a modern astrometric projection. */
(() => {
 const ORIGIN={x:211,y:275},W=736,H=549;
 const DATA=[
  ['B1727-47',459,350,'1000110001111100100011011101010'],
  ['B1451-68',283,356,'10110010011000101011101101111'],
  ['B1240-64',360,517,'100000110110010110001001111000'],
  ['B0833-45',195,449,'111100011011011001010100111'],
  ['B0950+08',143,358,'10101011011001101100101000011'],
  ['B0823+26',98,312,'101100111011010101011110001011'],
  ['B0531+21',17,293,'10110011100000101010000010'],
  ['B0525+21',35,284,'100111101000110101000100111000100'],
  ['B0329+54',104,199,'111100011111100011111000010110'],
  ['B2217+47',187,105,'101101100101101001000010110001'],
  ['B2016+28',255,160,'101111001111001110011000001101'],
  ['B1933+16',394,33,'11110010111110001110100011110'],
  ['B1929+10',291,185,'10011001011010111010010111000'],
  ['B1642-03',355,238,'100000110100101010001110101100']
 ];
 function render(canvas,{mode='marks',wear=.7,seed=1972}={}){
  const c=canvas.getContext('2d'),rng=Paper.random(seed),scale=Math.min(canvas.width/W,canvas.height/H)*.93,tx=(canvas.width-W*scale)/2,ty=(canvas.height-H*scale)/2;
  c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate(tx,ty);c.scale(scale,scale);c.lineCap='round';c.lineJoin='round';
  function stroke(x1,y1,x2,y2,width=.78){
   const len=Math.hypot(x2-x1,y2-y1),nx=-(y2-y1)/len,ny=(x2-x1)/len,steps=Math.max(2,Math.ceil(len/1.4));
   let a={x:x1,y:y1};const phase=rng()*20;
   for(let i=1;i<=steps;i++){
    const t=i/steps,rough=(rng()-.5)*.26*wear+Math.sin(t*23)*.10*wear,b={x:x1+(x2-x1)*t+nx*rough,y:y1+(y2-y1)*t+ny*rough};
    const pressure=Math.sin(t*51+phase)*Math.sin(t*19+phase*.6);
    if(rng()>wear*.035 && (len<35 || pressure<1-wear*.2)){c.strokeStyle=`rgba(20,20,17,${.65+rng()*.33})`;c.lineWidth=width*(.63+rng()*.62)*(1+Math.max(0,pressure)*wear*.38);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    if(rng()<.009*wear){c.fillStyle='rgba(18,18,16,.8)';c.beginPath();c.ellipse(b.x,b.y,.35+rng()*.55,.25+rng()*.4,0,0,Math.PI*2);c.fill();}a=b;
   }
  }
  // Long galactic-center reference axis and end crossbar.
  stroke(ORIGIN.x,ORIGIN.y,718,275,.92);stroke(718,272.7,718,277.3,.75);
  DATA.forEach(([name,x,y,bits],index)=>{
   const dx=x-ORIGIN.x,dy=y-ORIGIN.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),ux=dx/length,uy=dy/length,nx=-uy,ny=ux;
   // Preserve blank lead-in and the characteristic detached terminal notation.
   const inscriptionLength=Math.min(length*.60,mode==='binary'?bits.length*3.65:bits.length*2.65),start=length-inscriptionLength;
   stroke(ORIGIN.x,ORIGIN.y,ORIGIN.x+ux*(start-4),ORIGIN.y+uy*(start-4),.83);
   const step=inscriptionLength/bits.length;
   for(let j=0;j<bits.length;j++){
    const d=start+j*step,px=ORIGIN.x+ux*d,py=ORIGIN.y+uy*d;
    if(mode==='binary'){
     c.save();c.translate(px,py);c.rotate(angle+(dx<0?Math.PI:0));c.font=`${Math.min(6.1,step*1.66)}px 'Courier New',monospace`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=`rgba(13,13,12,${.78+rng()*.2})`;c.fillText(bits[j],0,-.3);c.restore();
    }else if(bits[j]==='1')stroke(px-nx*1.75,py-ny*1.75,px+nx*1.75,py+ny*1.75,.64);
    else stroke(px-ux*step*.37,py-uy*step*.37,px+ux*step*.37,py+uy*step*.37,.63);
   }
   stroke(x-nx*1.6,y-ny*1.6,x+nx*1.6,y+ny*1.6,.65);
   // Sparse ink deposits around the geometry, never a repeated dash pattern.
   if(index%3===0){const d=length*(.3+rng()*.4),px=ORIGIN.x+ux*d,py=ORIGIN.y+uy*d;c.fillStyle='rgba(17,17,14,.65)';c.beginPath();c.ellipse(px,py,.65,.38,angle,0,Math.PI*2);c.fill();}
  });
  c.fillStyle='#151513';c.beginPath();c.arc(ORIGIN.x,ORIGIN.y,1.8,0,Math.PI*2);c.fill();
  // Offset origin registration cross; tiny pressure artifacts like a printed plate.
  stroke(ORIGIN.x-4,ORIGIN.y,ORIGIN.x+4,ORIGIN.y,.5);stroke(ORIGIN.x,ORIGIN.y-4,ORIGIN.x,ORIGIN.y+4,.5);
  c.globalCompositeOperation='destination-out';
  for(let i=0;i<3000*wear;i++){const x=rng()*W,y=rng()*H,r=.1+rng()*.4;c.fillStyle=`rgba(0,0,0,${.15+rng()*.65})`;c.beginPath();c.ellipse(x,y,r,r*.6,rng()*3,0,Math.PI*2);c.fill();}
  c.restore();return canvas;
 }
 window.PulsarMap={render,data:DATA,origin:ORIGIN,width:W,height:H};
})();
