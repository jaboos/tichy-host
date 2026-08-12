# Tichý host — vizuální brief + prompty pro Claude Design

> Art direction pro hru a hotový prompt pack k vložení do claude.ai/design.
>
> **ODMRAŽENO 12. 8. 2026.** Vizuální jazyk se předělává. Sekce 2 (tokeny), 3 (typografie),
> 7 (tři směry) a prompty V2/V3 níže jsou **historický záznam první iterace**, ne kánon —
> viz PRD §6.7. Co přežívá redesign, je **kontrakt názvů tokenů** (Prompt 0) a strukturní
> zadání jednotlivých obrazovek (Prompty 1–7): ty popisují, co má obrazovka umět, ne jak má
> vypadat.

---

## 1. Koncept: „Vytištěný podnik"

Hra je textová — slabinu otočíme v identitu. **Každá obrazovka je fyzická tiskovina podniku:** menu je tištěná karta, servis jsou bony z termotiskárny na pasu, rezervace jsou kniha, verdikt Lamberta je dopis s ražbou, Kronika je účtenka. Hráč nehraje „aplikaci o restauraci" — listuje papíry svého podniku při svíčce.

Proč to funguje: dává textu hmatatelnost bez jediné ilustrace, sjednocuje UI jednou metaforou (nic nevypadá jako generický dashboard), přirozeně nese českou i anglickou mutaci a je levné na implementaci (papír = karta + stín + textura šumu).

---

## 2. Design tokeny

| Token | Hodnota | Použití |
|---|---|---|
| `--bg` | `#14100D` | pozadí — tma sálu |
| `--card` | `#1F1915` | karta / papír ve tmě |
| `--card-hi` | `#2A221C` | zvednutá karta, hover |
| `--ink` | `#F5EFE7` | primární text |
| `--ink-muted` | `#A89A88` | sekundární text |
| `--brass` | `#D4A24C` | akcent, hvězdy, CTA |
| `--ok` | `#6FA36B` | prošlo, zisk |
| `--warn` | `#D9922E` | zátěž, riziko |
| `--bad` | `#C9503F` | vada, ztráta |
| `--line` | `#3A2F26` | bordery 1px, dividery |
| `--seal` | `#8C3B2E` | pečeť Lambert, vosk |

Stíny měkké a teplé (`rgba(0,0,0,.45)`), radius 10 px na kartách, 4 px na bonech. Papírová textura: 2% šum jako overlay, žádné skeuomorfní přehánění.

## 3. Typografie

- **Display / nadpisy / jména chodů: Cormorant Garamond** (SemiBold) — serif z jídelních lístků, plná česká diakritika.
- **UI / běžný text: Inter** — neviditelná, spolehlivá.
- **Čísla a bony: IBM Plex Mono** s `font-variant-numeric: tabular-nums` — čísla ve sloupcích se nesmí hýbat.
- Škála (mobil): 28 / 20 / 16 / 14 / 12. Řádkování 1,45. Minimální text 12 px.

## 4. Komponentní inventář

- **Bon (docket)** — srdce hry. Úzká karta s perforovaným horním okrajem, mono písmo, čas v rohu. Stavy: tiše cvakl (prošlo) · **zlatá ražba** (hvězdný talíř) · přeškrtnutý a padá (vada).
- **Karta stolu** — motiv značky: skládaná kartička „Rezervováno". Logo hry = karta stolu s obrysem prázdné židle.
- **Pečeť Lambert** — kruhová slepotisková ražba, vosková varianta pro verdikt. Animace: přitlačit → otisk.
- **Plotýnky** — bary zátěže postů jako čtyři kruhové plotýnky, které se rozžhavují (ok → warn → bad). Čitelné na 10 sekund testu *„co se dnes večer pokazí?"*.
- **Řádek kuchaře** — jméno (serif), tři čísla (mono), FORMA jako šipka, OPOTŘEBENÍ jako tenký proužek, vlastnost jako štítek. Jeden řádek, žádná tabulka atributů.
- **Mosazná linka** — divider s drobnou tečkou uprostřed, jediný ornament v celé hře.
- **Podezření** — kruhový budík 0–100 % s ikonkami znaků; slova od maître, čísla v tooltipu.
- **Tab bar** — `Kádr · Menu · Servis · Podnik · Scéna`, ikony 1,5px stroke (nůž, karta menu, zvonek, kasa, město).

