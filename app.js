function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function d(s){return new Date(s+"T12:00:00");}
function fmt(s){return d(s).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function range(e){return e.start===e.end?fmt(e.start):`${fmt(e.start)} – ${fmt(e.end)}`;}
function card(e, latest){
  const src = e.source ? `<a class="shop" href="${esc(e.source)}" target="_blank" rel="noopener">Details</a>` : `<span>Unverified</span>`;
  const isNew = e.added===latest ? `<span class="badge new">New</span>` : "";
  const book = /book/i.test(e.urgency) ? `<span class="badge">${esc(e.urgency)}</span>` : "";
  return `<article class="item">
    <div class="top"><span class="when">${range(e)}</span><span>${isNew}${book}</span></div>
    <h3>${esc(e.title)}</h3>
    <p class="brand">${esc(e.venue)} · ${esc(e.area)}</p>
    <p>${esc(e.why)}</p>
    <p class="stock">${esc(e.time)} · ${esc(e.price)} · ${e.fit.map(esc).join(", ")}</p>
    <div class="foot"><span>Added ${fmt(e.added)}</span>${src}</div>
  </article>`;
}
fetch("data.json",{cache:"no-store"}).then(r=>r.json()).then(data=>{
  const today = new Date(); today.setHours(0,0,0,0);
  const latest = data.updated;
  const up = data.events.filter(e=>d(e.end)>=today).sort((a,b)=>a.start.localeCompare(b.start));
  const past = data.events.filter(e=>d(e.end)<today).sort((a,b)=>b.end.localeCompare(a.end));
  const week = new Date(today); week.setDate(week.getDate()+7);
  const soon = up.filter(e=>d(e.start)<=week), later = up.filter(e=>d(e.start)>week);
  const sec = (t,list)=>list.length?`<h2>${t}</h2><div class="grid">${list.map(e=>card(e,latest)).join("")}</div>`:"";
  document.getElementById("updated").textContent = fmt(latest);
  document.getElementById("app").innerHTML =
    sec("Next 7 days", soon) + sec("Coming up", later) +
    (past.length ? `<details class="archive"><summary>Archive (${past.length} passed)</summary><div class="grid">${past.map(e=>card(e,latest)).join("")}</div></details>` : "");
});
