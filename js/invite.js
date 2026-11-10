(function () {
  const C = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const params = new URLSearchParams(location.search);
  const code = (params.get("g") || "").trim().toUpperCase();
  const track = params.get("preview") !== "1";
  const OPENED_KEY = "invite_opened_" + (code || "x");
  let guest = null;

  /* ---------- text bindings ---------- */
  const d = new Date(C.receptionStart);
  let target = d;
  const binds = {
    first: C.couple.first, second: C.couple.second, monogram: C.couple.monogram,
    intro: C.intro, rsvpBy: C.rsvpBy, cityLine: C.cityLine,
    dateShort: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  };
  $$("[data-bind]").forEach((n) => {
    const k = n.dataset.bind;
    if (k === "namesCaps") { n.textContent = ""; n.append(C.couple.first + " ", el("span", "amp", "&"), " " + C.couple.second); }
    else if (binds[k] != null) n.textContent = binds[k];
  });
  document.title = `${C.couple.first} & ${C.couple.second} — The Wedding`;
  $("#m1").textContent = C.couple.first[0];
  $("#m2").textContent = C.couple.second[0];

  /* ---------- scene photos ---------- */
  const S = C.scenes || {}, root = document.documentElement.style;
  if (S.curtain) { root.setProperty("--curtain", `url("${S.curtain}")`); document.body.classList.add("has-curtain"); }
  if (S.detailsHero) { root.setProperty("--dhero", `url("${S.detailsHero}")`); document.body.classList.add("has-dhero"); }
  if (S.vinyl) { root.setProperty("--vinyl", `url("${S.vinyl}")`); document.body.classList.add("has-vinyl"); }

  /* ---------- photos ---------- */
  function photo(node, src) { if (src) node.style.backgroundImage = `url("${src}")`; else node.classList.add("ph-empty"); }
  photo($("#ticketPhoto"), C.photos.ticket);
  const dp = C.photos.details || [];
  photo($("#pol1"), dp[0]); photo($("#pol2"), dp[1]);
  (C.photos.strip || ["", "", ""]).forEach((src) => { const f = el("div"); photo(f, src); f.style.position = "relative"; $("#strip").append(f); });

  $("#ivorySeal").setAttribute("d", $("#sealShape").getAttribute("d"));

  /* ---------- scalloped badge ---------- */
  (function scallop() {
    const n = 18, R = 78, r = 17; let s = `<circle cx="100" cy="100" r="${R}"/>`;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; s += `<circle cx="${(100 + R * Math.cos(a)).toFixed(1)}" cy="${(100 + R * Math.sin(a)).toFixed(1)}" r="${r}"/>`; }
    $("#scallop").innerHTML = s;
  })();

  /* ---------- barcode (unique per guest code) ---------- */
  function drawBarcode(seed) {
    const s = seed || "WEDDING" + d.getFullYear();
    let x = 2, rects = "";
    for (let i = 0; x < 196; i++) {
      const c = s.charCodeAt(i % s.length) * (i + 7);
      const w = 1 + (c % 3), gap = 1 + ((c >> 2) % 3);
      rects += `<rect x="${x}" y="2" width="${w}" height="40"/>`; x += w + gap;
    }
    $("#barcode").innerHTML = `<svg viewBox="0 0 200 44" preserveAspectRatio="none" width="100%" height="100%" fill="#1d1514">${rects}</svg>`;
    $("#codeLine").textContent = seed ? "Nº " + seed : "";
  }

  /* ---------- story ---------- */
  C.story.forEach((p) => $("#storyText").append(el("p", null, p)));

  /* ---------- details page ---------- */
  function venue(box, v) {
    box.append(el("h4", null, v.title));
    if (v.time) box.append(el("div", "vtime", v.time));
    box.append(el("div", "vname", v.venue));
    v.address.forEach((a) => box.append(el("div", "addr", a)));
    if (v.mapUrl) { const a = el("a", "pill", "View on Maps"); a.href = v.mapUrl; a.target = "_blank"; a.rel = "noopener"; box.append(a); }
  }
  venue($("#ceremony"), C.ceremony);
  venue($("#reception"), C.reception);

  const ICONS = {
    arrival: '<path d="M10 42V21L24 11l14 10v21"/><path d="M19 42V31h10v11"/><path d="M24 3v8M21 6h6"/><circle cx="24" cy="22" r="3"/>',
    poruwa: '<path d="M5 18L24 7l19 11"/><path d="M9 18h30"/><path d="M11 18v22M37 18v22"/><path d="M6 40h36"/><path d="M15 33h18v7H15z"/><path d="M18 33v-4h12v4"/><path d="M24 7V3"/>',
    rings: '<circle cx="18" cy="29" r="10"/><circle cx="30" cy="29" r="10"/><path d="M27 15l3-5 3 5-3 3z"/>',
    cocktails: '<path d="M9 10h30L24 26z"/><path d="M24 26v14M16 41h16"/><circle cx="21" cy="15" r="2.5"/><path d="M23 13l9-9"/>',
    toast: '<path d="M11 8h8l-1 15a3 3 0 0 1-6 0z"/><path d="M15 26v12M11 38h8"/><path d="M29 8h8l-1 15a3 3 0 0 1-6 0z"/><path d="M33 26v12M29 38h8"/><path d="M22 6l2-3M26 6l-2-3"/>',
    dinner: '<circle cx="24" cy="26" r="11"/><circle cx="24" cy="26" r="7"/><path d="M6 12v28M4 12v7a2 2 0 0 0 4 0v-7"/><path d="M43 12c-3 4-3 10 0 12v16"/>',
    cake: '<path d="M11 41h26V31H11z"/><path d="M14 31v-8h20v8"/><path d="M18 23v-7h12v7"/><path d="M24 16v-5"/><path d="M11 36c4 2 8-2 13 0s9 2 13 0"/>',
    dance: '<path d="M24 3v9"/><circle cx="24" cy="27" r="14"/><path d="M10 27h28M12 20h24M12 34h24"/><path d="M24 13c-6 4-6 24 0 28M24 13c6 4 6 24 0 28"/>',
    farewell: '<path d="M5 33h38v-7l-6-8H13l-7 8z"/><path d="M13 18l3-6h16l3 6"/><circle cx="14" cy="34" r="4"/><circle cx="34" cy="34" r="4"/><path d="M43 30l3 3M43 26l4 1"/>',
  };
  function renderItinerary(full) {
    $("#itinerary").innerHTML = "";
    C.itinerary.filter((it) => full || !it.ceremony).forEach((it) => {
      const box = el("div", "it-item reveal");
      box.innerHTML = `<svg viewBox="0 0 48 48">${ICONS[it.icon] || ICONS.rings}</svg>`;
      box.append(el("div", "t", it.time), el("div", "l", it.label));
      $("#itinerary").append(box);
    });
    observeReveals();
  }

  function info(box, o, extra) {
    if (!o || !o.text) { box.remove(); return; }
    box.append(el("h5", null, o.title), el("p", null, o.text));
    if (extra) box.append(extra);
  }
  const sw = el("div", "swatch-groups");
  [["Lovely to wear", C.dressCode.wear, ""], ["Please avoid", C.dressCode.avoid, "no"]].forEach(([label, cols, cls]) => {
    if (!cols || !cols.length) return;
    const g = el("div", "swatch-group " + cls), row = el("div", "swatches");
    cols.forEach((c) => { const i = el("i"); i.style.background = c; row.append(i); });
    g.append(row, el("div", "sw-label", label)); sw.append(g);
  });
  info($("#dress"), C.dressCode, sw);
  info($("#gifts"), C.gifts);
  info($("#attendance"), C.attendance);

  const stay = $("#stay");
  if (C.stay && C.stay.hotels && C.stay.hotels.length) {
    const ic = el("div", "reveal");
    ic.innerHTML = '<svg class="stay-icon" viewBox="0 0 64 64"><path d="M10 46h44"/><path d="M14 46a18 18 0 0 1 36 0"/><path d="M32 28v-4"/><path d="M28 24h8"/><path d="M32 20v-3"/><circle cx="32" cy="15.5" r="1.8"/><path d="M8 50h48"/><path d="M22 36a11 11 0 0 1 6-5"/></svg>';
    stay.append(ic, el("h2", "script-title reveal", "Where to Stay"), el("p", "body-text reveal", C.stay.intro));
    C.stay.hotels.forEach((h) => {
      const b = el("div", "hotel reveal");
      b.append(el("div", "caps", h.name), el("p", null, h.text));
      if (h.url) { const a = el("a", "pill dark", "Book now"); a.href = h.url; a.target = "_blank"; a.rel = "noopener"; b.append(a); }
      stay.append(b);
    });
  } else stay.remove();

  /* ---------- countdown ---------- */
  function tick() {
    const ms = target - new Date(), box = $("#countdown");
    if (ms <= 0) { box.innerHTML = ""; return; }
    const parts = [["Days", Math.floor(ms / 864e5)], ["Hours", Math.floor(ms / 36e5) % 24], ["Mins", Math.floor(ms / 6e4) % 60]];
    box.innerHTML = parts.map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
  }
  setInterval(tick, 30000);

  /* ---------- music ---------- */
  if (C.music) {
    const a = $("#music"), b = $("#musicBtn");
    a.src = C.music; b.hidden = false;
    b.onclick = () => (a.paused ? a.play() : a.pause());
    a.onplay = () => b.classList.remove("paused");
    a.onpause = () => b.classList.add("paused");
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  function observeReveals() { $$(".view:not([hidden]) .reveal:not(.in)").forEach((n) => io.observe(n)); }

  /* ---------- first frame: envelope ---------- */
  const hero = $("#hero");
  function setOpened(instant) {
    if (instant) hero.classList.add("instant");
    hero.classList.add("open");
    $("#openHint").textContent = "Scroll down  ⌄";
    document.body.classList.remove("locked");
    try { sessionStorage.setItem(OPENED_KEY, "1"); } catch (e) {}
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.remove("instant")));
  }
  function openInvite() {
    if (hero.classList.contains("open")) { window.scrollTo({ top: hero.offsetHeight, behavior: "smooth" }); return; }
    if (C.music) $("#music").play().catch(() => {});
    hero.classList.add("open");
    setTimeout(() => setOpened(false), 2300);
  }
  $("#openBtn").addEventListener("click", openInvite);
  $("#openHint").addEventListener("click", openInvite);

  /* ---------- page routing: #home / #story / #details / #rsvp ---------- */
  function route() {
    const h = (location.hash || "#home").slice(1);
    const view = h === "story" || h === "home" || h === "hero" ? "home" : h === "details" || h === "rsvp" ? h : "home";
    $$(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
    if (view !== "home") { setOpened(true); window.scrollTo(0, 0); }
    else if (h === "story") { setOpened(true); requestAnimationFrame(() => $("#story").scrollIntoView()); }
    else window.scrollTo(0, 0);
    observeReveals();
  }
  window.addEventListener("hashchange", route);

  /* ---------- invite type: full vs reception-only ---------- */
  function applyType(type) {
    const full = type === "full";
    $("#ceremony").hidden = !full;
    $("#wording").textContent = (C.couple.first + " & " + C.couple.second) + " " + C.wording[full ? "full" : "reception"] + ".";
    target = new Date(full ? C.ceremonyStart : C.receptionStart);
    renderItinerary(full);
    tick();
  }

  /* ---------- RSVP (form as in the reference) ---------- */
  let attending = null, count = 1, maxParty = C.openRsvpMaxGuests || 3;
  function setChoice(group, val) { group.querySelectorAll("button").forEach((b) => { const on = b.dataset.v === String(val); b.classList.toggle("on", on); b.setAttribute("aria-checked", on); }); }
  function buildCounts() {
    const cc = $("#countChoice"); cc.innerHTML = "";
    for (let i = 1; i <= maxParty; i++) { const b = el("button", null, String(i)); b.type = "button"; b.dataset.v = i; b.setAttribute("role", "radio"); cc.append(b); }
  }
  function buildForm() {
    $("#rsvpForm").hidden = false;
    maxParty = guest ? guest.max_guests : (C.openRsvpMaxGuests || 3);
    buildCounts();
    if (guest) {
      $("#fullName").value = guest.rsvp_name || guest.name;
      if (guest.rsvp_status !== "pending") {
        attending = guest.rsvp_status === "attending"; count = guest.rsvp_count || 1;
        $("#names").value = guest.rsvp_names || "";
      }
    }
    refresh();
  }
  function refresh() {
    setChoice($("#attendChoice"), attending === null ? "" : attending ? "yes" : "no");
    setChoice($("#countChoice"), count);
    $("#partyFields").classList.toggle("muted", attending === false);
  }
  $("#attendChoice").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; attending = b.dataset.v === "yes"; refresh(); });
  $("#countChoice").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || attending === false) return; count = +b.dataset.v; refresh(); });
  $("#rsvpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#formMsg"), name = $("#fullName").value.trim();
    if (!name) { msg.textContent = "Please enter your full name."; $("#fullName").focus(); return; }
    if (attending === null) { msg.textContent = "Please let us know if you'll be attending."; return; }
    $("#submitBtn").disabled = true; msg.textContent = "Sending…";
    const r = { name, attending, count: attending ? count : 0, names: $("#names").value.trim() };
    try {
      if (guest) {
        await API.submitRsvp(code, r);
        Object.assign(guest, { rsvp_name: name, rsvp_status: attending ? "attending" : "declined", rsvp_count: r.count, rsvp_names: r.names });
      } else {
        await API.submitOpenRsvp(r);
        guest = { name, max_guests: maxParty, rsvp_status: attending ? "attending" : "declined", rsvp_count: r.count, rsvp_names: r.names, open: true };
      }
      msg.textContent = ""; showDone();
    } catch (err) { msg.textContent = "Sorry, something went wrong. Please try again."; console.error(err); }
    finally { $("#submitBtn").disabled = false; }
  });
  function showDone() {
    $("#rsvpForm").hidden = true;
    const box = $("#rsvpDone"); box.hidden = false; box.innerHTML = "";
    const who = guest.rsvp_name || guest.name;
    if (guest.rsvp_status === "attending")
      box.append(el("span", "script", "Thank you!"), el("p", null, `We've saved ${guest.rsvp_count} ${guest.rsvp_count > 1 ? "seats" : "seat"} for ${who}. We can't wait to celebrate with you.`));
    else box.append(el("span", "script", "Thank you"), el("p", null, "We'll miss you dearly, and we're grateful for your love from afar."));
    if (!guest.open) { const ch = el("button", null, "Change my reply"); ch.onclick = () => { box.hidden = true; buildForm(); }; box.append(ch); }
  }

  /* ---------- init ---------- */
  async function init() {
    drawBarcode(code || null);
    $("#rsvpAdults").textContent = C.attendance && C.attendance.text ? "Kindly note: ours is an adults-only celebration." : "";
    $("#openerFor").textContent = "Dear Guest";
    $("#dear").textContent = "Dear Guest,";
    applyType("reception"); // safest default: never reveal ceremony details without a valid full invite
    let opened = false; try { opened = sessionStorage.getItem(OPENED_KEY) === "1"; } catch (e) {}
    route();
    if (opened) setOpened(true);

    const openForm = () => {
      if (C.allowOpenRsvp === false) { $("#rsvpForm").hidden = true; $("#rsvpNoCode").hidden = false; $("#rsvpNoCode").textContent = "Please use the personal link you received to reply."; }
      else buildForm();
    };
    if (!code) { openForm(); return; }
    try { guest = await API.getInvite(code, track); } catch (err) { console.error(err); }
    if (!guest) { openForm(); return; }
    applyType(guest.invite_type === "full" ? "full" : "reception");
    $("#openerFor").textContent = guest.name;
    $("#dear").textContent = "Dear " + guest.name + ",";
    if (guest.rsvp_status !== "pending") showDone(); else buildForm();
  }
  init();
})();
