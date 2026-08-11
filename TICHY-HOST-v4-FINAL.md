# TICHÝ HOST — finální specifikace v4

> **Tento dokument nahrazuje všechny předchozí.** `tichy-host-navrh-v2.md`, `tichy-host-audit-v2.md` a `tichy-host-engine-v3.md` jsou od této chvíle historické podklady — kde si odporují s tímto textem, platí tento text.
> Všechna čísla níže jsou ověřena simulací (`sim-final.js`, 500 sezón × 4 politiky + kariéra 3 sezón).
> Vizuální stránka má vlastní dokument: `tichy-host-vizual-brief.md`.

---

## 1. Co to je

Prohlížečová textová manažerská hra o fine dining kuchyni. Jeden HTML soubor, vanilla JS, žádná grafika kromě karet a textu, mobil i desktop, CZ i EN. Hráč je šéfkuchař-majitel — **nevaří**. Rozepisuje šest kuchařů na čtyři posty, skládá degustační menu o šesti chodech a snaží se získat hvězdu od **Průvodce Lambert**, jehož inspektor přichází anonymně třikrát za sezónu.

Sezóna = 8 týdnů × 5 večerů = **40 večerů ≈ 45 minut**. Kariéra = 3 sezóny.

Trh k srpnu 2026 ověřen: „Football Manager pro kuchaře" neexistuje.

---

## 2. Verdikt posledního auditu

Pět agentů prošlo návrh v2 a engine v3 s přístupem k simulaci. Našli šest věcí, které rozbíjely hru, a všechny jsou v tomto dokumentu opravené.

**1. Menu mělo dominantní strategii.** Heuristika „ber šest chodů s nejmenší náročností a zátěží" vyhrávala hvězdu v **99,6 %** případů. Vztah byl monotónní bez zlomu, 13,8 % všech menu dávalo ★ ≥ 90 %. Menu se řešilo jednou větou a pak bylo šest ze šesti karet předvyplněných.
→ **Opraveno pohyblivou laťkou** (§7). Ambiciózní menu si laťku snižuje, takže bázlivost přestala být zdarma. Podíl vítězných menu spadl na 1 %, vznikl vnitřní vrchol a překryv optimálního menu mezi týdnem 2 a týdnem 7 klesl ze 4,8/6 na **2/6**.

**2. Hvězda jako minimum přes 36 talířů byla skrytý zabiják všeho.** Minimum z 36 tahů je téměř deterministické — pásmo, kde se pravděpodobnost hvězdy hýbe mezi 5 a 95 %, bylo široké 0,2 bodu kvality. Proto všechny ostatní mechaniky měřily nulu.
→ **Inspektor je jeden host a sní šest talířů v jedné vlně.** Tři návštěvy = 18 talířů. Změna jedné řádky, která udělala pro hratelnost víc než všechny nové systémy dohromady.

**3. Hra hráči lhala o pravděpodobnostech 5,5×.** Naivní Bayes počítal jen s přítomnými znaky a ignoroval nepřítomné. Kalibrace: hra ukázala 38 %, pravda byla 21 %; ukázala 14,5 %, pravda 3,9 %. Chyba stála chytrou politiku 15 procentních bodů úspěšnosti.
→ **Opraveno** (§8). Po opravě sedí kalibrace na desetinu procenta, AUC signálu 0,885.

**4. Kvadratické přetížení bylo mrtvá mechanika.** Změna koeficientu o ±20 % hnula výsledkem o 1,0 bodu. Neexistovalo menu, politika ani seed, kde by se přetížení vyplatilo — optimum leželo přesně na nule.
→ **Přetížení zůstává plotem** (plot má být plot) a jeho roli „riziko za výnos" převzala večerní volba **PŘITLAČIT** (§9), kde risk má měřitelný upside.

**5. Ekonomika měla nulový vliv.** ±20 % na cenu, nájem i kryty = 0,0 bodu na hvězdy. Nájem ani při 3,25násobku nehnul ničím.
→ **Ekonomika zredukována na jediný kanál, kterým peníze sahají na kvalitu** — týdenní ano/ne u prémiových surovin (§10). Michelinský paradox jako simulace se neosvědčil; nahradil ho konkrétní týden, kdy si zvednutou laťku nemůžeš dovolit.

