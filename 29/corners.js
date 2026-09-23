/* Printed marginalia: seeded word streams, broken syllables, overprinting and
   dry-ink holes. Positions follow corner density fields; glyphs aren't mirrored. */
(() => {
  const WORDS=['aquí','la Tierra','una señal','seguimos','en algún','lugar','tiempo','luz','nosotros','la distancia','el mapa','recuerda','todavía','una voz','del ruido','el universo','coordenadas','lo que queda','escuchamos','otra vez','hacia','nadie','el origen'];
  const FRAGMENTS=['a-','quí','se-','ñal','tiem-','po','dis-','tan-','cia','lu-','gar','no-','so-','tros','uni-','ver-','so','ori-','gen'];
  function render(canvas,{wear=.7,seed=1972,cssWidth=innerWidth,cssHeight=innerHeight,keepouts=[]}={}){
    const c=canvas.getContext('2d'),rng=Paper.random(seed+29029),ratio=canvas.width/cssWidth;
    c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(ratio,canvas.height/cssHeight);
    const mobile=cssWidth<600;
    const corners=[{sx:1,sy:1,k:.65},{sx:-1,sy:1,k:.9},{sx:1,sy:-1,k:1},{sx:-1,sy:-1,k:.72}];
    for(const corner of corners){
      const ox=corner.sx===1?0:cssWidth,oy=corner.sy===1?0:cssHeight;
      const cw=Math.min(440,cssWidth*(mobile?.43:.29))*Math.sqrt(corner.k);
      const ch=Math.min(430,cssHeight*(mobile?.25:.42))*Math.sqrt(corner.k);
      const candidates=Math.round((mobile?420:1100)*corner.k);
      for(let i=0;i<candidates;i++){
        const u=rng()**1.65*cw,v=rng()**1.4*ch;
        const radius=Math.pow(u/cw,.85)+Math.pow(v/ch,.82);
        if(radius>1 || rng()>Math.pow(1-radius,.62))continue;
        const x=ox+corner.sx*u,y=oy+corner.sy*v;
        const font=(mobile?6.3:7.1)+rng()*2.4;
        const turn=rng(),angle=turn<.58?Math.PI/2+(rng()-.5)*.08:turn<.85?(rng()-.5)*.08:(rng()-.5)*1.1;
        const pieces=rng()<.46?FRAGMENTS:WORDS,lines=1+Math.floor(rng()*5);
        c.save();c.translate(x,y);c.rotate(angle);c.font=`${font}px 'Courier New',monospace`;c.textBaseline='top';
        const alpha=.56+rng()*.40;c.fillStyle=`rgba(18,18,16,${alpha})`;
        for(let j=0;j<lines;j++){
          const word=pieces[(rng()*pieces.length)|0],dx=(rng()-.5)*1.4,dy=j*(font+1.6);
          c.fillText(word,dx,dy);
          if(rng()<.13*wear){c.save();c.globalAlpha=.23;c.fillText(word,dx+.4,dy+.3);c.restore();}
        }
        c.restore();
      }
    }
    // Paper tooth removes tiny irregular pieces of ink from the printed letters.
    c.globalCompositeOperation='destination-out';
    for(let i=0;i<(mobile?2500:10000)*wear;i++){
      const x=rng()*cssWidth,y=rng()*cssHeight,r=.14+rng()*.65;
      c.fillStyle=`rgba(0,0,0,${.2+rng()*.65})`;c.beginPath();c.ellipse(x,y,r,r*.43,rng()*3,0,Math.PI*2);c.fill();
    }
    // Soft clearings keep the small navigation text readable above the marginalia.
    for(const r of keepouts){c.save();c.filter='blur(7px)';c.fillStyle='#000';c.fillRect(r.x-9,r.y-7,r.width+18,r.height+14);c.restore();c.clearRect(r.x-3,r.y-3,r.width+6,r.height+6);}
    c.restore();return canvas;
  }
  window.PrintedCorners={render};
})();
