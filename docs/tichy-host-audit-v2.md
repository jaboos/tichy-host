# Tichý host — audit návrhu v2 a vylepšení

> Druhý audit, 10. 8. 2026. Prochází návrh v2 čerstvýma očima s otázkou: *co brání tomu, aby to byla návyková hra, o které se mluví?* Nálezy jsou seřazené podle závažnosti; každý má opravu. Sekce 4 přidává nové systémy — včetně mini-úkolů.

---

## 1. Souhrn nálezů

| # | Nález | Závažnost |
|---|---|---|
| N1 | Ekonomika nemá páky — hráč ji sleduje, ale nehraje | **kritická** |
| N2 | Chybí nábor a stážisté — kádr se může jen zmenšovat | **kritická** |
| N3 | Sezóna nemá dramaturgii — 40 večerů stejného tvaru | vysoká |
| N4 | Servisní reveal nemá ceremonii — informačně správný, emočně plochý | vysoká |
| N5 | Mini-cíle chybí úplně | vysoká |
| N6 | LÁMÁNÍ je nefér — porušuje pravidlo tří stop, které si v2 sám cituje | střední |
| N7 | Věrohodnostní poměry jako tabulka = daňové přiznání pro 90 % hráčů | střední |
| N8 | Chybí Scéna — hvězdy bez sociálního srovnání nemají lesk | střední |
| N9 | Chybí podpisový chod — Kronika ho cituje, mechanika neexistuje | střední |
| N10 | Onboarding nespecifikován — minutu 1 prohrajeme na neznámých jménech | střední |
| N11 | Sdílení je jen textové — mluví se o obrázcích | střední |
| N12 | Nekonzistence vln — vzorec s nimi počítá, smyčka je nedefinuje | nízká |
| N13 | Zvuk neexistuje — 30 řádek kódu, obrovský zisk pro feel | nízká |

---

## 2. Nálezy podrobně

### N1 — Ekonomika nemá páky *(kritická)*

v2 definuje tři veličiny (hotovost, náklad na hosta, obsazenost), ale **žádné rozhodnutí, kterým je hráč ovlivňuje**. Chybí cena degustace, chybí poptávkový model, chybí vztah mezi hodnocením a obsazeností. V současné podobě jsou to hodiny odpočítávající prohru, ne systém.

**Oprava — tři nové prvky:**

*Cena degustace* ve třech pásmech (2 200 / 2 800 / 3 400 Kč), lepivá — změna jen 1× týdně a hosté ji komentují. Vyšší pásmo = nižší poptávka, ale vyšší očekávání (práh vady se přitvrdí o 1). Hvězda odemkne čtvrté pásmo (4 200 Kč). Tím se ekonomika a hodnocení konečně zaklesnou: **zdražit znamená hrát těžší hru.**

*Rezervační kniha 2 týdny dopředu.* Obsazenost není číslo, ale viditelná pipeline: `Po 24 · Út 28 · St 31 · Čt 34 · Pá 40 ●plno`. Plní se jako funkce pověsti, ceny a událostí. Hráč vidí, že špatný pátek se propíše do knihy za deset dní — a to je přesně ta smyčka dread/plánování, která drží FM hráče u obrazovky.

*Pověst* jako jediná odvozená veličina (0–100): sytí ji hodnocení večerů, recenze a události, žere ji vada a nuda. Řídí plnění knihy. Není to abstraktní „prestiž" na utrácení — nejde utratit, jen vydělat a ztratit.

### N2 — Chybí nábor a stážisté *(kritická — regrese vůči původnímu záměru)*

v2 řeší odchody (práh na OHNI), ale příchody ne. Kádr se za sezónu může jen opotřebovat a zmenšit — to je death spiral zabudovaný do návrhu. Přitom původní handoff měl nejlepší nákupní mechaniku žánru: *„stagiaire jsou zadarmo, mají obrovský rozptyl, občas je mezi nimi poklad"* — a ta se cestou ztratila.