**6. Konceptů bylo zhruba třikrát víc, než mobilní čtyřicetiminutovka unese.** Napočítáno ~45.
→ **Škrtnuto na 12** (§14).

**A jeden nález ze závěrečné kalibrace:** při pětičlenné brigádě stojí odpočinek pomocníka, takže se rotace nikdy nevyplatí a dovednostní žebřík se obrátí. **Brigáda musí mít šest lidí** — čtyři vedoucí, jeden až dva pomocníci, jeden na volnu.

---

## 3. Struktura času

| Vrstva | Délka | Obsah |
|---|---|---|
| **VEČER** | 40–60 s | jedna karta rozhodnutí + servis + výsledek |
| **TÝDEN** = 5 večerů | ~5 min | pondělní rozpis, neděle: trh a vysvědčení; **hra tu nabízí východ** |
| **SEZÓNA** = 8 týdnů = 40 večerů | ~45 min | verdikt Průvodce Lambert |
| **KARIÉRA** = 3 sezóny | ~2,5 h | brigáda přežívá, laťka roste |

Volitelná **krátká sezóna** = 5 týdnů / 25 večerů ≈ 28 min (dvě návštěvy inspektora místo tří).

Ukládá se **po každém večeru** včetně stavu RNG (bez toho jde reloadem přetočit servis). Východ hra nabízí **jen na hranici týdne**, diegeticky tlačítkem *Zamknout kuchyni*.

**Mapování večerů na dny:** index 0–4 = úterý, středa, čtvrtek, pátek, sobota. Pondělí se nehraje — je to plánovací obrazovka a −2 opotřebení všem. Víkendová přirážka ke krytům platí pro index 3 a 4.

---

## 4. Smyčka

### Pondělí — rozpis týdne (~60 s)

Hráč **nevyplňuje mřížku 5 × 6**. Dostane **šest lístků volna** a rozdá je na pět večerů. Pět až sedm klepnutí, hotovo. Pod prstem se živě přepočítává předpověď: *„Pá · Omáčky bez Marka → kapacita 3,4 / zátěž 6,0 → PŘETÍŽENO"*.

Zároveň se tu mění menu (dva večery zkoušek, §6) a rozhoduje o prémiových surovinách (§10).

**Týden 1 má rozpis zamčený** — *„Rozpis ti nechal odcházející sous."* Odemkne se v pondělí týdne 2, kdy už hráč viděl vyskočit první proužek opotřebení. Rozhodovat o odpočinku dřív, než člověk ví, co dělá únava, není rozhodnutí.

### Večer (~40–60 s)

1. **Kniha rezervací** *(3 s)* — kryty a jeden řádek anomálie.
2. **Karta večera** *(10 s)* — **vždy právě jedna volba**, i když je klidno: přehodit člověka oproti plánu · odložit dnešní volno (vrátí se později) · pochvala · seřvání · sundat chod · **PŘITLAČIT** (§9).
3. **Servis** *(6–10 s)* — bonový reveal, chody najíždějí jako bony z termotiskárny.
4. **Následek** *(6 s)* — jeden řádek.

---

## 5. Kuchaři

Brigáda **6 lidí**, kapacita kádru 8.

| Vlastnost | Rozsah | Co dělá |
|---|---|---|
| **RUKA** | 1–5 | jediné číslo dovednosti |
| **domovský post** | 1 ze 4 | +1 RUKA doma, **−1 na cizím postu** |
| **odolnost** | štítek | koeficient únavy: *vydrží* 0,30 · *normál* 0,40 · *rychle hoří* 0,50 |
| **opotřebení** | 0–10 | kumulativní únava |
| **vlastnost** | text | mění pravidlo, ne číslo |
| **chtění** | dvoukroková karta | osobní oblouk (§13) |

