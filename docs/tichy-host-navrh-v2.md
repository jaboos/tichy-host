# Tichý host — návrh v2

> Syntéza po konfrontaci pěti designérských stanovisek. Nahrazuje předávací dokument z 10. 8. 2026.
> Hra stále neexistuje — jde o návrh připravený k postavení prototypu.

---

## 0. Verdikt sporu, ve zkratce

Původní návrh měl jednu fatální vadu, kterou pojmenoval skeptik: **učící smyčka byla stejně dlouhá jako celá hra.** Hráč se dozvěděl výsledek svých rozhodnutí až po 35 minutách. Zábavné hry mají učící smyčku kratší, než je tři opakování jádrového aktu.

První oprava (arbitr A) tu smyčku zkrátila radikální kompresí na 26minutový run s balíčkem karet. Byla ale rozstřílena matematicky:

- **Skórování bylo invariantní.** Když se `skóre chodu = Σ Ruka na postu − zátěž chodu` a každý post nese právě jeden chod, součet přes sezónu je `ΣRuka − ΣZátěž` — tedy **nezávislý na rozpisu**. Hráč nerozhodoval o výkonu, jen o tom, které chody obětuje pod prahy. Optimum je věta o přeuspořádání: seřaď ruce vzestupně, zátěže vzestupně, spáruj. Hráč ji objeví ve třetím servisu, tedy v **minutě 5**.
- **Růst kuchařů byl dominovaná strategie.** Investice 9 bodů, výnos 9 bodů přesně na konci sezóny. Break-even = mrtvý systém.
- **Ohlášený inspektor** znamenal, že 75 % večerů je bez důsledku. To je dvanáctikapitolový tutoriál — a hra, která se jmenuje *Tichý host*, nemůže mít ohlášeného hosta.

**Přijaté řešení:** učící smyčka se nezkracuje amputací, ale **rozvrství** — nový systém přichází dřív, než hráč zvládne předchozí. A přetížení postu se počítá **nelineárně**, čímž se z rozpisu stane skutečná úloha o balení, ne řazení.

---

## 1. Struktura času

| Vrstva | Délka | Funkce |
|---|---|---|
| **VEČER** | 40–70 s | jednotka rozhodnutí |
| **TÝDEN** = 5 večerů | ~5 min | uzavřená jednotka, hra tu **nabídne východ** |
| **SEZÓNA** = 8 týdnů = 40 večerů | ~45 min | oblouk, verdikt Průvodce Lambert |
| **KARIÉRA** = 3 sezóny | ~2,5 h | volitelné pokračování, brigáda přežívá |

Volitelná **krátká sezóna** = 5 týdnů / 25 večerů ≈ 28 min. Lekce od Subset Games: *„žádat hráče o dvě až tři hodiny nebylo dobré"* — proto Into the Breach nechává zvolit počet ostrovů.

Stav se ukládá **po každém večeru**, ale hra nabízí odchod **jen na hranici týdne** — diegeticky, tlačítkem *Zamknout kuchyni*. Football Manager neumí nabídnout přirozený východ; my ho nabídneme osmkrát za sezónu. Zároveň to znamená, že „ještě jeden týden" je pět minut, ne čtyřicet.

**Kadence nových pravidel:** 1 · 3 · 6 · 9 · 13 · 18 · 24 · 32 minuta. Po 32. minutě už hra nic nového nezavádí — od té chvíle hraješ příběh vlastní brigády, což je jediné palivo, které se neopotřebuje.

---

## 2. Jádrová smyčka — jeden večer

**1. Kniha rezervací** *(3 s)*
Počet krytů (24–40) a jeden řádek anomálie. *„Čtvrtek. 34 krytů. Praská mrazák — chladné posty −1 ruka."*

**2. Pas** *(25–35 s — tady je celá hra)*
Kuchaři jako řádky s kondicí, ne s tabulkou. Rozpis na posty. Každý post ukazuje živě **zátěž / kapacitu**. Přetečení se násobí, ne sčítá.

**3. Jeden zásah** *(8 s)*
Právě jeden z: POCHVALA · SEŘVÁNÍ · PŘESUN · SUNDAT CHOD · KOUPIT POZORNOST MAÎTRE. Vzájemně se vylučují — volby se musí vylučovat, ne sčítat.

**4. Servis** *(6 s)*
Maximálně tři řádky a **jen odchylky**. Chod, který proběhl v pořádku, se nekomentuje. Tichý servis je informace.

**5. Následek** *(6 s)*
Jeden řádek a delta čísel.

