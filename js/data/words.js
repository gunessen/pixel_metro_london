// =====================================================================
//  VOCABULARY — this is the file to edit when the school topics change.
// =====================================================================
//
// One line per word. Fields:
//   en        English word/phrase exactly as it must be written (capitals count!)
//   de        German translation (shown on the 🇩🇪 hint button)
//   img       picture:  'emoji:⚽'      an emoji, drawn pixelated
//                       'sprite:name'  a hand-drawn sprite from js/gfx/sprites.js
//                       'text:7'       a big text/number
//   alt       (optional) other spellings that also count as correct
//   sentence  (optional) example sentence; the part in [brackets] becomes the gap
//             in "Ergänze den Satz" exercises
//
// Special entries:
//   kind: 'gap'   — only used as a fill-the-gap sentence (e.g. a/an, by/on).
//                   Needs an explicit id and usually `choices`.
//   kind: 'prep'  — prepositions, practised with the room scene (Milestone 2).
//
// The id is created automatically as "<topic>:<english-word>" unless given.

const HOBBIES = [
  { en: 'play football', de: 'Fußball spielen', img: 'emoji:⚽', sentence: 'I like to [play football].' },
  { en: 'play tennis', de: 'Tennis spielen', img: 'emoji:🎾', sentence: 'Can you [play tennis]?' },
  { en: 'play basketball', de: 'Basketball spielen', img: 'emoji:🏀', sentence: 'We [play basketball] at school.' },
  { en: 'play the guitar', de: 'Gitarre spielen', img: 'emoji:🎸', sentence: 'My sister can [play the guitar].' },
  { en: 'play the piano', de: 'Klavier spielen', img: 'emoji:🎹', sentence: 'I can [play the piano].' },
  { en: 'play computer games', de: 'Computerspiele spielen', img: 'emoji:🎮', sentence: 'I [play computer games].' },
  { en: 'ride a bike', de: 'Fahrrad fahren', img: 'emoji:🚴', sentence: 'I [ride a bike] to school.' },
  { en: 'ride a horse', de: 'reiten', img: 'emoji:🏇', sentence: 'She can [ride a horse].' },
  { en: 'swim', de: 'schwimmen', img: 'emoji:🏊', sentence: 'I can [swim].' },
  { en: 'dance', de: 'tanzen', img: 'emoji:💃', sentence: 'We [dance] at the party.' },
  { en: 'sing', de: 'singen', img: 'emoji:🎤', sentence: 'I like to [sing].' },
  { en: 'read', de: 'lesen', img: 'emoji:📖', sentence: 'I [read] a book.' },
  { en: 'paint', de: 'malen', img: 'emoji:🎨', sentence: 'I [paint] a picture.' },
  { en: 'skateboard', de: 'Skateboard fahren', img: 'emoji:🛹', sentence: 'Can you [skateboard]?' },
  { en: 'skate', de: 'Inliner / Rollschuh fahren', img: 'emoji:🛼', sentence: 'I [skate] in the park.' },
  { en: 'fly a kite', de: 'einen Drachen steigen lassen', img: 'emoji:🪁', sentence: 'We [fly a kite].' },
  { en: 'climb', de: 'klettern', img: 'emoji:🧗', sentence: 'I can [climb] a tree.' },
  { en: 'listen to music', de: 'Musik hören', img: 'emoji:🎧', sentence: 'I [listen to music].' },
  { en: 'watch TV', de: 'fernsehen', img: 'emoji:📺', sentence: 'I [watch TV] in the evening.' },
  { en: 'go shopping', de: 'einkaufen gehen', img: 'emoji:🛍️', sentence: 'We [go shopping] on Saturday.' },
  { en: 'play hide and seek', de: 'Verstecken spielen', img: 'sprite:hideAndSeek', sentence: 'We [play hide and seek].' },
  { en: 'jump', de: 'springen', img: 'sprite:jump', sentence: 'I can [jump] high.' },
  // can / can't
  { id: 'hobbies:can-swim', kind: 'gap', en: 'can', de: 'Ja, ich kann es.', img: 'emoji:🏊', sentence: 'Can you swim? Yes, I [can].', choices: ['can', "can't"] },
  { id: 'hobbies:cant-fly', kind: 'gap', en: "can't", de: 'Nein, ich kann es nicht.', img: 'emoji:🦅', sentence: "Can you fly? No, I [can't].", choices: ['can', "can't"] },
];

