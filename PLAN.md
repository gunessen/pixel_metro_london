# Pixel Metro London — Implementation Plan

An English vocabulary practice game for a 10-year-old in Grade 4 (Grundschule, Hamburg). He is preparing for an English test **in a few days**. The game is pixel art, runs entirely in the browser (HTML + JS), is hosted on GitHub Pages, and is played on an **Alldocube 8" Android tablet** (Chrome, landscape).

He likes shapez 2, Subway Sim 2, BeamNG and Duolingo. So the game uses short Duolingo-style lessons wrapped in a "build and run your own London transport network" theme.

---

## 1. Goals and constraints

| Item | Decision |
|---|---|
| Focus skills | **Reading and writing** (understand, name, read, copy correctly). Listening uses on-device TTS. No speaking. |
| Instruction language | **German instructions**, English content. A German translation of a word is available as an optional hint (🇩🇪 button). |
| Spelling | **Strict, including capital letters** ("London Eye", not "london eye"). |
| Time pressure | The exam is in a few days. **All topics are playable from the start.** Progression only unlocks cosmetic rewards and never blocks practice. **No daily streak or daily goal.** |
| Tech | Vanilla HTML/CSS/JS with ES modules. No build step and no framework. Works from `index.html` on GitHub Pages. Offline-capable PWA. |
| Persistence | `localStorage` only. Reset is in Settings (parent area). |
| Device | Landscape 8" tablet (assume 1280×800 CSS px, but must also work from 1024×600 up to 1920×1200). Large touch targets (≥ 48px). Should also be usable on a desktop browser for testing. |
| Assets | No external image files are required. Pixel art is drawn in code, and emoji are pixelated at runtime (see §7). Fonts are self-hosted. |

---

## 2. Game concept

### 2.1 Theme
The player is the new **controller of a pixel-art London Underground-style network**. The main screen is a stylised pixel map of London with the river Thames. **Each school topic is one coloured metro line.** Each line has about 6 stations, and the last station is a **"Test day"** boss lesson.

> Do not copy real TfL branding (the roundel logo or exact line names). Use our own design: coloured lines, a generic circle-and-bar station sign, and our own line names.

| Line (topic) | Colour | German label | Station names (London flavour) |
|---|---|---|---|
| Fun Line — Action & fun (hobbies) | green | Hobbys | Hyde Park, Football Ground, Skate Park, Music Hall, Kite Hill, **Test day** |
| Home Line — At the house | brown | Haus & Möbel | Kitchen St, Garden Gate, Bedroom Rd, Bathroom Lane, Attic Corner, **Test day** |
| Where Line — Prepositions | purple | Präpositionen | On Top, Under Bridge, Next-to Market, Behind Wall, Between Towers, **Test day** |
| Clock Line — Time | yellow | Uhrzeit | Big Ben, O'Clock Sq, Quarter Past, Half Past, Quarter To, **Test day** |
| Traffic Line — Traffic & transport | red | Verkehr | Bus Stop, Taxi Rank, Tram Depot, Harbour, Airport, **Test day** |
| Sights Line — London sights | blue | London | London Eye, Tower Bridge, Buckingham Palace, St Paul's, The Shard, **Test day** |
| Jobs Line — Jobs | orange | Berufe | Hospital, Fire Station, Police Station, Bakery, Theatre, **Test day** |

Station names are flavour only. Some are real London sights (this reinforces that vocabulary) and some are invented.

### 2.2 Core loop
1. On the map, he taps a line, then the next station. This starts a **shift** (lesson) of **10 exercises**. A shift takes about 3–5 minutes.
2. Exercises are drawn from that line's vocabulary using spaced repetition (§5). Earlier stations use recognition exercises and later stations shift towards writing (§4.3).
3. Correct answers earn **coins** (+10), with a **combo bonus** (+5 per answer in the streak, capped at +25). A wrong answer resets the combo. **There are no lives or hearts**, so he can never be locked out.
4. A wrong answer shows the correct answer right away (with TTS), and the item is **re-queued at the end of the shift** (Duolingo style). The shift ends only once every item has been answered correctly once.
5. **End of shift:** the train animates to the next station. TTS says "*Next station: Tower Bridge!*" and the station sign appears. A star rating is shown (3★ = ≤1 mistake, 2★ = ≤3 mistakes, 1★ = finished). Stars are saved per station; the best result is kept.
6. Stations he has completed can be **replayed** at any time to improve stars or practise more.
7. **Test day** (last station of each line): 15 mixed exercises from the whole topic, mostly writing, with **no hints and no German button**. It shows a percentage score and a list of words to review. It unlocks a line badge.
8. **Big test ("Prüfungs-Probe")**: a button on the map for 20 mixed exercises across **all** topics, like a mock exam. It is available from the start.