**Zpětná vazba přijde 60 sekund po rozhodnutí.** Učící smyčka je 1/40 sezóny, ne 1/1.

---

## 3. Kuchaři

Čtrnáct atributů porušuje Meierovo pravidlo: *rozhodnutí s důsledky, kterým hráč nerozumí, není zábava.* Samotné věty bez čísel zase neumožní plánovat. Kompromis:

**Tři viditelná čísla:**

| | rozsah | co dělá |
|---|---|---|
| **RUKA** | 1–5 | kolik zátěže postu pokryje a jak vysoko sahá kvalitou |
| **HLAVA** | 1–5 | klid pod náporem — tlumí penalizaci za opotřebení |
| **OHEŇ** | 0–5 | ctižádost — kdy začne chtít víc, než mu dáváš |

**Dva stavy:** FORMA (−2…+2, krátkodobá) · OPOTŘEBENÍ (0–10, kumulativní).

**Jedna skrytá věc: LÁMÁNÍ** — práh 4–9 na opotřebení. Odhalí se **jedině tím, že ho překročíš.** Sem patří skrytá informace: do lidí, ne do balíčku pravidel.

**Jedna vlastnost, která mění pravidlo, ne číslo.** Pool ~40 archetypů.

**Jedna vazba** na jiného kuchaře (mentor/žák, rival na stejném postu, stará křivda z minulého podniku).

### Růst, který se vyplatí

6 čistých služeb na jednom postu = **+1 RUKA natrvalo**. Další po 12, další po 24. První povýšení přistane kolem sedmého večera a **splácí se dalších 33 večerů**. Commis s RUKOU 2, kterého celou sezónu kryješ, končí na 4–5.

To je věta *„vytáhl jsem kluka z rezervy a udělal z něj kapitána"* — a 26minutový run ji nemůže vyrobit ani teoreticky, protože na změnu člověka není časová páka.

### Odchody

OHEŇ > 3 a 12 večerů na stejném postu bez povýšení → v neděli přijde nabídka odjinud. Nedělní rozhodnutí trvá 30 sekund a bolí. Není to skriptovaná cutscéna po třech sezónách — je to **funkce hráčových kroků**.

### Tři ukázkoví kuchaři

**Ilona Bartáková · RUKA 3 · HLAVA 4 · OHEŇ 2 · Nožířka**
Sama na postu +2. Jakmile jí někdo pomáhá, −2. *Nutí tě nechat jeden post prázdný a přijmout díru jinde.*
Před servisem si sype sůl na hřbet ruky a olízne ji. Říká, že jinak nevěří chuti.

**Marek Ryba · RUKA 4 · HLAVA 2 · OHEŇ 4 · Šampión**
První dva chody +3, poslední dva −3. *Nutí tě přeskládat pořadí menu, ne rozpis.*
Nechce hvězdu. Chce, aby se vědělo, že ji držel.

**Dita Kesslerová · RUKA 2 · HLAVA 3 · OHEŇ 5 · Učednice**
Roste dvakrát rychleji, ale každý přetížený servis −1 morálka linky. *Sázka na slabého se vyplatí ve večeru 20. Nebo tě rozloží ve večeru 14.*

---

## 4. Menu

Menu je **sezónní aktivum, ne denní karta.** Změna menu stojí **dva večery zkoušek se sníženým výkonem** — revize je sázka, ne reset.

Karta chodu: **POST · NÁROČNOST 1–5 · ČAS 1–3 · NÁKLAD v Kč · CHARAKTER** (syrové / kyselé / tučné / uzené / sladké / fermentované).

**Dvě vrstvy omezení, které spolu nemluví:**

*Kuchyňská* — kapacita postu. Součet ČASU chodů na postu proti rukám, které tam máš. Čtyři ze sedmi chodů na omáčkách se ve 21:00 rozpadne.

*Hostova* — oblouk a sousedství:
- stejný charakter vedle sebe: **−3 opakování**
- protiklad (tučné→kyselé, uzené→syrové): **+3 úleva**
- zátěž musí stoupat a pak klesat; každý zlom navíc **−2**

Tři pravidla, papírově čitelný tvar, plná kombinatorika.

**Proč neexistuje jedno optimální menu:**

1. Součet zátěže je ohraničený rukama v kádru — a kádr se mění (růst, opotřebení, odchody).
2. Sezónnost surovin: chod za 16 v týdnu 2 je v týdnu 6 jedenáctka.
3. Osa, kterou Lambert letos váží, mění, jestli chceš plochý nebo špičatý profil.
4. Náklad na hosta musí zůstat v pásmu — nejlepší menu si nemůžeš dovolit každý večer.