**Efektivní RUKA** = RUKA + (domovský post ? +1 : −1). Vstupuje **všude**: do kvality, do kapacity postu, do prahu náročnosti i do podmínky růstu.

Ostatní atributy z v2 jsou **škrtnuté**: FORMA (nevstupovala do žádného vzorce), HLAVA jako číslo (nahrazena štítkem odolnosti), OHEŇ jako číslo (zůstává jen jako stav na kartě chtění), ČAS chodu (splynul s náročností), LÁMÁNÍ (skrytý práh odhalitelný jen překročením porušoval pravidlo tří stop, které si dokument sám citoval).

### Startovní brigáda

| Jméno | RUKA | Domovský post | Odolnost |
|---|---|---|---|
| Ilona Bartáková | 3 | Omáčky | vydrží |
| Marek Ryba | 4 | Oheň | rychle hoří |
| Petr Vaňous | 3 | Studená kuchyně | normál |
| Dita Kesslerová | 2 | Dezerty | vydrží |
| Jana Hrubá | 2 | Omáčky | vydrží |
| Ela Brichtová | 2 | Oheň | vydrží |

První run má brigádu **kurátorovanou a fixní** — draft z poolu archetypů až od druhého runu.

---

## 6. Menu

**Šest chodů**, vybraných z katalogu 18. Minimálně jeden na každý post.

Karta chodu: **post · náročnost 1–5 · sezónní fáze · souhra**.

Zátěž postu = **součet náročností** chodů na tom postu. Žádná samostatná veličina „čas" neexistuje.

**Změna menu stojí dva večery zkoušek** se sníženým výkonem. Revize je sázka, ne reset — a přesto se vyplácí: bot bez revize dá ★ 41,8 %, s týdenní revizí a čtením znaků 60,0 %.

**Sezónnost** je poctivě slabší, než tvrdil v2: amplituda ±0,8. Simulace ukázala důležitou věc — **sezónnost sama o sobě menu nemění vůbec** (zesílená 4× dala 6/6 shodných chodů mezi týdnem 2 a 7), protože posouvá všechny chody stejným směrem. Menu hýbe **laťka**; sezónnost rozhoduje jen o tom, *které konkrétní chody* tu ambici ponesou.

---

## 7. Servis, laťka a skórování

### Laťka — nejdůležitější číslo ve hře

```
LAŤKA = 12,0
      + clamp(1,4 × (3,33 − průměrná náročnost menu); −1,0; +2,5)
      + 0,20 × týden
      + 0,03 × (pověst − 15)
      + 0,4  × (sezóna − 1)
```

Derivace laťky podle tvé vlastní kvality je **0,48 < 1** — úspěch laťku zvedá, ale ne úplně. Dovednostní žebřík zůstává, gumování ne.

**Laťka je trvale na obrazovce** jako linka přes bony a po klepnutí ukáže rozpad:
`základ 12,0 · týden +1,4 · pověst +0,9 · sezóna +0,0 · ambice menu −1,1 = 13,2`

Bez toho je hra neřešitelná hádanka. Bon proto neukazuje absolutní kvalitu, ale **odchylku od dnešní laťky**: `+1,4` / `−0,6 POD`.

### Kvalita talíře

Počítá se pro každý chod × dvě vlny (18:30 s vahou 0,7 a 20:30 s vahou 1,3).

```
KAPACITA(post)  = 2,0 × (RUKA_ef vedoucího + 0,4 × RUKA_ef pomocníka)
PŘETÍŽENÍ(post) = max(0; zátěž postu / KAPACITA − 1)
TLAČENICE(post) = 1,5 × max(0; počet chodů s náročností ≥ 4 na postu − (pomocník ? 2 : 1))

Q = 9,5
  + 1,6 × RUKA_ef vedoucího
  + 0,6 × RUKA_ef pomocníka
  + 0,9 × náročnost
  − 2,2 × max(0; náročnost − RUKA_ef vedoucího)
  + sezónnost                     −0,8 … +0,8
  + souhra chodu                  −0,8 … +1,0
  − 5,0 × PŘETÍŽENÍ²
  − TLAČENICE
  − opotřebení × koef. odolnosti × váha vlny
  + 2,5   (jen post, na který se přitlačilo)
  + 0,8   (prémiové suroviny)
  + U(−1; +1) × (1 + 0,25 × max(0; náročnost − 2)) × (přitlačeno ? 2,2 : 1)
```

