// All German UI strings in one place.
export const T = {
  appName: 'PIXEL METRO LONDON',
  start: 'Start',
  back: 'Zurück',
  check: 'Prüfen',
  next: 'Weiter',
  yes: 'Ja',
  no: 'Nein',
  cancel: 'Abbrechen',
  settings: 'Einstellungen',

  // map
  mapTitle: 'Dein Netz',
  fit: 'Prüfungs-Fit',
  exam: 'Prüfungs-Probe',
  examSub: '20 Aufgaben aus allen Themen',
  comingSoon: 'Kommt bald',
  stationLocked: 'Fahr erst die Stationen davor!',
  testDay: 'Test day',
  coins: 'Münzen',

  // instructions
  'pick-word': 'Welches Wort passt zum Bild?',
  'pick-picture': 'Welches Bild passt?',
  'listen-pick': 'Hör zu! Welches Bild passt?',
  tiles: 'Bau das Wort aus den Buchstaben.',
  type: 'Schreib das Wort.',
  'fill-gap': 'Ergänze den Satz.',

  // lesson
  exitConfirm: 'Wirklich beenden?',
  exitConfirmSub: 'Deine Sterne für diese Schicht gehen verloren.',
  correct: ['Richtig!', 'Super!', 'Klasse!', 'Genau!', 'Toll!'],
  wrong: 'Fast!',
  wrongCase: 'Fast! Achte auf die Groß- und Kleinschreibung.',
  rightIs: 'Richtig ist:',
  youWrote: 'Du hast geschrieben:',
  hint: 'Tipp',
  hintText: (ch) => `Fängt mit „${ch}“ an.`,
  german: 'Deutsch',
  combo: 'Kombo',
  listen: 'Anhören',

  // result
  shiftDone: 'Schicht geschafft!',
  testDone: 'Test geschafft!',
  examDone: 'Prüfungs-Probe geschafft!',
  coinsEarned: 'Münzen verdient',
  mistakes: 'Fehler',
  noMistakes: 'Keine Fehler – perfekt!',
  practiseWords: 'Diese Wörter solltest du noch üben:',
  nextStation: 'Nächste Station',
  score: 'Ergebnis',
  badge: 'Linien-Abzeichen freigeschaltet!',

  // settings
  sound: 'Töne',
  on: 'An',
  off: 'Aus',
  voice: 'Stimme',
  voiceTest: 'Testen',
  speed: 'Sprechtempo',
  slow: 'Langsam',
  normal: 'Normal',
  pixelSize: 'Bild-Pixel',
  deviceVoice: 'Geräte-Stimme (Android)',
  deviceVoiceShort: 'Geräte-Stimme',
  voiceLoading: (pct) => `Stimme wird geladen … ${pct} % (ca. 60 MB, nur beim ersten Mal)`,
  voiceReady: '✔ Stimme bereit',
  voiceError: (msg) => `Stimme konnte nicht geladen werden (${msg}). Solange wird die Geräte-Stimme benutzt.`,
  voiceLoadingShort: (pct) => `Stimme lädt ${pct} %`,
  noVoice: 'Keine englische Stimme gefunden. Bitte in Android unter Einstellungen → Sprache → Sprachausgabe Englisch installieren.',
  version: 'Version',
};

export function pick(list) {
  return Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;
}
