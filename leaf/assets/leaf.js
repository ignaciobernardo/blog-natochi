const IMG={math:"/leaf/assets/math.webp",bio:"/leaf/assets/bio.webp",policy:"/leaf/assets/policy.webp",ai:"/leaf/assets/ai.webp"};
const ICON={
  math:'<path d="M4 4h16v16H4z"/><path d="M8 12h8"/><path d="M12 8h.01"/><path d="M12 16h.01"/>',
  bio:'<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>',
  policy:'<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>',
  ai:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>'
};
const COURSES=[
 {id:"math",tab:"Mathematics",title:"The Mathematics of Morality",tag:"Use maths to make the future better",
  desc:"How can you use mathematics and quantitative careers to best help others and multiply your positive impact?",
  url:"https://leaf.courses/the-mathematics-of-morality",
  weeks:["Mathematical methods & moral mindsets","The mathematics of what matters most","Quality & quantity: the mathematics of helping others","Algorithms for altruists & how to help save the world","Deciding your own future & planning next steps"],
  hours:[["Self-paced course exploration",1,2],["Group discussion call & tutorial break-outs",1,1],["Problem sheets & home labs",1,1.5]],
  optional:["Talks & Q&As with experts","Peer-led sessions","Community conversations","Olympiad practice, chess & games"],
  speakers:[["Spencer Greenberg","Mathematician and entrepreneur"],["Sanjay Joshi","Finance, ESG and charity founder"],["Noah Siegel","Google DeepMind"],["Vicky Cox","Charity Entrepreneurship"],["Jonah Boucher","Course designer, Harvard GSE"],["Alexander Barry","A/B Statistical Consulting"]]},
 {id:"bio",tab:"Biology",title:"Biology for a Better Tomorrow",tag:"Use biology & medicine to make a difference",
  desc:"How can you use biology to best help others and improve the future, from morally-motivated medicine to revolutionary research?",
  url:"https://leaf.courses/biology-for-a-better-tomorrow",
  weeks:["Bio, med & effective altruism","Moral med & bio beyond the lab","Bio & med that matters for millennia","How can you use biology to help others?","Deciding your own future & planning next steps"],
  hours:[["Self-paced course exploration",1,2],["Group discussion call & tutorial break-outs",1,1],["A project, passion or practical",0.5,1.5]],
  optional:["Talks & Q&As","Peer-led sessions","Community conversations"],
  speakers:[["Sofya Lebedeva","Oxford Biosecurity Group"],["Clare Harris","High-Impact Medicine"],["Kaleem Ahmid","Effective Ventures"],["Frederik Lau","Università di Trento"],["Dhruval Soni","University of Cambridge"],["Beth Gambotto-Burke","University of Oxford, course designer"]]},
 {id:"policy",tab:"Social sciences",title:"Power, Policy and Progress",tag:"Forecast and shape the future based on lessons from the past",
  desc:"How can you use the lessons of history, politics, economics and law to make a positive impact and steer humanity onto a better path?",
  url:"https://leaf.courses/power-policy-progress",
  weeks:["How to read the world","Can we change the future?","Learning from the past for a better tomorrow","How can you use your talents to help others?","Deciding your own future & planning next steps"],
  hours:[["Self-paced course exploration",1,2],["Group discussion call & tutorial break-outs",1,1],["Weekly position papers",1,2]],
  optional:["Networking & Q&As with professionals","Peer-led sessions","Community conversations"],
  speakers:[["Rutger Bregman","Bestselling author & historian"],["Lara Thurnherr","Rhyme, history research"],["Waqar Zaidi","LUMS & Centre for Governance of AI"],["Joe Mansour","Foreign Office, UK civil service"],["Matthew Chalmers","Humane League UK"],["Natasha Misra","KCL PPE, course designer"]]},
 {id:"ai",tab:"Artificial intelligence",title:"Dilemmas and Dangers in AI",tag:"Help tackle the biggest risks and opportunities posed by AI",
  desc:"An interdisciplinary fellowship on how to steer cutting-edge AI technology toward benefits for humanity.",
  url:"https://leaf.courses/dilemmas-and-dangers-in-ai",
  weeks:["Promise & perils of AI today","Foundations and collapse","Misalignment","Misuse and unintended consequences","Your role in it all: reflection and prioritisation"],
  hours:[["Self-paced course exploration",1,2],["Group discussion call & tutorial break-outs",1,1],["Exploration sheet",1.5,3]],
  optional:["Talks with AI safety & alignment professionals","Peer-led sessions","Community conversations","Competitions & simulations"],
  speakers:[["Adam Jones","Anthropic"],["Katja Grace","AI Impacts"],["David Kruger","University of Cambridge"],["Buck Shlegeris","Redwood Research"],["Emma Lawsen","Centre for Long-Term Resilience"],["Connor Axiotes","Conjecture"]]}
];
const MAXH=3;
const svg=(p,s=14,w=1.2)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const fmt=n=>(Math.round(n*10)/10).toString();
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;");

const LEAF_ITERATIONS=[["1","Ledger"],["2","Leaderboard"],["3","Forest"],["4","Report"]];
function leafSwitcher(current){
  const nav=document.createElement("nav");
  nav.className="switcher";nav.setAttribute("aria-label","Iterations");
  nav.innerHTML='<span class="switcher-l">Iteración</span>'+LEAF_ITERATIONS.map(([n,name])=>`<a href="/leaf/${n}/" title="${name}"${n===current?' aria-current="page"':''}>0${n}<span>${name}</span></a>`).join("");
  document.body.appendChild(nav);
}
function leafCopy(btnId,textId){
  const b=document.getElementById(btnId);if(!b)return;
  b.addEventListener("click",()=>{navigator.clipboard.writeText(document.getElementById(textId).textContent.trim()).then(()=>{b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1500);}).catch(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById(textId));const s=getSelection();s.removeAllRanges();s.addRange(r);});});
}
function leafAnnounce(items){
  const d=document.getElementById("ann-d"),t=document.getElementById("ann-t");if(!d)return;
  let a=0;const show=()=>{d.textContent=items[a][0];t.textContent=items[a][1];};
  document.getElementById("ann-prev").onclick=()=>{a=(a+items.length-1)%items.length;show();};
  document.getElementById("ann-next").onclick=()=>{a=(a+1)%items.length;show();};show();
}
