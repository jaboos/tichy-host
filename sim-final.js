// Tichý host — finální ověření v4 (po škrtech: bez FORMY, HLAVA jako štítek, ČAS zrušen)
// node sim-final.js [seasons]
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const clamp=(x,a,b)=>x<a?a:x>b?b:x;

const COOKS=[ // ruka, domovský post, koef. únavy (štítek: vydrží 0.20 / normál 0.27 / rychle hoří 0.34)
 {n:'Ilona',r:3,h:2,f:0.30},{n:'Marek',r:4,h:1,f:0.50},{n:'Dita',r:2,h:3,f:0.30},
 {n:'Petr', r:3,h:0,f:0.40},{n:'Jana', r:2,h:2,f:0.30},{n:'Ela',r:2,h:1,f:0.30}];
// katalog 18 chodů: post, náročnost, fáze sezónnosti, souhra
const CAT=[];{let i=0;for(const p of [0,1,2,3])for(const N of [1,2,3,4,5]){if(CAT.length>=18)break;
  CAT.push({p,N,ph:(i*3)%8,s:[0.6,-0.4,1.0,-0.8,0.2][i%5]});i++;}}
while(CAT.length<18)CAT.push({p:CAT.length%4,N:3,ph:CAT.length%8,s:0.2});
const BASE=+(process.env.BASE||9.5); const TOP=+(process.env.TOP||7.5); const AMP=0.8, E=40, WK=8, VIS=3, W=[0.7,1.3];
const LR=[2.4,3.1,1.9,2.8], PB=0.18;

const sur=(c,w)=>AMP*Math.sin(2*Math.PI*(w+c.ph)/8);
const latka=(menu,wk,rep,se)=>{const aN=menu.reduce((s,c)=>s+c.N,0)/menu.length;
  return 12.0+clamp(1.4*(3.33-aN),-1,2.5)+0.20*wk+0.03*(rep-15)+0.4*(se-1);};

function evalMenu(menu,cooks,wk,rep,se,plan){ // deterministický odhad kvality menu
  const L=latka(menu,wk,rep,se); let below=0,top=0;
  for(const c of menu)for(const w of W){
    const q=plateQ(c,menu,cooks,plan,wk,w,0,false,3.0);
    if(q<L)below++; if(q>=L+TOP)top++;
  }
  return -below*10+top*0.5;
}
function postAgg(menu){const L=[0,0,0,0],H=[0,0,0,0];
  for(const c of menu){L[c.p]+=c.N; if(c.N>=4)H[c.p]++;} return {L,H};}

function plateQ(c,menu,cooks,plan,wk,w,pushPost,prem,wearOverride){
  const {L,H}=postAgg(menu);
  const lead=cooks[plan.lead[c.p]], help=plan.help[c.p]>=0?cooks[plan.help[c.p]]:null;
  const rl=lead.r+(lead.h===c.p?1:-1), rh=help?help.r+(help.h===c.p?1:-1):0;
  const cap=2.0*(rl+0.4*rh);
  const over=Math.max(0,L[c.p]/cap-1);
  const crowd=1.5*Math.max(0,H[c.p]-(help?2:1));
  const wear=wearOverride!==undefined?wearOverride:lead.w;
  return BASE+1.6*rl+0.6*rh+0.9*c.N-2.2*Math.max(0,c.N-rl)
    +sur(c,wk)+c.s-5*over*over-crowd-wear*lead.f*w
    +(pushPost===c.p?2.5:0)+(prem?0.8:0);
}
function makePlan(cooks,restIdx){ // vedoucí na domovský post dle RUKY, zbytek pomocník na nejvytíženější
  const lead=[-1,-1,-1,-1], help=[-1,-1,-1,-1];
  const av=cooks.map((c,i)=>i).filter(i=>i!==restIdx).sort((a,b)=>cooks[b].r-cooks[a].r);
  for(const i of av){const h=cooks[i].h; if(lead[h]<0){lead[h]=i;}}
  for(const i of av){if(lead.includes(i))continue; const e=lead.findIndex(x=>x<0); if(e>=0)lead[e]=i;}
  for(const i of av){if(lead.includes(i)||Object.values(help).includes(i))continue; if(help[2]<0)help[2]=i; else if(help[1]<0)help[1]=i;}
  for(let p=0;p<4;p++)if(lead[p]<0)lead[p]=av[0]; // nouzové krytí
  return {lead,help};
}
function pickMenu(rnd,cooks,wk,rep,se,plan,tries){
  let best=null,bs=-1e9;
  for(let t=0;t<tries;t++){
    const idx=new Set(); const byPost=[[],[],[],[]];
    CAT.forEach((c,i)=>byPost[c.p].push(i));
    for(let p=0;p<4;p++)idx.add(byPost[p][Math.floor(rnd()*byPost[p].length)]);
    while(idx.size<6)idx.add(Math.floor(rnd()*CAT.length));
    const m=[...idx].map(i=>CAT[i]); const s=evalMenu(m,cooks,wk,rep,se,plan);
    if(s>bs){bs=s;best=m;}
  }
  return best;
}

