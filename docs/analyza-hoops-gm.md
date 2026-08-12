# Hoops GM — hloubková analýza a co z ní vzít

> Prošel jsem hru v prohlížeči: úvodní obrazovka → výběr týmu → tříkrokový onboarding → herní večer → kádr → karta hráče → živý zápas. Poznámky jsou z toho, co jsem viděl, ne z marketingu.

---

## 0. Nepříjemná věta na úvod

Řekls, že se ti líbí **vizuálně**. Prošel jsem to a myslím, že se ti ve skutečnosti líbí něco jiného, a je to důležité rozlišit.

Vizuál Hoops GM je **kompetentní tmavý dashboard**. Tmavé pozadí, karty s jemným okrajem, kondenzovaný bezpatkový nadpis, systémový sans na text. Nic z toho není původní; to samé uvidíš na dvaceti SaaS produktech. Náš „Vytištěný podnik" má oproti tomu **skutečný koncept** — Cormorant, bony, pečeť, kalendářní lepenky.

Co je na Hoops GM doopravdy silné, je **informační architektura a psaní textů**. Hra ti v každém okamžiku říká, o co jde, jazykem, kterému rozumíš, a nabízí pojmenovaná rozhodnutí. To je přenositelné a je toho hodně.

Mimochodem, na kartě hráče mají neošetřený float: `Morale 58.177313500000004`. Vyleštěnost není jejich výhoda.

---

## 1. Hlavní akce je dosažitelná odkudkoli

Tlačítko **`▶ TIP OFF`** sedí v horní liště na **každé obrazovce**. Kádr, taktika, finance, historie — pořád je vpravo nahoře. Nikdy nemusíš nikam navigovat, abys hrál.

Vedle něj je stavový řádek s barevnou tečkou: **`● Game night — your team takes the floor`**. Takže i když se hrabeš ve finančním přehledu, víš, co se od tebe čeká.

**U nás:** „Zahájit servis" existuje jen dole na Pasu — a přesně tam se pralo s tab barem. Kdo odejde do Menu nebo na Kalendář, musí najít cestu zpátky.

> **Vzít:** trvalý horní pruh se stavem večera a primární akcí. Náš ekvivalent: `Čtvrtek · 34 krytů · ● Kuchyně čeká` a vpravo `Zahájit servis ▶`.

---

## 2. Karta „Co je dnešek v sázce" — nejlepší nápad, který nemáme

Přímo pod výsledkovou kartou:

> ● **What tonight is worth** — `SECURE`
> All three board contracts on track. Next review in 10 games.

Jedna věta o tom, **co dnešní večer znamená pro tvůj krk**, plus stavové slovo. Zelená tečka a `SECURE`. Kdyby se dařilo špatně, bude tam něco jiného.

**U nás tohle úplně chybí.** Máme Podezření 38 %, což říká *jestli se dnes měří* — ale ne *co se stane, když to dopadne blbě*. Hráč nemá jak vědět, jestli je dnešek nudný úterý, nebo poslední šance před vysvědčením.

> **Vzít:** karta `Co je dnešek v sázce` hned pod hlavičkou Pasu. `Pověst 41 · drží se` nebo `Do vysvědčení zbývají 3 večery` nebo `Hotovost vydrží 11 večerů`. Jedna věta a stavové slovo.

---

## 3. Scouting report — přesně tvar, který má mít náš Pas

Tohle je nejcennější kus celé hry:

> **Scouting report · Indiana Racers** ✕ AGAINST THE READ
> They run **Post Hub** ⓘ — Offense runs through the block — deep touches, cutters off the big. *They walk it up — a grind-it-out night.*
> Scout: 65 % they open in Post Hub
> Your identity: Pace & Space — their staff is game-planning against it tonight too.
>
> `Switch Everything` `Drop Coverage` `Double the Star` `Pack-the-Paint Zone`

Rozeber si to:

1. **Pojmenovaný jev** — „Post Hub", s otazníkem na vysvětlení.
2. **Překlad do lidské řeči** — „offense runs through the block".
3. **Číslo jako pravděpodobnost, ne jako fakt** — „65 % they open in Post Hub".
4. **Tvoje identita jako protiváha** — a věta, že soupeř plánuje proti tobě.
5. **Čtyři pojmenované odpovědi**, každá s jednou větou důsledku.
6. **`✕ AGAINST THE READ`** červeně, když tvoje volba odporuje scoutingu.

