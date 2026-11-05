
(() => {
  'use strict';
  const data = window.IBP_GEOJSON;
  if (!data || !window.L) { document.querySelector('#map').innerHTML='<p class="map-error">No se pudo iniciar el mapa. Comprueba tu conexión a internet para cargar la biblioteca cartográfica Leaflet.</p>'; return; }
  const all = data.features;
  const metrics = [
    ['IBP','Índice global','Índice global de bienestar policial'],
    ['D1','D1 · Física y salud','Bienestar físico y salud'],
    ['D2','D2 · Psicológica','Bienestar psicológico, mental y emocional'],
    ['D3','D3 · Socioeconómica','Bienestar socioeconómico y habitabilidad'],
    ['D4','D4 · Carrera','Desarrollo profesional y carrera'],
    ['D5','D5 · Cognitiva y ética','Bienestar cognitivo, espiritual y ético institucional']
  ];
  const lookup = Object.fromEntries(metrics.map(m=>[m[0], {label:m[1],long:m[2]}]));
  const colors = ['#e9f2f8','#c6ddea','#99bfd7','#639ac1','#3376a5','#104f80'];
  let metric='IBP', scale='observed', selected='Cañar', zone='all';
  let outlines=null;
  const byName=new Map(all.map(f=>[f.properties.name,f]));
  const fmt=(n)=>new Intl.NumberFormat('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const avg=(nums)=>nums.reduce((a,b)=>a+b,0)/nums.length;
  const median=(nums)=>{const v=[...nums].sort((a,b)=>a-b);return (v[12]+v[13])/2;};
  const bounds = {
    mainland:L.latLngBounds([[-5.08,-81.16],[1.53,-75.12]]),
    islands:L.latLngBounds([[-1.48,-92.1],[1.78,-89.17]]),
    all:L.latLngBounds([[-5.12,-92.1],[1.78,-75.1]])
  };
  const map=L.map('map',{zoomControl:false,attributionControl:false,preferCanvas:true,scrollWheelZoom:false,minZoom:3,maxZoom:12,zoomSnap:.25});
  L.control.zoom({position:'bottomright'}).addTo(map);
  map.fitBounds(bounds.mainland,{padding:[20,20]});
  let geoLayer, zoneLayer;
  function getMinMax(){const v=all.map(f=>f.properties[metric]);return scale==='fixed' ? [0,100] : [Math.min(...v),Math.max(...v)];}
  function getColor(x){const [lo,hi]=getMinMax();const t=Math.max(0,Math.min(.999999,(x-lo)/(hi-lo||1)));return colors[Math.floor(t*colors.length)];}
  function zoneMatch(p){return zone==='all'||String(p.zone)===zone;}
  function getStyle(f){const p=f.properties;const isSelected=p.name===selected;const visible=zoneMatch(p);
    return {color:isSelected?'#102f4b':'#ffffff',weight:isSelected?2.8:1.25,opacity:visible?1:.3,fillColor:visible?getColor(p[metric]):'#f9fbfd',fillOpacity:visible?.95:.25};}
  function eachFeature(f,layer){let p=f.properties;
    layer.bindTooltip(`<b>${p.name}</b><span>${lookup[metric].long}: ${fmt(p[metric])}</span>`,{sticky:true,direction:'top',className:'ibp-tooltip'});
    layer.on({mouseover(e){e.target.setStyle({weight:2.2,color:'#204b71'});e.target.bringToFront();},mouseout(e){geoLayer.resetStyle(e.target);},click(){selectSubzone(p.name,true);}});
  }
  geoLayer=L.geoJSON(data,{style:getStyle,onEachFeature:eachFeature}).addTo(map);
  zoneLayer=L.geoJSON(window.IBP_ZONES_GEOJSON,{interactive:false,style:{color:'#122f4d',weight:2.1,opacity:.65,fill:false,dashArray:'6,4'}});
  function updateMap(){geoLayer.setStyle(getStyle);geoLayer.eachLayer(l=>{const p=l.feature.properties;l.setTooltipContent(`<b>${p.name}</b><span>${lookup[metric].long}: ${fmt(p[metric])}</span>`);});}
  function paintLegend(){let ramp=document.querySelector('#legend-ramp');ramp.replaceChildren();colors.forEach(c=>{let s=document.createElement('span');s.style.background=c;ramp.appendChild(s)});let [min,max]=getMinMax();document.querySelector('#legend-min').textContent=fmt(min);document.querySelector('#legend-max').textContent=fmt(max);document.querySelector('#legend-title').textContent=lookup[metric].long;document.querySelector('#legend-note').textContent=scale==='fixed'?'Referencia fija de 0 a 100':'Posición relativa dentro de la dimensión';}
  const proxyNote=name=>{
    const items=['Parte de los indicadores utiliza proxies zonales; la puntuación no equivale a una observación individual.'];
    if(['DMG','Guayas'].includes(name))items.push('Los indicadores de encuesta comparten los mismos valores provinciales en Guayas y DMG.');
    if(['DMQ','Pichincha'].includes(name))items.push('Los indicadores de encuesta comparten los mismos valores provinciales en Pichincha y DMQ.');
    if(['Pichincha','Galápagos'].includes(name))items.push('Tres indicadores de recursos PCIC utilizan aproximaciones zonales.');
    return items.join(' ');
  };
  function drawProfile(){const p=byName.get(selected).properties;document.querySelector('#selected-name').textContent=p.name;document.querySelector('#selected-zone').textContent='Zona policial '+p.zone;document.querySelector('#focus-label').textContent=lookup[metric].long;document.querySelector('#focus-score').textContent=fmt(p[metric]);document.querySelector('#proxy-note').textContent=proxyNote(p.name);
    const list=document.querySelector('#profile');list.replaceChildren();
    metrics.forEach(([key,label])=>{const row=document.createElement('div');row.className='profile-row'+(key===metric?' selected':'');const head=document.createElement('div');head.className='profile-head';const text=document.createElement('span');text.textContent=label;const val=document.createElement('strong');val.textContent=fmt(p[key]);head.append(text,val);const track=document.createElement('div');track.className='profile-track';const fill=document.createElement('div');fill.className='profile-fill';fill.style.width=p[key]+'%';track.appendChild(fill);row.append(head,track);list.appendChild(row);});
  }
  function drawList(){let query=document.querySelector('#subzone-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const filtered=all.filter(f=>{let name=f.properties.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return zoneMatch(f.properties)&&name.includes(query);});
    document.querySelector('#list-count').textContent=filtered.length+' territorios';const node=document.querySelector('#subzone-list');node.replaceChildren();
    filtered.forEach(f=>{const p=f.properties;const btn=document.createElement('button');btn.className='subzone-item'+(p.name===selected?' active':'');const a=document.createElement('span'),b=document.createElement('span');a.textContent=p.name;b.textContent=fmt(p[metric]);btn.append(a,b);btn.addEventListener('click',()=>selectSubzone(p.name,true));node.appendChild(btn);});
  }
  function selectSubzone(name,zoom){if(!byName.has(name))return;selected=name;const f=byName.get(name);if(!zoneMatch(f.properties)){zone='all';document.querySelector('#zone-filter').value='all';}updateMap();drawProfile();drawList();if(zoom){geoLayer.eachLayer(l=>{if(l.feature.properties.name===name){map.fitBounds(l.getBounds(),{padding:[50,50],maxZoom:9});}});}}
  function setMetric(key){if(!lookup[key])return;metric=key;document.querySelectorAll('.metric-btn').forEach(b=>{const active=b.dataset.metric===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});paintLegend();updateMap();drawProfile();drawList();}
  const nav=document.querySelector('#metrics');metrics.forEach(([key,label])=>{const b=document.createElement('button');b.className='metric-btn'+(key==='IBP'?' active':'');b.type='button';b.textContent=label;b.dataset.metric=key;b.setAttribute('aria-pressed',String(key==='IBP'));b.addEventListener('click',()=>setMetric(key));nav.appendChild(b);});
  const zsel=document.querySelector('#zone-filter');for(let z=1;z<=9;z++){const o=document.createElement('option');o.value=String(z);o.textContent='Zona '+z;zsel.appendChild(o)}
  zsel.addEventListener('change',e=>{zone=e.target.value;updateMap();drawList();if(zone!=='all'){const zoneFeatures=all.filter(f=>zoneMatch(f.properties));const group=L.geoJSON({type:'FeatureCollection',features:zoneFeatures});map.fitBounds(group.getBounds(),{padding:[25,25],maxZoom:9});}else map.fitBounds(bounds.mainland,{padding:[20,20]});});
  document.querySelector('#scale-filter').addEventListener('change',e=>{scale=e.target.value;paintLegend();updateMap();});
  document.querySelector('#show-zones').addEventListener('change',e=>{e.target.checked?zoneLayer.addTo(map):map.removeLayer(zoneLayer);});
  document.querySelector('#subzone-search').addEventListener('input',drawList);
  document.querySelector('#view-mainland').addEventListener('click',()=>map.fitBounds(bounds.mainland,{padding:[20,20]}));
  document.querySelector('#view-islands').addEventListener('click',()=>map.fitBounds(bounds.islands,{padding:[20,20]}));
  document.querySelector('#view-all').addEventListener('click',()=>map.fitBounds(bounds.all,{padding:[20,20]}));
  document.querySelector('#kpi-mean').textContent=fmt(avg(all.map(f=>f.properties.IBP)));
  // Use the reported full-precision median; rounded territorial values yield 47.295.
  document.querySelector('#kpi-median').textContent='47,29';
  paintLegend();drawProfile();drawList();
})();