**Náročný chod je nestabilní** — rozptyl roste s ambicí. To je jediný zdroj výstupní náhody; všechna ostatní náhoda je vstupní (přichází před rozhodnutím).

Prahy jsou **relativní k laťce**, žádná absolutní čísla:

| | Podmínka |
|---|---|
| **vada** | Q < laťka |
| **prošlo** | Q ≥ laťka |
| **hvězdný talíř** | Q ≥ laťka + 8,5 |

### Opotřebení

vedoucí `+0,3 + 0,18 × zátěž postu` · pomocník `+1,0` · přitlačení `+2,0` navíc vedoucímu · volno `−5` · pondělí `−2` všem · strop 10.

### Růst

Čítač „čistých večerů" roste, když platí obojí: **na kuchařově postu nebyla ani jedna vada** *a* **nejvyšší náročnost na jeho postu ≥ jeho efektivní RUKA** (práce ho natahuje). Prahy **14 / 30 / 60**, pak +1 RUKA, strop 5.

Tím zmizel exploit, kdy bázlivé menu zároveň vychovávalo brigádu.

---

## 8. Inspektor

**Inspektor sní šest talířů v jedné vlně.** Vlna se losuje a hráč ji zpětně uvidí. Tři návštěvy = 18 talířů.

### Znaky a podezření

Každý večer se nezávisle losují čtyři znaky, každý se svou četností. Korelující znaky:

| Znak | Věrohodnostní poměr |
|---|---|
| Host sám u okna, bez telefonu | 2,4 |
| Objednal si vodu z kohoutku a ptal se na ni | 3,1 |
| Odmítl párování a vybral si víno sám | 1,9 |
| Zůstal na kávu a psal si do papírového bloku | 2,8 |

Základní četnost 18 %. Posterior naivním Bayesem, **včetně členů za nepřítomné znaky** — bez nich hra lže 5,5×. Apriorní šance = zbývající návštěvy / zbývající večery.

Hráči se ukazuje **jedno číslo — Podezření: 38 %** — a slova od maître. Tabulka věrohodnostních poměrů patří do tooltipu, ne na obrazovku: hra už výpočet udělala a ukazovat vstupy k výpočtu, který hráč nedělá, je dekorace předstírající agenci. Dovednost je v tom, **co s 38 % uděláš**, ne v tom, že je spočítáš.

### Tři vysvědčení místo jednoho verdiktu

**Toto je nejdůležitější změna oproti v2.** Návštěva se **potvrdí do konce téhož týdne** — v neděli maître: *„Ten pán ve čtvrtek. Volali z redakce průvodce, chtěli jméno šéfkuchaře."*

Hráč tak dostane tři vysvědčení za sezónu místo jednoho posmrtného. Bez toho je učící smyčka hvězdy 45 minut — přesně ta vada, kterou celý projekt nadepisuje jako opravenou.

Vysvědčení ukazuje **přesně těch šest talířů proti laťce toho dne** a kotvu k tehdejšímu podezření:
> Návštěva 2 · večer 21 · druhá vlna: 11,4 · 13,0 · **9,8 POD** · 14,1 · 12,2 · 15,0
> Tvoje tehdejší podezření: 62 %. Přitlačil jsi na Omáčky. Nestačilo o 0,2.

### Hvězdy

| | Podmínka |
|---|---|
| **★** | přes všech 18 talířů nejvýše **1** pod laťkou |
| **★★** | **žádný** talíř pod laťkou **a** v každé návštěvě alespoň jeden hvězdný |
| **udržení** | laťka příští sezónu +0,4 |