## 5. Motion a zvuk

Pravidla pohybu: 150–250 ms, ease-out, žádné parallaxy. Čísla se dopočítávají (count-up 400 ms). Ražba = scale 1,15 → 1 s 2° rotací. Bony najíždějí zprava s 80 ms rozestupem. Reveal řadí chody podle napětí — nejnapjatější poslední.

Zvuk (WebAudio, 4 samply + mute): zvonek „service!", cvak termotiskárny per bon, šum sálu pod servisem, tupá ražba pečeti.

## 6. Obrazovky k navržení (7)

1. **Pas / rozpis** — jádro hry, mobil-first. Nahoře kniha rezervací (řádek), plotýnky zátěže, pod tím řádky kuchařů tažitelné na posty, dole jeden zásah večera + tlačítko „Servis".
2. **Servis / bonový reveal** — lišta pasu, bony najíždějí, mezisoučet, poslední bon = pointa. Skip klepnutím.
3. **Menu / skladba** — tištěná karta menu: 6 chodů jako řádky lístku (serif jména, mono čísla), sousedské vazby jako tenké oblouky mezi řádky (+3 úleva / −3 opakování), dole náklad na hosta a kapacita postů.
4. **Kalendář + kniha** — dva týdny dopředu, speciální večery jako vlepené lístky (svatba = krémový, kritik = novinový výstřižek), výzva týdne jako podepsaný kontrakt.
5. **Karta kuchaře** — profil: paradox v jedné větě, tři čísla, chtění jako dvoukroková karta questu, historie večerů jako řádka teček (✓ ✓ ★ ✕ ✓).
6. **Vyhlášení Lambert** — celoobrazovková ceremonie: obálka → dopis (serif, 250 slov max) → ražba pečeti → hvězda. Tři citovaná data z konkrétních večerů.
7. **Kronika / share karta** — účtenka z termotiskárny: podnik, seed, hvězdy, nejlepší chod, kuchař sezóny, řádek **Cena**. Tlačítka: zkopírovat text · stáhnout PNG.

## 7. Tři směry (pro průzkum variant)

- **V1 „Tiskárna bonů"** *(doporučený, popsaný výše)* — tmavý teplý papír při svíčce, navazuje na existující mockup, unese dlouhé večerní hraní.
- **V2 „Nerezová linka"** — chladná ocel, modrošedá + měď, industriální mono. Ostřejší, ale ztrácí teplo a intimitu fine diningu.
- **V3 „Stránky průvodce"** — světlý krémový papír, inkoust, červená stužka; celé UI jako listování průvodcem Lambert. Elegantní a odlišné, ale světlé UI hůř sedí k večernímu hraní a k „tichému" tónu.

Doporučení: V1 jako základ, z V3 si vzít jen obrazovku verdiktu (dopis na krémovém papíře = kontrast, který ceremonii zvedne).

---

## 8. Claude Design — workflow

Doporučený postup:

1. Na claude.ai/design založ projekt **Tichý host**.
2. Vlož **Prompt 0** (setup — tokeny a pravidla). Přilož screenshot existujícího Figma mockupu, ať má Claude kotvu.
3. Postupně vkládej prompty obrazovek (1–7). Vždy nech vygenerovat, pak iteruj komentáři přímo v canvasu („tady větší mezera", „tohle serif").
4. U Pasu a Servisu si vyžádej 2–3 varianty layoutu — to jsou dvě obrazovky, na kterých hra stojí.
5. Export: **standalone HTML** → pošli mi ho sem; přenesu vizuál do hratelného prototypu. (Logiku hry stejně píšu v kódu — z Claude Designu potřebujeme vzhled a komponenty, ne stavový stroj.)