### 2.3 Replacing streaks: exam readiness
Instead of a daily streak, the map shows a **"Prüfungs-Fit" meter** for each line: the percentage of that topic's words that are in SRS box ≥ 3 (§5). Optionally, the parent can set an **exam date** in Settings, and the map then shows "Noch X Tage bis zum Test".

### 2.4 Coins and the depot (cosmetic rewards)
- **Depot / shop screen:** he buys vehicles and train paints with coins. Owned vehicles drive around the map as decoration, and the chosen paint colours his train.
- **Buying requires spelling the name:** to buy the motorbike, he has to type "motorbike" (using the strict keyboard). This is a sneaky extra writing practice.
- Items (rough prices): bus 50, taxi 80, motorbike 100, tram 120, double-decker bus 150, helicopter 250, plane 300, ship 300, rocket (fun extra) 500. Paints cost 40 each (red, blue, green, gold, rainbow = 200).
- Pricing should let him buy something after roughly every 2 shifts.

---

## 3. Screens

1. **Title screen:** the logo "PIXEL METRO LONDON", a moving pixel train, a "Start" button, and a small ⚙️ button.
2. **Map (hub):** the 7 lines, stations (done / next / locked-for-order), stars, a Prüfungs-Fit meter per line, a coin counter, a "Depot" button, a "Prüfungs-Probe" button, and ⚙️.
   - Within a line, stations are completed in order. **Every line's first station is open from the start.**
3. **Lesson screen:** a progress bar (train moving along a track), the exercise area, a "Prüfen" button, a feedback panel (green "Richtig!" / red "Fast!" + correct answer + 🔊), a "Weiter" button, and a combo counter. An "✕" button exits, after asking "Wirklich beenden?".
4. **Result screen:** stars, coins earned, words he got wrong (with 🔊), "Weiter" back to the map with the train arrival animation.
5. **Depot screen:** vehicles and paints to buy.
6. **Settings (⚙️):** sound on/off, TTS voice picker (English voices only) with a test button, TTS speed (slow 0.7 / normal 0.9), and a link to the parent area.
7. **Parent area (Eltern-Bereich):** protected by a simple gate ("Halte den Knopf 3 Sekunden gedrückt"). It shows:
   - Accuracy per topic and the Prüfungs-Fit per topic.
   - The 15 **weakest words** (most wrong answers / lowest box), with correct and wrong counts.
   - Exam date setting.
   - **Reset all progress**: a confirmation dialog where the parent types "RESET" or holds a button. It clears the `localStorage` key and reloads.
   - Export/import progress as JSON (copy/paste text box). This is nice-to-have.

All UI text (buttons, instructions) is in **German**. All learning content is in **English**.

---

## 4. Exercise types

Every exercise type is a module with this interface:
```js
// js/exercises/<type>.js
export default {
  id: 'pick-picture',
  canUse(item, ctx) { ... },     // e.g. needs an image, needs TTS
  render(container, item, ctx),  // builds DOM, returns { check(): Result, ... }
}
// Result = { correct: boolean, caseOnly?: boolean, expected: string, given: string }
```

