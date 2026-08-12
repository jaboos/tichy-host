# Redesign — stav rozpracovanosti

Poznámka pro pokračování. Přepsáno 2026-08-12 po příchodu kompletního exportu.

## PORT PROBĚHL

Vizuál je v aplikaci. Osm rozhodnutí dole je vyřešených takto:

| # | rozhodnutí | jak je to postavené |
|---|---|---|
| 1 | jména postů | **Studená · Oheň · Omáčky · Dezerty**, jednoslovně; přibyl lokál `station.*.at` |
| 2 | „Ryba" | odpadlo, žádný post se tak nejmenuje |
| 3 | „cíl 15,0" | **nestavěno**; místo něj `hvězda od {laťka + 7,5}`, což engine počítá |
| 4 | rozpad laťky | **šest skutečných členů**; „Únava kuchyně" ani „Včerejší vada" ne — gumování zakazuje pravidlo 6 |
| 5 | „bez zásahu" | odklepnutím zaškrtávátka; počítadlo hlásí `žádný` |
| 6 | „SEED" | opraveno na **Kód kuchyně** (bylo to i v našem `app.seedLabel`, ne jen v návrhu) |
| 7 | „Slib sálu" | nahrazen pojmenováním podniku, tříbeatový onboarding zůstal |
| 8 | šest bez návrhu | dopočítáno analogií; lišta zůstala, spodní oblast je nově `sticky` dok |

**Co se nepřeneslo a proč:** Lambertovy odstavce na verdiktu. Text dopisu generuje
`narrator.ts` ze skutečných událostí sezóny a to je fáze 4. Papír, pečeť, pořadí
pečeť → hvězda a patička s kódem kuchyně stojí; obsah je zatím poctivá čísla.

**Nálezy z prohlížeče, ne z testů** (všechny opravené): dok se v centrovaném flex
sloupci smrskl na šířku obsahu · dok byl uvnitř centrujícího bloku, takže ho
`justify-content` táhl doprostřed · `ODOLNOST`/`CHTĚNÍ` se znovu slily, protože
`--fs-micro` vyrostl 7,5 → 9,5 px · výběr kuchaře i výběr cíle se otevíraly pod
dokem a klepnutí vypadalo jako nic · „Vad dnes" bylo na Následku dvakrát ·
„KDO NA STUDENÁ" měl špatný pád.

Zbývá z dřívějška: `pnpm test` 129 zelených, žebřík beze změny, build 81 kB gzip.

## Kde jsou soubory

| co | kde |
|---|---|
| **kompletní export, jedenáct obrazovek** | `design/redesign/Tichý host - přehled.dc.html` |
| samostatný Pas | `design/redesign/Tichý host - Pas.dc.html` |
| živý design systém | `src/styles/tokens.css` |
| první iterace (historický záznam) | `design/tokens.css`, `design/*.dc.html` |

Prohlédnutí: `npx serve design/redesign -l 5210`, pak
`http://localhost:5210/Tichý host - přehled.dc.html`. Přes `file://` to nefunguje —
runtime volá `fetch(location.href)` a tahá React z unpkg, takže je potřeba i síť.

Obrazovky v exportu: `1a` `1b` Pas · `2a` výběr kuchaře · `3a` přitlačit ·
`4a` `4b` `4c` onboarding · `5a` servis · `5b` následek · `6a` `6b` verdikt.

## Token contract — splněn beze zbytku

Všech **50** jmen z PRD §6.7 je definovaných, všech **12** keyframes taky.
Písma sahají jen přes proměnné.

Přidané nad rámec kontraktu, vzít s sebou:

    --fs-num: 26px  --fs-num-lg: 40px  --fs-num-sm: 13px   stupnice pro čísla
    --hit: 48px                                            minimální dotykový cíl
    --rail: linear-gradient(…)                             kovová lišta na bony
    @keyframes spad                                        bon pod laťkou spadne z lišty

**Není to delta, je to výměna celé palety.** Liší se prakticky každá hodnota:
`--bg` #14100d → #0E0D0B, `--radius-card` 10 → 14, `--radius-docket` 4 → 10,
`--radius-pill` 8 → 999, `--pad-x` 20 → 16, `--pad-top` 22 → 14,
`--dur-count` 520 → 900 ms, `--stagger` 80 → 60 ms, `--ls-mono` .08 → .02,
obě křivky `--ease-*`. Protože komponenty sahají na tokeny jménem, je to jeden soubor.

Proporce: `--fs-title` 29 → 21 px, `--fs-h2` 20 → 13 px, ale přibylo
`--fs-num-lg: 40px`. Nadpisy se zmenšily a **čísla se stala titulkem**.
Pro hru o číslech je to správně.

Výměna písem: Cormorant Garamond → **Spectral**, Inter → **Public Sans**.
Obojí na `@fontsource`, IBM Plex Mono zůstává. Dva balíčky v `package.json`
a importy v `src/main.tsx`.

