// Metro lines = school topics. Each line has 6 stations; the last one is "Test day".
// Station names are flavour only.

export const STATIONS_PER_LINE = 6;
export const TEST_STATION = 5; // index of "Test day"

export const LINES = [
  {
    topic: 'hobbies', name: 'Fun Line', de: 'Hobbys', color: '#38b764', ink: '#0b2e17',
    stations: ['Hyde Park', 'Football Ground', 'Skate Park', 'Music Hall', 'Kite Hill', 'Test day'],
  },
  {
    topic: 'house', name: 'Home Line', de: 'Haus & Möbel', color: '#a0673a', ink: '#2b1608',
    stations: ['Kitchen St', 'Garden Gate', 'Bedroom Rd', 'Bathroom Lane', 'Attic Corner', 'Test day'],
  },
  {
    topic: 'prepositions', name: 'Where Line', de: 'Präpositionen', color: '#9b59d0', ink: '#24082f',
    stations: ['On Top', 'Under Bridge', 'Next-to Market', 'Behind Wall', 'Between Towers', 'Test day'],
  },
  {
    topic: 'time', name: 'Clock Line', de: 'Uhrzeit', color: '#f4c430', ink: '#3a2c00',
    stations: ['Big Ben', "O'Clock Sq", 'Quarter Past', 'Half Past', 'Quarter To', 'Test day'],
  },
  {
    topic: 'transport', name: 'Traffic Line', de: 'Verkehr', color: '#e04545', ink: '#3a0909',
    stations: ['Bus Stop', 'Taxi Rank', 'Tram Depot', 'Harbour', 'Airport', 'Test day'],
  },
  {
    topic: 'london', name: 'Sights Line', de: 'London', color: '#3b7dd8', ink: '#08193a',
    stations: ['London Eye', 'Tower Bridge', 'Buckingham Palace', "St Paul's", 'The Shard', 'Test day'],
  },
  {
    topic: 'jobs', name: 'Jobs Line', de: 'Berufe', color: '#f08a24', ink: '#3a1d00',
    stations: ['Hospital', 'Fire Station', 'Police Station', 'Bakery', 'Theatre', 'Test day'],
  },
];

export const LINE_BY_TOPIC = Object.fromEntries(LINES.map((l) => [l.topic, l]));
