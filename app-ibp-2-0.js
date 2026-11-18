(()=>{'use strict';
const data=window.IBP2_GEOJSON,zoneData=window.IBP2_ZONES;
const canvas=document.getElementById('map');
if(!window.L||!data||!Array.isArray(data.features)){if(canvas)canvas.textContent='No fue posible iniciar el mapa.';return;}
const fts=data.features, byName=new Map(fts.map(f=>[f.properties.name,f]));
const dims=[['IBP','Índice global',null],['D1','D1 · Física y salud',5],['D2','D2 · Psicológica y emocional',6],['D3','D3 · Socioeconómica y habitabilidad',6],['D4','D4 · Carrera profesional',6],['D5','D5 · Cognitiva, espiritual y ética',6]];
let selected=fts[0].properties.name,metric='IBP',zone='all',outline=false;
const bounds={mainland:[[-5.08,-81.16],[1.53,-75.12]],islands:[[-1.48,-92.1],[1.78,-89.17]],all:[[-5.12,-92.1],[1.78,-75.1]]};
const map=L.map('map',{zoomControl:false,attributionControl:false,preferCanvas:true,scrollWheelZoom:false,minZoom:3,maxZoom:12,zoomSnap:.25});
L.control.zoom({position:'bottomright'}).addTo(map);map.fitBounds(bounds.mainland,{padding:[20,20]});
const matching=p=>zone==='all'||String(p.zone)===zone;
const style=f=>{const p=f.properties;return{color:p.name===selected?'#16466e':'#fff',weight:p.name===selected?2.8:1.15,fillColor:'#b7ccdb',fillOpacity:matching(p)?.75:.14,opacity:matching(p)?1:.25}};
const geo=L.geoJSON(data,{style,onEachFeature(f,l){l.bindTooltip(f.properties.name+' · IBP 2.0 sin calificación',{sticky:true});l.on('click',()=>choose(f.properties.name));}}).addTo(map);
const lines=L.geoJSON(zoneData,{interactive:false,style:{color:'#2b5475',weight:2,dashArray:'6,4',fill:false,opacity:.68}});
function txt(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
function choose(name,zoom=false){if(!byName.has(name))return;selected=name;
const p=byName.get(name).properties;geo.setStyle(style);
txt('selected-name',p.name);txt('selected-zone','Zona policial '+p.zone);
txt('selected-risk','—');txt('selected-risk-description','Rangos R4–R1 pendientes de validación');
txt('reading-territory',p.name);
txt('metric-meaning','La subzona está incluida en el universo geográfico del IBP 2.0. Se prevé medir '+(metric==='IBP'?'el índice global y las cinco dimensiones':dims.find(d=>d[0]===metric)[1])+'.');
txt('metric-comparison','Sin puntuación IBP 2.0, no procede calcular medias, diferencias ni posición relativa.');
txt('proxy-note','Los valores territoriales del IBP 1.0 no se imputan a la versión 2.0.');
txt('focus-label',metric==='IBP'?'Índice global IBP 2.0':dims.find(d=>d[0]===metric)[1]);
showProfile();drawList();
if(zoom){geo.eachLayer(l=>{if(l.feature.properties.name===name)map.fitBounds(l.getBounds(),{padding:[35,35],maxZoom:9});});}}
function showProfile(){const panel=document.getElementById('profile');panel.replaceChildren();
dims.forEach(([key,label,count])=>{
 const row=document.createElement('div');row.className='profile-row'+(metric===key?' selected':'');
 const button=document.createElement('button');button.type='button';button.className='profile-trigger';button.setAttribute('aria-label',label+' · sin puntuación IBP 2.0');
 const title=document.createElement('div');title.className='profile-label-line';
 const name=document.createElement('span');name.className='profile-label';name.textContent=label;const arrow=document.createElement('span');arrow.className='profile-chevron';arrow.textContent='›';
 title.append(name,arrow);const stats=document.createElement('div');stats.className='profile-values';
 const text=document.createElement('span');text.className='indicator-unavailable';text.textContent=key==='IBP'?'Puntuación pendiente':'Sin puntuación · '+count+' indicadores';stats.append(text);
 const progress=document.createElement('div');progress.className='profile-track';progress.style.background='#e7eef4';
 button.append(title,stats,progress);button.onclick=()=>setMetric(key);row.append(button);panel.append(row);
});}
function drawList(){const list=document.getElementById('subzone-list'),search=document.getElementById('subzone-search').value.trim().toLowerCase();
const values=fts.map(f=>f.properties).filter(p=>matching(p)&&p.name.toLowerCase().includes(search)).sort((a,b)=>a.name.localeCompare(b.name,'es'));
list.replaceChildren();txt('list-count',values.length+' de 26');txt('ranking-title','Subzonas IBP 2.0 · sin clasificación');
values.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='subzone-item'+(p.name===selected?' active':'');
const no=document.createElement('span');no.className='rank-index';no.textContent='—';
const name=document.createElement('span');name.className='rank-name';name.textContent=p.name;
const col=document.createElement('span');col.className='subzone-values';col.textContent='Pendiente';
b.append(no,name,col);b.onclick=()=>choose(p.name,true);list.append(b);});
}
function setMetric(key){metric=key;
document.querySelectorAll('.metric-btn').forEach(btn=>{btn.classList.toggle('active',btn.dataset.metric===key);btn.setAttribute('aria-pressed',String(btn.dataset.metric===key));});
txt('legend-title',key==='IBP'?'IBP 2.0 · Índice global pendiente':dims.find(d=>d[0]===key)[1]+' · sin puntuación');
choose(selected);
}
const metricNav=document.getElementById('metrics');
dims.forEach(([key,label])=>{const b=document.createElement('button');b.className='metric-btn'+(key==='IBP'?' active':'');b.type='button';b.textContent=label;b.dataset.metric=key;b.setAttribute('aria-pressed',String(key==='IBP'));b.onclick=()=>setMetric(key);metricNav.append(b);});
const zoneSelect=document.getElementById('zone-filter');
[...new Set(fts.map(f=>String(f.properties.zone)))].sort((a,b)=>Number(a)-Number(b)).forEach(z=>{const o=document.createElement('option');o.value=z;o.textContent='Zona '+z;zoneSelect.append(o);});
zoneSelect.onchange=()=>{zone=zoneSelect.value;geo.setStyle(style);drawList();if(zone==='all')map.fitBounds(bounds.mainland,{padding:[20,20]});else{const current=fts.filter(f=>matching(f.properties));map.fitBounds(L.geoJSON({type:'FeatureCollection',features:current}).getBounds(),{padding:[24,24],maxZoom:9});}};
document.getElementById('show-zones').onchange=e=>e.target.checked?lines.addTo(map):map.removeLayer(lines);
document.getElementById('subzone-search').oninput=drawList;
document.getElementById('view-mainland').onclick=()=>map.fitBounds(bounds.mainland,{padding:[20,20]});
document.getElementById('view-islands').onclick=()=>map.fitBounds(bounds.islands,{padding:[20,20]});
document.getElementById('view-all').onclick=()=>map.fitBounds(bounds.all,{padding:[20,20]});
setMetric('IBP');
})();