function season(seed,pol,cooks0,se){
  const rnd=mul(seed); const cooks=cooks0.map(c=>({...c,w:0,clean:0,need:14}));
  const vis=new Set(); while(vis.size<VIS)vis.add(Math.floor(rnd()*E));
  let rep=15, tokens=5, below=0, tops=[], plan=makePlan(cooks,-1);
  let menu=pickMenu(rnd,cooks,0,rep,se,plan,pol==='NAIVE'?1:200);
  const rota=[4,1,2,3,0];
  for(let e=0;e<E;e++){
    const wk=Math.floor(e/5);
    if(e%5===0&&wk>0&&(pol==='REVISE'||pol==='SMART')) menu=pickMenu(rnd,cooks,wk,rep,se,plan,200);
    const ins=vis.has(e), insWave=Math.floor(rnd()*2);
    // podezření (korektní Bayes vč. nepřítomných znaků)
    let lr=1; for(let s=0;s<4;s++){const pH=Math.min(0.85,PB*LR[s]);
      const on=rnd()<(ins?pH:PB); lr*= on?(pH/PB):((1-pH)/(1-PB));}
    const remV=VIS-tops.length, prior=remV/(E-e), odds=prior/(1-prior||1e-9)*lr, susp=odds/(1+odds);
    // rozpis
    let rest=-1;
    if(pol!=='NAIVE'){const wi2=cooks.map((c,i)=>i).sort((a,b)=>cooks[b].w-cooks[a].w)[0];
      const thr=+(process.env.THR||4); if(cooks[wi2].w>=thr) rest=wi2;
      if(pol==='SMART'&&susp>=0.35) rest=-1;}
    plan=makePlan(cooks,rest);
    // přitlačit
    let push=-1;
    if(pol==='SMART'&&tokens>0&&susp>=0.35){push=2;tokens--;}
    const prem=(pol!=='NAIVE')&&(wk%2===0);
    // servis
    let sum=0,n=0,bel=0,star=0; const belP=[0,0,0,0]; const L=latka(menu,wk,rep,se); const visBelow=[],visTop=[];
    for(let wi=0;wi<2;wi++)for(const c of menu){
      const noise=(rnd()*2-1)*(1+0.25*Math.max(0,c.N-2))*(push===c.p?2.2:1);
      const q=plateQ(c,menu,cooks,plan,wk,W[wi],push,prem)+noise;
      sum+=q;n++; if(q<L){bel++;belP[c.p]++;} if(q>=L+TOP)star++;
      if(ins&&wi===insWave){ if(q<L)visBelow.push(1); if(q>=L+TOP)visTop.push(1); }
    }
    if(ins){below+=visBelow.length; tops.push(visTop.length);}
    const avg=sum/n;
    // opotřebení a růst
    const {L:LD}=postAgg(menu);
    cooks.forEach((c,i)=>{
      if(i===rest){c.w=Math.max(0,c.w-5);return;}
      const p=plan.lead.indexOf(i);
      if(p>=0){ c.w=Math.min(10,c.w+0.3+0.18*LD[p]+(push===p?2:0));
        const re=c.r+(c.h===p?1:-1), maxN=Math.max(...menu.filter(x=>x.p===p).map(x=>x.N),0);
        if(belP[p]===0&&maxN>=re){c.clean++; if(c.clean>=c.need&&c.r<5){c.r++;c.clean=0;c.need=c.need===14?30:60;}}
      } else c.w=Math.min(10,c.w+1.0);
    });
    if(e%5===4)cooks.forEach(c=>c.w=Math.max(0,c.w-2));
    rep=clamp(rep+0.45*(avg-L)-0.35*bel+0.5*star,0,100);
  }
  const ok=below<=1, two=(below===0)&&tops.every(t=>t>=1);
  return {ok,two,rep,cooks:cooks.map(c=>({...c,w:0,clean:0}))};
}

const N=+process.argv[2]||400;
console.log('— SEZÓNA 1 —');
for(const pol of ['NAIVE','ROTA','REVISE','SMART']){
  let a=0,b=0,r=0; for(let s=0;s<N;s++){const x=season(7000+s,pol,COOKS,1);a+=x.ok;b+=x.two;r+=x.rep;}
  console.log(`${pol.padEnd(7)} ★ ${(100*a/N).toFixed(1)}%  ★★ ${(100*b/N).toFixed(1)}%  pověst ${(r/N).toFixed(0)}`);
}
console.log('— KARIÉRA (SMART, brigáda přežívá, laťka +0,4/sezónu) —');
{let a=[0,0,0],b=[0,0,0],ru=[0,0,0];
 for(let s=0;s<N;s++){let ck=COOKS;
   for(let se=1;se<=3;se++){const x=season(9000+s*3+se,'SMART',ck,se);
     a[se-1]+=x.ok;b[se-1]+=x.two;ru[se-1]+=x.cooks.reduce((t,c)=>t+c.r,0);ck=x.cooks;}}
 for(let i=0;i<3;i++)console.log(`sezóna ${i+1}  ★ ${(100*a[i]/N).toFixed(1)}%  ★★ ${(100*b[i]/N).toFixed(1)}%  Σruka ${(ru[i]/N).toFixed(1)}`);
}
