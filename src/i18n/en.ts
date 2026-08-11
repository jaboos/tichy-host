/**
 * English dictionary. PRD FR-16.
 *
 * `satisfies Record<TKey, string>` is doing real work here: a missing key fails to
 * compile because the record is total, and an extra key fails the excess-property
 * check on the object literal. `tests/i18n.test.ts` enforces the same thing at
 * runtime so the pair cannot drift.
 *
 * Phase 4 revisits the wording; the kitchen terms are the risky ones. `bar` for
 * *laťka* and `pass` for *pas* are the two that carry the most weight.
 */
import type { TKey } from './cs';

export const en = {
  // --- app ------------------------------------------------------------------
  'app.title': 'The Silent Guest',
  'app.tagline': 'The Lambert Guide never says when it is coming.',

  // --- glossary -------------------------------------------------------------
  'common.bar': 'bar',
  'common.plateQuality': 'plate quality',
  'common.hand': 'hand',
  'common.homeStation': 'home station',
  'common.wear': 'wear',
  'common.endurance': 'endurance',
  'common.difficulty': 'difficulty',
  'common.overload': 'overload',
  'common.crowding': 'crowding',
  'common.harmony': 'harmony',
  'common.capacity': 'capacity',
  'common.suspicion': 'suspicion',
  'common.covers': 'covers',
  'common.reputation': 'reputation',
  'common.cash': 'cash',
  'common.desire': 'desire',
  'common.station': 'station',
  'common.lead': 'lead',
  'common.helper': 'helper',
  'common.resting': 'resting',
  'common.pushTokens': 'tokens',
  'common.premium': 'premium ingredients',
  'common.none': '—',

  // --- stations -------------------------------------------------------------
  'station.cold': 'Cold kitchen',
  'station.fire': 'Fire',
  'station.sauce': 'Sauces',
  'station.dessert': 'Desserts',

  // --- flavours -------------------------------------------------------------
  'flavour.earthy': 'earthy',
  'flavour.sour': 'sour',
  'flavour.meaty': 'meaty',
  'flavour.dairy': 'dairy',
  'flavour.sweet': 'sweet',

  // --- endurance ------------------------------------------------------------
  'endurance.lasts': 'Lasts',
  'endurance.normal': 'Normal',
  'endurance.burns': 'Burns fast',

  // --- plate outcomes -------------------------------------------------------
  'outcome.defect': 'defect',
  'outcome.passed': 'passed',
  'outcome.star': 'star plate',
  'outcome.belowBar': 'UNDER',

  // --- interventions --------------------------------------------------------
  'intervention.praise.name': 'Praise',
  'intervention.praise.desc': 'Takes 1.5 wear off one cook for tonight.',
  'intervention.scold.name': 'Dressing-down',
  'intervention.scold.desc': 'One station cooks 0.5 better tonight. Its lead pays 1.5 wear.',
  'intervention.swap.name': 'Swap',
  'intervention.swap.desc': 'Move one cook against the Monday plan.',
  'intervention.cutCourse.name': 'Cut a course',
  'intervention.cutCourse.desc':
    'The course does not leave the pass tonight. It counts as a defect.',
  'intervention.deferRest.name': 'Defer rest',
  'intervention.deferRest.desc':
    "Tonight's rest is cancelled and returned later. The queue caps at two.",
  'intervention.push.name': 'Push',
  'intervention.push.desc':
    'The station cooks 2.5 better, but variance doubles and its lead takes 2 wear.',
  'intervention.push.cost': 'Costs one of five brass tokens for the season.',

  // --- traits ---------------------------------------------------------------
  'trait.nozirka.name': 'Knife hand',
  'trait.nozirka.desc': 'Alone on a station she cooks 2 better. With a helper, 2 worse.',
  'trait.sampion.name': 'Champion',
  'trait.sampion.desc': 'First two courses 3 better, last two 3 worse.',
  'trait.klidnaRuka.name': 'Steady hand',
  'trait.klidnaRuka.desc': 'Variance on his station is only seventy per cent.',
  'trait.ucednice.name': 'Apprentice',
  'trait.ucednice.desc': 'Grows twice as fast — her clean-evening thresholds are halved.',
  'trait.cteListky.name': 'Reads the room',
  'trait.cteListky.desc': 'The second wave goes 0.5 better for her.',
  'trait.vydrziZar.name': 'Takes the heat',
  'trait.vydrziZar.desc': 'The first two points of wear do not touch her.',
  'trait.raniPtace.name': 'Early bird',
  'trait.raniPtace.desc': 'The first wave goes 0.5 better for him.',
  'trait.perfekcionista.name': 'Perfectionist',
  'trait.perfekcionista.desc':
    'Difficult courses 1 better, easy ones 0.5 worse. Boredom is the enemy.',
  'trait.tahoun.name': 'Workhorse',
  'trait.tahoun.desc': 'As a helper she does the work of two.',
  'trait.hazardniHrac.name': 'Gambler',
  'trait.hazardniHrac.desc': 'Cooks 0.8 better, with forty per cent more variance.',
  'trait.domaZustava.name': 'Home is home',
  'trait.domaZustava.desc': '1.5 better on his home station, 1.5 worse anywhere else.',
  'trait.tichaVoda.name': 'Still waters',
  'trait.tichaVoda.desc': 'When the station is overloaded he cooks 1 better. Pressure suits him.',

  // --- signals --------------------------------------------------------------
  'signal.aloneByWindow': 'A guest alone by the window, no phone.',
  'signal.tapWater': 'Ordered tap water and asked where it came from.',
  'signal.declinedPairing': 'Declined the pairing and picked the wine himself.',
  'signal.notebook': 'Stayed for coffee and wrote in a paper notebook.',
  'signal.photographedPlates': 'Photographed every course.',
  'signal.askedForChef': 'Asked to greet the chef.',
  'signal.largeParty': 'A party of six came in, loud.',
  'signal.expensiveWine': 'Ordered the most expensive wine on the list.',
  'signal.earlyDeparture': 'Left before dessert.',

  // --- courses --------------------------------------------------------------
  'course.celeroveCarpaccio.name': 'Celeriac carpaccio',
  'course.tatarakZJelena.name': 'Venison tartare',
  'course.nakladanaJikra.name': 'Cured trout roe',
  'course.krenAKedlubna.name': 'Horseradish and kohlrabi',
  'course.uzenyUhor.name': 'Smoked eel with apple',
  'course.kysleMlekoBylinky.name': 'Soured milk with herbs',
  'course.syrovaKapusta.name': 'Raw kale with cheese',
  'course.ustriceSOctem.name': 'Oysters with wine vinegar',
  'course.kachniPrsaNaUhli.name': 'Duck breast over coals',
  'course.grilovanyPorek.name': 'Grilled leek',
  'course.jehneciHrbet.name': 'Saddle of lamb',
  'course.holubNaSene.name': 'Pigeon on hay',
  'course.pecenyCeler.name': 'Whole roast celeriac',
  'course.zverinovySteak.name': 'Game steak',
  'course.candatNaKuzi.name': 'Pike-perch, skin down',
  'course.kvetakZPece.name': 'Cauliflower from the oven',
  'course.demiGlace.name': 'Bone demi-glace',
  'course.beurreBlanc.name': 'Beurre blanc',
  'course.kminovaJiska.name': 'Caraway roux',
  'course.hollandaise.name': 'Hollandaise with tarragon',
  'course.redukceZVina.name': 'Red wine reduction',
  'course.smetanovaKrenova.name': 'Creamed horseradish',
  'course.houboveJus.name': 'Mushroom jus',
  'course.tvarohovyKrem.name': 'Curd cream with honey',
  'course.svestkovyKolac.name': 'Plum tart',
  'course.karameloveSufle.name': 'Caramel soufflé',
  'course.bezinkovySorbet.name': 'Elderflower sorbet',
  'course.pernikSeSmetanou.name': 'Gingerbread and cream',
  'course.jablecnyZavin.name': 'Apple strudel',
  'course.cokoladaOlivovyOlej.name': 'Chocolate and olive oil',

  // --- cook paradoxes -------------------------------------------------------
  'cook.bartakova.paradox': 'Her best sauces come in silence, and a kitchen is never silent.',
  'cook.ryba.paradox': 'The best of them, and the first of them to stop.',
  'cook.vanous.paradox': 'Never slipped once. Never astonished anyone either.',
  'cook.kesslerova.paradox': 'She learns faster than anyone can show her.',
  'cook.hruba.paradox':
    'She knows what a guest wants before he does. She cannot ask for a station.',
  'cook.brichtova.paradox': 'Takes the heat all evening and will not light a candle at home.',
  'cook.dolezal.paradox': 'Either the best plate of the night, or ash.',
  'cook.novakova.paradox': 'She can do a perfect plate. Six in a row, no.',
  'cook.simek.paradox': 'At home he is king. The next station does not interest him.',
  'cook.kolar.paradox': 'Twenty years of desserts and he still tastes with a spoon.',
  'cook.sykorova.paradox': 'Does the work of two and claims half of it.',
  'cook.benes.paradox': 'At dawn the best cook in Prague. At half eight, a tired man.',
  'cook.malkova.paradox': 'Steady hand, restless head.',
  'cook.zeman.paradox': 'Carries what the others cannot, and never mentions it.',
  'cook.rehorova.paradox': 'She asks until she has it. That costs time.',
  'cook.prochazka.paradox': 'Starts fast and hopes the evening ends before he does.',
  'cook.vlckova.paradox': 'Reads the room and never reads the rota.',
  'cook.sedlacek.paradox': 'Better alone. A helper is more in the way than in the work.',
  'cook.jandova.paradox': 'A hard course holds her. An easy one puts her to sleep.',
  'cook.bilek.paradox': 'The more pressure, the steadier the hand. Calm bores him.',
  'cook.krejci.paradox': 'Brilliant at six in the morning, burnt out by ten at night.',
  'cook.zelena.paradox': 'She takes risks because she does not yet know what can break.',
  'cook.hruska.paradox': 'Knows nothing and will do anything for you.',
  'cook.peroutkova.paradox': 'On her own station she grows. Anywhere else she is lost.',
} satisfies Record<TKey, string>;
