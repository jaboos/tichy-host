/**
 * The source dictionary. PRD FR-16, CLAUDE.md rule 9.
 *
 * Czech is written here first and English is derived from it, never the other way
 * round — the game's voice is Czech and the kitchen vocabulary (laťka, pas, bon,
 * chtění) has no clean English equivalent.
 *
 * `TKey` is derived from this object, so a key that exists here and nowhere else
 * is a compile error in `en.ts`, and a key that exists in neither is a compile
 * error at the call site.
 *
 * Placeholders are `{name}` and are substituted by `t()`.
 */
export const cs = {
  // --- app ------------------------------------------------------------------
  'app.title': 'Tichý host',
  'app.tagline': 'Průvodce Lambert nikdy neřekne, kdy přijde.',

  // --- glossary — the twelve concepts (v4 §14) -------------------------------
  'common.bar': 'laťka',
  'common.plateQuality': 'kvalita talíře',
  'common.hand': 'ruka',
  'common.homeStation': 'domovský post',
  'common.wear': 'opotřebení',
  'common.endurance': 'odolnost',
  'common.difficulty': 'náročnost',
  'common.overload': 'přetížení',
  'common.crowding': 'tlačenice',
  'common.harmony': 'souhra',
  'common.capacity': 'kapacita',
  'common.suspicion': 'podezření',
  'common.covers': 'kryty',
  'common.reputation': 'pověst',
  'common.cash': 'hotovost',
  'common.desire': 'chtění',
  'common.station': 'post',
  'common.lead': 'vedoucí',
  'common.helper': 'pomocník',
  'common.resting': 'volno',
  'common.pushTokens': 'žetony',
  'common.premium': 'prémiové suroviny',
  'common.none': '—',

  // --- stations -------------------------------------------------------------
  'station.cold': 'Studená kuchyně',
  'station.fire': 'Oheň',
  'station.sauce': 'Omáčky',
  'station.dessert': 'Dezerty',

  // --- flavours -------------------------------------------------------------
  'flavour.earthy': 'zemitá',
  'flavour.sour': 'kyselá',
  'flavour.meaty': 'masitá',
  'flavour.dairy': 'mléčná',
  'flavour.sweet': 'sladká',

  // --- endurance ------------------------------------------------------------
  'endurance.lasts': 'Vydrží',
  'endurance.normal': 'Normál',
  'endurance.burns': 'Rychle hoří',

  // --- plate outcomes -------------------------------------------------------
  'outcome.defect': 'vada',
  'outcome.passed': 'prošlo',
  'outcome.star': 'hvězdný talíř',
  'outcome.belowBar': 'POD',

  // --- interventions — PRD §3.5 ---------------------------------------------
  'intervention.praise.name': 'Pochvala',
  'intervention.praise.desc': 'Jednomu kuchaři ubere dnes večer 1,5 opotřebení.',
  'intervention.scold.name': 'Seřvání',
  'intervention.scold.desc':
    'Post dnes uvaří o 0,5 lépe. Jeho vedoucí za to zaplatí 1,5 opotřebení.',
  'intervention.swap.name': 'Přesun',
  'intervention.swap.desc': 'Přehodí jednoho kuchaře oproti pondělnímu rozpisu.',
  'intervention.cutCourse.name': 'Škrtnout chod',
  'intervention.cutCourse.desc': 'Chod dnes nejde ven. Počítá se jako vada.',
  'intervention.deferRest.name': 'Odložit volno',
  'intervention.deferRest.desc': 'Dnešní volno propadá a vrátí se později. Fronta má strop dva.',
  'intervention.push.name': 'Přitlačit',
  'intervention.push.desc':
    'Post uvaří o 2,5 lépe, ale rozptyl je dvojnásobný a vedoucí přibere 2 opotřebení.',
  'intervention.push.cost': 'Stojí jeden z pěti mosazných žetonů na sezónu.',

  // --- traits — PRD §4.2 a §6.5 ---------------------------------------------
  'trait.none.name': 'Bez vlastnosti',
  'trait.none.desc': 'Nic zvláštního. Vaří přesně tak, jak říkají čísla.',
  'trait.nozirka.name': 'Nožířka',
  'trait.nozirka.desc': 'Sama na postu vaří o 2 lépe. S pomocníkem o 2 hůř.',
  'trait.sampion.name': 'Šampión',
  'trait.sampion.desc': 'První dva chody o 3 lépe, poslední dva o 3 hůř.',
  'trait.klidnaRuka.name': 'Klidná ruka',
  'trait.klidnaRuka.desc': 'Rozptyl na jejím postu je jen sedmdesátiprocentní.',
  'trait.ucednice.name': 'Učednice',
  'trait.ucednice.desc': 'Roste dvakrát rychleji — prahy čistých večerů má poloviční.',
  'trait.cteListky.name': 'Čte lístky',
  'trait.cteListky.desc': 'Druhá vlna jí jde o 0,5 lépe.',
  'trait.vydrziZar.name': 'Vydrží žár',
  'trait.vydrziZar.desc': 'První dva stupně opotřebení na ni neplatí.',
  'trait.raniPtace.name': 'Ranní ptáče',
  'trait.raniPtace.desc': 'První vlna mu jde o 0,5 lépe.',
  'trait.perfekcionista.name': 'Perfekcionista',
  'trait.perfekcionista.desc': 'Náročné chody o 1 lépe, jednoduché o 0,5 hůř. Nudu nesnáší.',
  'trait.tahoun.name': 'Tahoun',
  'trait.tahoun.desc': 'Jako pomocník odvede práci za dva.',
  'trait.hazardniHrac.name': 'Hazardní hráč',
  'trait.hazardniHrac.desc': 'Vaří o 0,8 lépe, ale rozptyl má o čtyřicet procent vyšší.',
  'trait.domaZustava.name': 'Doma je doma',
  'trait.domaZustava.desc': 'Na domovském postu o 1,5 lépe, na cizím o 1,5 hůř.',
  'trait.tichaVoda.name': 'Tichá voda',
  'trait.tichaVoda.desc': 'Když je post přetížený, vaří o 1 lépe. Tlak jí svědčí.',

  // --- signals — PRD §3.8. The four with LR > 1 correlate with the inspector.
  'signal.aloneByWindow': 'Host sám u okna, bez telefonu.',
  'signal.tapWater': 'Objednal si vodu z kohoutku a ptal se, odkud je.',
  'signal.declinedPairing': 'Odmítl párování a vybral si víno sám.',
  'signal.notebook': 'Zůstal na kávu a psal si do papírového bloku.',
  'signal.photographedPlates': 'Fotil si každý chod.',
  'signal.askedForChef': 'Chtěl pozdravit šéfkuchaře.',
  'signal.largeParty': 'Přišla společnost šesti lidí, hlučná.',
  'signal.expensiveWine': 'Objednal nejdražší víno na lístku.',
  'signal.earlyDeparture': 'Odešel před dezertem.',

  // --- courses — PRD §3.6 ---------------------------------------------------
  'course.celeroveCarpaccio.name': 'Celerové carpaccio',
  'course.tatarakZJelena.name': 'Tatarák z jelena',
  'course.nakladanaJikra.name': 'Nakládaná pstruží jikra',
  'course.krenAKedlubna.name': 'Křen a kedlubna',
  'course.uzenyUhor.name': 'Uzený úhoř s jablkem',
  'course.kysleMlekoBylinky.name': 'Kyselé mléko s bylinkami',
  'course.syrovaKapusta.name': 'Syrová kapusta se sýrem',
  'course.ustriceSOctem.name': 'Ústřice s vinným octem',
  'course.kachniPrsaNaUhli.name': 'Kachní prsa na uhlí',
  'course.grilovanyPorek.name': 'Grilovaný pórek',
  'course.jehneciHrbet.name': 'Jehněčí hřbet',
  'course.holubNaSene.name': 'Holub na seně',
  'course.pecenyCeler.name': 'Pečená celerová bulva',
  'course.zverinovySteak.name': 'Zvěřinový steak',
  'course.candatNaKuzi.name': 'Candát na kůži',
  'course.kvetakZPece.name': 'Květák z pece',
  'course.demiGlace.name': 'Demi-glace z kostí',
  'course.beurreBlanc.name': 'Beurre blanc',
  'course.kminovaJiska.name': 'Kmínová jíška',
  'course.hollandaise.name': 'Hollandaise s estragonem',
  'course.redukceZVina.name': 'Redukce z červeného vína',
  'course.smetanovaKrenova.name': 'Smetanová křenová',
  'course.houboveJus.name': 'Houbové jus',
  'course.tvarohovyKrem.name': 'Tvarohový krém s medem',
  'course.svestkovyKolac.name': 'Švestkový koláč',
  'course.karameloveSufle.name': 'Karamelové suflé',
  'course.bezinkovySorbet.name': 'Bezinkový sorbet',
  'course.pernikSeSmetanou.name': 'Perník se smetanou',
  'course.jablecnyZavin.name': 'Jablečný závin',
  'course.cokoladaOlivovyOlej.name': 'Čokoláda a olivový olej',

  // --- cook paradoxes — one sentence on the card, PRD §4.1 -------------------
  'cook.bartakova.paradox': 'Nejlepší omáčky vaří v tichu, a v kuchyni ticho nikdy není.',
  'cook.ryba.paradox': 'Umí to nejlíp ze všech a nejdřív ze všech toho nechá.',
  'cook.vanous.paradox': 'Nikdy se neseknul a nikdy nikoho neohromil.',
  'cook.kesslerova.paradox': 'Učí se rychleji, než jí kdo stačí ukazovat.',
  'cook.hruba.paradox': 'Ví, co host chce, dřív než host. Říct si o post neumí.',
  'cook.brichtova.paradox': 'Snese žár celý večer a doma nezapálí ani svíčku.',
  'cook.dolezal.paradox': 'Buď to bude nejlepší talíř večera, nebo popel.',
  'cook.novakova.paradox': 'Perfektní talíř umí. Šest perfektních talířů za sebou ne.',
  'cook.simek.paradox': 'Doma je král. O post vedle se nezajímá.',
  'cook.kolar.paradox': 'Dvacet let dezertů a pořád ochutnává lžičkou.',
  'cook.sykorova.paradox': 'Odvede práci za dva a přihlásí se o půlku.',
  'cook.benes.paradox': 'Ráno je nejlepší kuchař v Praze. Ve dvacet třicet unavený člověk.',
  'cook.malkova.paradox': 'Ruka klidná, hlava ne.',
  'cook.zeman.paradox': 'Zvládne to, co ostatní neunesou, a nikdy o tom neřekne.',
  'cook.rehorova.paradox': 'Ptá se tak dlouho, až se to naučí. To zdržuje.',
  'cook.prochazka.paradox': 'Začne rychle a doufá, že večer skončí dřív než on.',
  'cook.vlckova.paradox': 'Přečte sál a nepřečte vlastní rozpis.',
  'cook.sedlacek.paradox': 'Nejradši sám. Pomocník mu překáží víc, než pomůže.',
  'cook.jandova.paradox': 'Náročný chod ji drží. Jednoduchý ji uspí.',
  'cook.bilek.paradox': 'Čím větší tlak, tím rovnější ruka. V klidu se nudí.',
  'cook.krejci.paradox': 'V šest ráno geniální, v deset večer vyhořelý.',
  'cook.zelena.paradox': 'Riskuje, protože ještě neví, co se dá pokazit.',
  'cook.hruska.paradox': 'Nic neumí a udělá pro tebe cokoliv.',
  'cook.peroutkova.paradox': 'Na svém postu roste. Kdekoliv jinde se ztratí.',
} as const;

/** Every valid translation key. A typo is a compile error. */
export type TKey = keyof typeof cs;
