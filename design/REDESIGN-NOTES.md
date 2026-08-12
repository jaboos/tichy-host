# Redesign — stav rozpracovanosti

Poznámka pro pokračování. Zapsáno 2026-08-12, aby to nezůstalo jen v konverzaci.

## Kde jsou soubory

| co | kde |
|---|---|
| export Pasu z Claude Design | `design/redesign-pas/Pas.dc.html` |
| původní export (adresář se zmršeným názvem) | `design/# Pas — Večerní služba__…` — ke smazání |
| kompletní export všech obrazovek | `design/redesign.zip` nebo `design/redesign/` |
| živý design systém | `src/styles/tokens.css` |
| první iterace (historický záznam) | `design/tokens.css`, `design/*.dc.html` |

Prohlédnutí mockupu: `npx serve design/redesign-pas -l 5199`, pak
`http://localhost:5199/Pas.dc.html`. Přes `file://` to nefunguje — runtime volá
`fetch(location.href)` a tahá React z unpkg, takže je potřeba i síť.

## Token contract — export ho splňuje

Všech 50 jmen z PRD §6.7 je v exportu definovaných, všech 12 keyframes taky.
Písma sahají jen přes proměnné, žádná natvrdo.

Přidané nad rámec kontraktu, vzít s sebou:

    --fs-num  --fs-num-lg  --fs-num-sm    vlastní stupnice pro čísla
    --hit: 48px                            minimální dotykový cíl

Změna proporcí, která stojí za zmínku: `--fs-title` 29 → 21 px,
`--fs-h2` 20 → 13 px, ale přibylo `--fs-num-lg: 40px`. Nadpisy se zmenšily
a **čísla se stala titulkem**. Pro hru o číslech je to správně.

Výměna písem: Cormorant Garamond → **Spectral**, Inter → **Public Sans**.
Obojí je na `@fontsource`, IBM Plex Mono zůstává. Znamená to výměnu dvou
balíčků v `package.json` a importů v `src/main.tsx`.

## PĚT OTEVŘENÝCH ROZHODNUTÍ — bez nich se stavět nedá

Návrh ukazuje pojmy a čísla, které engine nepočítá.

1. **Jména postů.** Návrh: *Předkrmy · Ryba · Maso · Dezerty*.
   Skutečnost: *Studená kuchyně · Oheň · Omáčky · Dezerty*.
   V exportu se „Studená", „Oheň" ani „Omáčky" nevyskytují ani jednou.
   `Station = 'cold' | 'fire' | 'sauce' | 'dessert'` je v enginu, datech
   i v zamrzlém golden pásmu.

2. **„Ryba" je v návrhu název postu**, ale je to jeden ze šesti kuchařů
   startovní brigády (Marek Ryba, PRD §4.2). Kolize zůstane, i kdyby se
   posty přejmenovaly.

3. **„cíl 15,0" u laťky.** Engine žádnou cílovou laťku nemá. Práh hvězdného
   talíře je laťka + 7,5, tedy pro laťku 14,6 hodnota 22,1 — ne 15,0.

4. **Rozpad laťky nesedí a obsahuje zakázanou mechaniku.**
   Návrh: *Základ sezóny · Očekávání od stolů · Únava kuchyně · Dvě vady v řadě*.
   Skutečnost: *základ · ambice menu · týden · pověst · sezóna · souhra*.
   Opotřebení do laťky nevstupuje vůbec (jde do kvality talíře).
   „Dvě vady v řadě" znamená, že laťka reaguje na čerstvý neúspěch — to je
   gumování, které v4 §14 škrtlo jako „skrytou laskavost" a CLAUDE.md
   pravidlo 6 zakazuje. Tohle nestavět.

5. **Chybí „Bez zásahu".** Hlavička říká „1 ze 6" a jedna volba je vždy
   vybraná. PRD §3.5 ale říká „selection is required-optional (may choose
   none)". Buď sedmá dlaždice, nebo změna §3.5.

Drobnost: verdikt v mockupu překrývá kartu nad sebou. Layoutová chyba
mockupu, při portu zmizí.

## Co z návrhu převzít, protože je to lepší než současný stav

- zaškrtávátko na kartách zásahů místo „✓" za názvem
- `KLID` / `NAPJATO` pod ciferníkem podezření — barva přestává být jediným
  nositelem významu
- text verdiktu: „Kuchyně drží. Ryba jede sama a bez pomocníka na stropu."
  je lepší než současné „Dnes nic nehoří."
- počítadlo „1 ze 6" v hlavičce zásahů

## Hotovo (commit f411c84)

Body 1–3 z analýzy Hoops GM, všechno text a logika, restyl je nepřepíše:

1. každý zásah nese svůj obchod na kartě, bez klepnutí
2. glosář `?` u dvanácti pojmů — definice **plus oprava omylu**, ke kterému
   pojem svádí (laťka není skóre, opotřebení není nálada, přetížení je plot)
3. verdikt večera nad CTA, hlásí nejhorší nález v pořadí
   bez vedoucího → přetížený → zkušební večer → nekrytý → na stropu → klid

129 testů zelených, build 79 kB gzip.

## Zadrženo do příchodu návrhů

Body 4–6, protože by se stavěly dvakrát:

4. chipy → velká tlačítka (teď na to existuje token `--hit`)
5. volba rychlosti před servisem, ne až uvnitř kaskády
6. onboarding rozdělený na tři beaty

## Dluh, na který jsem narazil při portu

`--stagger` je 80 ms v `tokens.css` a zároveň `const STAGGER_MS = 80`
v `src/screens/Service.tsx`. Dvě pravdy o jednom čísle. Návrh mění stagger
na 60 ms, takže se to musí srovnat při portu, jinak JS zůstane na osmdesáti.