Vrchol je stavbou menu **nedosažitelný** — dá se dosáhnout jen přitlačením. Hra to musí říct v týdnu 1 ústy postavy: *„Bez rizika se hvězdný talíř neuvaří. Nikdy."* Skrytý strop je nejhorší druh skrytosti.

---

## 9. Přitlačit

> **PŘITLAČIT** na jeden post: **+2,5 kvality, rozptyl ×2,2, +2 opotřebení vedoucímu.**

**Pět žetonů na sezónu**, viditelných jako mosazné ražby. Vyčerpatelnost je to, co z prahového pravidla dělá rozhodnutí — správná odpověď závisí na tom, kolik žetonů a kolik večerů zbývá. Kdyby byly neomezené, hráč by si za dva večery zautomatizoval „přitlač nad 35 %".

Rozhodnutí není *jestli*, ale **kam** — špatný post znamená vypálený žeton.

Hra ukazuje **obě strany nabídky**, ne jednu: `Hvězdný talíř 18 % → 34 %. Vada 4 % → 19 %.`

**Naměřeno:** slepé přitlačování bez čtení znaků stojí místo výnosu. Rozdíl mezi politikou, která žetony pálí podle podezření, a tou, která je pálí naslepo, je celý rozdíl mezi jednou a dvěma hvězdami.

---

## 10. Ekonomika

Simulace prokázala, že rozsáhlá ekonomika nemá na hvězdy vliv. Zůstává proto **minimální**:

- **HOTOVOST** — jediné číslo. Pod −150 000 Kč = prohra sezóny (podnik převezme investor).
- **Prémiové suroviny** — týdenní ano/ne. `+0,8 kvality všem talířům, food cost +8 procentních bodů.` **Jediný kanál, kterým peníze sahají na kvalitu.** Není to druhá optimalizační úloha — je to jedno pondělní rozhodnutí, které se ti buď vejde do cashflow, nebo ne.
- Kryty 12–40 podle pověsti (+6 o víkendu), cena 2 800 Kč, food cost `26 % + 2 % × průměrná náročnost`, mzdy 16 000 + provoz 18 000 za večer, nájem 40 000 za týden. Start: hotovost 250 000, pověst 15.

**Škrtnuto:** cenová pásma, rezervační kniha na dva týdny, obsazenost jako samostatná veličina, mzdy odvozené z RUKY, odstupné. Čtyři páčky, z nichž na kvalitu sahala jediná.

**Pověst** (0–100, start 15) se počítá `+0,45 × (průměrné Q − laťka) − 0,35 × počet vad + 0,5 × počet hvězdných talířů`. Řídí kryty a zvedá laťku. Nedá se utratit — jen vydělat a ztratit.

---

## 11. Ověřená čísla

`sim-final.js`, 500 sezón na politiku. Politiky: **NAIVE** = nikdo nikdy nemá volno, fixní menu · **ROTA** = odpočinek při opotřebení ≥ 4 · **REVISE** = ROTA + týdenní revize menu · **SMART** = REVISE + žetony podle podezření.

| Politika | ★ | ★★ | pověst |
|---|---|---|---|
| NAIVE | 20,6 % | 0,2 % | 38 |
| ROTA | 38,4 % | 4,6 % | 95 |
| REVISE | 41,8 % | 4,2 % | 86 |
| **SMART** | **60,0 %** | **13,6 %** | 87 |

**Kariéra** (SMART, brigáda přežívá, laťka +0,4 za sezónu):

| | ★ | ★★ | Σ RUKA |
|---|---|---|---|
| sezóna 1 | 63,8 % | 14,0 % | 19,8 |
| sezóna 2 | 57,2 % | 20,2 % | 21,8 |
| sezóna 3 | 53,6 % | 18,0 % | 22,0 |

Čtení: dovednostní žebřík ★ je monotónní s rozpětím 39 procentních bodů. **★★ vyžaduje čtení znaků** — skok z 4,2 % na 13,6 % je celý rozdíl mezi „hraju pořádně" a „hraju s informací". Kariéra mírně klesá, růst brigády se sytí (14 → 22) a nepřerůstá. Pro srovnání: Balatro má výhru na základní sázce 64,9 % a na zlaté 6,8 %.

