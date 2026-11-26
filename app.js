const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const D=s=>new Date(s+"T12:00:00");
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const fmt=(s,o={month:"short",day:"numeric"})=>D(s).toLocaleDateString("en-US",o);
const TODAY=iso(new Date());
const SAVE="out-saved-v1"; let saved=new Set(JSON.parse(localStorage.getItem(SAVE)||"[]"));
const WHO={family:"Family",friends:"Friends",couples:"Date night",solo:"Solo"};
const st={q:"",day:null,who:"All",cat:"All",free:false,book:false,saved:false,view:"list"};
let EV=[],map,layer;

const endOf=e=>e.end||e.start;
const isFree=e=>/^free/i.test(e.price||"");
const isBook=e=>/book now/i.test(e.urgency||"");
const onDay=(e,d)=>e.start<=d&&endOf(e)>=d;
const upcoming=()=>EV.filter(e=>endOf(e)>=TODAY);
const past=()=>EV.filter(e=>endOf(e)<TODAY).sort((a,b)=>b.start.localeCompare(a.start));
function when(e){
  if(e.start===endOf(e))return fmt(e.start,{weekday:"short",month:"short",day:"numeric"});
  if(e.start<=TODAY)return "On now · through "+fmt(endOf(e));
  return fmt(e.start)+" to "+fmt(endOf(e));
}
function badge(e){if(e.start<TODAY&&endOf(e)>=TODAY)return `<div class="badge now"><b>NOW</b><span>to ${fmt(endOf(e))}</span></div>`;const d=D(e.start);
  return `<div class="badge"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-US",{month:"short"})}</span></div>`}
