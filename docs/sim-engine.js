// Tichý host — simulace enginu v3 (balanc)
// node sim-engine.js [seasons]

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const POSTS=['Studená','Oheň','Omáčky','Dezerty'];
// menu: 6 chodů — Omáčky schválně těžké (mockup: PŘETÍŽENO)
const MENU=[
  {post:0,n:2,t:1,souhra: 0.5,phase:0},
  {post:0,n:3,t:2,souhra:-0.5,phase:2},
  {post:1,n:4,t:2,souhra: 1.0,phase:4},
  {post:2,n:5,t:3,souhra: 0.5,phase:1},
  {post:2,n:4,t:3,souhra:-1.0,phase:5},
  {post:3,n:2,t:2,souhra: 1.0,phase:3},
];
const LOAD=[0,0,0,0]; MENU.forEach(d=>LOAD[d.post]+=d.t); // [3,2,5,2]

const BRIGADE=[
  {name:'Ilona',ruka:3,hlava:4},
  {name:'Marek',ruka:4,hlava:2},
  {name:'Dita', ruka:2,hlava:3},
  {name:'Petr', ruka:3,hlava:3},
  {name:'Jana', ruka:2,hlava:4},
];

const E=40, VISITS=3, WAVES=[0.7,1.3];
const LR=[2.4,3.1,1.9,2.8], P_BASE=0.18;
const PRICE=2800, CASH0=250000;

function surovina(d,week){ return 0.3+0.5*Math.sin(2*Math.PI*(week+d.phase)/8); } // −0.2..0.8