**Tři skutečné ladicí páky** (vše ostatní je jeden ciferník obtížnosti v mnoha maskách):
1. **základní konstanta 9,5** — vzdálenost průměrné kvality od laťky, hlavní kalibrace
2. **opotřebení × náročnost 0,18** — jediná vazba mezi menu a rozpisem, citlivost 25 bodů
3. **laťka × pověst 0,03** — servo, které brání gumování i utíkání

---

## 12. Vypravěč

Simulace nikdy nepíše text — loguje strukturovaná fakta. Vypravěč dostane 30–60 faktů za večer a **smí vyprávět tři**. Mlčení o zbytku je polovina designu.

Vrstvy: **salience** (odchylka × pozornost hráče k aktérovi × novost) · **paměť postavy** (12 slotů, váha klesá s časem) · **vztahová matice 6×6** · **callback** (šablona si vyžádá vzpomínku a přilepí druhou větu se jménem a týdnem).

**Tvrdé limity** — uživatel přečte maximálně 28 % slov:
servis nejvýše 3 řádky a jen odchylky · žádný odstavec nad 40 slov · událost 60 slov a volby po 8 · **číslo je vidět hned, historka se rozklikává** · každý text buď mění stav, nebo má nejvýše dvě věty.

Rozpočet ~3 500 slov na jazyk. Chod, který proběhl v pořádku, se nekomentuje — **tichý servis je informace**.

> **SERVIS — 9. večer, pátek. 34 krytů. Laťka 13,2.**
> Třetí chod se rozpadl. Bartáková držela dvě pánve na jednom plameni, protože Ryba stál na studené místo na omáčkách.
> Ryba zůstal po servisu v kuchyni o dvacet minut dýl. Neuklízel.

---

## 13. Mini-úkoly a návratnost

Zásada: **žádný quest log.** Úkol je vždy člověk, večer, nebo sázka.

**Speciální večery** — v kalendáři viditelné dva týdny dopředu, nejvýše jeden týdně. *Svatba* (60 krytů, menu zkráceno na 5 chodů, dvojnásobná tržba) · *Kritik Průcha* (viditelný kritik, verdikt hned ráno, pověst ±8 — rychlá protiváha tichého Lamberta) · *Výpadek dodávky* · *Soukromá večeře investora*.

**Osobní oblouky** — dvoukroková karta přímo na profilu kuchaře:
> **Ilona chce omáčky sama.** Nech ji 3× samotnou na postu → vlastnost *Sólo+* (+1 RUKA, když je sama).
> *Pak:* bude chtít vlastní chod na menu. *Když odmítneš dvakrát:* v neděli přijde nabídka odjinud.

**Návratnost:** brigáda přežívá mezi sezónami (tvoji vychovaní kuchaři se vracejí jako konkurence) · podniky měnící pravidla, odemykané dokončením runu, ne výhrou · Ročník 0–8 jako žebříček obtížnosti, kde polovina stupňů mění taktiku · seed týdne · **Kronika sezóny** pod 900 znaků jako PNG účtenka s **povinným řádkem Cena** — chlubení se nesdílí, historka ano.

---

## 14. Dvanáct pojmů

Hra smí hráče naučit **dvanáct věcí**, ne pětačtyřicet. V prvních deseti minutách nejvýše sedm.

`RUKA` · `domovský post` · `opotřebení` · `náročnost chodu` · `kapacita a přetížení postu` · `laťka` · `kvalita talíře` · `podezření` · `přitlačit` · `prémiové suroviny` · `chtění kuchaře` · `hotovost`

**Škrtnuto bez milosti:** FORMA · HLAVA a OHEŇ jako čísla · ČAS chodu · LÁMÁNÍ · osa roku · pravidlo „zátěž stoupá a pak klesá" · Scéna s osmi podniky (zůstává jeden řádek ve verdiktu) · výzva týdne (checkbox v převleku) · cenová pásma · rezervační kniha · stážisté s mlhou (až sezóna 2) · globální žebříček · **skrytá laskavost** (tichý příhoz po dvou špatných večerech rozbíjí jedinou měnu, kterou hra má — důvěru v čísla; pokud vůbec, tak jen jako viditelná událost: *„Dodavatel poslal jako omluvu lepší kus. Dnes +1 na ohni."*).