---

## 5. Servis a skórování

Jediná **výstupní** náhoda je `U(−1, +1)`. Všechna ostatní náhoda je **vstupní** — přichází před rozhodnutím (draft, sezóna, osa roku, znaky), ne mezi rozhodnutím a výsledkem. Rozdíl je zásadní: vstupní náhoda obohacuje stavový prostor, výstupní znehodnocuje rozhodnutí.

```
PŘETÍŽENÍ(post) = max(0, ZÁTĚŽ/KAPACITA − 1)

Q = 8
  + 2,2 × RUKA(vedoucí postu)
  + 0,8 × RUKA(první pomocník)
  − 2,0 × NÁROČNOST(chod)
  + surovina(chod, týden)            −1 … +1,5
  + souhra(soused vlevo, soused vpravo)  −1,5 … +1,5
  − 5,0 × PŘETÍŽENÍ²                  ← nelineární, tady vzniká úloha o balení
  − OPOTŘEBENÍ × (0,25 + (5−HLAVA)×0,06) × vlna
  + vlastnosti
  + U(−1, +1)
```

Prahy: **vada < 9 · prošlo 9–13 · dobré 13–16 · hvězdný talíř ≥ 16.**

Kvadratické přetížení je to, co dělá rozpis netriviálním. Lineární verze je řešitelná řazením; kvadratická je úloha o balení, kde přesun jedné ruky mění výsledek nemonotónně.

**Skrytá laskavost:** po dvou nezaslouženě špatných večerech hra tiše přihodí. XCOM to dělá — když vidíš 85 %, je to reálně blíž 95 %. Nikdy se to hráči neřekne.

---

## 6. Inspektor — jádro hry

Vracíme **skryté KDY**. Ohlášený inspektor bere každému všednímu večeru váhu, a to byl celý smysl. Ale skryté KDY bez nástroje reakce je jen rozptyl. Řešení je udělat z toho **čitelný odhad, ne hádání**:

### Znaky s věrohodnostními poměry

Každý večer hra vylosuje **3 znaky z balíčku 9**. Čtyři z nich s Lambertem korelují a hra **jejich sílu ukazuje**:

| Znak | LR |
|---|---|
| Host sám u okna, bez telefonu | 2,4 |
| Objednal si vodu z kohoutku a ptal se na ni | 3,1 |
| Odmítl párování a vybral si víno sám ze seznamu | 1,9 |
| Zůstal na kávu a psal si do papírového bloku | 2,8 |
| *(pět neutrálních znaků)* | 1,0 |

Apriorní pravděpodobnost: 3 návštěvy ze 40 večerů = 7,5 %.
Dva korelující znaky → **38 %.** Všechny čtyři → **76 %.**

Hra to číslo spočítá a ukáže. Dovednost není v počítání, ale v tom, **co s 38 % uděláš** — jestli dnes večer nasadíš unaveného Marka, protože zítra je sobota na 40 krytů.

Maître má **jednu pozornost za večer**: zvedne jistotu u jednoho stolu z ~35 % na ~70 %. Pozornost stojí kredit, který ti pak chybí jinde. Informace je nakupovatelný zdroj, ne dárek.

**Rozhodnutí „jedu dnes naostro, nebo bezpečně" padá 40× ze 40 večerů.**

### Osa roku

Na začátku sezóny se ohlásí, co Lambert letos váží: *konzistenci napříč návštěvami · nejlepší chod večera · poslední třetinu menu · souhru chodů · osobnost na talíři.* Je to vstupní náhoda — mění strategii mezi runy, ale nikdy nefrustruje, protože ji znáš předem.

### Verdikt

Na konci sezóny průvodce **jmenuje tři konkrétní data** — a jedno z nich si nepamatuješ. Retroaktivní přepis vzpomínky je nejsilnější emoce, kterou simulace umí vyrobit, a stojí nula textu navíc.

**Hvězda:** všechny tři návštěvy nad prahem (počítá se minimum, ne průměr). **Druhá hvězda:** navíc alespoň dva hvězdné talíře napříč návštěvami. **Udržení:** práh příští sezónu +2.

Konzistentní kuchař tedy hvězdu neztratí, ale ani nezíská. Špičkový nekonzistentní může obojí. Dvě různé účelové funkce nad jedním menu — tam leží celý prostor rozhodnutí.

---

## 7. Ekonomika

Michelinský paradox je hratelný jedině tehdy, když **tlak na hvězdu a tlak na solventnost táhnou opačně**. Jeden abstraktní counter tyhle síly slepí a rozhodnutí zruší — proto tři logické veličiny, ne „prestižní body":