const HOUSE = [
  // rooms
  { en: 'house', de: 'Haus', img: 'emoji:🏠', sentence: 'I live in a big [house].' },
  { en: 'kitchen', de: 'Küche', img: 'sprite:kitchen', sentence: 'We cook in the [kitchen].' },
  { en: 'living room', de: 'Wohnzimmer', img: 'sprite:livingRoom', sentence: 'There is a sofa in the [living room].' },
  { en: 'bedroom', de: 'Schlafzimmer', img: 'sprite:bedroom', sentence: 'I sleep in my [bedroom].' },
  { en: 'bathroom', de: 'Badezimmer', img: 'sprite:bathroom', sentence: 'The bath is in the [bathroom].' },
  { en: 'hall', de: 'Flur', img: 'sprite:hall', sentence: 'My shoes are in the [hall].' },
  { en: 'garden', de: 'Garten', img: 'sprite:garden', sentence: 'The flowers are in the [garden].' },
  { en: 'garage', de: 'Garage', img: 'sprite:garage', sentence: 'The car is in the [garage].' },
  { en: 'attic', de: 'Dachboden', img: 'sprite:attic', sentence: 'Old toys are in the [attic].' },
  { en: 'stairs', de: 'Treppe', img: 'sprite:stairs', sentence: 'I go up the [stairs].' },
  // furniture and things
  { en: 'table', de: 'Tisch', img: 'sprite:table', sentence: 'We eat at the [table].' },
  { en: 'chair', de: 'Stuhl', img: 'emoji:🪑', sentence: 'Sit on the [chair], please.' },
  { en: 'bed', de: 'Bett', img: 'emoji:🛏️', sentence: 'I sleep in my [bed].' },
  { en: 'sofa', de: 'Sofa', img: 'emoji:🛋️', sentence: 'We sit on the [sofa].' },
  { en: 'armchair', de: 'Sessel', img: 'sprite:armchair', sentence: 'Grandpa sits in the [armchair].' },
  { en: 'wardrobe', de: 'Kleiderschrank', img: 'sprite:wardrobe', sentence: 'My clothes are in the [wardrobe].' },
  { en: 'cupboard', de: 'Schrank', img: 'sprite:cupboard', sentence: 'The cups are in the [cupboard].' },
  { en: 'shelf', de: 'Regal', img: 'sprite:shelf', sentence: 'The books are on the [shelf].' },
  { en: 'desk', de: 'Schreibtisch', img: 'sprite:desk', sentence: 'I do my homework at my [desk].' },
  { en: 'lamp', de: 'Lampe', img: 'sprite:lamp', sentence: 'Switch on the [lamp], please.' },
  { en: 'bath', de: 'Badewanne', img: 'emoji:🛁', sentence: 'I have a [bath] in the evening.' },
  { en: 'shower', de: 'Dusche', img: 'emoji:🚿', sentence: 'I have a [shower] in the morning.' },
  { en: 'toilet', de: 'Toilette', img: 'emoji:🚽', sentence: 'The [toilet] is in the bathroom.' },
  { en: 'sink', de: 'Waschbecken', img: 'sprite:sink', sentence: 'Wash your hands at the [sink].' },
  { en: 'fridge', de: 'Kühlschrank', img: 'sprite:fridge', sentence: 'The milk is in the [fridge].' },
  { en: 'cooker', de: 'Herd', img: 'sprite:cooker', sentence: 'Mum cooks on the [cooker].' },
  { en: 'window', de: 'Fenster', img: 'emoji:🪟', sentence: 'Open the [window], please.' },
  { en: 'door', de: 'Tür', img: 'emoji:🚪', sentence: 'Close the [door], please.' },
  { en: 'mirror', de: 'Spiegel', img: 'emoji:🪞', sentence: 'I look in the [mirror].' },
  { en: 'carpet', de: 'Teppich', img: 'sprite:carpet', sentence: 'The cat sleeps on the [carpet].' },
  { en: 'clock', de: 'Uhr', img: 'emoji:🕰️', sentence: 'The [clock] is on the wall.' },
  { en: 'TV', de: 'Fernseher', img: 'emoji:📺', sentence: 'The [TV] is in the living room.' },
];

const PREPOSITIONS = [
  { en: 'in', de: 'in', kind: 'prep' },
  { en: 'on', de: 'auf', kind: 'prep' },
  { en: 'under', de: 'unter', kind: 'prep' },
  { en: 'next to', de: 'neben', kind: 'prep' },
  { en: 'behind', de: 'hinter', kind: 'prep' },
  { en: 'in front of', de: 'vor', kind: 'prep' },
  { en: 'between', de: 'zwischen', kind: 'prep' },
];

