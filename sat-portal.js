(()=>{"use strict";
const mode=document.body.dataset.version==="2"?"2":"1";
const isTwo=mode==="2";
const cuts=[44.9593,47.2917,49.5282];
const palette={R4:"#a13f4e",R3:"#c38a3b",R2:"#73a9c9",R1:"#2a6489"};
const order={R4:0,R3:1,R2:2,R1:3};
const fmt=n=>new Intl.NumberFormat("es-EC",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const risk=score=>score<=cuts[0]?"R4":score<=cuts[1]?"R3":score<=cuts[2]?"R2":"R1";
const desc={R4:"Prioridad máxima de revisión, con ruta territorial de alerta propuesta",R3:"Revisión temática prioritaria en la sesión anual",R2:"Revisión técnica anual",R1:"Seguimiento ordinario"};
const dimNames={D1:"Física y salud",D2:"Psicológica, mental y emocional",D3:"Socioeconómica y habitabilidad",D4:"Profesional y carrera",D5:"Cognitiva, espiritual y ética"};
const sourceNotes={R4:"Los resultados R4 abren una ruta de comprobación y eventual alerta según la propuesta SAT-BP. No son alertas ya emitidas.",R3:"Una situación R3 estable requiere revisión. Las transiciones interanuales desde R1 o R2 a R3 podrían activar la ruta de alerta si existe comparabilidad verificada.",R2:"La clasificación R2 mantiene revisión anual. La transición R1 a R2 genera vigilancia reforzada según la propuesta.",R1:"La clasificación R1 indica mayor puntuación relativa. No excluye riesgos materiales, eventos graves ni necesidades de intervención."};
let features=[], selected="Esmeraldas", filter="all", zoneFilter="all", query="", map, layer, outlines, selectedLayer, byName=new Map(), allZones, groupButtons, search;
function cls(p){return isTwo?null:risk(Number(p.IBP));}
function label(name){return name==="DMQ"?"Distrito Metropolitano de Quito":name==="DMG"?"Distrito Metropolitano de Guayaquil":name;}
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}
function active(p){return (filter==="all"||cls(p)===filter) && (zoneFilter==="all"||String(p.zone)===zoneFilter) && label(p.name).toLowerCase().includes(query);}
const bounds={mainland:[[-5.2,-81.3],[1.7,-75.1]],islands:[[-1.5,-92.2],[1.9,-89.1]],all:[[-5.3,-92.3],[1.9,-75.1]]};
function style(f){const p=f.properties,r=cls(p),isSelected=p.name===selected,shown=active(p);
 return {color:isSelected?"#173b58":"#fff",weight:isSelected?3.2:1.1,fillColor:r?palette[r]:"#c9d8e2",fillOpacity:shown?(isTwo?.72:.90):.12,opacity:shown?1:.23};
}
function tooltip(p){const r=cls(p);return "<strong>"+esc(label(p.name))+"</strong><div>Zona "+esc(p.zone)+"</div>"+(r?"<div><b>"+r+"</b> · "+fmt(Number(p.IBP))+" / 100</div>":"<div>IBP 2.0: pendiente de cálculo</div>");}
function focus(name,zoom=false){
 const f=byName.get(name);if(!f)return;selected=name;
 if(layer){layer.setStyle(style);layer.eachLayer(l=>l.setTooltipContent(tooltip(l.feature.properties)));}
 renderDetails(f.properties);
 renderList();
 if(zoom&&layer){layer.eachLayer(l=>{if(l.feature.properties.name===name)map.fitBounds(l.getBounds(),{padding:[25,25],maxZoom:8});});}
}
function renderDetails(p){
 setText("selected-name",label(p.name));
 setText("selected-zone","Zona policial "+p.zone);
 const r=cls(p),badge=document.getElementById("risk-badge");
 badge.textContent=r||"—";badge.style.background=r?palette[r]:"#7393aa";
 setText("selected-score",r?fmt(Number(p.IBP)):"Sin puntuación");
 setText("score-label",r?"Índice global IBP 1.0 / 100":"IBP 2.0 aún no medido");
 setText("risk-desc",r?desc[r]:"Sin datos recalculados del IBP 2.0 no puede determinarse la categoría R4–R1 ni una ruta territorial a partir del índice.");
 setText("risk-note",r?sourceNotes[r]:"La capa neutral muestra las mismas 26 unidades de referencia; sus geometrías no constituyen evidencia de resultados nuevos.");
 const dims=document.getElementById("dimensions");
 dims.replaceChildren();
 for(const code of ["D1","D2","D3","D4","D5"]){
 const row=document.createElement("div");row.className="dim";
 const head=document.createElement("div");head.className="dim-head";
 const name=document.createElement("span");name.textContent=dimNames[code];
 const num=document.createElement("strong");num.textContent=r?fmt(Number(p[code])):"Sin dato 2.0";
 head.append(name,num);row.append(head);
 const track=document.createElement("div");track.className="dim-track";
 const bar=document.createElement("span");bar.style.width=r?Number(p[code])+"%":"0%";
 track.append(bar);row.append(track);dims.append(row);
 }
}
function renderList(){
 const sorted=features.slice().filter(f=>active(f.properties)).sort((a,b)=>
 isTwo?label(a.properties.name).localeCompare(label(b.properties.name),"es"):
 order[cls(a.properties)]-order[cls(b.properties)] || Number(a.properties.IBP)-Number(b.properties.IBP));
 const list=document.getElementById("risk-list");list.replaceChildren();
 setText("shown-count",sorted.length+" de 26");
 for(const f of sorted){
 const p=f.properties,r=cls(p),b=document.createElement("button");b.type="button";b.className="risk-item"+(p.name===selected?" active":"");
 b.setAttribute("aria-label","Seleccionar "+label(p.name));
 const tag=document.createElement("span");tag.className="initial";tag.style.background=r?palette[r]:"#829cb0";tag.textContent=r||"—";
 const name=document.createElement("span");name.className="name";name.textContent=label(p.name);
 const score=document.createElement("span");score.className="score";score.textContent=r?fmt(Number(p.IBP)):"—";
 b.append(tag,name,score);b.addEventListener("click",()=>focus(p.name,true));list.append(b);
 }
 if(!sorted.length){const p=document.createElement("p");p.className="empty";p.textContent="No hay subzonas que coincidan con el filtro.";list.append(p);}
}
function applyFilter(){
 for(const b of groupButtons){b.setAttribute("aria-pressed",String(b.dataset.risk===filter));}
 if(layer)layer.setStyle(style);
 renderList();const counter=Object.fromEntries(["R4","R3","R2","R1"].map(c=>[c,features.filter(f=>cls(f.properties)===c).length]));
 for(const k of ["R4","R3","R2","R1"])setText("count-"+k,isTwo?"Sin clasificación":counter[k]+" subzonas");
}
async function init(){
 const mapNode=document.getElementById("map");
 if(!window.L){mapNode.textContent="No fue posible cargar Leaflet. Comprueba la conexión a internet.";return;}
 const urls=["./datos/subzonas_ibp_2026.geojson","./datos/limites_zonas_derivadas.geojson"];
 let geo,zone;
 try{const resp=await Promise.all(urls.map(x=>fetch(x)));if(resp.some(x=>!x.ok))throw Error("Archivos cartográficos no disponibles");[geo,zone]=await Promise.all(resp.map(x=>x.json()));}
 catch(e){mapNode.textContent="No fue posible cargar la cartografía. Consulta los archivos de datos del repositorio.";return;}
 if(!Array.isArray(geo.features)||geo.features.length!==26){mapNode.textContent="La capa no contiene las 26 subzonas esperadas.";return;}
 features=geo.features;byName=new Map(features.map(f=>[f.properties.name,f]));
 if(!features.every(f=>Number.isFinite(Number(f.properties.IBP))&&!isNaN(Number(f.properties.zone)))){mapNode.textContent="Los datos territoriales no cumplen la estructura esperada.";return;}
 groupButtons=[...document.querySelectorAll("[data-risk]")];
 map=L.map("map",{scrollWheelZoom:false,preferCanvas:true,minZoom:3,maxZoom:12,zoomSnap:.25});
 map.fitBounds(bounds.mainland,{padding:[18,18]});
 L.control.zoom({position:"bottomright"}).addTo(map);
 layer=L.geoJSON(geo,{style,onEachFeature(f,l){l.bindTooltip(tooltip(f.properties),{sticky:true,direction:"top"});l.on("click",()=>focus(f.properties.name));}}).addTo(map);
 outlines=L.geoJSON(zone,{interactive:false,style:{color:"#325b79",weight:2,dashArray:"5,4",fill:false,opacity:.65}});
 const zoneSet=[...new Set(features.map(f=>String(f.properties.zone)))].sort((a,b)=>Number(a)-Number(b));
 const zs=document.getElementById("zone-filter");for(const z of zoneSet){const o=document.createElement("option");o.value=z;o.textContent="Zona "+z;zs.append(o);}
 zs.addEventListener("change",()=>{zoneFilter=zs.value;applyFilter();});
 document.getElementById("name-search").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();applyFilter();});
 document.getElementById("reset").addEventListener("click",()=>{filter="all";zoneFilter="all";query="";document.getElementById("zone-filter").value="all";document.getElementById("name-search").value="";applyFilter();map.fitBounds(bounds.mainland,{padding:[18,18]});});
 document.getElementById("view-mainland").addEventListener("click",()=>map.fitBounds(bounds.mainland,{padding:[15,15]}));
 document.getElementById("view-islands").addEventListener("click",()=>map.fitBounds(bounds.islands,{padding:[15,15]}));
 document.getElementById("view-all").addEventListener("click",()=>map.fitBounds(bounds.all,{padding:[15,15]}));
 const toggler=document.getElementById("show-zones");
 toggler.addEventListener("change",()=>{if(toggler.checked)outlines.addTo(map);else map.removeLayer(outlines);});
 for(const b of groupButtons){b.addEventListener("click",()=>{if(isTwo)return;filter=filter===b.dataset.risk?"all":b.dataset.risk;applyFilter();});}
 if(!isTwo){
 const counters={R4:0,R3:0,R2:0,R1:0};for(const f of features)counters[cls(f.properties)]++;
 if(Object.entries(counters).some(([k,v])=>v!==({R4:7,R3:6,R2:6,R1:7})[k])){
 console.warn("Los conteos observados no concuerdan con el SAT 2026",counters);
 document.getElementById("data-warning").textContent="Aviso de consistencia: verificar cortes frente a las puntuaciones del archivo.";document.getElementById("data-warning").hidden=false;
 }
 }
 setText("n-territories",features.length);
 if(!byName.has(selected))selected=features[0].properties.name;
 applyFilter();focus(selected);
}
init();
})();