Devět natvrdo psaných velikostí písma v sedmi souborech (`BarIndicator`,
`Docket` ×2, `Service`, `SuspicionDial`, `StationDisk`, `Onboarding` ×2,
`Verdict`) je přesně to, co `--fs-num*` nahradí.

## Rozhodnutí — dvě vyřešena, tři otevřená, tři nová

### ✅ 1. Jména postů — vyřešeno
Nově *Předkrmy · Oheň · Omáčky · Dezerty*. Tři ze čtyř sedí doslova na
`fire` / `sauce` / `dessert`. Zbývá jediné slovo: `cold` je v návrhu
**Předkrmy**, u nás **Studená kuchyně**.

### ✅ 2. Kolize „Ryba" — vyřešena
Žádný post se tak nejmenuje. Jména kuchařů v mockupu (Havel, Klein, Doubrava,
Nezval, Roubalová) jsou vymyšlená a Bartáková má cizí post i ruku — to je ale
obsah mockupu, ne kontrakt. Port dosadí skutečná data.

### ❌ 3. „cíl 15,0" u laťky — trvá
Engine žádnou cílovou laťku nemá. Práh hvězdného talíře je laťka + 7,5.

### ❌ 4. Rozpad laťky nesedí a obsahuje zakázanou mechaniku — trvá
Návrh: *Základ sezóny · Očekávání od stolů · Únava kuchyně · Včerejší vada*
(na 1b *Dvě vady v řadě*).
Skutečnost: *základ · ambice menu · týden · pověst · sezóna · souhra*.
Opotřebení do laťky nevstupuje vůbec. „Včerejší vada" znamená, že laťka
reaguje na čerstvý neúspěch — gumování, které v4 §14 škrtlo a CLAUDE.md
pravidlo 6 zakazuje. **Nestavět.**

### ✅ 5. „Bez zásahu" — vyřešitelné bez zásahu do návrhu
Zaškrtávátko se odklepnutím vypne (`sel = on ? null : c.key`), takže
„nevybrat nic" je dosažitelné. Stačí, aby počítadlo „1 ze 6" bylo dynamické.

### 🆕 6. Na verdiktu je natvrdo napsáno „SEED"
Porušuje PRD §3.10 a glosář v CLAUDE.md („never write 'seed' in the UI").
Má být **KÓD KUCHYNĚ**.

### 🆕 7. „Slib sálu" (4b) je třináctý pojem
V PRD není. §5 říká, že onboarding je *pojmenovat podnik, poznat brigádu,
zamčený plán prvního týdne*. Návrh navíc **pole na jméno podniku úplně
vypustil**. Buď 4b nahradit pojmenováním podniku, nebo změnit PRD.

### 🆕 8. Nikde není spodní lišta
Šest obrazovek nedostalo návrh vůbec: **Menu, Kalendář, Kádr, Karta kuchaře,
Pondělní plán, Kronika**. A v exportu není žádná navigace — `--pad-bottom: 150px`
počítá s verdiktem + CTA + druhotným tlačítkem, bez lišty pod tím.

Drobnosti mockupu, které při portu zmizí: verdikt na 1a leze pod gradient CTA,
pečeť na 6a překrývá podpis.

## Co z návrhu převzít, protože je to lepší než současný stav

- **bony ukazují odchylku od laťky**, ne absolutní kvalitu (`+0,9` / `−0,6 POD`);
  vadný bon je přeškrtnutý a spadne z lišty (`spad`)
- trik na dotykový cíl: `height: var(--hit); width: 26px; margin: -14px 0`
  dá 48 px bez zásahu do layoutu
- `KLID` / `NAPJATO` pod ciferníkem — barva přestává být jediným nositelem významu
- karty přitlačení nesou ★ i vadu jako `z → na` vedle sebe
- **„Rovnou výsledek"** jako druhotné tlačítko pod CTA = volba rychlosti před
  servisem (bod 5 ze zadrženého seznamu)
- tříbeatový onboarding (bod 6)
- zaškrtávátko na kartách zásahů (část bodu 4)
- počítadlo „1 ze 6" v hlavičce zásahů

## Hotovo (commit f411c84)

Body 1–3 z analýzy Hoops GM, všechno text a logika, restyl je nepřepíše:

1. každý zásah nese svůj obchod na kartě, bez klepnutí
2. glosář `?` u dvanácti pojmů — definice **plus oprava omylu**
3. verdikt večera nad CTA

129 testů zelených, build 79 kB gzip.

## Dluh, který port smazal

`--stagger` byl 80 ms v `tokens.css` a zároveň `const STAGGER_MS = 80`
v `src/screens/Service.tsx`. Dvě pravdy o jednom čísle. Konstanta je pryč;
`Service` teď hodnotu čte z CSS proměnné, `Docket` počítá zpoždění přes
`calc(var(--stagger) * i)`. Fallback je 0, ne číslo — jinak by se
druhá pravda tiše vrátila.

Stejným způsobem zmizel `CTA_HEIGHT = 86` z `App.tsx`: spodní dok je `sticky`
a v toku, takže si výšku rezervuje sám a nikdo ji nemusí odhadovat.