Claude Design se navíc hodí na marketingové věci mimo hru: landing page, screenshoty do storu, social karty.

---

## 9. Prompt pack (kopíruj po jednom)

### Prompt 0 — setup projektu

```
Navrhuji vizuální identitu prohlížečové textové manažerské hry „Tichý host" (The Silent Guest).
Téma: fine dining restaurace, hráč je šéfkuchař-majitel a snaží se získat michelinskou hvězdu
od fiktivního průvodce Lambert. Hra je čistě textová — karty, seznamy, čísla. Mobil-first (390 px),
musí fungovat i na desktopu.

Koncept: „Vytištěný podnik" — každá obrazovka je fyzická tiskovina restaurace: menu je tištěná
karta, servis jsou bony z termotiskárny, verdikt průvodce je dopis s voskovou pečetí. Tmavý,
teplý, intimní vzhled — papír při svíčce, ne dashboard.

VÝSTUP: kromě návrhu vrať i hotový blok CSS custom properties.

Musí definovat přesně tyhle názvy (hodnoty si zvol podle svého návrhu,
názvy neměň — kód na ně sahá):
  --bg --card --card-hi --line
  --ink --ink-muted
  --brass --brass-hi --ok --warn --bad
  --brass-a35 --brass-a55 --bad-a45
  --radius-card --radius-docket --radius-chip --radius-pill
  --shadow-card --shadow-cta
  --font-display --font-ui --font-mono
  --fs-title --fs-h2 --fs-dish --fs-body --fs-small --fs-label --fs-micro
  --ls-label
  --col-width --pad-x --pad-top --pad-bottom
  --dur-base --dur-docket --ease-out

Nové proměnné přidávej, kolik chceš. Písma musí být dostupná přes
@fontsource (balíme je lokálně, žádné CDN).

`--brass` nemusí zůstat mosazná — je to prostě hlavní akcent. Ale ať
zůstane JEDEN hlavní akcent, ne tři.

Publikum: hráči Football Manageru a roguelite her (Balatro, Slay the Spire), 25–45 let,
hrají večer na mobilu nebo notebooku.

Zatím nic nenavrhuj — jen si ulož tenhle systém, další prompty budou jednotlivé obrazovky.
```

### Prompt 1 — Pas (rozpis večera)

```
Navrhni hlavní herní obrazovku „Pas" — rozpis kuchařů na posty před večerním servisem. Mobil 390 px.

Cíl: hráč do 10 sekund pozná, co se dnes večer pokazí, a do 40 sekund rozmístí lidi.

Layout shora dolů:
1. Hlavička: název podniku, večer 14/40, čtvrtek · 34 krytů. Vpravo nenápadný budík „Podezření 38 %"
   (kruhový indikátor — šance, že dnes večeří inspektor).
2. Řádek od maître kurzívou: „Stůl šest. Sám, u okna, ptal se na vodu z kohoutku."
3. Sekce „Posty": 4 posty (Studená kuchyně · Oheň · Omáčky · Dezerty) jako kruhové plotýnky,
   které se rozžhavují podle zátěže — zelená ok, jantarová plná, červená přetíženo s vlnícím žárem.
   U přetížené štítek PŘETÍŽENO.
4. Sekce „Brigáda": 6 kuchařů jako řádky — jméno serifem, tři čísla mono (RUKA/HLAVA/OHEŇ),
   tenký proužek opotřebení, štítek vlastnosti (např. „Nožířka"). Řádky se přetahují na posty.
   Jeden kuchař má varovný stav: „Marek dnes dvakrát přesolil základ." červeným podtónem.
5. Dole: „Jeden zásah večera" — 5 ikon vedle sebe (pochvala, seřvání, přesun, škrtnout chod,
   pozornost maître), vybrat lze jen jednu.
6. Fixní tlačítko „Zahájit servis" v mosazné.

Tón: tiché napětí před službou. Žádné veselé barvy, žádné gamifikační odznáčky.
```