---

## 15. Hraniční případy

Věci, kvůli kterým by programátor jinak hádal. Všechny jsou rozhodnuté.

| Situace | Řešení |
|---|---|
| Méně kuchařů než postů | Post smí zůstat prázdný. Chod na prázdném postu = automatická vada, hra na to předem upozorní červeně. |
| Kapacita prázdného postu | Nedělí se nulou — prázdný post má kapacitu 0 a chod se vyhodnotí jako vada bez výpočtu. |
| Post bez chodu | Kuchař tam stojí, dostává opotřebení jako pomocník (+1,0), čistý večer se mu nepočítá (práce ho nenatahuje). |
| Počet pomocníků | Nejvýše **dva** v brigádě, každý na jiném postu, na jednom postu vždy jen jeden. |
| Kuchař odejde uprostřed týdne | Jeho zbývající večery se uvolní, hráč dostane mimořádné přeplánování zdarma. |
| Zavření záložky uprostřed servisu | Servis je atomický: výsledek se spočítá a uloží **před** animací, reveal je jen přehrávka. Reload ukáže hotový výsledek. |
| Rozdělení návštěv inspektora | Jedna návštěva na každou třetinu sezóny, uvnitř třetiny náhodně. Poslední nesmí padnout na večer 40. |
| Inspektor na speciálním večeru | Smí. U Svatby (5 chodů) se ★ počítá jako „nejvýše 1 pod laťkou z 15 talířů" — poměr zůstává. |
| Sundání chodu v inspekční večer | Povoleno, ale sundaný chod se počítá jako vada. Není to exploit. |
| Změna menu | Jen v pondělí. Dva následující večery mají −1,0 ke kvalitě. Pokud v nich přijde inspektor, je to riziko revize. |
| Dlužné volno | Fronta má strop 2. Nesplacené volno na konci sezóny propadá. |
| Tlačenice a přetížení | **Sčítají se.** Jsou to různé věci: tlačenice je počet ambiciózních chodů, přetížení je objem. |
| Kolize dvou speciálních večerů | Nejvýše jeden týdně, tvrdé pravidlo při generování kalendáře. |
| Pořadí revealu | Data mají pořadí menu; reveal smí přeskládat jen zobrazení, nikdy výpočet souhry. |
| Souhra u krajních chodů | V MVP je souhra vlastnost chodu, ne sousedství — krajní chody nejsou znevýhodněné. |
| Kryty | Ovlivňují jen tržbu, ne kvalitu. Proto patří do patičky, ne na hlavní místo obrazovky — jinak hráč čeká vliv, který neexistuje. |
| Opotřebení 10 | Strop. Kuchař na stropu má vadu skoro jistou; hra to hlásí červeně dva večery dopředu. |
| localStorage | Klíč `tichy-host-v4`, schéma s číslem verze a migrací, jeden slot na rozehranou hru + seznam Kronik. Ukládá se i stav RNG. |
| CZ/EN | Všechny řetězce ve slovníku, přepínatelné za běhu. Jména kuchařů mají v češtině uložené tvary pro 1. a 4. pád. Čísla se formátují podle jazyka (12,3 vs 12.3). |
| Seed | Formát `7K3-MAREN`, odvozený z data v UTC. Determinuje brigádu, katalog chodů, večery návštěv a všechny hody. |

---

## 15b. Test stropu — je co se učit?

Nejdůležitější otázka celého projektu: *nezůstane hra vyčerpaná po třech runech?* Měřeno postavením nejlepší reálné politiky proti **věštci**, který dopředu zná termíny inspekcí (horní mez dovednosti).