function simSeason(seed,policy){
  const rnd=mulberry32(seed);
  const cooks=BRIGADE.map(c=>({...c,wear:0,clean:0,need:6}));
  // inspektor: 3 večery bez opakování
  const visitSet=new Set(); while(visitSet.size<VISITS) visitSet.add(Math.floor(rnd()*E));
  let rep=15, cash=CASH0, cashMin=CASH0;
  let vady=0, hvezdne=0, falseAlarms=0, fullOnInspector=0;
  const visitResults=[]; const owed=[];

  for(let e=0;e<E;e++){
    const week=Math.floor(e/5);
    const isInsp=visitSet.has(e);
    // znaky
    let lrProd=1;
    for(let s=0;s<4;s++){ const p=isInsp?Math.min(0.85,P_BASE*LR[s]):P_BASE; if(rnd()<p) lrProd*=LR[s]; }
    const remV=VISITS-visitResults.length, remE=E-e;
    const prior=remV/remE, priorOdds=prior/(1-prior||1e-9);
    const post=priorOdds*lrProd, suspicion=post/(1+post);

    // politika: koho na lavičku
    let bench=-1;
    const wornIdx=cooks.map((c,i)=>i).sort((a,b)=>cooks[b].wear-cooks[a].wear)[0];
    const wantRest=cooks[wornIdx].wear>=4;
    if(policy==='ROTATE'&&wantRest) bench=wornIdx;
    if(policy==='SMART'&&wantRest&&suspicion<0.22) bench=wornIdx;
    if(policy==='SMART2'&&suspicion<0.22){
      const cand=cooks.map((c,i)=>i).filter(i=>cooks[i].wear>=2.5)
        .sort((a,b)=>(cooks[b].wear+cooks[b].ruka*0.8)-(cooks[a].wear+cooks[a].ruka*0.8))[0];
      if(cand!==undefined) bench=cand;
    }
    // týdenní plán: rota volna — den e%5 odpočívá kuchař dle plánu [Jana,Marek,Dita,Petr,Ilona]
    if(policy==='PLAN_R'||policy==='PLAN_S'){
      const rota=[4,1,2,3,0]; bench=rota[e%5];
      if(policy==='PLAN_S'){
        if(suspicion>=0.22){ owed.push(bench); bench=-1; }        // podezřelý večer: volno se odkládá
        else if(owed.length){ owed.push(bench); bench=owed.shift(); } // klidný večer: vrať dlužné volno
      }
    }
    if((policy==='SMART'||policy==='SMART2')&&suspicion>=0.22&&!isInsp) falseAlarms++;
    if((policy!=='NAIVE')&&bench<0&&isInsp) {/*full on purpose*/}
    if(isInsp&&bench<0) fullOnInspector++;

    // rozpis: leads podle RUKA na posty podle LOAD, zbylý = pomocník na nejtěžší post
    const avail=cooks.map((c,i)=>i).filter(i=>i!==bench);
    const postsByLoad=[0,1,2,3].sort((a,b)=>LOAD[b]-LOAD[a]);
    const byRuka=[...avail].sort((a,b)=>cooks[b].ruka-cooks[a].ruka);
    const lead=[]; postsByLoad.forEach((p,k)=>lead[p]=byRuka[k]);
    const helperIdx=byRuka[4]??-1; const helperPost=postsByLoad[0]; // nejtěžší
    // kapacita a přetížení
    const cap=[0,1,2,3].map(p=>cooks[lead[p]].ruka+(helperIdx>=0&&p===helperPost?0.4*cooks[helperIdx].ruka:0));
    const over=[0,1,2,3].map(p=>Math.max(0,LOAD[p]/cap[p]-1));

    // servis
    let sumQ=0,minQ=99,eveHvezdne=0,eveVady=0; const vadaPost=new Set();
    for(const d of MENU){ for(const w of WAVES){
      const L=cooks[lead[d.post]];
      const help=(helperIdx>=0&&d.post===helperPost)?cooks[helperIdx].ruka:0;
      const gap=Math.max(0,d.n-L.ruka);
      const fatigue=L.wear*(0.25+(5-L.hlava)*0.06)*w;
      const Q=6+1.6*L.ruka+0.6*help+0.9*d.n-2.2*gap
        +surovina(d,week)+d.souhra-5*over[d.post]**2-fatigue+(rnd()*2-1);
      sumQ+=Q; if(Q<minQ)minQ=Q;
      if(Q>=17){eveHvezdne++;hvezdne++;}
      if(Q<9){eveVady++;vady++;vadaPost.add(d.post);}
    }}
    const avgQ=sumQ/(MENU.length*WAVES.length);
    if(isInsp) visitResults.push({minQ,hv:eveHvezdne});

    // opotřebení + růst
    cooks.forEach((c,i)=>{
      if(i===bench){c.wear=Math.max(0,c.wear-5);return;}
      const p=lead.indexOf(i); const wasLead=p>=0;
      const gain=wasLead?0.5+0.25*LOAD[p]:1.0;
      c.wear=Math.min(10,c.wear+gain);
      if(wasLead&&!vadaPost.has(p)&&over[p]<=0.2){ c.clean++;
        if(c.clean>=c.need&&c.ruka<5){c.ruka++;c.clean=0;c.need=12;} }
    });
    if(e%5===4) cooks.forEach(c=>c.wear=Math.max(0,c.wear-2)); // zavřené pondělí

    // ekonomika + pověst
    const weekend=(e%5>=3);
    const covers=Math.max(12,Math.min(40,Math.round(14+rep/3.5+(weekend?6:0))));
    const rev=covers*PRICE, fc=0.26+0.02*(MENU.reduce((s,d)=>s+d.n,0)/MENU.length);
    cash+=rev*(1-fc)-16000-18000; if(e%5===4)cash-=40000;
    cashMin=Math.min(cashMin,cash);
    rep=Math.max(0,Math.min(100,rep+(avgQ-12.3)*0.6-eveVady*1.5+eveHvezdne*0.4));
  }
  const passes=visitResults.filter(v=>v.minQ>=10).length;
  const star=passes===VISITS;
  const twoStar=star&&visitResults.every(v=>v.hv>=1);
  return {star,twoStar,rep,cash,cashMin,vady,hvezdne,falseAlarms,fullOnInspector,
    sumRuka:cooks.reduce((s,c)=>s+c.ruka,0)};
}

const N=+process.argv[2]||3000;
for(const pol of ['NAIVE','ROTATE','SMART2','PLAN_R','PLAN_S']){
  let st=0,ts=0,rep=0,cash=0,cmin=0,vad=0,hv=0,fa=0,foi=0,sr=0;
  for(let s=0;s<N;s++){ const r=simSeason(1000+s,pol);
    st+=r.star; ts+=r.twoStar; rep+=r.rep; cash+=r.cash; cmin+=r.cashMin;
    vad+=r.vady; hv+=r.hvezdne; fa+=r.falseAlarms; foi+=r.fullOnInspector; sr+=r.sumRuka; }
  console.log(`${pol.padEnd(7)} ★ ${(100*st/N).toFixed(1)}%  ★★ ${(100*ts/N).toFixed(1)}%  ` +
    `pověst ${(rep/N).toFixed(0)}  cash ${(cash/N/1000).toFixed(0)}k (min ${(cmin/N/1000).toFixed(0)}k)  ` +
    `vady/sez ${(vad/N).toFixed(1)}  hvězdné/sez ${(hv/N).toFixed(1)}  ` +
    `plná síla při inspekci ${(100*foi/(N*VISITS)).toFixed(0)}%  Σruka na konci ${(sr/N).toFixed(1)} (start 14)`);
}