### Prompt 2 — Servis (bonový reveal)

```
Navrhni obrazovku probíhajícího servisu — ceremonii odhalování výsledků. Mobil 390 px.

Cíl: 6–10 sekund napětí; každý chod se odhalí jako bon z termotiskárny na pasu.

Layout: nahoře tenká lišta pasu (kovová tyč s klipy). Bony (úzké karty s perforovaným horním
okrajem, mono písmo, čas v rohu) najíždějí zprava jeden po druhém s 80ms rozestupem:
- prošlý chod: bon tiše cvakne na místo, krátký zelený tik
- hvězdný talíř: přes bon se otiskne zlatá ražba ★, jemný záblesk
- vada: bon se přeškrtne červeně a spadne z lišty dolů
Pod lištou průběžný mezisoučet večera (velké mono číslo, dopočítává se). Úplně dole komentář
jednou větou: „Druhá vlna. Marek už třetí hodinu na ohni."
Poslední bon je vizuálně zvýrazněný — pointa večera.
Klepnutí kamkoli = přeskočit na výsledek.

Ukaž stav uprostřed revealu: 4 bony na liště (2 prošlé, 1 zlatý, 1 padající), 2 ještě čekají.
```

### Prompt 3 — Menu (tištěná karta)

```
Navrhni obrazovku skladby degustačního menu jako tištěnou kartu jídelního lístku. Mobil 390 px.

Cíl: hráč vidí menu jako elegantní lístek A5 na tmavém stole, ale s herními čísly po ruce.

Layout: karta menu (světlejší papír #1F1915 s texturou) uprostřed. 6 chodů jako řádky lístku:
název chodu Cormorantem (např. „Celer v popelu", „Kachna, demi-glace"), pod ním drobně mono:
post · náročnost · čas · náklad. Mezi sousedními chody tenké oblouky po straně: zelený oblouk
= chuťová úleva (+3), červený = opakování (−3). Jeden chod má mosazný štítek „podpisový".
Dole mimo kartu: souhrn — náklad na hosta 31 % (pásmo 28–34 ok), kapacita postů jako 4 mini
plotýnky, cena degustace 2 800 Kč s možností změny pásma.
Chody se přidávají ze zásobníku karet dole (horizontální scroll).

Tón: lístek, který bys chtěl dostat v podniku s hvězdou. Čísla decentně, jména jídel hlavní.
```

### Prompt 4 — Kalendář a rezervační kniha

```
Navrhni obrazovku kalendáře na 2 týdny dopředu s rezervační knihou. Mobil 390 px.

Layout: rozevřená kniha rezervací — řádky dní: den, počet krytů, plnost jako tečky.
Speciální večery jako vlepené lístky přes řádek: „SVATBA — 60 krytů, menu 5 chodů, dvojnásobná
tržba" na krémovém papírku; „KRITIK PRŮCHA" jako novinový výstřižek. Dnešek zvýrazněný mosazně.
Nahoře týdenní výzva jako podepsaný kontrakt s pečetí: „Celý týden nikoho nepřetížíš →
+8 000 Kč" a tlačítka Přijmout / Nechat být.
Dole řádek hotovosti a pověsti (malé mono, bez grafů).
```

### Prompt 5 — Karta kuchaře

```
Navrhni profil kuchaře jako personální kartu z papírové složky. Mobil 390 px.

Obsah: jméno velkým serifem (Ilona Bartáková), věk, post. Jedna věta paradoxu kurzívou:
„Nejlepší ruce v podniku a ví to. Nesnese, když jí někdo pomáhá."
Tři čísla velké mono: RUKA 3 · HLAVA 4 · OHEŇ 2. Forma šipkou, opotřebení proužkem.
Vlastnost jako štítek: „Nožířka — sama na postu +2, s pomocníkem −2".
Sekce „Chtění" jako dvoukroková questová karta: krok 1 „Nech ji 3× samotnou na rybách (2/3)"
s progress tečkami → odměna „Sólo+"; krok 2 zamčený, naznačený.
Historie večerů: řádka symbolů ✓ ✓ ★ ✕ ✓ ✓ ✓.
Dole akce: Povýšit · Přeřadit · Propustit (destruktivní decentně).
```

