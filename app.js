
(() => {
  'use strict';
  const data = window.IBP_GEOJSON;
  if (!data || !window.L) { document.querySelector('#map').innerHTML='<p class="map-error">No se pudo iniciar el mapa. Comprueba tu conexión a internet para cargar la biblioteca cartográfica Leaflet.</p>'; return; }
  const all = data.features;
  const metrics = [
    ['IBP','Índice global','Índice global de bienestar policial'],
    ['D1','D1 · Física y salud','Bienestar físico y salud'],
    ['D2','D2 · Psicológica y emocional','Bienestar psicológico, mental y emocional'],
    ['D3','D3 · Socioeconómica','Bienestar socioeconómico y habitabilidad'],
    ['D4','D4 · Carrera profesional','Desarrollo profesional y carrera'],
    ['D5','D5 · Cognitiva, espiritual y ética','Bienestar cognitivo, espiritual y ético institucional']
  ];
  const lookup = Object.fromEntries(metrics.map(m=>[m[0], {label:m[1],long:m[2]}]));
  const dimensionTopics = {
    D1:{name:'bienestar físico y salud',items:'infraestructura, operatividad de instalaciones, descanso, acceso a salud y dotación de protección'},
    D2:{name:'bienestar psicológico, mental y emocional',items:'seguimiento psicológico registrado, carga emocional, confianza y acceso a servicios de apoyo'},
    D3:{name:'bienestar socioeconómico y habitabilidad',items:'alojamiento, habitabilidad, ingresos y condiciones de vivienda'},
    D4:{name:'desarrollo profesional y carrera',items:'recursos de capacitación, pertinencia de la formación y percepción de ascensos'},
    D5:{name:'bienestar cognitivo y ética institucional',items:'formación doctrinal, misión institucional, toma de decisiones y dilemas éticos'}
  };
  // En cada ranking se conserva el puesto nacional, también al filtrar por zona.
  function rankFor(key, p) {
    return 1 + all.filter(f => f.properties[key] > p[key]).length;
  }
  function sortedFor(key) {
    return [...all].sort((a,b) => b.properties[key]-a.properties[key] ||
      a.properties.name.localeCompare(b.properties.name,'es'));
  }
  function interpretationFor(p,key) {
    const place=rankFor(key,p);
    if(key==='IBP'){
      const profile=Object.entries(dimensionTopics).map(([code,info])=>({
        name:info.name, value:p[code]
      }));
      const sorted=[...profile].sort((a,b)=>b.value-a.value);
      return p.name+' obtiene '+fmt(p.IBP)+' puntos en el índice global y ocupa el puesto '+
        place+' entre las 26 subzonas. Sus puntuaciones dimensionales más altas se encuentran en '+
        sorted[0].name+' ('+fmt(sorted[0].value)+') y '+sorted[1].name+
        ' ('+fmt(sorted[1].value)+'). En contraste, registra los valores menores en '+
        sorted[4].name+' ('+fmt(sorted[4].value)+') y '+sorted[3].name+
        ' ('+fmt(sorted[3].value)+'). Esta combinación permite identificar fortalezas relativas y dimensiones que requieren atención en su perfil territorial.';
    }
    const dim=dimensionTopics[key];
    const internal=Object.keys(dimensionTopics).sort((a,b)=>p[b]-p[a]);
    const internalRank=internal.indexOf(key)+1;
    const relation=internalRank===1?'es la dimensión con puntuación más alta de la subzona':
      internalRank===5?'es la dimensión con puntuación más baja de la subzona':
      'ocupa el puesto '+internalRank+' entre sus cinco dimensiones';
    const diff=p[key]-meanByMetric[key];
    const againstMean=Math.abs(diff)<0.005?'coincide con la media de referencia':
      'se encuentra '+fmt(Math.abs(diff))+' puntos '+(diff>0?'por encima':'por debajo')+' de la media de referencia';
    return p.name+' registra '+fmt(p[key])+' puntos en '+dim.name+
      ' y ocupa el puesto '+place+' de 26 subzonas en esta dimensión. El resultado '+againstMean+
      '. Dentro de su perfil, '+relation+'. La puntuación reúne indicadores de '+dim.items+'.';
  }
  function comparisonFor(p,key) {
    const diff=p[key]-meanByMetric[key],distance=fmt(Math.abs(diff));
    const national=fmt(meanByMetric[key]);
    if(Math.abs(diff)<.005) return 'El resultado coincide con la media de referencia de las 26 subzonas, situada en '+national+' puntos.';
    return key==='IBP'
      ? 'Comparación: '+p.name+' se encuentra '+distance+' puntos '+(diff>0?'por encima':'por debajo')+
        ' de la media nacional de referencia ('+national+' puntos).'
      : 'Media nacional de referencia de esta dimensión: '+national+' puntos.';
  }
  // Una sola escala cromática para el mapa y las barras de cada dimensión.
  const colors = ['#e7f0f8','#cbdfef','#a5c8e2','#75a9cd','#4384b3','#1c527d'];
  let metric='IBP', scale='observed', selected='Cañar', zone='all';
  let outlines=null;
  const byName=new Map(all.map(f=>[f.properties.name,f]));
  const fmt=(n)=>new Intl.NumberFormat('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const avg=(nums)=>nums.reduce((a,b)=>a+b,0)/nums.length;
  const median=(nums)=>{const v=[...nums].sort((a,b)=>a-b);return (v[12]+v[13])/2;};
  // Referencia calculada con las 26 subzonas, todas con peso uno.
  // No se interpreta como una estimación de la media de policías del país.
  const meanByMetric=Object.fromEntries(metrics.map(([key])=>[key,avg(all.map(f=>f.properties[key]))]));
  const delta=(score,key)=>score-meanByMetric[key];
  const signed=(value)=>(value>0?'+':value<0?'−':'')+fmt(Math.abs(value));
  const position=(score,key)=>{
    const difference=delta(score,key);
    return Math.abs(difference)<0.005?'coincide con la media de referencia':('se sitúa '+fmt(Math.abs(difference))+' puntos '+(difference>0?'por encima':'por debajo')+' de la media de referencia');
  };
  const tooltipHtml=(p)=>'<b>'+rankFor(metric,p)+'. '+p.name+'</b><span>'+lookup[metric].long+': '+fmt(p[metric])+' / 100</span><span>Media de 26 subzonas: '+fmt(meanByMetric[metric])+'</span><span>'+position(p[metric],metric)+'.</span>';
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
  function colorForMetric(x,key) {
    const values=all.map(f=>f.properties[key]);
    const lo=scale==='fixed'?0:Math.min(...values);
    const hi=scale==='fixed'?100:Math.max(...values);
    const t=Math.max(0,Math.min(.999999,(x-lo)/(hi-lo||1)));
    return colors[Math.floor(t*colors.length)];
  }
  function getColor(x){return colorForMetric(x,metric);}
  function zoneMatch(p){return zone==='all'||String(p.zone)===zone;}
  function getStyle(f){const p=f.properties;const isSelected=p.name===selected;const visible=zoneMatch(p);
    return {color:isSelected?'#143958':'#ffffff',weight:isSelected?2.8:1.25,opacity:visible?1:.3,fillColor:visible?getColor(p[metric]):'#f8fbfe',fillOpacity:visible?.95:.25};}
  function eachFeature(f,layer){const p=f.properties;
    layer.bindTooltip(tooltipHtml(p),{sticky:true,direction:'top',className:'ibp-tooltip'});
    layer.on({mouseover(e){e.target.setStyle({weight:2.2,color:'#285a84'});e.target.bringToFront();},mouseout(e){geoLayer.resetStyle(e.target);},click(){selectSubzone(p.name,true);}});
  }
  geoLayer=L.geoJSON(data,{style:getStyle,onEachFeature:eachFeature}).addTo(map);
  zoneLayer=L.geoJSON(window.IBP_ZONES_GEOJSON,{interactive:false,style:{color:'#33516d',weight:2.1,opacity:.65,fill:false,dashArray:'6,4'}});
  function updateMap(){geoLayer.setStyle(getStyle);geoLayer.eachLayer(l=>l.setTooltipContent(tooltipHtml(l.feature.properties)));}
  function paintLegend(){
    const ramp=document.querySelector('#legend-ramp');ramp.replaceChildren();
    colors.forEach(c=>{let s=document.createElement('span');s.style.background=c;ramp.appendChild(s);});
    const [min,max]=getMinMax();
    document.querySelector('#legend-min').textContent=fmt(min);
    document.querySelector('#legend-max').textContent=fmt(max);
    document.querySelector('#legend-title').textContent=lookup[metric].long;
    document.querySelector('#legend-note').textContent=scale==='fixed'?'Referencia fija de 0 a 100':'Posición relativa dentro de la dimensión';
    document.querySelector('#map-benchmark').textContent='Media nacional de referencia de '+lookup[metric].long.toLowerCase()+': '+fmt(meanByMetric[metric])+' puntos, promedio simple de 26 subzonas.';
  }
  const proxyNote=name=>{
    const items=['Parte de los indicadores utiliza proxies zonales; la puntuación no equivale a una observación individual.'];
    if(['DMG','Guayas'].includes(name))items.push('Los indicadores de encuesta comparten los mismos valores provinciales en Guayas y DMG.');
    if(['DMQ','Pichincha'].includes(name))items.push('Los indicadores de encuesta comparten los mismos valores provinciales en Pichincha y DMQ.');
    if(['Pichincha','Galápagos'].includes(name))items.push('Tres indicadores de recursos PCIC utilizan aproximaciones zonales.');
    return items.join(' ');
  };
  function drawProfile(){
    const p=byName.get(selected).properties;
    document.querySelector('#selected-name').textContent=p.name;
    document.querySelector('#selected-zone').textContent='Zona policial '+p.zone;
    document.querySelector('#focus-label').textContent=lookup[metric].long;
    document.querySelector('#focus-score').textContent=fmt(p[metric]);
    document.querySelector('#focus-mean').textContent=fmt(meanByMetric[metric]);
    document.querySelector('#focus-diff').textContent=signed(delta(p[metric],metric));
    document.querySelector('#focus-rank').textContent=rankFor(metric,p)+' / 26';
    document.querySelector('#reading-territory').textContent=p.name;
    document.querySelector('#metric-meaning').textContent=interpretationFor(p,metric);
    document.querySelector('#metric-comparison').textContent=comparisonFor(p,metric);
    document.querySelector('#proxy-note').textContent=proxyNote(p.name);
    const list=document.querySelector('#profile');list.replaceChildren();
    metrics.forEach(([key,label])=>{
      const row=document.createElement('div');
      row.className='profile-row'+(key===metric?' selected':'');
      const title=document.createElement('div');
      title.className='profile-label';
      title.textContent=label;
      const values=document.createElement('div');
      values.className='profile-values';
      const number=(value,caption,kind)=>{
        const cell=document.createElement('div');
        cell.className='profile-stat '+kind;
        const strong=document.createElement('strong');
        strong.textContent=value;
        const small=document.createElement('small');
        small.textContent=caption;
        cell.append(strong,small);
        return cell;
      };
      values.append(
        number(fmt(p[key]),'Subzona','stat-local'),
        number(fmt(meanByMetric[key]),'Media','stat-mean'),
        number(signed(delta(p[key],key)),'Diferencia','stat-delta')
      );
      const track=document.createElement('div');
      track.className='profile-track';
      track.setAttribute('role','img');
      track.setAttribute('aria-label',label+': '+fmt(p[key])+' puntos; media de 26 subzonas: '+fmt(meanByMetric[key])+'; diferencia: '+signed(delta(p[key],key))+' puntos');
      const fill=document.createElement('div');
      fill.className='profile-fill';
      fill.style.width=p[key]+'%';
      fill.style.backgroundColor=colorForMetric(p[key],key);
      const meanMark=document.createElement('div');
      meanMark.className='profile-mean-mark';
      meanMark.style.left=meanByMetric[key]+'%';
      meanMark.title='Media: '+fmt(meanByMetric[key]);
      track.append(fill,meanMark);
      row.append(title,values,track);
      list.appendChild(row);
    });
  }
  function drawList(){
    const input=document.querySelector('#subzone-search');
    const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const query=normalize(input.value.trim());
    const ordered=sortedFor(metric);
    const filtered=ordered.filter(f=>zoneMatch(f.properties)&&normalize(f.properties.name).includes(query));
    document.querySelector('#ranking-title').textContent='Ranking nacional · '+lookup[metric].label;
    document.querySelector('#list-count').textContent=filtered.length+' de 26';
    const node=document.querySelector('#subzone-list');node.replaceChildren();
    filtered.forEach(f=>{
      const p=f.properties;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='subzone-item'+(p.name===selected?' active':'');
      const rank=document.createElement('span');
      rank.className='rank-index';rank.textContent=rankFor(metric,p)+'.';
      const name=document.createElement('span');
      name.className='rank-name';name.textContent=p.name;
      const values=document.createElement('span');
      values.className='subzone-values';
      const score=document.createElement('strong');score.textContent=fmt(p[metric]);
      const difference=document.createElement('small');difference.textContent=signed(delta(p[metric],metric))+' vs. media';
      values.append(score,difference);
      btn.append(rank,name,values);
      btn.title='Puesto '+rankFor(metric,p)+' de 26; '+lookup[metric].long+': '+fmt(p[metric])+' puntos';
      btn.addEventListener('click',()=>selectSubzone(p.name,true));
      node.appendChild(btn);
    });
  }
  function selectSubzone(name,zoom){if(!byName.has(name))return;selected=name;const f=byName.get(name);if(!zoneMatch(f.properties)){zone='all';document.querySelector('#zone-filter').value='all';}updateMap();drawProfile();drawList();if(zoom){geoLayer.eachLayer(l=>{if(l.feature.properties.name===name){map.fitBounds(l.getBounds(),{padding:[50,50],maxZoom:9});}});}}
  function setMetric(key){if(!lookup[key])return;metric=key;document.querySelectorAll('.metric-btn').forEach(b=>{const active=b.dataset.metric===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});paintLegend();updateMap();drawProfile();drawList();}
  const nav=document.querySelector('#metrics');metrics.forEach(([key,label])=>{const b=document.createElement('button');b.className='metric-btn'+(key==='IBP'?' active':'');b.type='button';b.textContent=label;b.dataset.metric=key;b.setAttribute('aria-pressed',String(key==='IBP'));b.addEventListener('click',()=>setMetric(key));nav.appendChild(b);});
  const zsel=document.querySelector('#zone-filter');for(let z=1;z<=9;z++){const o=document.createElement('option');o.value=String(z);o.textContent='Zona '+z;zsel.appendChild(o)}
  zsel.addEventListener('change',e=>{zone=e.target.value;updateMap();drawList();if(zone!=='all'){const zoneFeatures=all.filter(f=>zoneMatch(f.properties));const group=L.geoJSON({type:'FeatureCollection',features:zoneFeatures});map.fitBounds(group.getBounds(),{padding:[25,25],maxZoom:9});}else map.fitBounds(bounds.mainland,{padding:[20,20]});});
  document.querySelector('#scale-filter').addEventListener('change',e=>{scale=e.target.value;paintLegend();updateMap();drawProfile();});
  document.querySelector('#show-zones').addEventListener('change',e=>{e.target.checked?zoneLayer.addTo(map):map.removeLayer(zoneLayer);});
  document.querySelector('#subzone-search').addEventListener('input',drawList);
  document.querySelector('#view-mainland').addEventListener('click',()=>map.fitBounds(bounds.mainland,{padding:[20,20]}));
  document.querySelector('#view-islands').addEventListener('click',()=>map.fitBounds(bounds.islands,{padding:[20,20]}));
  document.querySelector('#view-all').addEventListener('click',()=>map.fitBounds(bounds.all,{padding:[20,20]}));
  document.querySelector('#kpi-mean').textContent=fmt(avg(all.map(f=>f.properties.IBP)));
  // Mediana publicada con precisión original; los datos del CSV están redondeados a dos decimales.
  document.querySelector('#kpi-median').textContent='47,29';
  paintLegend();drawProfile();drawList();
})();