const NUMBERS_EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const NUMBERS_DE = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const TIME = NUMBERS_EN.map((en, i) => ({
  en, de: NUMBERS_DE[i], img: `text:${i + 1}`, sentence: `It's [${en}] o'clock.`,
}));

const TRANSPORT = [
  { en: 'car', de: 'Auto', img: 'emoji:🚗', sentence: 'My dad drives a [car].' },
  { en: 'bus', de: 'Bus', img: 'emoji:🚌', sentence: 'I go to school by [bus].' },
  { en: 'double-decker bus', de: 'Doppeldeckerbus', img: 'sprite:doubleDecker', alt: ['double-decker'], sentence: 'A red [double-decker bus] drives through London.' },
  { en: 'taxi', de: 'Taxi', img: 'emoji:🚕', alt: ['cab'], sentence: 'We take a [taxi] to the station.' },
  { en: 'train', de: 'Zug', img: 'emoji:🚆', sentence: 'The [train] is very fast.' },
  { en: 'underground', de: 'U-Bahn', img: 'emoji:🚇', alt: ['tube'], sentence: 'In London, I take the [underground].' },
  { en: 'tram', de: 'Straßenbahn', img: 'emoji:🚊', sentence: 'The [tram] stops here.' },
  { en: 'bike', de: 'Fahrrad', img: 'emoji:🚲', alt: ['bicycle'], sentence: 'I go to school by [bike].' },
  { en: 'motorbike', de: 'Motorrad', img: 'emoji:🏍️', sentence: 'The [motorbike] is loud.' },
  { en: 'scooter', de: 'Roller / Tretroller', img: 'emoji:🛴', sentence: 'I ride my [scooter] to the park.' },
  { en: 'lorry', de: 'Lastwagen', img: 'emoji:🚚', alt: ['truck'], sentence: 'The [lorry] is very big.' },
  { en: 'plane', de: 'Flugzeug', img: 'emoji:✈️', alt: ['aeroplane', 'airplane'], sentence: 'We fly to London by [plane].' },
  { en: 'helicopter', de: 'Hubschrauber', img: 'emoji:🚁', sentence: 'The [helicopter] flies over the city.' },
  { en: 'ship', de: 'Schiff', img: 'emoji:🚢', sentence: 'The big [ship] is on the sea.' },
  { en: 'boat', de: 'Boot', img: 'emoji:⛵', sentence: 'We sail a small [boat].' },
  { en: 'ambulance', de: 'Krankenwagen', img: 'emoji:🚑', sentence: 'The [ambulance] goes to the hospital.' },
  { en: 'fire engine', de: 'Feuerwehrauto', img: 'emoji:🚒', sentence: 'The [fire engine] is red.' },
  { en: 'police car', de: 'Polizeiauto', img: 'emoji:🚓', sentence: 'The [police car] is very fast.' },
  { en: 'traffic lights', de: 'Ampel', img: 'emoji:🚦', sentence: 'Stop at the [traffic lights]!' },
  { en: 'bus stop', de: 'Bushaltestelle', img: 'emoji:🚏', sentence: 'I wait at the [bus stop].' },
  { en: 'station', de: 'Bahnhof', img: 'emoji:🚉', sentence: 'The train is at the [station].' },
  { en: 'zebra crossing', de: 'Zebrastreifen', img: 'sprite:zebraCrossing', sentence: 'Cross the street at the [zebra crossing].' },
  { en: 'street', de: 'Straße', img: 'emoji:🛣️', alt: ['road'], sentence: "Don't play in the [street]!" },
  { en: 'on foot', de: 'zu Fuß', img: 'emoji:🚶', sentence: 'I go to school [on foot].' },
  // by / on
  { id: 'transport:by-bus', kind: 'gap', en: 'by', de: 'mit dem Bus', img: 'emoji:🚌', sentence: 'I go to school [by] bus.', choices: ['by', 'on'] },
  { id: 'transport:by-car', kind: 'gap', en: 'by', de: 'mit dem Auto', img: 'emoji:🚗', sentence: 'We go to the zoo [by] car.', choices: ['by', 'on'] },
  { id: 'transport:on-foot-gap', kind: 'gap', en: 'on', de: 'zu Fuß', img: 'emoji:🚶', sentence: 'I go to school [on] foot.', choices: ['by', 'on'] },
];

