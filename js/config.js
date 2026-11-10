/* =========================================================
   WEDDING CONFIG — edit this one file to change the content.
   ========================================================= */
window.WEDDING = {
  // ---- Database (Supabase). Leave as-is to run in DEMO mode (browser-only data).
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY",

  // Full public URL of the invitation page (used to build guest links).
  // e.g. "https://lakmalz.github.io/wedding/"  — leave "" to auto-detect.
  siteUrl: "https://frstuln.github.io/wedding-invitation/",

  couple: {
    first: "Udari",
    second: "Piushan",
    monogram: "U & P",
  },

  dateText: "Thursday, 10 June 2027",
  cityLine: "Beruwala, Sri Lanka",
  rsvpBy: "30 April 2027",

  // RSVP form for people who open the site WITHOUT a personal link.
  // Their replies appear in the admin portal under the group "Website RSVP".
  allowOpenRsvp: true,
  openRsvpMaxGuests: 3,

  // Countdown targets (ISO, Sri Lanka time). Reception-only guests count down to the reception.
  // ⚠ Times below are placeholders — set your real nekath / reception times.
  ceremonyStart: "2027-06-10T09:30:00+05:30",
  receptionStart: "2027-06-10T18:30:00+05:30",

  // Invitation wording — chosen per guest by "Invite type" in the admin portal.
  wording: {
    full: "request the pleasure of your company at their Poruwa ceremony and wedding reception",
    reception: "request the pleasure of your company at the celebration of their wedding reception",
  },

  intro:
    "We're so excited to share this special day with you! As we begin our journey together, we'd love for you to join us in celebrating our big day.",

  story: [
    "Replace this with how the two of you met. Keep it warm and short; two or three paragraphs read best on a phone.",
    "Tell your guests about the moments that brought you closer: the conversations, the trips, the little traditions that became yours.",
    "Now we're thrilled to start our next chapter, and your presence would mean the world to us.",
  ],

  // Scene photos (free, Unsplash License — credits in README).
  // Tip: download them into /assets and change these to "assets/curtain.jpg" etc.
  scenes: {
    curtain: "https://images.unsplash.com/photo-1508778552286-12d4c6007799?w=1600&q=75&auto=format&fit=crop",   // velvet curtain (tinted to Brown Coffee)
    detailsHero: "https://images.unsplash.com/photo-1773188243511-2eb85126f08b?w=1200&q=75&auto=format&fit=crop", // martini on stage — Details page header
    vinyl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=1400&q=75&auto=format&fit=crop",     // record on turntable — Kindly Reply
  },

  // Couple / venue photos. These are STAND-IN stock photos — replace with your own
  // (put files in /assets, e.g. "assets/us1.jpg"). Shown in black & white automatically.
  photos: {
    ticket: "https://images.unsplash.com/photo-1731566971965-acfb1151fc34?w=700&q=75&auto=format&fit=crop",          // oval photo on the Save-the-Date ticket
    strip: [                                                   // 3 film-strip frames in Love Story
      "https://images.unsplash.com/photo-1496429946712-acb085074b51?w=500&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1624228652954-9e3725a2a4f8?w=500&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1721568818927-0e2158daf702?w=500&q=75&auto=format&fit=crop",
    ],
    details: [                                                 // 2 polaroids on the "The Details" tray
      "https://images.unsplash.com/photo-1589534345827-e619f9b2dd2b?w=500&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1704797390597-24dea42ffea8?w=500&q=75&auto=format&fit=crop",
    ],
  },

  // Shown ONLY to guests whose invite type is "Ceremony + Reception".
  ceremony: {
    title: "Poruwa Ceremony",
    time: "9:30 AM",
    venue: "Cinnamon Bey Beruwala",
    address: ["Moragalla, Beruwala 12070"],
    mapUrl: "https://maps.google.com/?q=Cinnamon+Bey+Beruwala",
  },
  // Shown to everyone.
  reception: {
    title: "Reception",
    time: "6:30 PM",
    venue: "Cinnamon Bey Beruwala",
    address: ["Moragalla, Beruwala 12070"],
    mapUrl: "https://maps.google.com/?q=Cinnamon+Bey+Beruwala",
  },

  // icon: arrival | poruwa | rings | cocktails | toast | dinner | cake | dance | farewell
  // ceremony: true  → hidden from reception-only guests
  itinerary: [
    { time: "9:00 AM", label: "Arrival", icon: "arrival", ceremony: true },
    { time: "9:30 AM", label: "Poruwa Ceremony", icon: "poruwa", ceremony: true },
    { time: "11:30 AM", label: "Lunch", icon: "dinner", ceremony: true },
    { time: "6:30 PM", label: "Welcome", icon: "cocktails" },
    { time: "7:00 PM", label: "Couple's Entrance", icon: "rings" },
    { time: "7:30 PM", label: "Toasts", icon: "toast" },
    { time: "8:30 PM", label: "Dinner", icon: "dinner" },
    { time: "9:30 PM", label: "Cake Cutting", icon: "cake" },
    { time: "10:00 PM", label: "Dancing", icon: "dance" },
    { time: "11:30 PM", label: "Farewells", icon: "farewell" },
  ],

  dressCode: {
    title: "The Dress Code",
    text: "Formal attire in warm, earthy tones is warmly welcomed — think coffee, cocoa, espresso and sand. We kindly ask guests to avoid ivory, white, cream and similar shades, as these are reserved for the bride.",
    wear: ["#4a2c2a", "#544339", "#8a6c5f", "#bfa38a"],   // Brown Coffee, Deep Espresso, Dusty Cocoa, Warm Sand
    avoid: ["#ffffff", "#f5e9d3", "#e0d9cf"],             // White, Ivory, Oatmeal
  },
  gifts: {
    title: "A Note on Gifts",
    text: "Your presence at our wedding is the greatest gift of all. If you wish to honour us with a gift, a contribution towards our new beginning would be warmly appreciated.",
  },
  attendance: {
    title: "An Adults-Only Celebration",
    text: "We love your little ones, but our wedding will be an adults-only celebration. We hope this gives you a night off to relax and celebrate with us.",
  },

  stay: {
    intro: "For guests who would like to stay over, rooms are available at the venue itself.",
    hotels: [
      { name: "Cinnamon Bey Beruwala", text: "Beachfront resort and our wedding venue.", url: "https://www.cinnamonhotels.com/cinnamon-bey-beruwala" },
    ],
  },

  // Optional background music (mp3 in /assets). "" = no music button.
  music: "",

  // Message used by the admin portal's WhatsApp / copy buttons.
  // {name} and {link} are replaced automatically.
  shareMessage:
    "Dear {name},\n\nWith great joy we invite you to celebrate our wedding on 10 June 2027 at Cinnamon Bey Beruwala. Please open your personal invitation here:\n{link}\n\nWith love,\nUdari & Piushan",
};
