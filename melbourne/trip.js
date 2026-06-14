/* ============================================================
   MELBOURNE TRIP DATA
   ------------------------------------------------------------
   This is the ONLY file you normally edit. Presentation lives
   in index.html and never needs touching.

   HOW TO USE THE SCRATCHPAD (the "inbox"):
   Find the INBOX array near the bottom. Drop anything you find
   in there as a quick string or rough object. No structure
   required. Example:
       "coffee - Patricia, Little Bourke, standing only, get a magic"
   Then tell Claude: "process my inbox" and it will slot each
   item into the right day as a proper event and clear the list.

   HOW THE RESHUFFLE WORKS:
   Every event has an id. To move things, tell Claude e.g.
   "move the State Library to Thursday afternoon" and it edits
   the data here, respecting the fixed anchors (see FIXED below).
   ============================================================ */

const TRIP = {
  title: "Melbourne · July 2026",
  subtitle: "Solo · 8–12 July 2026",
  homeBase: "192 Little Collins St, Unit 1, Melbourne CBD",
  timezone: "Australia/Melbourne",

  /* Fixed anchors that must not move when reshuffling. */
  fixed: [
    "cartier-tour (Thu 9 Jul, 10:30am)",
    "hamlet (Fri 10 Jul, 7:00pm)",
    "flight-out (Wed 8 Jul, lands 5:35pm)",
    "flight-home (Sun 12 Jul, 9:15am)",
    "airbnb checkout (Sun 12 Jul, 10:00am — but flight is earlier)"
  ],

  /* Personal constraints Claude should respect on every edit. */
  constraints: [
    "GLP-1: small meals. Never schedule heavy/large dishes. Order light, share-plate size, skip the famous-but-huge mains.",
    "Solo throughout. Prefer counter seats, bar dining, open kitchens.",
    "Book dinners ahead where possible rather than winging it.",
    "Build in real downtime daily — this is not a march.",
    "Off the beaten path with a few great standouts. Curious traveller wanting to understand Melbourne.",
    "Voice: no em dashes, short sentences, plain language."
  ],

  days: [
    {
      id: "jul8",
      date: "Wed 8 Jul",
      code: "ARR",
      tag: "Arrival",
      headline: "Land, settle, eat close",
      briefing: `You land Tullamarine 5:35pm on QF170. The whole evening has one job: get horizontal without a fuss. Uber straight to Little Collins (about $70, 30 min) beats the SkyBus-plus-walk in the cold and dark. Bags down by 7pm, then a short walk to dinner. Melbourne in July is dark by 5:30pm and sits between 5 and 13 degrees, often wet. Tonight is not the night to prove anything. The city keeps.`,
      weather: "forecast closer to the date",
      events: [
        { id: "arr-flight", time: "5:35 PM", title: "Land Tullamarine — QF170", kind: "transit",
          detail: "From Christchurch, lands Melbourne T2 5:35pm. Qantas, Boeing 737. Booking ref E8GW8J." },
        { id: "arr-uber", time: "6:00 PM", title: "Uber to Little Collins St", kind: "transit",
          detail: "~30 min, ~$70. Faster and warmer than SkyBus + tram with bags. Airbnb check-in from 3pm so the place is ready.",
          map: "https://maps.apple.com/?q=192+Little+Collins+Street,+Melbourne" },
        { id: "arr-checkin", time: "7:00 PM", title: "Check in — Airbnb, 192 Little Collins St", kind: "stay",
          detail: "Unit 1, between Swanston and Russell. Bin room code 1634. Wi-Fi and entry instructions land in the app 48h before check-in. Shoes off, exhale.",
          map: "https://maps.apple.com/?q=192+Little+Collins+Street,+Melbourne" },
        { id: "arr-dinner", time: "7:45 PM", title: "Dinner — Bar Lourinhã", kind: "food", booked: false,
          detail: "Corner Little Collins / Drewery Lane, 4 min walk. One of Melbourne's great Iberian wine bars, low-lit, counter seats made for one. Order light: oysters, a small jamón plate, one or two pintxos, a glass of fino. Home by 9.",
          map: "https://maps.apple.com/?q=Bar+Lourinha,+Little+Collins+Street,+Melbourne" }
      ],
      onthis: []
    },

    {
      id: "jul9",
      date: "Thu 9 Jul",
      code: "ART",
      tag: "The Cartier day",
      headline: "Jewels, arcades, then nothing",
      briefing: `The anchor of the trip sits this morning. You booked a guided Cartier tour — the largest jewellery exhibition ever staged in Australia, 500-plus objects, the panther brooches, the Tank watch, the mystery clocks. The tour is free with your exhibition ticket; you register at the info desk on the day. Build the morning around being sharp for it: a light start, a short walk along the river, then ninety minutes of proper looking. The afternoon is deliberately soft — Victorian arcades, then back to the apartment and genuinely nothing until dinner. A day with one big thing in it and room to breathe around it.`,
      weather: "forecast closer to the date",
      events: [
        { id: "art-coffee", time: "9:15 AM", title: "Coffee — Patricia", kind: "food",
          detail: "Corner Little Bourke / Little William, 5 min walk. Standing-only espresso bar, no seats, no laptops. This is the city's actual coffee culture. Order a magic.",
          map: "https://maps.apple.com/?q=Patricia+Coffee+Brewers,+Melbourne" },
        { id: "cartier-tour", time: "10:30 AM", title: "Cartier guided tour — NGV International", kind: "culture", booked: false, fixed: true,
          detail: "Register at the info desk before the tour, ground level, NGV International, 180 St Kilda Rd. 15 min walk via Fed Square and Princes Bridge. Free with exhibition ticket (buy that ahead). Guide for ~60 min on the panther brooch, mystery clock, the Hindou necklace, the Tank watch. Then stay in the exhibition on your own for another hour.",
          link: "https://www.ngv.vic.gov.au/program/2026-melbourne-winter-masterpieces-cartier-exhibition-tour/",
          map: "https://maps.apple.com/?q=NGV+International,+180+St+Kilda+Road,+Melbourne" },
        { id: "art-lunch", time: "12:30 PM", title: "Light lunch — Gallery Kitchen, NGV", kind: "food",
          detail: "On-site at NGV International. Keep it small: smoked trout or a salad, a glass of wine. No big lunch before an afternoon of looking.",
          map: "https://maps.apple.com/?q=NGV+International,+180+St+Kilda+Road,+Melbourne" },
        { id: "art-arcades", time: "2:00 PM", title: "The Victorian arcades", kind: "wander",
          detail: "Cross back into the CBD. Block Arcade (1892), Royal Arcade (1869, with the Gog and Magog statues that have struck the hour for over 150 years), Howey Place. Not laneways — the city's Victorian commercial heart, and most visitors miss that they are still here.",
          map: "https://maps.apple.com/?q=Block+Arcade,+Melbourne" },
        { id: "art-rest", time: "4:00 PM", title: "Downtime — apartment", kind: "rest",
          detail: "Back by 4. Read, bath, nap. Do nothing until 7:15. This is in the plan on purpose." },
        { id: "art-dinner", time: "7:30 PM", title: "Dinner — Cumulus Inc", kind: "food", booked: false,
          detail: "45 Flinders Lane, 10 min walk. Andrew McConnell's room — the canonical Melbourne solo restaurant, long marble bar, open kitchen. Request the chef's pass in the notes. Order light: half a dozen oysters, the chickpea fritter, one small fish dish, a glass of riesling. Skip the lamb shoulder — famous but you won't finish it.",
          map: "https://maps.apple.com/?q=Cumulus+Inc,+45+Flinders+Lane,+Melbourne" }
      ],
      onthis: [
        { title: "Cartier — Melbourne Winter Masterpieces", note: "NGV International, ticketed, until 4 Oct. Your tour is inside this.",
          link: "https://www.ngv.vic.gov.au/exhibition/cartier/" },
        { title: "Top Arts 2026", note: "NGV Australia (Ian Potter Centre, Fed Square), free, until 19 Jul. VCE student show, better than it sounds — slot it if you want a second gallery." }
      ]
    },

    {
      id: "jul10",
      date: "Fri 10 Jul",
      code: "HDE",
      tag: "Heide + Hamlet",
      headline: "Modernism in the morning, one-woman Hamlet at night",
      briefing: `This is the day for the curious traveller. Most visitors never go to Heide, and they should. It is where Sidney Nolan painted the Ned Kelly series — the former home of John and Sunday Reed, who in the 1930s bought a dairy farm and turned it into the centre of Australian modernism: Nolan, Tucker, Hester, Perceval, Blackman all lived and worked here. Three galleries, a sculpture park, the original modernist farmhouse, fifteen acres on the Yarra. The evening is the trip's second fixed point: Eddie Izzard performing all twenty-three characters of Hamlet on a bare stage, two hours twenty. Between them, a hard rule — real downtime before the theatre, because Hamlet asks for concentration and you want to be sharp.`,
      weather: "forecast closer to the date",
      events: [
        { id: "hde-uber", time: "9:30 AM", title: "Uber to Heide, Bulleen", kind: "transit",
          detail: "~25 min, ~$35. Heide opens 10am (closed Mondays — Friday is fine).",
          map: "https://maps.apple.com/?q=Heide+Museum+of+Modern+Art,+7+Templestowe+Road,+Bulleen" },
        { id: "hde-museum", time: "10:00 AM", title: "Heide Museum of Modern Art", kind: "culture", booked: false,
          detail: "Three galleries, sculpture park, the modernist farmhouse. On while you're there: John Perceval: All That We Are (closes Sun 12 Jul — last chance); Crichton, Tucker, Whiteley: The Chelsea Hotel Years 1967–69; Badra Aji. Allow ~2.5 hours. Book entry online for the 10am slot.",
          map: "https://maps.apple.com/?q=Heide+Museum+of+Modern+Art,+7+Templestowe+Road,+Bulleen" },
        { id: "hde-lunch", time: "12:30 PM", title: "Lunch — Café Heide", kind: "food",
          detail: "Overlooking the kitchen garden. Small, simple, good. Right size for one." },
        { id: "hde-convent", time: "1:30 PM", title: "Abbotsford Convent (optional, en route)", kind: "wander",
          detail: "15 min from Heide back toward the city. Former convent, now an arts precinct — grounds, the Convent Bakery, the cloisters, a riverside walk. Skip if energy is low; worth it if not.",
          map: "https://maps.apple.com/?q=Abbotsford+Convent,+1+St+Heliers+Street,+Abbotsford" },
        { id: "hde-rest", time: "3:30 PM", title: "Downtime — apartment", kind: "rest",
          detail: "Back by 3:30. Real rest until 5. Non-negotiable: Hamlet is 2h20 of intense concentration." },
        { id: "hde-dinner", time: "5:00 PM", title: "Early dinner — MoVida", kind: "food", booked: false,
          detail: "1 Hosier Lane, 10 min walk, opening onto the street-art alley. Frank Camorra's original tapas bar. Bar seats. Light and quick: anchoa (Cantabrian anchovy on crouton), the bomba croquette, one cured fish plate, a glass of albariño. Out by 6:30.",
          map: "https://maps.apple.com/?q=MoVida,+1+Hosier+Lane,+Melbourne" },
        { id: "hamlet", time: "7:00 PM", title: "Eddie Izzard performs Hamlet — Fairfax Studio", kind: "culture", booked: false, fixed: true,
          detail: "Arts Centre Melbourne, 100 St Kilda Rd, under the spire. 8 min walk across Princes Bridge — leave by 6:50. One performer, 23 characters, bare stage, 2h20 incl. interval. Final week of the Melbourne run. Tickets via Ticketek (~$85+).",
          link: "https://premier.ticketek.com.au/shows/show.aspx?sh=EIHAMLET26",
          map: "https://maps.apple.com/?q=Arts+Centre+Melbourne,+100+St+Kilda+Road,+Melbourne" },
        { id: "hde-nightcap", time: "9:45 PM", title: "Nightcap — Bar Americano (optional)", kind: "drink",
          detail: "Presgrave Place, 12 seats, no phones, standing. One negroni on the way home if it's open.",
          map: "https://maps.apple.com/?q=Bar+Americano,+Presgrave+Place,+Melbourne" }
      ],
      onthis: [
        { title: "And What Will People Say — fortyfivedownstairs", note: "9–12 Jul, 45 Flinders Lane (3 min from yours). Amani Mahmoud, winner 2025 Sydney Fringe Best in Theatre. Indian dance, music, spoken word on hidden domestic violence. The strongest independent-theatre option on while you're here — consider a matinee or swap if you want a second show.",
          link: "https://fortyfivedownstairs.com/" }
      ]
    },

    {
      id: "jul11",
      date: "Sat 11 Jul",
      code: "SLW",
      tag: "Slow day",
      headline: "Market, reading room, headline dinner",
      briefing: `The rest day. Treat it that way. A morning at the Queen Victoria Market — the deli hall especially, where your spice shelf will get ideas at Gewürzhaus — then the La Trobe Reading Room at the State Library, one of the great reading spaces in the world, where you can simply sit with a book for as long as you like. The afternoon stays loose. The evening is the headline dinner: Gimlet, the best bar seats in the city, solo dining treated as an event. Given the appetite, order light and let the room do the work.`,
      weather: "forecast closer to the date",
      events: [
        { id: "slw-market", time: "8:30 AM", title: "Queen Victoria Market", kind: "wander",
          detail: "Tram 19 or 57 up Elizabeth St. Deli hall first — Polish smallgoods, the cheesemongers, and Gewürzhaus the spice merchant (an hour will vanish). Coffee at Market Lane. A small bratwurst if hungry.",
          map: "https://maps.apple.com/?q=Queen+Victoria+Market,+Melbourne" },
        { id: "slw-library", time: "10:30 AM", title: "State Library — La Trobe Reading Room", kind: "culture",
          detail: "Free, just walk in. 1913, octagonal, six storeys under the dome. Pull a book, sit, read for an hour or two. Rare urban quiet. The Mirror of the World gallery upstairs has rotating manuscripts.",
          map: "https://maps.apple.com/?q=State+Library+Victoria,+Melbourne" },
        { id: "slw-lunch", time: "12:30 PM", title: "Light lunch — Tipo 00 (optional)", kind: "food",
          detail: "361 Little Bourke, 5 min walk. Lunch counter, easy for one. The tagliolini al limone, a glass of wine, out in 45 min. Only if you want it — don't force a meal.",
          map: "https://maps.apple.com/?q=Tipo+00,+361+Little+Bourke+Street,+Melbourne" },
        { id: "slw-afternoon", time: "2:00 PM", title: "Slow afternoon — pick one", kind: "rest",
          detail: "Hill of Content (Bourke St, Melbourne's oldest indie bookshop, two floors, strong history/politics shelves). Or Le Labo Melbourne on Gertrude St, Fitzroy (15 min Uber) to properly sample Santal 33, Another 13, Rose 31. Or back to the apartment to read and pack." },
        { id: "slw-dinner", time: "7:30 PM", title: "Dinner — Gimlet at Cavendish House", kind: "food", booked: false,
          detail: "33 Russell St, 8 min walk. Andrew McConnell's grand room — 1920s grain merchant's building, brass and leather, the best bar seats in the city. Solo dining treated as an event. Given the appetite: half a dozen oysters, the steak tartare (small), one side, a glass of something French. Home by 9:30.",
          map: "https://maps.apple.com/?q=Gimlet+at+Cavendish+House,+33+Russell+Street,+Melbourne" }
      ],
      onthis: []
    },

    {
      id: "jul12",
      date: "Sun 12 Jul",
      code: "DEP",
      tag: "Departure",
      headline: "Early out",
      briefing: `Travel only, and the timing is tight. QF167 leaves Tullamarine 9:15am and Qantas international check-in closes 60 minutes before. Pre-book the airport ride on Saturday night — taxis from Little Collins at that hour can be patchy. Everything else — bag check, last look around — happens the night before.`,
      weather: "forecast closer to the date",
      events: [
        { id: "dep-wake", time: "5:45 AM", title: "Wake, coffee, last bag check", kind: "transit",
          detail: "Pre-booked Uber confirmed from Saturday night." },
        { id: "dep-uber", time: "6:30 AM", title: "Uber to Tullamarine", kind: "transit",
          detail: "30–40 min at that hour. International terminal.",
          map: "https://maps.apple.com/?q=Melbourne+Airport+T2,+Tullamarine" },
        { id: "dep-checkin", time: "7:15 AM", title: "At terminal — Qantas check-in", kind: "transit",
          detail: "International check-in closes 60 min before departure (8:15am cut-off). You're QF Gold so use the priority queue." },
        { id: "dep-flight", time: "9:15 AM", title: "QF167 → Christchurch", kind: "transit",
          detail: "Lands Christchurch 2:45pm. Boeing 737. Booking ref E8GW8J." }
      ],
      onthis: []
    }
  ],

  /* ============================================================
     BACK POCKET — no booking, no fixed time.
     Reference for when a day opens up. Claude can pull from
     here when reshuffling, or you can ask it to.
     ============================================================ */
  backpocket: {
    eat: [
      { name: "Embla", note: "122 Russell St. Dave Verheul's wood-fire wine bar. 8 counter stools held for walk-ins — arrive 5:45pm. Small plates, light enough for the appetite.", map: "https://maps.apple.com/?q=Embla,+122+Russell+Street,+Melbourne" },
      { name: "Supernormal", note: "Flinders Lane. Andrew McConnell's Asian room. Order a few small things, skip the lobster roll size-wise.", map: "https://maps.apple.com/?q=Supernormal,+180+Flinders+Lane,+Melbourne" },
      { name: "Tonka", note: "Duckboard Place. Modern Indian, bar seats, leans into spice — your shelf, plated.", map: "https://maps.apple.com/?q=Tonka,+Duckboard+Place,+Melbourne" },
      { name: "Bar Lourinhã (again)", note: "If one visit isn't enough. Light Iberian, counter, close to home." }
    ],
    look: [
      { name: "ACCA", note: "Australian Centre for Contemporary Art, Southbank. The rusted-steel building, free, challenging shows. 5 min from NGV.", map: "https://maps.apple.com/?q=ACCA,+111+Sturt+Street,+Southbank" },
      { name: "Buxton Contemporary", note: "Southbank, free, contemporary Australian art.", map: "https://maps.apple.com/?q=Buxton+Contemporary,+Melbourne" },
      { name: "The laneways", note: "Centre Place, Degraves, AC/DC Lane, Hosier Lane. Best wandered without a plan." }
    ],
    theatre: [
      { name: "fortyfivedownstairs", note: "45 Flinders Lane, 3 min away. Artist-led basement. 'And What Will People Say' on 9–12 Jul.", link: "https://fortyfivedownstairs.com/" },
      { name: "La Mama", note: "Carlton. The heritage independent venue (Williamson, Blanchett came through). June–Aug is 'PLAY' — experimental works-in-development, $20, includes coffee and a raffle. A gamble, but sacred ground.", link: "https://www.lamama.com.au/" },
      { name: "Malthouse / Red Stitch", note: "Checked — nothing on for your dates. Worth a re-check closer in case of additions." }
    ],
    drink: [
      { name: "Eau de Vie", note: "Hidden bar, Malthouse Lane. Whisky and cocktails." },
      { name: "Bar Americano", note: "Presgrave Place. 12 seats, no phones, standing." }
    ],
    wetweather: [
      { name: "NGV International permanent collection", note: "Free, vast, easily fills a wet afternoon beyond Cartier." },
      { name: "State Library", note: "Reading room + Mirror of the World. Dry, quiet, free." },
      { name: "The Capitol / Kino cinemas", note: "The Capitol (Swanston, restored) and Kino (Collins Place) for a rainy matinee." }
    ]
  },

  /* ============================================================
     BOOKINGS — confirmed references live here.
     Status: "confirmed" | "to-book" | "tentative"
     ============================================================ */
  bookings: [
    { id: "bk-flight-out", name: "Qantas QF170 CHC→MEL", status: "confirmed", ref: "E8GW8J",
      detail: "Wed 8 Jul, dep 3:45pm CHC, arr 5:35pm MEL. Economy. Frequent Flyer QF5827522 (Gold)." },
    { id: "bk-flight-home", name: "Qantas QF167 MEL→CHC", status: "confirmed", ref: "E8GW8J",
      detail: "Sun 12 Jul, dep 9:15am MEL, arr 2:45pm CHC. Economy. Intl check-in closes 8:15am." },
    { id: "bk-airbnb", name: "Airbnb — Home in Melbourne (Rodger)", status: "confirmed", ref: "HMSDKWFRMS",
      detail: "192 Little Collins St, Unit 1. Check-in Wed 8 Jul 3pm, checkout Sun 12 Jul 10am. 1 guest. Bin room code 1634. Total $1,253.02 NZD." },
    { id: "bk-cartier", name: "Cartier exhibition ticket + tour", status: "to-book",
      detail: "Buy timed exhibition ticket for Thu 9 Jul (10am or earlier slot) at ngv.vic.gov.au. The 10:30am guided tour is free — just register at the info desk on the day." },
    { id: "bk-hamlet", name: "Eddie Izzard's Hamlet", status: "to-book",
      detail: "Fri 10 Jul 7pm, Fairfax Studio, via Ticketek. ~$85+. Final week — book early." },
    { id: "bk-lourinha", name: "Bar Lourinhã", status: "to-book", detail: "Wed 8 Jul 7:30pm, counter seat." },
    { id: "bk-cumulus", name: "Cumulus Inc", status: "to-book", detail: "Thu 9 Jul 7:30pm — request chef's pass in notes." },
    { id: "bk-movida", name: "MoVida", status: "to-book", detail: "Fri 10 Jul 5pm bar seat (early sitting is easy)." },
    { id: "bk-gimlet", name: "Gimlet", status: "to-book", detail: "Sat 11 Jul 7:30pm bar seat — book ~2 weeks ahead." },
    { id: "bk-heide", name: "Heide entry", status: "to-book", detail: "Fri 10 Jul, 10am slot, online." },
    { id: "bk-uber-airport", name: "Airport ride (Sun)", status: "to-book", detail: "Pre-schedule Saturday night for 6:30am Sun pickup." }
  ],

  /* ============================================================
     INBOX — YOUR SCRATCHPAD.
     Drop anything here, any format. Quick strings are fine.
     Then tell Claude "process my inbox" to file them into days.
     ============================================================ */
  inbox: [
    // "example: great wine bar someone mentioned on Gertrude St"
  ]
};

if (typeof module !== "undefined") module.exports = TRIP;