const LONDON = [
  { en: 'London Eye', de: 'London Eye (Riesenrad)', img: 'sprite:londonEye', alt: ['the London Eye'], sentence: 'The [London Eye] is a big wheel.' },
  { en: 'Big Ben', de: 'Big Ben (Uhrturm)', img: 'sprite:bigBen', sentence: '[Big Ben] is a famous clock.' },
  { en: 'Buckingham Palace', de: 'Buckingham-Palast', img: 'sprite:buckinghamPalace', sentence: 'The King lives in [Buckingham Palace].' },
  { en: 'Tower Bridge', de: 'Tower Bridge (Brücke)', img: 'sprite:towerBridge', sentence: '[Tower Bridge] is over the River Thames.' },
  { en: 'Tower of London', de: 'Tower of London (Burg)', img: 'sprite:towerOfLondon', sentence: 'The [Tower of London] is a very old castle.' },
  { en: 'River Thames', de: 'die Themse', img: 'sprite:thames', alt: ['Thames', 'the River Thames', 'the Thames'], sentence: 'Boats go on the [River Thames].' },
  { en: 'Houses of Parliament', de: 'Parlament', img: 'sprite:parliament', alt: ['the Houses of Parliament'], sentence: 'Big Ben is next to the [Houses of Parliament].' },
  { en: "St Paul's Cathedral", de: "St.-Paul's-Kathedrale", img: 'sprite:stPauls', alt: ["St. Paul's Cathedral"], sentence: "[St Paul's Cathedral] has a big round roof." },
  { en: 'Trafalgar Square', de: 'Trafalgar Square (Platz)', img: 'sprite:trafalgarSquare', sentence: 'There are four big lions in [Trafalgar Square].' },
  { en: 'Hyde Park', de: 'Hyde Park', img: 'sprite:hydePark', sentence: '[Hyde Park] is a very big park.' },
  { en: 'Piccadilly Circus', de: 'Piccadilly Circus', img: 'sprite:piccadilly', sentence: '[Piccadilly Circus] has big bright signs.' },
  { en: 'The Shard', de: 'The Shard (Hochhaus)', img: 'sprite:shard', alt: ['the Shard'], sentence: '[The Shard] is a very tall building.' },
  { en: 'Westminster Abbey', de: 'Westminster Abbey (Kirche)', img: 'sprite:westminsterAbbey', sentence: '[Westminster Abbey] is a famous old church.' },
  { en: 'Natural History Museum', de: 'Naturkundemuseum', img: 'sprite:naturalHistoryMuseum', alt: ['the Natural History Museum'], sentence: 'You can see dinosaurs in the [Natural History Museum].' },
  { en: 'double-decker bus', de: 'Doppeldeckerbus', img: 'sprite:doubleDecker', alt: ['double-decker'], sentence: 'You can see a red [double-decker bus] in London.' },
  { en: 'black cab', de: 'Londoner Taxi', img: 'sprite:blackCab', sentence: 'A [black cab] is a London taxi.' },
  { en: 'guard', de: 'Wachsoldat (Queen\'s Guard)', img: 'emoji:💂', alt: ["Queen's Guard", "King's Guard"], sentence: 'The [guard] has a tall black hat.' },
  { en: 'King', de: 'der König', img: 'emoji:👑', alt: ['the King'], sentence: 'The [King] lives in a palace.' },
];