| Politika | ★ | ★★ |
|---|---|---|
| NAIVE | 18,0 % | 0,8 % |
| ROTA | 36,8 % | 4,4 % |
| REVISE | 46,8 % | 10,8 % |
| SMART | 60,6 % | 26,4 % |
| **VĚŠTEC** (zná termíny) | **97,6 %** | **91,4 %** |

**Mezera mezi dobrým a dokonalým hraním je 37 bodů na jedničce a 65 na dvojce.** Hra tedy není vyčerpaná ani vázaná na náhodu — je **informačně vázaná**. Celý ten rozdíl je dovednost číst znaky a načasovat pět žetonů. Věštcových 97,6 % nedosáhne nikdo, protože signál má AUC 0,885 a je nedokonalý záměrně; **realistický lidský strop odhadujeme na 70–75 %**, tedy zhruba 15 bodů učitelné dovednosti nad současnou nejlepší politikou.

**Rozklad rozptylu:** u **79 % seedů** dopadne sezóna jinak podle toho, jak se hraje. Ve čtyřech z pěti partií rozhoduje hráč, ne štěstí. To je jediné číslo, které odděluje hru od automatu.

### Co tím ověřené NENÍ

Simulace dokazuje, že **rozhodovací prostor má hloubku**. Nedokazuje, že **klikání skrz něj je příjemné** — to umí zjistit jen prototyp.

A ukazuje jednu skutečnou slabinu: **rozmanitost mezi runy.** S pevnou šesticí kuchařů a pevným katalogem je druhý run skoro stejná hádanka jako první; seed mění jen termíny inspekce, znaky a šum. To je nejreálnější důvod, proč by člověk odešel po třetím běhu.

**Oprava je změřená a levná:** hrát menu ušité pro jinou partu stojí **51,6 procentního bodu**, a optimum jedné party hrané druhou spadlo na **0,1 %**. Různá brigáda není kosmetika — je to úplně jiná úloha. Proto se draft brigády a rotace katalogu **přesouvají do MVP**; jsou to data, ne systémy, a jsou to jediné dva motory návratnosti, které se dají postavit hned.

---

## 16. Rozsah

**MVP — postavit jako první, nic víc**
Pondělní rozpis šesti lístky · večerní karta s jednou volbou · servis se dvěma vlnami a bonovým revealem · laťka trvale na obrazovce s rozpadem · inspektor se šesti talíři, opraveným Bayesem a třemi vysvědčeními · přitlačení s pěti žetony · růst · hotovost a prémiové suroviny · pojmenování podniku · Kronika jako text i PNG · CZ/EN.

**Nově v MVP, protože je to motor návratnosti** (viz §15b):
- **Draft brigády** — první run má kurátorovanou šestici (onboarding), od druhého runu se losuje 6 z poolu ~24 archetypů: různá RUKA, různé domovské posty, různé odolnosti. Měřeno: parta určuje optimální menu silněji než cokoli jiného ve hře.
- **Rotace katalogu** — z většího katalogu (~30 chodů) se pro každý run losuje 18 dostupných, se zachovaným pokrytím všech čtyř postů.

**Druhá vrstva** — speciální večery · osobní oblouky · nedělní trh a stážisté · podpisový chod · zvuk · duel přes schránku.

**Třetí vrstva** — podniky měnící pravidla · Ročník 0–8 · kariéra napříč sezónami · alumni jako rivalové.

---

## 17. Co zbývá ověřit hraním

- Je pondělní rozdávání šesti lístků doopravdy zábavné, nebo je to i tak domácí úkol? **Jediný test, na kterém záleží.**
- Je 4,7 změn menu za sezónu příliš, když každá stojí dva večery?
- Unese hráč laťku jako koncept, nebo ji bude ignorovat i s rozpadem na klepnutí?
- Uživatelský test: ukázat obrazovku rozpisu deseti lidem mimo obor na 10 sekund a zeptat se *„Co se dnes večer pokazí?"* Když víc než polovina ukáže na přetížený post, hierarchie je v pořádku.
- Gramatika a tón všech českých textů.

---

*Simulace: `sim-final.js` (finální model), `sim-engine.js` (historický, engine v3).*