**Oprava — nedělní trh:** na hranici týdne (tam, kde hra stejně nabízí východ) se objeví 0–3 kandidáti. Placený kuchař má čísla viditelná, stážista má **všechna tři čísla skrytá jako `?`** a odhalují se nasazením: 2 večery odkryjí RUKU, 4 HLAVU, 6 OHEŇ. Stážista nestojí nic kromě rizika, že mu svěříš post v pátek. Poklad (RUKA 4+) je v poolu s pravděpodobností ~10 %.

Tím vzniká rozhodnutí, které v žádné gastro hře není: *obětuju úterý na zkoušku neznámého kluka, když úterý může být Lambert?*

### N3 — Sezóna nemá dramaturgii *(vysoká)*

40 večerů stejného tvaru. „Hlučné týdny" z v1 se rozpustily do event systému, který v2 nikde nespecifikuje. Řešení je sekce 4A — speciální večery s kalendářem.

### N4 — Servisní reveal nemá ceremonii *(vysoká — a je to grafika)*

„Maximálně 3 řádky, jen odchylky" je informačně správně, ale emočně mrtvě. Balatro žije z kaskády skórování — reveal JE ta droga. Náš servis potřebuje navrženou ceremonii:

**Bonový reveal.** Chody najíždějí jako bony (dockets) na pas, jeden po druhém, s tichým tikáním. Prošlý chod jen cvakne. **Hvězdný talíř = zlatá ražba přes bon + zvonek.** Vada = bon se přeškrtne a spadne z lišty. Celé 6–10 s, přeskočitelné klepnutím — ale nikdo to přeskakovat nebude, protože poslední bon může všechno otočit. Pořadí revealu řadit tak, aby napětí rostlo (nejnapjatější chod poslední).

Tohle je místo, kde se vizuál a game feel potkávají — detailně ve vizuálním briefu.

### N5 — Mini-cíle chybí úplně *(vysoká)*

Řešení je celá sekce 4 (speciální večery, výzva týdne, osobní oblouky). Zásada: **žádný quest log jako přílepek.** Každý mini-úkol musí být buď člověk, nebo večer, nebo sázka — nikdy checkbox mimo fikci.

### N6 — LÁMÁNÍ je nefér *(střední)*

Skrytý práh, který se odhalí jedině překročením, je přesně ta frustrace, za kterou hráči kritizují Blue Prince — a porušuje pravidlo tří stop, které v2 sám cituje jako zdroj. **Oprava:** od `práh − 2` začnou eskalující varovné texty (*„Marek dnes dvakrát přesolil základ. Nic neříká."* → *„Marek upustil pánev. Zavřel se v chlaďáku na cigaretu."*), teprve pak zlom. Přesné číslo zůstává skryté — férovost vznikne, tajemství zůstane.

### N7 — Věrohodnostní poměry: skvělá matematika, špatná prezentace *(střední)*

Tabulka „LR 2,4" je lahůdka pro 10 % hráčů a daňové přiznání pro zbytek. **Oprava:** matematika zůstává pod kapotou, na obrazovce je diegetické podání — maître šeptá slovy (*„Stůl šest. Sám, u okna, ptal se na vodu."*), hra ukazuje jen **Podezření: 38 %** a ikonky znaků. LR čísla do tooltipu pro nerdy.

### N8 — Chybí Scéna *(střední)*

Hvězda má hodnotu jen ve srovnání. Původní spodní tab „Scéna" z handoffu zmizel. **Oprava:** tabulka osmi pojmenovaných podniků ve městě (U Ambrože, Sůl, Bord…), jejich hvězdy, jeden řádek drbů týdně. Simulace triviální (statický drift + události), účinek velký: svět má tíhu, druhá sezóna má rivaly a alumni (tvůj odešlý sous se objeví v tabulce — mechanika z původního handoffu, která si to zaslouží).

### N9 — Chybí podpisový chod *(střední)*

Kronika cituje „Celer v popelu", ale mechanika vlastnictví neexistuje. **Oprava:** hráč může jeden chod prohlásit za podpisový a **pojmenovat ho** (generátor: surovina + technika + detail, nebo vlastní text). Podpisový chod: +0,2 identity týdně, Lambertova osa „osobnost na talíři" ho vyžaduje — ale hosté se ho po ~6 týdnech začnou přejídat (pověst −). Napětí věrnost vs. stagnace. A pojmenovaný chod je přesně to, co si hráči posílají: vlastnictví = sdílení.