function pic(e,cls=""){
  const fb=`<div class="fb c-${esc((e.category||"x").replace(/\W/g,"").toLowerCase())}"><span>${esc(e.category||"")}</span></div>`;
  return `<div class="pic ${cls}" data-fb='${fb.replace(/'/g,"&#39;")}'>${e.image?`<img loading="lazy" src="${esc(e.image)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.innerHTML=this.parentNode.dataset.fb">`:fb}</div>`;
}
function card(e,big){
  const s=saved.has(e.id), gone=endOf(e)<TODAY;
  return `<article class="ev ${big?"big":""} ${gone?"gone":""}" data-id="${esc(e.id)}">
   <div class="pwrap">${pic(e)}${badge(e)}<button class="heart ${s?"on":""}" data-save="${esc(e.id)}" aria-label="Save">${s?"♥":"♡"}</button>
   ${gone?`<span class="flag past">Passed</span>`:isBook(e)?`<span class="flag hot">Book now</span>`:/decide/i.test(e.urgency)?`<span class="flag warm">Decide this week</span>`:""}</div>
   <div class="body"><p class="cat">${esc(e.category)} · ${esc(e.area)}</p><h3>${esc(e.title)}</h3>
   <p class="when">${esc(when(e))}${e.time&&e.start===endOf(e)?` · ${esc(e.time)}`:""}</p>
   <p class="foot"><span class="price ${isFree(e)?"free":""}">${esc(e.price||"")}</span>${(e.fit||[]).map(f=>`<i>${WHO[f]||f}</i>`).join("")}</p></div></article>`;
}
function match(e){
  const q=st.q.toLowerCase();
  return (!st.day||onDay(e,st.day))&&(st.who==="All"||(e.fit||[]).includes(st.who))&&(st.cat==="All"||e.category===st.cat)
   &&(!st.free||isFree(e))&&(!st.book||isBook(e))&&(!st.saved||saved.has(e.id))
   &&(!q||[e.title,e.venue,e.area,e.category,e.why].join(" ").toLowerCase().includes(q));
}
function weekendRange(){
  const d=D(TODAY),dow=d.getDay();
  const fri=dow===0?addDays(TODAY,-2):dow===6?addDays(TODAY,-1):addDays(TODAY,5-dow);
  return [dow>=5||dow===0?TODAY:fri,addDays(fri,2)];
}
function renderWeekend(){
  const [a,b]=weekendRange();
  let list=upcoming().filter(e=>e.start<=b&&endOf(e)>=a), label="This weekend";
  if(!list.length){list=upcoming().slice(0,6);label="Coming up"}
  list.sort((x,y)=>(!!y.image-!!x.image)||(isBook(y)-isBook(x))||x.start.localeCompare(y.start));
  $("#weekend").innerHTML=`<div class="wk-head"><h2>${label}</h2><span>${fmt(a,{month:"short",day:"numeric"})} to ${fmt(b,{month:"short",day:"numeric"})}</span></div><div class="rail">${list.slice(0,8).map(e=>card(e,true)).join("")}</div>`;
}
function renderDays(){
  const up=upcoming(); const starts=d=>up.filter(e=>e.start===d||(d===TODAY&&e.start<TODAY)).length; let h=`<button class="day any ${!st.day?"on":""}" data-day="">Any<br>day</button>`;
  for(let n=0;n<42;n++){const d=addDays(TODAY,n),dt=D(d),c=up.filter(e=>onDay(e,d)).length,sc=starts(d);
    h+=`<button class="day ${st.day===d?"on":""} ${[0,6].includes(dt.getDay())?"we":""} ${dt.getDate()===1||n===0?"mstart":""}" data-day="${d}" ${c?"":"disabled"}>
     <small>${n===0?"Today":dt.toLocaleDateString("en-US",{weekday:"short"})}</small><b>${dt.getDate()}</b><em>${dt.getDate()===1||n===0?dt.toLocaleDateString("en-US",{month:"short"}):""}</em><span class="dots">${"•".repeat(Math.min(sc,4))}</span></button>`}
  $("#days").innerHTML=h;
}
function chipRow(el,items){el.innerHTML=items.map(([k,v,label,on])=>`<button class="chip ${on?"on":""}" data-k="${k}" data-v="${esc(v)}">${label}</button>`).join("")}
function renderChips(){
  chipRow($("#who"),[["who","All","Everyone",st.who==="All"],...Object.entries(WHO).map(([k,l])=>["who",k,l,st.who===k]),
    ["free","1","Free",st.free],["book","1","Book now",st.book],["saved","1",`♥ Saved (${saved.size})`,st.saved]]);
  const cats=[...new Set(upcoming().map(e=>e.category))].sort();
  chipRow($("#cats"),[["cat","All","All types",st.cat==="All"],...cats.map(c=>["cat",c,c,st.cat===c])]);
}
function group(list){
  const [a,b]=weekendRange(),nextWk=addDays(b,7),g=new Map();
  for(const e of list){
    const s=e.start<TODAY?TODAY:e.start;
    const k=e.start<TODAY?"On now":s<=b?"This weekend":s<=nextWk?"Next week":D(s).toLocaleDateString("en-US",{month:"long",year:"numeric"});
    if(!g.has(k))g.set(k,[]);g.get(k).push(e);
  }
  return g;
}
function renderList(){
  const list=upcoming().filter(match).sort((x,y)=>(x.start<TODAY?TODAY:x.start).localeCompare(y.start<TODAY?TODAY:y.start)||x.title.localeCompare(y.title));
  $("#empty").hidden=list.length>0;
  if(st.view==="map"){$("#list").innerHTML="";drawMap(list);return}
  $("#list").innerHTML=[...group(list)].map(([k,v])=>`<h2 class="grp">${esc(k)}<span>${v.length}</span></h2><div class="grid">${v.map(e=>card(e)).join("")}</div>`).join("");
}
function renderArchive(){
  const p=past().filter(e=>!st.saved||saved.has(e.id));
  $("#archWrap").hidden=!p.length;
  $("#archSum").innerHTML=`Past outings <span>${p.length} kept</span>`;
  const g=new Map();for(const e of p){const k=D(e.start).toLocaleDateString("en-US",{month:"long",year:"numeric"});if(!g.has(k))g.set(k,[]);g.get(k).push(e)}
  $("#arch").innerHTML=[...g].map(([k,v])=>`<h3 class="grp small">${k}</h3><div class="grid small">${v.map(e=>card(e)).join("")}</div>`).join("");
}
function drawMap(list){
  if(!window.L){$("#map").innerHTML="<p class='empty'>The map couldn't load.</p>";return}
  if(!map){map=L.map("map",{scrollWheelZoom:false}).setView([38.93,-77.03],10);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:18}).addTo(map);
    layer=L.layerGroup().addTo(map)}
  layer.clearLayers();const pts=[];
  list.filter(e=>e.lat&&e.lng).forEach(e=>{pts.push([e.lat,e.lng]);
    L.marker([e.lat,e.lng],{icon:L.divIcon({className:"pin"+(isBook(e)?" hot":""),html:`<b>${D(e.start<TODAY?TODAY:e.start).getDate()}</b>`,iconSize:[34,34],iconAnchor:[17,34]})})
     .addTo(layer).bindPopup(`<b>${esc(e.title)}</b><br>${esc(when(e))}<br><a href="#" data-open="${esc(e.id)}">Details</a>`)});
  if(pts.length)map.fitBounds(pts,{padding:[30,30],maxZoom:13});
  setTimeout(()=>map.invalidateSize(),50);
}
function render(){renderDays();renderChips();renderList();renderArchive();
  $("#view").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.view===st.view));
  $("#map").hidden=st.view!=="map";}