Ten poslední bod je zadarmo geniální: hra ti **nezakáže** hrát proti čtení, jen to označí. Nechá tě to udělat a dá ti vědět, že to děláš.

> **Vzít celé.** Naše obrazovka Pasu má mít stejný tvar: **čtení večera → pojmenované odpovědi → značka, když jdeš proti čtení.** Znaky maître jsou naše „Post Hub", podezření je naše „65 %", a šest zásahů jsou naše čtyři karty. A když přitlačíš při podezření 8 %, ať se to označí `✕ PROTI ZNAKŮM`.

---

## 4. Zásahy: pojmenované věty, seskupené podle významu

Karta hráče má akce rozdělené do skupin s popiskem vlevo:

| Skupina | Akce |
|---|---|
| **TALK TO HIM** | `Praise` · `Challenge` · `Reassure` |
| **YOUR GUY** | `Make him your guy` |
| **YOUR WORD** | `Promise a starting spot` · `Promise rotation minutes` |
| **ROSTER MOVES** | `Trade block` · `Shop him` · `Focus: none` · `Waive` (červeně) |

Každá akce je **slovesná fráze, kterou umíš převyprávět kamarádovi**. „Slíbil jsem mu místo v základní pětce." Žádné ikony, žádné abstraktní popisky.

**U nás:** šest zásahů jsou typografické značky `✦ ! ⇄ ✕ ❧` s jednoslovným popiskem. `❧` neznamená pro nikoho nic.

> **Vzít:** zásahy jako pojmenované věty, seskupené podle toho, čeho se týkají. `MLUVIT S NIMI: Pochválit · Seřvat` — `ROZPIS: Přesunout · Odložit volno` — `SERVIS: Sundat chod · Přitlačit`. Ikona smí být navíc, nikdy místo jména.

---

## 5. Reprezentace se řídí povahou dat, ne konzistencí

V tabulce kádru:

| Údaj | Jak se zobrazuje |
|---|---|
| OVR | **číslo** `88` + barevné podtržení |
| Morale, Energy | **jen proužek**, žádné číslo |
| Outlook | **jen slova** — „Clear All-Star upside", „Close to his ceiling" |
| Status | **jedno slovo** — „Fit" |

Nikde se necpe číslo tam, kde je pravdivější slovo. „Close to his ceiling" nese víc informace než „potenciál 84".

To je přesně princip, který jsme přijali u triptychu — ale **zatím jen tam**. Zbytek našeho UI pořád sype čísla.

> **Vzít:** projít každý údaj a zeptat se, jestli je to opravdu číslo. Opotřebení = proužek. Odolnost = slovo. Podezření = číslo (protože se s ním sází). Kvalita talíře = odchylka od laťky, protože absolutní číslo nic neříká.

---

## 6. Onboarding: tři obrazovky, každá je volba, ani jedna není tutoriál

1. **`SEASON 2027 · CHARLOTTE STINGERS · The front office is yours.`** — identita, jedna věta, `CONTINUE`.
2. **`THE OWNER'S EXPECTATION: Develop the young core. So what do you tell the room?`** — tři možnosti, každá s důsledkem: *„Promise the title — the biggest swing there is, and the shortest rope."* Hlavní tlačítko se přejmenuje na **`SKIP THE QUESTION`**, dokud nic nevybereš. Poctivé.
3. **`YOUR GUY` — Every GM has one. The game will follow his career alongside yours.** Tři obličeje. Pod tím: *„You can change your mind later, from any player card."*

Pak `▶ TAKE ME TO MY FIRST GAME`. Ne „Start". **Akce, ne funkce.**

Nikde se nevysvětluje mechanika. Místo toho se **vyrábí sázka a připoutání** dřív, než hra začne.

> **Vzít:** náš onboarding má být `Pojmenuj podnik` → `Co slíbíš investorovi?` (tři možnosti s cenou) → `Kdo je tvoje ruka?` (vyber kuchaře, kterého bude kronika sledovat). A tlačítko `Odjeď první servis`, ne „Začít".

**A „Your guy" je samostatně velká věc.** Necháš hráče určit oblíbence, hra ho pak sleduje. Stojí to skoro nic a vyrábí to vazbu. Máme *chtění*, ale nemáme *„tenhle je můj"*.