### N10 — Onboarding nespecifikován *(střední)*

První run musí začít **kurátorovanou brigádou** — fixní seed, 5 lidí s ostrými, okamžitě čitelnými osobnostmi (Ilona/Marek/Dita + 2). Draft z poolu až od druhého runu. A hráč si na startu **pojmenuje podnik** — deset sekund, trvalé vlastnictví, jméno pak žije v Kronice i ve Scéně.

### N11 — Sdílení jen textové *(střední)*

Kronika jako text do schránky je dobrá, ale „mluví se" o obrázcích. **Oprava:** render Kroniky do `<canvas>` → PNG ke stažení/zkopírování, stylizovaná jako účtenka z termotiskárny nebo tištěná menu karta. Nula serveru, plná sdílitelnost.

**A navrch — duel bez serveru:** výsledek týdenního seedu se exportuje jako krátký string. Kamarád si ho vloží do hry a vidí tvoje večery jako „ducha" vedle svých (ghost data z Trackmanie, přenesená přes schránku). Asynchronní multiplayer za nula infrastruktury — a přesně ten typ featury, o které se píše vlákno na Redditu.

### N12 — Vlny: nekonzistence *(nízká)*

Vzorec má `× vlna` a sekce 11 počítá „3 vlny", ale servisní smyčka vlny nedefinuje. **Rozhodnutí: 2 vlny** (18:30 / 20:30) — druhá vlna násobí penalizaci opotřebení. „Drží kvalitu i ve 22:00" je tematické jádro; tři vlny jsou zbytečná granularita.

### N13 — Zvuk *(nízká závažnost, velký zisk)*

WebAudio, ~30 řádek: zvonek „service!", cvakání tiskárny bonů při revealu, tichý šum sálu, ražba pečeti. Mute v nastavení. Textová hra se zvukem přestává být stránka a začíná být místo.

---

## 3. Definiční díry k dořešení v enginu

Věci, které v2 zmiňuje, ale nedefinuje — musí se uzavřít před stavbou:

- **Čistá služba** (podmínka růstu +1 RUKA): večer bez vady na kuchařově postu a bez přetížení > 20 %.
- **Odpočinek:** nenasazený kuchař −3 OPOTŘEBENÍ za večer; zavřené pondělí −2 všem.
- **FORMA:** ±1 po výrazném večeru (hvězdný talíř / vada na jeho postu), samovolný návrat k 0 o 1 týdně.
- **Morálka linky** (Dita ji referencuje): průměr FOREM + události; pod −1 rostou penalizace, pod −2 hrozí odchod nejlepšího.
- **Kredity vs. Kč:** sjednotit — všechno v korunách, „pozornost maître" stojí 1 500 Kč (přesčas).
- **Přetížení:** definováno jako `ZÁTĚŽ/KAPACITA − 1`, kapacita postu = RUKA vedoucího + 0,5 × RUKA pomocníka.
- **Počet chodů:** fixně 6 pro MVP (ne 5–9). Rozhodnutí = *které*, ne *kolik*.

---

## 4. Nové systémy

### 4A — Speciální večery *(boss blinds — dramaturgie sezóny)*

V kalendáři viditelné **2 týdny dopředu** (dread + plánování), max 1× týdně, typicky pátek/sobota. Každý mění pravidla jednoho večera a má explicitní odměnu:

| Večer | Twist | Odměna / riziko |
|---|---|---|
| **Svatba** | 60 krytů, menu zkráceno na 5 chodů, dezerty ×2 zátěž | dvojnásobná tržba |
| **Kritik Průcha** | viditelný kritik, verdikt hned ráno v novinách | pověst ±8 — rychlá protiváha tichého Lamberta |
| **Foodie klub** | plná kniha, chtějí risk | hvězdné talíře +2 pověsti, vady −2 |
| **Výpadek dodávky** | jeden charakter surovin nedostupný | přežij bez vady → dodavatel dá slevu |
| **Soukromá večeře investora** | 12 krytů, přesné požadavky | peníze teď, podmínky potom |
| **Gastrofestival** | polovina brigády vaří venku | PR zásah, doma hraješ v podstavu |