function ics(e){
  const d=s=>s.replace(/-/g,""),x=s=>String(s||"").replace(/[\\,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  const body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//outdmv//EN","BEGIN:VEVENT",`UID:${e.id}@outdmv`,`DTSTAMP:${d(TODAY)}T120000Z`,
    `DTSTART;VALUE=DATE:${d(e.start)}`,`DTEND;VALUE=DATE:${d(addDays(e.start===endOf(e)?e.start:e.start,1))}`,
    `SUMMARY:${x(e.title)}`,`LOCATION:${x([e.venue,e.area].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${x([e.time,e.price,e.why,e.source].filter(Boolean).join("\n"))}`,e.source?`URL:${e.source}`:"","END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:"text/calendar"}));a.download=e.id+".ics";document.body.appendChild(a);a.click();a.remove();
}
function gcal(e){const d=s=>s.replace(/-/g,"");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(e.title)+"&dates="+d(e.start)+"/"+d(addDays(e.start,1))+"&location="+encodeURIComponent([e.venue,e.area].join(", "))+"&details="+encodeURIComponent([e.time,e.price,e.source].filter(Boolean).join("\n"))}
function sheet(id){
  const e=EV.find(x=>x.id===id); if(!e)return; const s=saved.has(e.id),gone=endOf(e)<TODAY;
  $("#sheetCard").innerHTML=`<button class="x" data-close aria-label="Close">×</button><div class="pwrap">${pic(e,"tall")}${badge(e)}</div><div class="sbody">
   <p class="cat">${esc(e.category)} · ${esc(e.area)}</p><h2>${esc(e.title)}</h2>
   <dl><dt>When</dt><dd>${esc(when(e))}${e.time?`<br>${esc(e.time)}`:""}</dd><dt>Where</dt><dd>${esc(e.venue||e.area)}</dd><dt>Cost</dt><dd>${esc(e.price||"See event page")}</dd><dt>Good for</dt><dd>${(e.fit||[]).map(f=>WHO[f]||f).join(", ")}</dd></dl>
   <p class="whyx">${esc(e.why)}</p>${e.urgency&&!gone?`<p class="urg ${isBook(e)?"hot":""}">${esc(e.urgency)}</p>`:""}${gone?`<p class="urg">This one has passed. Kept here in case it comes back next year.</p>`:""}
   <div class="acts">${e.source?`<a class="btn" href="${esc(e.source)}" target="_blank" rel="noopener">Event page</a>`:""}
   ${gone?"":`<button class="btn ghost" data-ics="${esc(e.id)}">Add to calendar</button><a class="btn ghost" href="${gcal(e)}" target="_blank" rel="noopener">Google Calendar</a>`}
   ${e.lat?`<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lng}" target="_blank" rel="noopener">Directions</a>`:""}
   <button class="btn ghost" data-save="${esc(e.id)}">${s?"♥ Saved":"♡ Save"}</button></div></div>`;
  $("#sheet").hidden=false;document.body.classList.add("lock");
}
const close=()=>{$("#sheet").hidden=true;document.body.classList.remove("lock")};
document.addEventListener("click",ev=>{
  const t=ev.target.closest("[data-save],[data-day],[data-k],[data-view],[data-ics],[data-open],[data-close],.ev");if(!t)return;
  if(t.dataset.save){const k=t.dataset.save;saved.has(k)?saved.delete(k):saved.add(k);localStorage.setItem(SAVE,JSON.stringify([...saved]));renderWeekend();render();if(!$("#sheet").hidden)sheet(k);return}
  if(t.dataset.day!==undefined){st.day=t.dataset.day||null;render();$("#list").scrollIntoView({behavior:"smooth",block:"start"});return}
  if(t.dataset.k){const k=t.dataset.k;if(["free","book","saved"].includes(k))st[k]=!st[k];else st[k]=t.dataset.v;render();return}
  if(t.dataset.view){st.view=t.dataset.view;render();return}
  if(t.dataset.ics){ics(EV.find(e=>e.id===t.dataset.ics));return}
  if(t.dataset.open){ev.preventDefault();sheet(t.dataset.open);return}
  if(t.hasAttribute("data-close")){close();return}
  if(t.classList.contains("ev"))sheet(t.dataset.id);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
$("#q").addEventListener("input",e=>{st.q=e.target.value;renderList();renderArchive()});
fetch("data.json",{cache:"no-store"}).then(r=>r.json()).then(d=>{
  EV=d.events;$("#updated").textContent=fmt(d.updated,{month:"long",day:"numeric",year:"numeric"});
  $("#metaLine").textContent=`${upcoming().length} upcoming · ${past().length} in the archive`;
  renderWeekend();render();
});