**HOTOVOST** (konec pod −150 000 Kč) · **NÁKLAD NA HOSTA** (cíl 28–34 %; pod 25 % host cítí lakotu, nad 38 % krvácíš) · **OBSAZENOST**.

Modelový večer:

```
30 krytů × 2 800 Kč                    84 000
− food cost 31 %                      −26 040
− mzdy (6 kuchařů)                    −14 000
− provoz                               −9 000
                                    = +34 960
```

Najmi sous s RUKOU 5 za 3 800/den a přejdi na hvězdné suroviny (41 %):

```
84 000 − 34 440 − 17 800 − 9 000    = +22 760
```

Jeden zlomený kuchař = dva předělané chody (+8 % food cost) a 12 stornovaných krytů:

```                                   = −20 000
```

Lekce z Imperator: Rome — hra umřela na abstraktní „manu" a léčila se převodem na logické zdroje. Žádné prestižní body.

---

## 8. Vypravěč

**Simulace nikdy nepíše text.** Loguje strukturovaná fakta: `{t:9, typ:'chod_selhal', kdo:'vrana', co:'langusta', delta:−14, tagy:['tlak','rozpis']}`

Nad tím čtyři vrstvy:

- **Salience** — vypravěč dostane 30–60 faktů za večer a smí vyprávět **tři**. Mlčení o zbytku je polovina designu.
- **Paměť postavy** — 12 slotů, váha klesá s časem. Paměť je vstup do rozhodování *i* do textu.
- **Vztahová matice** — jedno číslo −3…+3 a tag. Rivalita je nejlevnější dramatický motor v existenci: dvě čísla a jeden trigger.
- **Callback** — šablona si vyžádá vzpomínku a přilepí druhou větu se jménem a číslem týdne. Hloubka není v počtu variant, ale v té druhé větě.

**Rozpočet:** ~3 500 slov na jazyk, z toho 60 % v lidské vrstvě. Jedna sezóna odhalí ~15 %.

**Tvrdé limity** (uživatel přečte maximálně 28 % slov na obrazovce):

- servis maximálně 3 řádky, jen odchylky
- žádný odstavec nad 40 slov
- událost 60 slov + volby po 8
- **číslo je vidět hned, historka se rozklikává**
- každý text buď mění stav, nebo má maximálně dvě věty

FM26 zrušil inbox a stejně spadl na ~23 % pozitivních recenzí. Lék na nečtený text není méně slov — je to méně **opakovaných** slov.

### Ukázka hlasu

> **SERVIS — 9. večer, pátek. 42 krytů.**
> Třetí chod se rozpadl. Řezáčová držela dvě pánve na jednom plameni, protože Vrána stál na garde místo na rybách.
> Vrána zůstal po servisu v kuchyni o dvacet minut dýl. Neuklízel.
> `71/100 · náklad 38 % · nálada −1`

> **PRŮVODCE LAMBERT — ROČNÍK 2026**
> **Tichý host, Praha. ★ Jedna hvězda, nově udělena.**
> Navštívili jsme podnik dvakrát. Poprvé v květnu, kdy kuchyně působila jako soubor velmi dobrých nápadů, které o sobě navzájem nevědí. Podruhé v srpnu, kdy už o sobě věděly.
> V paměti zůstává celer pečený v popelu — chod, který nestojí skoro nic a unese celé menu.
> Doporučujeme kuchyni, aby nesahala na třetí chod. Ví, proč to říkáme.

---

## 9. Proč se hráč vrátí

**Brigáda přežívá mezi sezónami.** Kuchaři, které jsi vychoval, se vracejí jako konkurence. To je jediné palivo, které se neopotřebuje.

**Tři hvězdné režimy s jinými pravidly** — 1★ přežij · 2★ okno konzistence (žádný večer pod prahem po osm týdnů) · 3★ signature (jeden chod třikrát na maximum).

**Podniky měnící pravidlo**, odemykané dokončením runu, ne výhrou: popup o 12 místech se dvěma posty · hotelová restaurace s 90 kryty a dvojnásobnou zátěží · převzatý tým s morálkou 5 · comeback po skandálu s prahem +2 · farma s dvojnásobně přísnou sezónností a −40 % nákladem.

**Ročník 0–8** — žebříček obtížnosti, kde polovina stupňů mění taktiku, ne konstanty. (Slay the Spire drží 7,3 % všech majitelů na Ascension 20, Balatro 6,8 % na Gold Stake — ale Mega Crit sám ve dvojce zkrátil žebříček z 20 na 10. Osm stačí.)

