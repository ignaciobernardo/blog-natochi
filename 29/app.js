(() => {
 const params=new URLSearchParams(location.search),mode=document.body.dataset.mode||'marks';
 let paperId=Math.max(1,Math.min(15,Math.round(Number(params.get('paper')))||15)),wear=.7,drawTimer;
 const paper=document.querySelector('#paper'),drawing=document.querySelector('#drawing');
 const select=document.querySelector('#stock');
 Paper.presets.forEach((p,i)=>{const o=document.createElement('option');o.value=i+1;o.textContent=`${String(i+1).padStart(2,'0')} / ${p.name}`;select.append(o);});
 function links(){document.querySelectorAll('[data-version]').forEach(a=>{a.href=(a.dataset.version==='binary'?'/29/binario/':'/29/')+'?paper='+paperId;});document.querySelector('#compare').href='/29/papeles/?mode='+mode;}
 function render(){
  const dpr=Math.min(devicePixelRatio||1,1.6),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
  paper.width=drawing.width=w;paper.height=drawing.height=h;
  Paper.render(paper,paperId);PulsarMap.render(drawing,{mode,wear});
  document.querySelector('#paper-name').textContent=String(paperId).padStart(2,'0');document.querySelector('#paper-description').textContent=Paper.presets[paperId-1].desc;select.value=paperId;links();window.pulsarReady=true;
 }
 select.onchange=()=>{paperId=Number(select.value);const q=new URLSearchParams(location.search);q.set('paper',paperId);history.replaceState(null,'','?'+q);render();};
 document.querySelector('#wear').oninput=e=>{wear=Number(e.target.value);PulsarMap.render(drawing,{mode,wear});};
 const settings=document.querySelector('#settings'),help=document.querySelector('#explanation');
 function toggle(panel,button){panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)panel.querySelector('button,select').focus();}
 document.querySelector('#papers').onclick=e=>toggle(settings,e.currentTarget);document.querySelector('#about').onclick=e=>toggle(help,e.currentTarget);
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{const target=document.getElementById(b.dataset.close);target.hidden=true;const trigger=document.getElementById(b.dataset.close==='settings'?'papers':'about');trigger.setAttribute('aria-expanded','false');trigger.focus();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){settings.hidden=help.hidden=true;document.querySelector('#papers').setAttribute('aria-expanded','false');document.querySelector('#about').setAttribute('aria-expanded','false');}});
 document.querySelector('#export').onclick=()=>{const out=document.createElement('canvas');out.width=paper.width;out.height=paper.height;const c=out.getContext('2d');c.drawImage(paper,0,0);c.globalCompositeOperation='multiply';c.drawImage(drawing,0,0);out.toBlob(blob=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`pulsar-${mode}-paper-${paperId}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
 window.addEventListener('resize',()=>{clearTimeout(drawTimer);drawTimer=setTimeout(render,120);});
 window.pulsar={render,setPaper(id){select.value=id;select.dispatchEvent(new Event('change'));},get paper(){return paperId;},mode};
 render();
})();