| # | id | Skill | Description | German instruction |
|---|---|---|---|---|
| 1 | `pick-word` | reading | Shows a picture and 4 English words. Tap the right one. | "Welches Wort passt zum Bild?" |
| 2 | `pick-picture` | reading | Shows an English word and 4 pictures. | "Welches Bild passt?" |
| 3 | `listen-pick` | listening | 🔊 plays the word (auto-play plus replay button) and 4 pictures. Hidden if no English TTS voice is available. | "Hör zu! Welches Bild passt?" |
| 4 | `tiles` | writing (copying) | Shows a picture (plus 🔊). He builds the word from scrambled letter tiles. Spaces and apostrophes are pre-placed as fixed gaps. Tiles keep the correct case, so "L" in "London" is a capital tile. Later stations add 2 distractor letters. | "Bau das Wort aus den Buchstaben." |
| 5 | `type` | writing | Shows a picture (plus 🔊). He types the word or phrase on the **in-game keyboard**. A "Tipp" button reveals the first letter (costs the combo). | "Schreib das Wort." |
| 6 | `copy` | copying (abschreiben) | Shows the word briefly (3 s), then hides it. He types it from memory. | "Merk dir das Wort und schreib es ab." |
| 7 | `fill-gap` | reading + writing | A sentence with a gap and a picture, e.g. "She is a ____." or "I can ____ ____." (play football). Typed, or tiles at earlier stations. | "Ergänze den Satz." |
| 8 | `sentence-order` | reading | Put word tiles in the right order, e.g. "The cat is under the table." | "Bring die Wörter in die richtige Reihenfolge." |
| 9 | `match-pairs` | reading | 4–5 pairs of picture ↔ word. Tap to connect. Counts as one exercise. | "Finde die Paare." |
| 10 | `clock-read` | time | An analog pixel clock and 4 options ("quarter past three", ...). | "Wie spät ist es?" |
| 11 | `clock-write` | time + writing | An analog clock. He types the time in words ("half past seven"). Tiles at earlier stations. | "Schreib die Uhrzeit auf Englisch." |
| 12 | `clock-set` | time | Text ("It's quarter to nine.") and an interactive clock. He sets the hands (see §4.4). | "Stell die Uhr." |
| 13 | `prep-pick` | prepositions | A pixel room scene with an object placed relative to furniture. Question: "Where is the cat?" There are 4 options ("under the table", "on the table", ...). | "Wo ist ...?" |
| 14 | `prep-place` | prepositions | Instruction "Put the ball **next to** the bed." He drags the object onto a drop zone (zones exist for on / under / next to / behind / in front of / in / between). | "Lies und zieh den Gegenstand an die richtige Stelle." |

### 4.1 Answer checking (strict)
`checkAnswer(given, expected, alternatives)` in `js/check.js`:
1. Normalise: trim, collapse multiple spaces into one, convert typographic apostrophes `’ ‘ ´ \`` into `'`. Ignore a trailing `.`, but **do not change letter case**.
2. Correct if it equals `expected` or any entry in `alternatives` exactly.
3. If it matches only when compared case-insensitively, it is **wrong**, with `caseOnly: true`. The feedback is: "Fast! Achte auf die Groß- und Kleinschreibung." The correct letters are highlighted.
4. Otherwise it is wrong. The feedback shows the correct answer, with the differing letters highlighted (simple per-character diff).
5. Unit test this function (a simple `tests.html` page that runs assertions in the browser is enough).

### 4.2 Distractor and option rules
- Distractors come from the **same topic** where possible.
- **Never show two options with the same picture** in one question. Words share images through the `img` field (e.g. "bike" and "ride a bike"); filter out options with the same `img`.
- Never offer an option that is also a valid `alt` of the correct answer (e.g. "underground" and "tube").
- Shuffle option positions.

### 4.3 Shift composition by station
| Station | Mix |
|---|---|
| 1 | mostly `pick-word`, `pick-picture`, `listen-pick`, plus 1 `match-pairs` |
| 2 | recognition + `tiles` |
| 3 | `tiles`, `fill-gap` (tiles), `sentence-order` |
| 4 | `type`, `copy`, `fill-gap` (typed) |
| 5 | mostly `type`, `copy`, `fill-gap` |
| Test day | 15 items, 70% writing (`type`, `fill-gap`, `copy`), 30% recognition. No hints and no German button. |

Clock Line and Where Line use their special types instead (clock-* / prep-*), following the same recognition → production progression. For example, on Clock Line, station 1 is `clock-read` with o'clock / half past only, then quarter past / quarter to are added, then `clock-write` tiles, then typed, then `clock-set`.