**Seed týdne** — jedna kuchyně pro všechny. Wordle: prototyp s nekonečným hraním testeři odložili a nevrátili se; teprve jedno slovo denně to udrželo.

**Kronika sezóny** pod 900 znaků do schránky, s **povinným řádkem Cena**:

```
TICHÝ HOST — sezóna 1 · seed 7K3-MAREN
★ udělena v 8. týdnu

Nejlepší chod:  Celer v popelu (17,2)
Kuchař sezóny:  Ilona Řezáčová — 14 servisů, 0 vad
Cena:           Tobiáš Vrána odešel ve 13. večeru.
                Vzkaz: „Myslel jsem, že si to pamatuješ."

seed 7K3-MAREN — zahraj si stejnou kuchyni
```

Chlubení se nesdílí. Historka ano. A seed je celá virální smyčka za nula serveru.

**Verdikt navíc ukazuje jednu nevyužitou cestu:** *„Ilonu jsi nikdy nenechal samotnou."*

---

## 10. Co je vyhozeno a proč

| Vyhozeno | Proč |
|---|---|
| 14 atributů, konzistence jako stat, σ | hráč nerozumí důsledkům; strop jsou 3 čísla + 1 skryté + 1 vazba |
| Drift a atrofie dovedností na pozadí | ±2 za 10 týdnů je pod hladinou vlastního šumu hry; nahrazeno diskrétním +1 RUKA |
| Čtyřicetisekundový ticker | 13 minut nečinného koukání za sezónu; nejdražší tlačítko Skip v historii |
| Zásahy během servisu | odporují premise „šéf nevaří"; jsou to quicktime eventy |
| Podezřelé stoly s 80 % falešně pozitivních | hádání není dovednost; nahrazeno věrohodnostními poměry |
| Skriptovaný odchod sousa po 3 sezónách | cutscéna, ne mechanika; nahrazeno prahem na OHNI |
| Inbox, tiskovky | FM26 inbox zrušil a stejně spadl; text musí měnit stav |
| Globální žebříček | prázdný leaderboard je horší než žádný (Zachtronics: „jediné, co ti globální žebříček řekne, je že jsi špatný") |
| Meta-progrese síly | odemyká se jen obsah, nikdy síla |
| Bankrot jako jediná prohra | pravá prohra je rozpad brigády: jsi bohatý a nikdo ti nechce vařit |

---

## 11. Co ověřit prototypem

- [ ] **Nejdůležitější ladicí konstanta: velikost vzorku, který inspektor uvidí.** 40 večerů × 3 vlny × 7 chodů = 840 hodů; zákon velkých čísel udělá sezónu deterministickou. Zachraňuje to jen to, že průvodce vidí 21–63 talířů. Tohle se musí odsimulovat na tisících běhů.
- [ ] Je kvadratické přetížení doopravdy netriviální, nebo se z něj po deseti večerech stane heuristika „nikdy nepřetěžuj"?
- [ ] Sedí ekonomika tak, že průměrné menu mírně krvácí a růst obsazenosti to léčí?
- [ ] Je pásmo věrohodnostních poměrů čitelné, nebo hráč jen kouká na výsledné procento?
- [ ] Uživatelský test: ukázat obrazovku Pasu deseti lidem mimo obor na 10 sekund a zeptat se *„Co se dnes večer pokazí?"* Když víc než polovina ukáže na přetížený post, hierarchie je v pořádku.
- [ ] Gramatika a tón všech českých textů.

---

## 12. Zdroje, o které se návrh opírá

- Slay the Spire / Balatro — statistiky dokončení ze Steamu, struktura žebříčku obtížnosti
- Subset Games (FTL → Into the Breach) — volitelná délka runu
- Wordle — jedno zadání denně, sdílený výsledek bez odkazu
- XCOM (Jake Solomon) — tichá laskavost v pravděpodobnostech
- Keith Burgun — rozdíl vstupní a výstupní náhody
- Return of the Obra Dinn, pravidlo tří stop — jak dávkovat dedukci
- Sid Meier / Soren Johnson — „rozhodnutí s důsledky, kterým hráč nerozumí, není zábava"
- Imperator: Rome, Victoria 3 — proč abstraktní měny zabíjejí manažerské hry
- Football Manager 26 — proč zrušení inboxu nestačí
- Nielsen Norman Group — uživatel přečte maximálně 28 % slov
- Zachtronics (Zach Barth) — proč histogram místo globálního žebříčku

**Stav trhu k srpnu 2026: „Football Manager pro kuchaře" neexistuje. Mezera je otevřená.**
