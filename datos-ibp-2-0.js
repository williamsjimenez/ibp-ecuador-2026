(async function(){const node=document.getElementById('map');
try{const urls=['./datos/subzonas_ibp_2026.geojson','./datos/limites_zonas_derivadas.geojson'];
const res=await Promise.all(urls.map(x=>fetch(x)));if(res.some(x=>!x.ok))throw Error('Error cargando capas');
const [areas,zones]=await Promise.all(res.map(x=>x.json()));
if(!Array.isArray(areas.features)||areas.features.length!==26)throw Error('No son 26 geometrías');
window.IBP2_GEOJSON=areas;window.IBP2_ZONES=zones;
const js=document.createElement('script');js.src='./app-ibp-2-0.js';js.onerror=()=>{node.textContent='No se pudo cargar el visor IBP 2.0.';};document.body.append(js);
}catch(e){console.error(e);if(node)node.textContent='No fue posible cargar la cartografía de referencia del IBP 2.0.';}})();