### 4.4 Clock specifics
- Times come only from {o'clock, quarter past, half past, quarter to} × hours 1–12.
- Expected written forms: "three o'clock", "quarter past three", "half past three", "quarter to four". Numbers are **written in words** (one … twelve). Accept an optional leading "It's " / "It is ". Also accept "a quarter past/to".
- **German trap:** "half past seven" = 7:30 = German *halb acht*. When he gets a half-past wrong, show the special hint: "Achtung: *half past seven* = 7:30 = halb **acht**!" Also make sure about 30% of clock items are half-past.
- Clock drawing: a pixel-style canvas clock with 12 numbers. **The hour hand is positioned correctly**: between the hours for half past and quarter to/past.
- `clock-set`: drag the minute hand (snaps to 0/15/30/45) and drag the hour hand (snaps to hour positions). Then compute the hour-hand offset from the minutes. When checking, only the snapped hour and minute must match. Large hit areas. A fallback with ◀ ▶ buttons for each hand is fine if dragging feels fiddly on the tablet.
- Also include a few digital ↔ words items in `clock-read` (show "3:45" and choose "quarter to four").

### 4.5 Preposition scenes
- One pixel-art room drawn on a canvas (or as absolutely positioned sprites) with anchor furniture: table, bed, sofa, box, chair, wardrobe.
- Movable objects: cat, ball, dog, teddy, book, lamp.
- For each anchor, define rects for: `on`, `under`, `next to`, `behind` (partially hidden, drawn behind the anchor), `in front of`, `in` (box / wardrobe only). `between` uses two anchors.
- Sentences generated: "The cat is under the table." / "Put the ball on the bed."

### 4.6 In-game keyboard (`js/keyboard.js`)
- An on-screen pixel keyboard, so that **no native Android keyboard opens**. This means no autocorrect or word suggestions. Answer fields are `div`s, not `<input>`s.
- **QWERTZ layout** (matches German keyboards he knows), letters only, plus: Shift (one-shot, with a visible state; double-tap for caps lock), `'` (apostrophe), Space, ⌫, and ✔ (= Prüfen).
- Keys show lowercase by default and uppercase while Shift is active.
- Also listen for physical keyboard `keydown` events, for desktop testing.

---

## 5. Spaced repetition (`js/srs.js`)

Use a Leitner system with 5 boxes per word item:
- New item: box 0. Correct: box + 1 (max 5). Wrong: box = max(0, box − 2), and the item is re-queued in the current shift.
- A `caseOnly` mistake counts as wrong (strict spelling), but only drops 1 box.
- Item selection for a shift: weighted random from the line's item pool, with weight ∝ `(6 − box)²`, boosted ×2 if the item was answered wrong in the last session. Avoid repeating the same item within a shift unless it is being re-queued.
- Introduce new items gradually: at most 4 never-seen items per shift.
- Prüfungs-Fit per line = percentage of the line's items with box ≥ 3.
- Clock items are generated, so SRS tracks them by **pattern** (`time:oclock`, `time:quarter-past`, `time:half-past`, `time:quarter-to`), plus `time:write-hours` for writing numbers in words.
- Preposition items are tracked per preposition (`prep:under`, ...).

---

## 6. Vocabulary (`js/data/words.js`)

A single data file that the parent can edit easily. Schema:
```js
{ id: 'kitchen', topic: 'house', en: 'kitchen', de: 'Küche',
  img: 'emoji:🍳' | 'sprite:kitchen',   // picture source
  alt: [],                               // other accepted spellings
  sentence: 'We cook in the kitchen.',   // optional, used by fill-gap / sentence-order
  gap: 'kitchen' }                       // optional, which part of the sentence is blanked
```
Topics: `hobbies`, `house`, `prepositions`, `time`, `transport`, `london`, `jobs`.

The emoji below are suggestions. If no good emoji exists, or two words would share one, the item uses a hand-drawn `sprite:` (marked **S**). The implementer should check that each emoji renders on Android (Noto Color Emoji) and that pictures are unambiguous.

### 6.1 Action and fun (hobbies) — `hobbies`
| en | de | img | example sentence |
|---|---|---|---|
| play football | Fußball spielen | ⚽ | I like to play football. |
| play tennis | Tennis spielen | 🎾 | Can you play tennis? |
| play basketball | Basketball spielen | 🏀 | We play basketball at school. |
| play the guitar | Gitarre spielen | 🎸 | My sister can play the guitar. |
| play the piano | Klavier spielen | 🎹 | I can play the piano. |
| play computer games | Computerspiele spielen | 🎮 | I play computer games. |
| ride a bike | Fahrrad fahren | 🚴 | I ride a bike to school. |
| ride a horse | reiten | 🏇 | She can ride a horse. |
| swim | schwimmen | 🏊 | I can swim. |
| dance | tanzen | 💃 | We dance at the party. |
| sing | singen | 🎤 | I like to sing. |
| read | lesen | 📖 | I read a book. |
| paint | malen | 🎨 | I paint a picture. |
| skateboard | Skateboard fahren | 🛹 | Can you skateboard? |
| skate | Inliner / Rollschuh fahren | 🛼 | I skate in the park. |
| fly a kite | einen Drachen steigen lassen | 🪁 | We fly a kite. |
| climb | klettern | 🧗 | I can climb a tree. |
| listen to music | Musik hören | 🎧 | I listen to music. |
| watch TV | fernsehen | 📺 | I watch TV in the evening. |
| go shopping | einkaufen gehen | 🛍️ | We go shopping on Saturday. |
| play hide and seek | Verstecken spielen | **S** | We play hide and seek. |
| jump | springen | **S** (kid jumping) | I can jump high. |

Sentence patterns to use: "I like to …", "I can …", "Can you …? Yes, I can. / No, I can't."

### 6.2 At the house — `house`
**Rooms**
| en | de | img |
|---|---|---|
| house | Haus | 🏠 |
| kitchen | Küche | **S** (room with cooker) |
| living room | Wohnzimmer | 🛋️ (room) **S** preferred |
| bedroom | Schlafzimmer | **S** (room with bed) |
| bathroom | Badezimmer | **S** (room with bath) |
| hall | Flur | **S** |
| garden | Garten | 🏡 / **S** |
| garage | Garage | **S** |
| attic | Dachboden | **S** |
| stairs | Treppe | **S** |

**Furniture and things**
| en | de | img |
|---|---|---|
| table | Tisch | **S** |
| chair | Stuhl | 🪑 |
| bed | Bett | 🛏️ |
| sofa | Sofa | 🛋️ |
| armchair | Sessel | **S** |
| wardrobe | Kleiderschrank | **S** |
| cupboard | Schrank | **S** |
| shelf | Regal | **S** |
| desk | Schreibtisch | **S** |
| lamp | Lampe | **S** |
| bath | Badewanne | 🛁 |
| shower | Dusche | 🚿 |
| toilet | Toilette | 🚽 |
| sink | Waschbecken | **S** |
| fridge | Kühlschrank | **S** |
| cooker | Herd | **S** |
| window | Fenster | 🪟 |
| door | Tür | 🚪 |
| mirror | Spiegel | 🪞 |
| carpet | Teppich | **S** |
| clock | Uhr | 🕰️ |
| TV | Fernseher | 📺 (avoid in the same question as "watch TV") |

Sentences: "We cook in the kitchen.", "I sleep in my bedroom.", "There is a sofa in the living room."

### 6.3 Prepositions — `prepositions`
| en | de |
|---|---|
| in | in |
| on | auf |
| under | unter |
| next to | neben |
| behind | hinter |
| in front of | vor |
| between | zwischen |

Plus the question form "Where is the …?" / "The … is … the …". Uses the house furniture words and the movable objects: cat 🐈, dog 🐕, ball ⚽, teddy 🧸, book 📕, box 📦.

### 6.4 Time — `time`
- Numbers one to twelve, **written in words**: one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve.
- Patterns: "… o'clock", "quarter past …", "half past …", "quarter to …".
- Phrases: "What time is it?" — "It's …".
- Generated items only (§4.4). Also add `pick-word`/`tiles`/`type` items for the number words, shown as a digit ("7" → "seven").

### 6.5 Traffic and transport — `transport`
| en | de | img | alt |
|---|---|---|---|
| car | Auto | 🚗 | |
| bus | Bus | 🚌 | |
| double-decker bus | Doppeldeckerbus | **S** (red London bus) | double-decker |
| taxi | Taxi | 🚕 | cab |
| train | Zug | 🚆 | |
| underground | U-Bahn | 🚇 | tube |
| tram | Straßenbahn | 🚊 | |
| bike | Fahrrad | 🚲 | bicycle |
| motorbike | Motorrad | 🏍️ | |
| scooter | Roller / Tretroller | 🛴 | |
| lorry | Lastwagen | 🚚 | truck |
| plane | Flugzeug | ✈️ | aeroplane |
| helicopter | Hubschrauber | 🚁 | |
| ship | Schiff | 🚢 | |
| boat | Boot | ⛵ | |
| ambulance | Krankenwagen | 🚑 | |
| fire engine | Feuerwehrauto | 🚒 | |
| police car | Polizeiauto | 🚓 | |
| traffic lights | Ampel | 🚦 | |
| bus stop | Bushaltestelle | 🚏 | |
| station | Bahnhof | **S** | |
| zebra crossing | Zebrastreifen | **S** | |
| street | Straße | **S** / 🛣️ | road |
| on foot | zu Fuß | 🚶 | |

Sentences: "I go to school by bus.", "I go to school on foot.", "Stop at the traffic lights!" (Note: "**by** bus/car/bike" but "**on** foot".)

### 6.6 London sights — `london`
Use hand-drawn pixel sprites for all of these. They are also the station signs, so they deserve the most art effort.
| en | de |
|---|---|
| London Eye | London Eye (Riesenrad) |
| Big Ben | Big Ben (Uhrturm) |
| Buckingham Palace | Buckingham-Palast |
| Tower Bridge | Tower Bridge (Brücke) |
| Tower of London | Tower of London (Burg) |
| River Thames | die Themse |
| Houses of Parliament | Parlament |
| St Paul's Cathedral | St.-Paul's-Kathedrale |
| Trafalgar Square | Trafalgar Square (Platz) |
| Hyde Park | Hyde Park |
| Piccadilly Circus | Piccadilly Circus |
| The Shard | The Shard (Hochhaus) |
| Westminster Abbey | Westminster Abbey (Kirche) |
| Natural History Museum | Naturkundemuseum |

Related London words that also belong in this topic: **double-decker bus** (shared with transport, same sprite), **black cab** (S), **the Queen's Guard / guard** (S), **the King** (👑).

Spelling notes: capitals are required in every word ("Buckingham Palace"). For "St Paul's Cathedral", accept "St. Paul's Cathedral" as `alt`. Accept "Thames" for "River Thames" and "the London Eye" (with article) as `alt`.

Sentences: "The London Eye is a big wheel.", "The King lives in Buckingham Palace.", "Big Ben is a famous clock.", "Tower Bridge is over the River Thames."

### 6.7 Jobs — `jobs`
| en | de | img |
|---|---|---|
| singer | Sänger/in | 🧑‍🎤 |
| secretary | Sekretär/in | 🧑‍💼 (+ **S** variant with typewriter/computer if ambiguous) |
| teacher | Lehrer/in | 🧑‍🏫 |
| doctor | Arzt / Ärztin | 🧑‍⚕️ |
| nurse | Krankenpfleger/in | **S** (nurse cap) — must differ from doctor |
| police officer | Polizist/in | 👮 |
| firefighter | Feuerwehrmann/-frau | 🧑‍🚒 |
| farmer | Bauer / Bäuerin | 🧑‍🌾 |
| cook | Koch / Köchin | 🧑‍🍳 (alt: chef) |
| baker | Bäcker/in | **S** (with bread 🍞) |
| pilot | Pilot/in | 🧑‍✈️ |
| bus driver | Busfahrer/in | **S** |
| vet | Tierarzt / Tierärztin | **S** (with dog) |
| hairdresser | Friseur/in | 💇 |
| shop assistant | Verkäufer/in | **S** |
| mechanic | Mechaniker/in | 🧑‍🔧 |
| dentist | Zahnarzt / Zahnärztin | 🦷 / **S** |
| actor | Schauspieler/in | 🎭 |
| footballer | Fußballspieler/in | **S** (avoid clash with ⚽ "play football") |
| postman | Briefträger | **S** (alt: postwoman, post carrier) |
| builder | Bauarbeiter/in | 👷 |
| artist | Künstler/in | 🧑‍🎨 |
| scientist | Wissenschaftler/in | 🧑‍🔬 |
| astronaut | Astronaut/in | 🧑‍🚀 |

Sentence patterns: "He is a singer.", "She is a teacher.", "I want to be a pilot.", plus the **a/an** rule: "an actor", "an artist", "an astronaut". Include fill-gap items that test "a"/"an".

Total: roughly 140 items. Shifts draw from these with SRS, so a topic's vocabulary is covered over about 5 shifts.

---

## 7. Graphics and audio

### 7.1 Style
- Chunky pixel art. A limited palette (e.g. PICO-8-like 16 colours plus line colours). Use `image-rendering: pixelated` everywhere.
- **Fonts:** a pixel font for headings and UI (e.g. **Pixelify Sans** or **Silkscreen**, OFL, self-hosted under `fonts/`). **English learning words must be shown in a clean, very readable font**, because he is learning letter shapes and spelling. Use a large system sans-serif or a self-hosted school-like font such as "Andika" (OFL). Never show vocabulary in a hard-to-read pixel font.
- Correct-answer feedback: green panel, a happy chiptune blip, a small train "toot", and coin pop-up particles. Wrong: red panel and a soft low blip (not harsh).

### 7.2 Pixelated emoji (`js/gfx/emoji.js`)
- Draw the emoji onto an offscreen canvas at about 20×20 px, then display it upscaled with nearest-neighbour scaling. This gives a consistent pixel look. Cache the result as data URLs per emoji.
- Test the resolution (16, 20, 24 px) on the target device and pick the one where pictures stay recognisable.

### 7.3 Hand-drawn sprites (`js/gfx/sprites.js`)
- Sprites are defined as string arrays plus a palette map, for example:
  ```js
  bigBen: { palette: { k:'#1a1c2c', y:'#ffcd75', g:'#5d5d5d' }, px: [
    '....kk....',
    '...kyyk...', ... ] }
  ```
  Render them to a canvas once and cache.
- Sizes: 24×24 for vocabulary pictures and 32×32 (or 48×32) for London sights and station signs.
- Must-have sprites: all London sights, all **S** items in §6, the train (3 frames), vehicles for the map and depot, the station sign, the clock face, the room scene furniture, and the title logo.

### 7.4 Map (`js/screens/map.js`)
- A canvas or SVG map, with a pixel Thames running across. Seven coloured lines arranged so they all cross at a central hub station ("Central"). Stations are circles; the completed ones are filled. The player's train sits at the last reached station of each line.
- Bought vehicles drive slowly along the streets or river as decoration (the ship and boat on the Thames, the plane and helicopter in the sky).
- Keep it static or lightly animated. Performance matters on a budget tablet.

### 7.5 Sound (`js/audio.js`)
- Chiptune sound effects generated with WebAudio oscillators (no audio files): correct, wrong, coin, tile click, station chime ("ding-dong"), train arrival.
- One global mute in Settings.

### 7.6 Text-to-speech (`js/tts.js`, `js/piper.js`, `js/piper-worker.js`)
- **Piper neural TTS in the browser** (the device voices sound bad). Pipeline in a classic Web Worker:
  espeak-ng phonemizer compiled to WASM (`@diffusionstudio/piper-wasm` 1.0.0) → phoneme ids →
  Piper VITS model via `onnxruntime-web` 1.22 (WASM, **single thread**, because GitHub Pages cannot
  enable cross-origin isolation). Engine files are vendored under `vendor/`.
- Voices come from `rhasspy/piper-voices` **v1.0.0** on Hugging Face (British English; default
  `en_GB-jenny_dioco-medium`, ~60 MB). Downloaded once and kept in Cache Storage (`piper-voices-v1`);
  only the selected voice is kept. Voice choice in Settings.
- A synthesis queue: the text being spoken jumps the queue; at the start of a shift all its words and
  sentences are prefetched in the background. Audio is cached in memory and played through WebAudio.
- Slow mode uses Piper's `length_scale` (normal 1.0, slow ≈ 1.3), not playback rate.
- **Fallback:** while the voice is downloading, or if Piper fails, use `speechSynthesis` (prefer `en-GB`,
  wait for `voiceschanged` on Android). If no English speech is possible at all, disable `listen-pick`
  and the 🔊 buttons and show the hint in Settings: "Keine englische Stimme gefunden. …".
- Speak the correct answer automatically on wrong answers. Every displayed English word has a 🔊 button.
- Special phrases: "Next station: …", "Mind the gap!" (when starting a shift), "Well done!"

---

## 8. Persistence (`js/state.js`)

A single `localStorage` key: `pixelMetro.v1`.
```js
{
  version: 1,
  coins: 0,
  xp: 0,
  settings: { sound: true, voiceURI: null, rate: 0.9, examDate: null },
  items: { [itemId]: { box: 0, seen: 0, correct: 0, wrong: 0, lastSeen: 0, lastWrong: 0 } },
  lines: { [topic]: { station: 0, stars: [0,0,0,0,0,0], testBest: null } },
  owned: { vehicles: ['train'], paints: ['default'], paint: 'default' },
  stats: { shifts: 0, exercises: 0, msPlayed: 0, history: [ /* last 50 shift results */ ] }
}
```
- Save after every answer, so nothing is lost if the tablet sleeps.
- Wrap all storage access in try/catch, and fall back to in-memory state if storage is unavailable.
- Reset removes the key and reloads.
- Validate and migrate on load. Unknown or old versions get merged with defaults.

---

## 9. File structure

```
/index.html                 single page, loads js/main.js as a module
/manifest.webmanifest       PWA: name, icons, display: fullscreen, orientation: landscape
/sw.js                      service worker: cache-first for all app files (versioned cache name)
/css/style.css
/fonts/                     self-hosted OFL fonts + license files
/icons/                     PWA icons (generated pixel art PNGs; 192 & 512)
/js/main.js                 boot, screen router
/js/state.js                load/save/reset/migrate
/js/srs.js                  Leitner logic + item selection
/js/check.js                answer normalisation & strict checking
/js/lesson.js               shift engine: builds queue, re-queues wrong items, scoring, combo
/js/tts.js
/js/audio.js
/js/keyboard.js             in-game QWERTZ keyboard
/js/i18n.js                 all German UI strings in one place
/js/data/words.js           vocabulary (§6)
/js/data/lines.js           line/station definitions (§2.1)
/js/data/shop.js            depot items & prices
/js/gfx/emoji.js            pixelated emoji renderer
/js/gfx/sprites.js          hand-drawn sprite data + renderer
/js/gfx/clock.js            clock drawing + interactive clock
/js/gfx/room.js             preposition room scene
/js/exercises/*.js          one module per exercise type (§4)
/js/screens/title.js, map.js, lesson.js, result.js, depot.js, settings.js, parent.js
/tests.html                 in-browser unit tests (check.js, srs.js, clock text generation)
/README.md                  how to play, how to edit words, how to deploy
```

---

## 10. Deployment

- GitHub Pages from the `main` branch root. All paths must be **relative** (the site will live under `/<repo-name>/`).
- The service worker uses a versioned cache name (`pixel-metro-v1`). Bump the version on every deploy so the tablet gets updates. Show a small "Neue Version — neu laden" toast when an update is detected.
- On the tablet: open the URL in Chrome, then use "Zum Startbildschirm hinzufügen". The game then runs full-screen and offline.

---

## 11. Implementation order (the exam is in days, so a playable version comes first)

**Milestone 1: playable core (must-have)**
1. Project skeleton, screen router, state, i18n, `words.js` with all vocabulary.
2. Pixelated emoji renderer, plus placeholder sprites (a coloured box with initials) for **S** items, so content works before the art is done.
3. Lesson engine (queue, re-queue, combo, coins, stars) and SRS.
4. Exercises: `pick-word`, `pick-picture`, `listen-pick`, `tiles`, `type` (with the in-game keyboard), `fill-gap`.
5. Simple map (lines and stations as buttons) and the result screen.
6. TTS.
→ At this point he can practise every topic except time and prepositions.

**Milestone 2: special topics (must-have)**
7. Clock rendering and `clock-read`, `clock-write`, `clock-set`, including the half-past hint.
8. Room scene and `prep-pick`, `prep-place`.
9. `copy`, `sentence-order`, `match-pairs`.
10. Test day and the Prüfungs-Probe.

**Milestone 3: polish and motivation**
11. Real pixel sprites (London sights first, then the remaining **S** items).
12. Pixel map with the Thames, train arrival animation, station announcement.
13. Depot shop (buy by spelling) and vehicles on the map.
14. WebAudio sound effects.
15. Settings and parent area (stats, weakest words, reset, exam date).
16. PWA (manifest, service worker, icons) and a README with deploy steps.

**Milestone 4: nice-to-have**
- Export/import progress, extra paints and vehicles, achievements.

---

## 12. Acceptance checklist

- [ ] All 7 topics are practicable from the first launch. Nothing educational is locked.
- [ ] Every exercise works with touch only on a 1280×800 landscape screen. No native keyboard ever opens.
- [ ] Strict spelling: "london eye" is marked wrong with the capital-letter hint, and "London Eye" is correct. Alternatives are accepted ("tube", "bicycle", "St. Paul's Cathedral").
- [ ] A wrong answer always shows the correct spelling and speaks it. The item comes back later in the same shift.
- [ ] No question ever shows two identical pictures, or two options that are both correct.
- [ ] The clock hour hand is drawn correctly for :15, :30 and :45. The half-past hint appears on half-past mistakes.
- [ ] TTS uses a British voice when available, and the game degrades gracefully without one.
- [ ] Progress survives reload and tablet sleep. Reset in the parent area wipes everything.
- [ ] Works offline after the first load (PWA). Uses relative paths that work on GitHub Pages under a sub-path.
- [ ] All UI text is German. All learning content is English, shown in a highly readable font.
- [ ] `tests.html` passes (answer checker, SRS transitions, time-to-words generation).
- [ ] Runs smoothly on a budget Android tablet: no heavy per-frame canvas redraws when idle.