Speciální večer je mini-úkol, který nevypadá jako úkol — je to prostě těžký pátek, na který se tři dny připravuješ.

### 4B — Výzva týdne *(volitelný kontrakt)*

V pondělí hra nabídne **jednu ze dvou** výzev; přijetí je dobrovolné:

- *„Celý týden nikoho nepřetížíš"* → +8 000 Kč a +1 FORMA všem
- *„Zařaď fermentovaný chod do čtvrtka"* → dodavatelská sleva 10 % do konce sezóny
- *„Beze změny rozpisu 5 večerů"* → Lambert osa konzistence: +1 k verdiktu

Dobrovolná omezení s odměnou jsou nejlevnější hloubka, jaká existuje (Balatro/Gwent kontrakty) — a přirozeně vedou hráče hrát jinak, než by hrál sám od sebe.

### 4C — Osobní oblouky *(lidé jako questy)*

Každý kuchař má viditelné **chtění** jako dvoukrokovou kartu přímo na svém profilu:

> **Ilona chce ryby.** Nech ji 3× samotnou na postu → odemkne vlastnost *Sólo+* (+1 RUKA, když je sama).
> *Pak:* bude chtít vlastní chod na menu. Když ho dostane a chod 3× projde bez vady → loajalita (nabídky zvenku ji přestanou lákat).
> *Když odmítneš:* OHEŇ +1. Dvakrát odmítnuté chtění → nedělní nabídka odjinud.

Drama přestává být náhodná událost a stává se plánovatelnou investicí s cenou. Tři kroky stačí; nikdy ne checkbox mimo fikci — vždycky člověk.

### 4D — Trh a stážisté

Viz N2. Nedělní trh, stážisté se skrytými čísly odhalovanými nasazením.

### 4E — Podpisový chod

Viz N9. Pojmenování, rostoucí identita, riziko okoukanosti.

### 4F — Scéna

Viz N8. Osm podniků, drby, alumni.

### 4G — Rezervační kniha a cena

Viz N1. Pipeline 2 týdny, tři cenová pásma, pověst.

### 4H — Ceremonie, zvuk, sdílení

Viz N4, N11, N13. Bonový reveal, pečeť Lambert při vyhlášení (obálka → ražba → hvězda), PNG Kronika, duel přes schránku.

---

## 5. Talkability — proč se o hře bude mluvit

1. **PNG Kronika s řádkem Cena** — účtenka, kterou si lidi dávají do stories.
2. **Pojmenované podpisové chody** — „můj *Celer v popelu* má za sebou 31 čistých večerů" je věta, kterou někdo napíše do chatu.
3. **Týdenní seed + duel přes schránku** — stejná kuchyně pro všechny, ghost kamaráda bez serveru.
4. **Historky o lidech** — *„vytáhl jsem stážistu, který uměl loupat hrášek, a zachránil mi poslední pátek"* se vypráví sama; systém stážistů je generátor těchhle vět.
5. **Jméno podniku** — vlastní jméno v cizí Kronice („U Dušana ★") je nejlevnější personalizace na světě.

---

## 6. Prioritizace do MVP

**Do prototypu hned** *(bez toho hra nefunguje nebo netestuje to hlavní)*:
kalendář + 2 typy speciálních večerů (Svatba, Kritik Průcha) · výzva týdne · osobní oblouky (1 krok u 3 kuchařů) · nedělní trh v jednoduché podobě (1 kandidát) · cena + rezervační kniha + pověst · bonový reveal s ceremonií · varovné texty před LÁMÁNÍM · 2 vlny · pojmenování podniku · PNG Kronika · zvuk (4 samply).

**Druhá vrstva** *(po ověření smyčky)*:
stážisté s mlhou · podpisový chod · Scéna s 8 podniky · duel přes schránku · druhý krok osobních oblouků · plný pool 40 archetypů.

**Třetí vrstva** *(meta)*:
podniky měnící pravidla · Ročník 0–8 · kariéra 3 sezóny · alumni jako rivalové.

---

*Vizuální stránka má vlastní dokument: `tichy-host-vizual-brief.md` — art direction, komponenty a hotové prompty pro Claude Design.*
