(function () {
  const C = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let guests = [];

  $("#mono").textContent = C.couple.monogram;
  if (API.demo) $("#demoBadge").hidden = false;

  function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.remove("show"), 2200); }
  function fail(err) { console.error(err); toast("Error: " + (err.message || err)); }

  const message = (g) => C.shareMessage.replace(/\{name\}/g, g.display_name).replace(/\{link\}/g, inviteLink(g.code));
  const waUrl = (g) => {
    const phone = (g.phone || "").replace(/\D/g, "");
    return (phone ? `https://wa.me/${phone}` : "https://wa.me/") + "?text=" + encodeURIComponent(message(g));
  };
  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text); toast(label || "Copied"); }
    catch { prompt("Copy this:", text); }
  }

  /* ---------- auth ---------- */
  async function start() {
    const s = await API.session().catch(() => null);
    if (!s) { $("#login").hidden = false; $("#app").hidden = true; $("#logoutBtn").hidden = true; return; }
    $("#login").hidden = true; $("#app").hidden = false; $("#logoutBtn").hidden = API.demo;
    await load();
  }
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#loginErr").textContent = "";
    try { await API.signIn($("#email").value, $("#password").value); await start(); }
    catch (err) { $("#loginErr").textContent = err.message || "Sign-in failed"; }
  });
  $("#logoutBtn").onclick = async () => { await API.signOut(); start(); };

  /* ---------- data ---------- */
  async function load() {
    try { guests = await API.listGuests(); } catch (err) {
      fail(err);
      if (String(err.message).match(/permission|policy|JWT/i)) toast("Your account is not in the admins table");
      guests = [];
    }
    render();
  }

  function stats() {
    const sum = (f) => guests.reduce((a, g) => a + (f(g) || 0), 0);
    const items = [
      ["Invitations", guests.length],
      ["Seats offered", sum((g) => g.max_guests)],
      ["Ceremony seats", sum((g) => (g.invite_type === "full" ? g.max_guests : 0))],
      ["Opened", guests.filter((g) => g.opened_count > 0).length],
      ["Attending (heads)", sum((g) => (g.rsvp_status === "attending" ? g.rsvp_count : 0)), true],
      ["Declined", guests.filter((g) => g.rsvp_status === "declined").length],
      ["Awaiting reply", guests.filter((g) => g.rsvp_status === "pending").length],
    ];
    $("#stats").innerHTML = items.map(([l, v, a]) => `<div class="stat${a ? " accent" : ""}"><b>${v}</b><span>${l}</span></div>`).join("");
    const tags = [...new Set(guests.map((g) => g.tag).filter(Boolean))];
    $("#tagList").innerHTML = tags.map((t) => `<option value="${esc(t)}">`).join("");
  }

  function render() {
    stats();
    const q = $("#search").value.trim().toLowerCase();
    const st = $("#statusFilter").value;
    const ty = $("#typeFilter").value;
    const list = guests.filter((g) => {
      if (ty && g.invite_type !== ty) return false;
      if (st === "unopened" && g.opened_count > 0) return false;
      if (st && st !== "unopened" && g.rsvp_status !== st) return false;
      if (!q) return true;
      return [g.display_name, g.tag, g.phone, g.side, g.notes, g.code].join(" ").toLowerCase().includes(q);
    });
    $("#rows").innerHTML = list.map((g) => {
      const rsvp = g.rsvp_status === "attending" ? `<span class="badge b-attending">Attending · ${g.rsvp_count}</span>`
        : g.rsvp_status === "declined" ? `<span class="badge b-declined">Declined</span>` : `<span class="badge b-pending">Pending</span>`;
      const rsvpSub = [g.rsvp_name && g.rsvp_name !== g.display_name && "Replied as: " + g.rsvp_name, g.rsvp_names && "Guests: " + g.rsvp_names, g.rsvp_message && "“" + g.rsvp_message + "”"].filter(Boolean).map(esc).join("<br>");
      const opened = g.opened_count ? `${g.opened_count}×<div class="sub">${new Date(g.last_opened_at).toLocaleString()}</div>` : `<span class="sub">Not yet</span>`;
      return `<tr data-id="${g.id}">
        <td><b>${esc(g.display_name)}</b><div class="sub">${esc([g.side, g.phone].filter(Boolean).join(" · "))}</div>${g.notes ? `<div class="sub">${esc(g.notes)}</div>` : ""}</td>
        <td>${g.invite_type === "full" ? '<span class="badge b-full">Ceremony + Reception</span>' : '<span class="badge b-rec">Reception only</span>'}</td>
        <td>${g.max_guests}</td>
        <td>${esc(g.tag || "")}</td>
        <td>${opened}</td>
        <td>${rsvp}${rsvpSub ? `<div class="sub">${rsvpSub}</div>` : ""}</td>
        <td><span class="code">${esc(g.code)}</span></td>
        <td><div class="actions">
          <button data-a="copy">Copy link</button>
          <button data-a="msg">Copy message</button>
          <a class="wa" href="${esc(waUrl(g))}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="${esc(inviteLink(g.code))}&preview=1" target="_blank" rel="noopener">Preview</a>
          <button data-a="edit">Edit</button>
          <button data-a="del" class="del">Delete</button>
        </div></td></tr>`;
    }).join("") || `<tr><td colspan="8" class="sub">No guests yet.</td></tr>`;
  }
  $("#search").oninput = render;
  $("#statusFilter").onchange = render;
  $("#typeFilter").onchange = render;
  $("#refreshBtn").onclick = load;

  $("#rows").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const g = guests.find((x) => x.id === b.closest("tr").dataset.id);
    const a = b.dataset.a;
    if (a === "copy") copy(inviteLink(g.code), "Link copied");
    if (a === "msg") copy(message(g), "Message copied");
    if (a === "edit") openEdit(g);
    if (a === "del" && confirm(`Delete ${g.display_name}? Their link will stop working.`)) {
      try { await API.deleteGuest(g.id); toast("Deleted"); load(); } catch (err) { fail(err); }
    }
  });

  /* ---------- add ---------- */
  const clean = (v) => (v || "").trim() || null;
  $("#addForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const row = {
      display_name: $("#fName").value.trim(), invite_type: $("#fType").value, max_guests: Math.max(1, Math.min(20, +$("#fMax").value || 1)),
      side: clean($("#fSide").value), tag: clean($("#fTag").value), phone: clean($("#fPhone").value), notes: clean($("#fNotes").value),
    };
    try {
      const [g] = await API.addGuests([row]);
      const keepType = $("#fType").value; e.target.reset(); $("#fMax").value = 1; $("#fType").value = keepType;
      const box = $("#newLink"); box.hidden = false;
      box.innerHTML = `<b>${esc(g.display_name)}</b><div class="url">${esc(inviteLink(g.code))}</div>
        <div class="actions"><button id="nlCopy">Copy link</button><a class="wa" href="${esc(waUrl(g))}" target="_blank" rel="noopener">Send on WhatsApp</a></div>`;
      $("#nlCopy").onclick = () => copy(inviteLink(g.code), "Link copied");
      toast("Guest added"); load();
    } catch (err) { fail(err); }
  });

  /* ---------- edit ---------- */
  let editing = null;
  function openEdit(g) {
    editing = g;
    $("#eName").value = g.display_name; $("#eType").value = g.invite_type || "full"; $("#eMax").value = g.max_guests; $("#eSide").value = g.side || "";
    $("#eTag").value = g.tag || ""; $("#ePhone").value = g.phone || ""; $("#eNotes").value = g.notes || "";
    $("#eStatus").value = g.rsvp_status; $("#eCount").value = g.rsvp_count ?? "";
    $("#editDlg").showModal();
  }
  $("#editDlg").addEventListener("close", async () => {
    if ($("#editDlg").returnValue !== "save" || !editing) return;
    const status = $("#eStatus").value;
    const patch = {
      display_name: $("#eName").value.trim(), invite_type: $("#eType").value, max_guests: Math.max(1, Math.min(20, +$("#eMax").value || 1)),
      side: clean($("#eSide").value), tag: clean($("#eTag").value), phone: clean($("#ePhone").value), notes: clean($("#eNotes").value),
      rsvp_status: status, rsvp_count: status === "pending" ? null : +$("#eCount").value || 0,
    };
    if (status !== editing.rsvp_status) patch.rsvp_at = status === "pending" ? null : new Date().toISOString();
    try { await API.updateGuest(editing.id, patch); toast("Saved"); load(); } catch (err) { fail(err); }
  });

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  $("#csvFile").onchange = async (e) => { const f = e.target.files[0]; if (f) $("#csvText").value = await f.text(); };
  $("#importBtn").onclick = async () => {
    const rows = parseCSV($("#csvText").value);
    if (rows.length < 2) { $("#importMsg").textContent = "Nothing to import (need a header row + at least one guest)."; return; }
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (...names) => head.findIndex((h) => names.includes(h));
    const iY = idx("invite", "invite_type", "type"), iN = idx("name", "display_name"), iM = idx("seats", "max_guests"), iS = idx("side"), iT = idx("group", "tag"), iP = idx("phone", "whatsapp"), iO = idx("notes");
    if (iN < 0) { $("#importMsg").textContent = "Header must include a 'name' column."; return; }
    const data = rows.slice(1).map((r) => ({
      display_name: (r[iN] || "").trim(),
      invite_type: iY >= 0 && /^rec/i.test((r[iY] || "").trim()) ? "reception" : "full",
      max_guests: Math.max(1, Math.min(20, parseInt(r[iM]) || 1)),
      side: iS >= 0 ? clean(r[iS]) : null, tag: iT >= 0 ? clean(r[iT]) : null,
      phone: iP >= 0 ? clean(r[iP]) : null, notes: iO >= 0 ? clean(r[iO]) : null,
    })).filter((r) => r.display_name);
    try { await API.addGuests(data); $("#importMsg").textContent = `Imported ${data.length} guests.`; $("#csvText").value = ""; load(); }
    catch (err) { fail(err); }
  };

  $("#exportBtn").onclick = () => {
    const cols = ["display_name", "rsvp_name", "invite_type", "max_guests", "side", "tag", "phone", "notes", "code", "link", "opened_count", "rsvp_status", "rsvp_count", "rsvp_names", "rsvp_message", "rsvp_at"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(",")].concat(guests.map((g) => cols.map((c) => q(c === "link" ? inviteLink(g.code) : g[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `guests-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  start();
})();
