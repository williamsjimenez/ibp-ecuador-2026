(async function loadAtlasData() {
  const mapElement = document.getElementById('map');
  try {
    const paths = [
      './datos/subzonas_ibp_2026.geojson',
      './datos/limites_zonas_derivadas.geojson'
    ];
    const responses = await Promise.all(paths.map(path => fetch(path)));
    for (let i = 0; i < responses.length; i++) {
      if (!responses[i].ok) throw new Error('No se pudo cargar ' + paths[i] + ': HTTP ' + responses[i].status);
    }
    const [subzones, zones] = await Promise.all(responses.map(response => response.json()));
    if (!subzones.features || subzones.features.length !== 26) {
      throw new Error('La cartografía de subzonas no contiene exactamente 26 geometrías');
    }
    window.IBP_GEOJSON = subzones;
    window.IBP_ZONES_GEOJSON = zones;
    const app = document.createElement('script');
    app.src = './app.js?v=20261105-lecturas';
    app.onerror = () => {
      if (mapElement) mapElement.textContent = 'No se pudo cargar la aplicación cartográfica.';
    };
    document.body.appendChild(app);
  } catch (error) {
    console.error('Atlas IBP: error al cargar los datos', error);
    if (mapElement) {
      mapElement.innerHTML = '<p class="map-error">No se pudo abrir la cartografía. Verifica que se hayan publicado los archivos de la carpeta datos.</p>';
    }
  }
})();
