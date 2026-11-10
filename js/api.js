/* Data layer — Supabase when configured, otherwise DEMO mode (localStorage). */
(function () {
  const C = window.WEDDING;
  const DEMO =
    !C.supabaseUrl || C.supabaseUrl.includes("YOUR-") || !C.supabaseAnonKey || C.supabaseAnonKey.includes("YOUR-");

  // ---------------- Supabase ----------------
  function supa() {
    if (!window.supabase) throw new Error("Supabase library failed to load");
    if (!supa._c) supa._c = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
    return supa._c;
  }
  const SupaApi = {
    demo: false,
    async getInvite(code, track = true) {
      const { data, error } = await supa().rpc("get_invite", { p_code: code, p_track: track });
      if (error) throw error;
      return data;
    },
    async submitRsvp(code, r) {
      const { data, error } = await supa().rpc("submit_rsvp", {
        p_code: code, p_name: r.name, p_attending: r.attending, p_count: r.count, p_names: r.names,
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.error);
      return data;
    },
    async submitOpenRsvp(r) {
      const { data, error } = await supa().rpc("submit_open_rsvp", {
        p_name: r.name, p_attending: r.attending, p_count: r.count, p_names: r.names,
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.error);
      return data;
    },
    async session() {
      const { data } = await supa().auth.getSession();
      return data.session;
    },
    async signIn(email, password) {
      const { error } = await supa().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() { await supa().auth.signOut(); },
    async listGuests() {
      const { data, error } = await supa().from("guests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async addGuests(rows) {
      const { data, error } = await supa().from("guests").insert(rows).select();
      if (error) throw error;
      return data;
    },
    async updateGuest(id, patch) {
      const { error } = await supa().from("guests").update(patch).eq("id", id);
      if (error) throw error;
    },
    async deleteGuest(id) {
      const { error } = await supa().from("guests").delete().eq("id", id);
      if (error) throw error;
    },
  };

  // ---------------- Demo (localStorage) ----------------
  const KEY = "wedding_demo_guests_v1";
  const ALPH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => ALPH[b % ALPH.length]).join("");
  const blank = (o) => ({
    id: crypto.randomUUID(), code: code(), display_name: "", invite_type: "full", max_guests: 1, side: "", tag: "", phone: "", notes: "",
    opened_count: 0, first_opened_at: null, last_opened_at: null, rsvp_status: "pending",
    rsvp_count: null, rsvp_names: "", rsvp_message: "", rsvp_at: null, created_at: new Date().toISOString(), ...o,
  });
  function load() {
    let g;
    try { g = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!Array.isArray(g)) {
      g = [
        blank({ display_name: "Mr. & Mrs. Perera", max_guests: 2, side: "Groom", tag: "Family", code: "DEMOPERERA" }),
        blank({ display_name: "Dilshan Fernando", invite_type: "reception", code: "DEMORECEPT", max_guests: 1, side: "Bride", tag: "School", phone: "94771234567" }),
        blank({ display_name: "The Silva Family", max_guests: 4, side: "Both", tag: "Neighbours", rsvp_status: "attending", rsvp_count: 3, rsvp_names: "Nimal, Kumari, Sahan", rsvp_at: new Date().toISOString(), opened_count: 3, first_opened_at: new Date().toISOString(), last_opened_at: new Date().toISOString() }),
      ];
      save(g);
    }
    return g;
  }
  function save(g) { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch (e) {} }

  const DemoApi = {
    demo: true,
    async getInvite(c, track = true) {
      const g = load(); const x = g.find((r) => r.code === String(c).trim().toUpperCase());
      if (!x) return null;
      if (track) { x.opened_count++; x.first_opened_at ||= new Date().toISOString(); x.last_opened_at = new Date().toISOString(); save(g); }
      return { name: x.display_name, rsvp_name: x.rsvp_name, invite_type: x.invite_type, max_guests: x.max_guests, rsvp_status: x.rsvp_status, rsvp_count: x.rsvp_count, rsvp_names: x.rsvp_names, rsvp_message: x.rsvp_message };
    },
    async submitRsvp(c, r) {
      const g = load(); const x = g.find((r2) => r2.code === String(c).trim().toUpperCase());
      if (!x) throw new Error("Invitation not found");
      if (r.attending && (r.count < 1 || r.count > x.max_guests)) throw new Error("Invalid party size");
      Object.assign(x, { rsvp_name: r.name, rsvp_status: r.attending ? "attending" : "declined", rsvp_count: r.attending ? r.count : 0, rsvp_names: r.names, rsvp_at: new Date().toISOString() });
      save(g); return { ok: true };
    },
    async submitOpenRsvp(r) {
      const g = load();
      g.push(blank({ display_name: r.name, rsvp_name: r.name, invite_type: "reception", max_guests: Math.max(1, r.count), tag: "Website RSVP",
        rsvp_status: r.attending ? "attending" : "declined", rsvp_count: r.attending ? r.count : 0, rsvp_names: r.names, rsvp_at: new Date().toISOString() }));
      save(g); return { ok: true };
    },
    async session() { return { user: { email: "demo@local" } }; },
    async signIn() {}, async signOut() {},
    async listGuests() { return load().slice().sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async addGuests(rows) { const g = load(); const n = rows.map(blank); g.push(...n); save(g); return n; },
    async updateGuest(id, patch) { const g = load(); Object.assign(g.find((r) => r.id === id), patch); save(g); },
    async deleteGuest(id) { save(load().filter((r) => r.id !== id)); },
  };

  window.API = DEMO ? DemoApi : SupaApi;

  window.inviteLink = function (code) {
    let base = C.siteUrl;
    if (!base) {
      const u = new URL(location.href);
      u.search = ""; u.hash = "";
      u.pathname = u.pathname.replace(/admin\.html$/, "");
      base = u.toString();
    }
    return base.replace(/index\.html$/, "") + "?g=" + encodeURIComponent(code);
  };
})();
