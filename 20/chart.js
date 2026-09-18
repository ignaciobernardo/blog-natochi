(() => {
'use strict';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let scale=1,paused=false,time=0,last=0;
let seed=20917;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const noise=(i)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return (n-Math.floor(n))-.5;};
// All geometry uses the plate's original 1000 × 830 coordinate system.
function stroke(points,width=1,alpha=1,id=0){ctx.beginPath();for(let k=0;k<points.length;k++){const [x,y]=points[k];k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.lineWidth=width;ctx.strokeStyle=`rgba(244,246,236,${alpha})`;ctx.stroke();}
function rough(points,width=1,alpha=1,id=0){const out=[];for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let k=0;k<n;k++){const t=k/n;out.push([a[0]+(b[0]-a[0])*t+noise(k+j*89+id)*.65,a[1]+(b[1]-a[1])*t+noise(k+j*71+id+9)*.65]);}}out.push(points[points.length-1]);stroke(out,width,alpha);}
function curve(a,b,c,d,width=1,alpha=.85,id=0){const p=[];for(let i=0;i<=100;i++){const t=i/100,u=1-t;p.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}rough(p,width,alpha,id);}
const glyphs={
'0':[[[.5,0],[.15,.08],[0,.4],[.04,.8],[.3,1],[.7,.96],[.88,.65],[.85,.22],[.5,0]]],
'1':[[[.1,.18],[.48,0],[.45,1]]],
'2':[[[0,.2],[.22,.02],[.6,0],[.85,.2],[.77,.4],[.02,.97],[.9,1]]],
'3':[[[0,.08],[.73,0],[.83,.18],[.45,.43],[.8,.55],[.84,.82],[.58,1],[.08,.94]]],
'4':[[[.65,0],[0,.65],[.9,.64]],[[.62,.3],[.61,1]]],
'6':[[[.72,0],[.3,.14],[.04,.53],[.02,.8],[.3,1],[.66,.95],[.86,.7],[.63,.52],[.12,.57]]],
'8':[[[.42,.02],[.1,.1],[.02,.34],[.65,.61],[.84,.81],[.63,.99],[.21,.98],[0,.8],[.13,.58],[.75,.29],[.73,.08],[.42,.02]]],
'P':[[[0,1],[0,0],[.63,0],[.86,.19],[.75,.46],[.04,.48]]],
'N':[[[0,1],[0,0],[.83,1],[.83,0]]],
'D':[[[0,1],[0,0],[.52,.02],[.85,.3],[.83,.75],[.55,.98],[0,1]]],
'R':[[[0,1],[0,0],[.63,0],[.84,.21],[.67,.48],[0,.48]],[[.4,.49],[.9,1]]],
'A':[[[0,1],[.4,0],[.9,1]],[[.17,.65],[.71,.65]]]
};
function text(str,x,y,size=19,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);let offset=0;for(const ch of str){if(glyphs[ch])for(const path of glyphs[ch])rough(path.map(([a,b])=>[offset+a*size*.59,b*size]),1.8,.94,offset+size);offset+=size*.76;}ctx.restore();}
const arrows=[
[174,242,60,115],[194,291,77,204],[192,323,109,265],[190,345,84,299],
[261,276,215,199],[279,259,255,156],[304,186,286,60],[319,217,312,100],
[362,303,374,230],[336,346,341,288],[327,336,305,289],[344,333,350,300],[368,336,378,298],[365,370,385,334],
[457,295,545,219],[554,260,697,183],[622,324,701,301],[689,388,925,381],
[270,420,176,439],[214,436,145,449],[188,444,79,467],[151,478,69,514],
[251,484,168,550],[298,455,260,501],[298,487,272,536],[321,449,319,490],[329,460,326,503],
[344,498,350,541],[314,524,309,578],[304,544,297,606],[319,562,304,630],[302,608,301,657],[149,592,61,683],
[388,394,427,393],[402,403,438,402],[382,416,421,413],[393,433,364,421],[374,444,350,430],[361,452,350,433],
[430,398,491,395],[459,366,475,350],[420,335,442,318],
[506,365,546,360],[513,373,550,371],[508,382,548,378],[539,363,579,350],[542,376,616,363],[550,382,626,372],
[519,400,560,400],[531,415,598,414],[446,436,485,444],
[442,449,473,466],[438,455,482,478],[437,466,477,487],[434,473,480,496],
[473,470,548,504],[503,491,567,529],[531,520,604,557],[530,532,614,590],[574,539,675,548],
[428,495,457,526],[446,513,512,549],[483,539,541,577],[452,560,498,609],[429,558,455,600],
[515,589,570,628],[512,601,576,650],[579,591,671,670],[602,572,656,603],
[672,490,909,542],[429,197,446,173]
].map((v,i)=>({v,phase:random()*Math.PI*2,speed:.3+random()*.35,id:i}));
const plate=document.createElement('canvas');plate.width=1000;plate.height=830;const pc=plate.getContext('2d');pc.fillStyle='#000';pc.fillRect(0,0,1000,830);
for(let i=0;i<21000;i++){const x=random()*1000,y=random()*830;pc.fillStyle=`rgba(220,222,209,${random()*.055})`;pc.fillRect(x,y,random()<.98?1:2,1);}
function grid(){
 rough([[46,786],[46,51],[263,49],[497,51],[734,50],[943,52],[946,788],[730,788],[497,789],[263,787],[46,786]],1.25,.97);
 const origin=[497,287];
 for(const [i,p] of [[174,51],[345,50],[438,50],[499,50],[566,50],[661,50],[830,51],[944,184],[945,401],[945,633],[826,788],[637,789],[496,789],[350,788],[174,788],[47,633],[46,385],[46,187]].entries())rough([p,origin],i%3===0?1.05:.85,.79,i*101);
 curve([263,50],[278,271],[312,413],[497,422],1.15);
 curve([734,51],[731,259],[670,414],[497,422],1.15);
 curve([46,483],[274,603],[670,600],[945,493],1.2);
 curve([126,786],[337,694],[652,696],[878,788],1.2);
 rough([[46,632],[300,633],[600,634],[945,633]],1.1,.9);
 const ellipse=[];for(let i=0;i<=150;i++){const a=i/150*Math.PI*2;ellipse.push([497+81*Math.cos(a),257+110*Math.sin(a)]);}rough(ellipse,1.1,.9);
 for(const [label,x] of [['120',162],['140',332],['160',421],['180',482],['200',543],['220',642],['240',811]])text(label,x,26,19);
 for(const [label,x,y] of [['100',10,177],['80',16,376],['60',16,623],['260',951,177],['280',951,394],['300',951,626],['40',164,796],['20',338,796],['340',612,796],['320',800,796]])text(label,x,y,19);
 for(const [label,y] of [['20',347],['40',402],['60',495],['80',573],['100',728]])text(label,label==='100'?477:484,y,18);
 text('R 360 A',427,796,20);text('NPD',474,708,18,-Math.PI/2);
 const ring=[];for(let i=0;i<=36;i++){const a=i/36*Math.PI*2;ring.push([329+8*Math.cos(a),400+8*Math.sin(a)]);}rough(ring,3,.95);
}
function arrow(a,t){let [x,y,ex,ey]=a.v;const dx=ex-x,dy=ey-y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 const drift=(Math.sin(t*a.speed+a.phase)-Math.sin(a.phase))*5;
 x+=ux*drift;y+=uy*drift;ex+=ux*drift;ey+=uy*drift;
 rough([[x,y],[x+dx*.48+noise(a.id)*.9,y+dy*.48],[ex,ey]],2.65,.97,a.id*71);
 const head=Math.min(12,len*.31),wing=head*.32;
 ctx.fillStyle='#f4f6ec';ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*head-uy*wing,ey-uy*head+ux*wing);ctx.lineTo(ex-ux*head*.66,ey-uy*head*.66);ctx.lineTo(ex-ux*head+uy*wing,ey-uy*head-ux*wing);ctx.closePath();ctx.fill();
}
function draw(){ctx.setTransform(scale,0,0,scale,0,0);ctx.drawImage(plate,0,0);ctx.lineCap='round';ctx.lineJoin='round';grid();for(const a of arrows)arrow(a,time);}
function resize(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);scale=canvas.width/1000;draw();}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!paused&&!reduced.matches&&document.visibilityState==='visible'){time+=dt;draw();}requestAnimationFrame(tick);}
function toggle(){paused=!paused;draw();}
canvas.addEventListener('click',toggle);canvas.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();toggle();}});reduced.addEventListener('change',draw);new ResizeObserver(resize).observe(canvas);resize();requestAnimationFrame(tick);
})();