const JOBS = [
  { en: 'singer', de: 'Sänger/in', img: 'emoji:🧑‍🎤', sentence: 'She is a [singer].' },
  { en: 'secretary', de: 'Sekretär/in', img: 'emoji:🧑‍💼', sentence: 'My aunt is a [secretary].' },
  { en: 'teacher', de: 'Lehrer/in', img: 'emoji:🧑‍🏫', sentence: 'Mr Brown is a [teacher].' },
  { en: 'doctor', de: 'Arzt / Ärztin', img: 'emoji:🧑‍⚕️', sentence: 'The [doctor] helps sick people.' },
  { en: 'nurse', de: 'Krankenpfleger/in', img: 'sprite:nurse', sentence: 'The [nurse] works in a hospital.' },
  { en: 'police officer', de: 'Polizist/in', img: 'emoji:👮', alt: ['policeman', 'policewoman'], sentence: 'The [police officer] stops the car.' },
  { en: 'firefighter', de: 'Feuerwehrmann / Feuerwehrfrau', img: 'emoji:🧑‍🚒', alt: ['fireman', 'firewoman'], sentence: 'The [firefighter] is very brave.' },
  { en: 'farmer', de: 'Bauer / Bäuerin', img: 'emoji:🧑‍🌾', sentence: 'The [farmer] has ten cows.' },
  { en: 'cook', de: 'Koch / Köchin', img: 'emoji:🧑‍🍳', alt: ['chef'], sentence: 'The [cook] makes soup.' },
  { en: 'baker', de: 'Bäcker/in', img: 'sprite:baker', sentence: 'The [baker] makes bread.' },
  { en: 'pilot', de: 'Pilot/in', img: 'emoji:🧑‍✈️', sentence: 'I want to be a [pilot].' },
  { en: 'bus driver', de: 'Busfahrer/in', img: 'sprite:busDriver', sentence: 'The [bus driver] drives a red bus.' },
  { en: 'vet', de: 'Tierarzt / Tierärztin', img: 'sprite:vet', sentence: 'The [vet] helps my sick dog.' },
  { en: 'hairdresser', de: 'Friseur/in', img: 'emoji:💇', sentence: 'The [hairdresser] cuts my hair.' },
  { en: 'shop assistant', de: 'Verkäufer/in', img: 'sprite:shopAssistant', sentence: 'The [shop assistant] works in a shop.' },
  { en: 'mechanic', de: 'Mechaniker/in', img: 'emoji:🧑‍🔧', sentence: 'The [mechanic] repairs cars.' },
  { en: 'dentist', de: 'Zahnarzt / Zahnärztin', img: 'emoji:🦷', sentence: 'The [dentist] looks at my teeth.' },
  { en: 'actor', de: 'Schauspieler/in', img: 'emoji:🎭', sentence: 'He is an [actor].' },
  { en: 'footballer', de: 'Fußballspieler/in', img: 'sprite:footballer', sentence: 'My brother wants to be a [footballer].' },
  { en: 'postman', de: 'Briefträger/in', img: 'sprite:postman', alt: ['postwoman', 'post carrier'], sentence: 'The [postman] brings letters.' },
  { en: 'builder', de: 'Bauarbeiter/in', img: 'emoji:👷', sentence: 'The [builder] builds a house.' },
  { en: 'artist', de: 'Künstler/in', img: 'emoji:🧑‍🎨', sentence: 'She is an [artist].' },
  { en: 'scientist', de: 'Wissenschaftler/in', img: 'emoji:🧑‍🔬', sentence: 'The [scientist] works in a lab.' },
  { en: 'astronaut', de: 'Astronaut/in', img: 'emoji:🧑‍🚀', sentence: 'He is an [astronaut].' },
  // a / an
  { id: 'jobs:an-actor', kind: 'gap', en: 'an', de: 'ein Schauspieler', img: 'emoji:🎭', sentence: 'He is [an] actor.', choices: ['a', 'an'] },
  { id: 'jobs:an-artist', kind: 'gap', en: 'an', de: 'eine Künstlerin', img: 'emoji:🧑‍🎨', sentence: 'She is [an] artist.', choices: ['a', 'an'] },
  { id: 'jobs:an-astronaut', kind: 'gap', en: 'an', de: 'ein Astronaut', img: 'emoji:🧑‍🚀', sentence: 'I want to be [an] astronaut.', choices: ['a', 'an'] },
  { id: 'jobs:a-teacher', kind: 'gap', en: 'a', de: 'eine Lehrerin', img: 'emoji:🧑‍🏫', sentence: 'She is [a] teacher.', choices: ['a', 'an'] },
  { id: 'jobs:a-pilot', kind: 'gap', en: 'a', de: 'ein Pilot', img: 'emoji:🧑‍✈️', sentence: 'My dad is [a] pilot.', choices: ['a', 'an'] },
  { id: 'jobs:a-doctor', kind: 'gap', en: 'a', de: 'ein Arzt', img: 'emoji:🧑‍⚕️', sentence: 'He is [a] doctor.', choices: ['a', 'an'] },
];

// ---------------------------------------------------------------------

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function build(topic, list) {
  return list.map((w) => ({ id: w.id || `${topic}:${slug(w.en)}`, topic, alt: [], ...w }));
}

export const WORDS = [
  ...build('hobbies', HOBBIES),
  ...build('house', HOUSE),
  ...build('prepositions', PREPOSITIONS),
  ...build('time', TIME),
  ...build('transport', TRANSPORT),
  ...build('london', LONDON),
  ...build('jobs', JOBS),
];

export const WORDS_BY_ID = new Map(WORDS.map((w) => [w.id, w]));