---

## 7. Živý zápas — co dělá dobře náš servis a co ne

Prvky, které tam jsou:

- **Skóre pinnuté nahoře** s časem a `● LIVE`, pod tím tenký proužek postupu čtvrtiny.
- **`WIN PROBABILITY` 58 % → 62 %** — jedna linka napětí, kterou lze číst boční viděním. Nemusíš číst log, abys věděl, jak to jde.
- **Rychlost `⏸ 1× 2× 4× 8× ⚡` a `Skip to final`**, a hned pod tím **vypsané klávesové zkratky**: `Space` play/pause · `↑↓` speed · `→` step · `Enter` skip.
- **`CALL THE PLAY`** — šest tlačítek, `AUTO` zeleně jako výchozí. Můžeš zasahovat, nemusíš.
- **Komentář** jako log: čas · štítek události (`+2`, `REB`, `SUB`, `FT`) · věta · skóre po ní.

> **Vzít dvě věci.** Zaprvé **spojitý ukazatel napětí** — u nás linka laťky s tím, kde se drží dnešní průměr. Zadarmo dramaturgie bez čtení. Zadruhé **rychlost a přeskočení natvrdo, ne jen klepnutí kamkoli** — a zkratky vypsat na obrazovku.

**Co naopak nekopírovat:** hřiště s tečkami. Naše hra je textová záměrně, bony jsou lepší nápad než animovaná půdorysná mapa kuchyně.

---

## 8. Struktura, kterou NEkopírovat

Hoops GM je **dashboard**: levý sidebar s dvanácti položkami, jdeš si věci hledat. To odpovídá hře na stovky hodin s otevřeným koncem.

**Tichý host je lineární** — 45 minut, jedna cesta, definitivní konec. Sidebar by nám uškodil: rozptýlil by pozornost od jediné věci, kterou má hráč večer udělat.

Co ale okopírovat **uvnitř večera**: celý herní večer u nich je **jeden svislý sloupec karet, seřazený podle důležitosti, zakončený primární akcí.** Žádné modály, žádné záložky.

```
Game night        ← kdo, kdy
What it's worth   ← co je v sázce
Storylines        ← proč to má šťávu
Scouting report   ← čtení + pojmenované odpovědi
Your starting five← kdo nastupuje
[Instant result] [TIP-OFF ▶]
```

Náš Pas má být přesně tohle:

```
Večer 14/40 · čtvrtek · 34 krytů      ← hlavička
Co je dnešek v sázce                   ← NOVÉ
Od maître (znaky) + Podezření          ← čtení
Posty (plotýnky) + Brigáda             ← rozpis
Jeden zásah večera                     ← pojmenované věty
[Rychlý výsledek] [Zahájit servis ▶]
```

---

## 9. Devět konkrétních věcí k převzetí, seřazeno podle poměru přínos/práce

| # | Co | Práce |
|---|---|---|
| 1 | **Trvalá horní lišta** se stavem večera a primární akcí na každé obrazovce | malá |
| 2 | **Karta „Co je dnešek v sázce"** — jedna věta a stavové slovo | malá |
| 3 | **Zásahy jako pojmenované věty**, seskupené podle významu | malá |
| 4 | **Značka „✕ Proti znakům"**, když volba odporuje čtení | malá |
| 5 | **Rychlost a přeskočení servisu** s vypsanými zkratkami | malá |
| 6 | **Spojitá linka napětí** během servisu (laťka vs. průběžný průměr) | střední |
| 7 | **Onboarding jako tři volby**, ne tutoriál | střední |
| 8 | **„Moje ruka"** — hráč určí kuchaře, kterého sleduje kronika | střední |
| 9 | **Reprezentace podle povahy dat** napříč celým UI, ne jen v triptychu | střední |

---

## 10. Jedna věc, kde jsme napřed

Jejich texty jsou dobré, ale **funkční**. Naše mají mít **hlas**:

> *„Ryba zůstal po servisu v kuchyni o dvacet minut dýl. Neuklízel."*

To Hoops GM neumí a ani se o to nepokouší. Když k jejich informační architektuře přidáme náš vypravěč a naši typografii, je to lepší produkt než obojí zvlášť. To je ta příležitost.