### Prompt 6 — Vyhlášení Lambert

```
Navrhni celoobrazovkovou ceremonii verdiktu průvodce Lambert — vrchol sezóny. Mobil 390 px.

Sekvence (navrhni klíčový snímek: rozložený dopis):
Krémový papír (jediná světlá obrazovka ve hře — kontrast!), nahoře slepotisk LAMBERT.
Dopis serifem, max 250 slov, cituje tři konkrétní večery. Pod textem vosková pečeť #8C3B2E
s ražbou, pod ní velká mosazná hvězda ★.
Dole dvě tlačítka: „Kronika sezóny" (mosazné) a „Nová sezóna" (tiché).

Tón: úřední dopis, na kterém závisí všechno. Žádné konfety, žádný „Congratulations!" —
jen papír, pečeť a hvězda.
```

### Prompt 7 — Kronika (share karta)

```
Navrhni sdílitelnou kartu výsledku sezóny jako účtenku z termotiskárny. Poměr 4:5 (Instagram),
ale navržená v mobilním rámci.

Obsah účtenky (mono písmo, perforované okraje, jemně zvlněný spodní okraj):
TICHÝ HOST · „U Dušana" · sezóna 1 · seed 7K3-MAREN
★ udělena v 8. týdnu
Nejlepší chod: Celer v popelu (17,2)
Kuchař sezóny: Ilona Bartáková — 14 servisů, 0 vad
Cena: Tobiáš Vrána odešel ve 13. večeru.
      Vzkaz: „Myslel jsem, že si to pamatuješ."
seed 7K3-MAREN — zahraj si stejnou kuchyni

Pod kartou tlačítka: Zkopírovat text · Stáhnout obrázek.
Účtenka musí vypadat dobře na screenshotu v cizím chatu — to je její jediný účel.
```

### Prompt V2 — alternativní směr „Nerezová linka"

```
Ulož si druhou variantu vizuálního systému a přegeneruj obrazovku Pas v ní:
chladná průmyslová kuchyně po zavíračce. Pozadí #101418 (modrošedá ocel), karty #1A2026,
text #EEF2F5, akcent měď #C87F4A, linky #2C353D. Typografie: Space Grotesk pro nadpisy,
IBM Plex Mono pro všechno ostatní — víc terminál než lístek. Ostré rohy (radius 2 px),
žádná papírová textura, místo bonů kovové štítky. Stejný obsah obrazovky jako u Pasu výše.
```

### Prompt V3 — alternativní směr „Stránky průvodce"

```
Ulož si třetí variantu a přegeneruj obrazovku Pas v ní: celé UI jako listování tištěným
průvodcem Lambert. Pozadí krémový papír #F2EAD9, inkoust #1C1710, akcent červená stužka
#A63B2A, zlacení #B08D3E. Cormorant Garamond výrazněji (i podnadpisy), Inter jen pro drobné UI.
Působí jako kniha: stránkové okraje, číslo strany, kapitálky. Stejný obsah obrazovky Pas.
```

Po vygenerování všech tří polož Claude Designu otázku: *„Ukaž všechny tři varianty Pasu vedle sebe a porovnej čitelnost čísel a náladu."* Vyber podle toho, u které chceš strávit 40 večerů.

---

## 10. Přístupnost

Kontrast `--ink` na `--bg` je ~14:1 (AAA). Zelenou/červenou vždy doprovodit tvarem (✓/✕, ražba/přeškrtnutí) kvůli barvosleposti. Minimální touch target 44 px. `prefers-reduced-motion`: vypnout kaskádu bonů, ukázat výsledek naráz.
