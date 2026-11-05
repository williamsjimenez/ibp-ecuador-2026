# Atlas territorial del Índice de Bienestar Policial 1.0

Sitio cartográfico estático sobre fondo blanco con puntuaciones para **26 subzonas policiales del Ecuador**: índice global y dimensiones D1 a D5. Incluye navegación por subzona y zona, búsqueda, comparaciones descriptivas y descarga de datos.

**Sitio público previsto:** https://williamsjimenez.github.io/ibp-ecuador-2026/

## Activación inicial de GitHub Pages

El archivo `.github/workflows/deploy.yml` publica automáticamente los cambios. Para **habilitar GitHub Pages por primera vez**, el propietario debe abrir **Settings → Pages → Build and deployment** y seleccionar **GitHub Actions** en **Source**. No selecciones «Deploy from a branch», porque este repositorio está preparado para publicar desde el flujo de Actions. Tras activar esa opción, entra en **Actions → Publicar Atlas IBP Ecuador** y selecciona **Run workflow** o **Re-run jobs** para lanzar el despliegue.

## Estructura

- `index.html` y `styles.css`: interfaz y diseño.
- `datos.js`: carga las dos capas GeoJSON y después inicia `app.js`.
- `app.js`: motor del mapa interactivo Leaflet.
- `datos/subzonas_ibp_2026.geojson`: geometría y puntuaciones para las 26 subzonas.
- `datos/limites_zonas_derivadas.geojson`: delimitación cartográfica de las nueve zonas reconstruida a partir de las subzonas.
- `datos/resultados_26_subzonas.csv`: seis puntuaciones por subzona.
- `datos/metadatos.json`: descripción y limitaciones de procedencia.

## Interpretación

Este atlas es un instrumento exploratorio para discusión científica y validación, **no una clasificación oficial de bienestar policial**. Las puntuaciones provienen de un índice compuesto de 30 indicadores y cinco dimensiones; ciertas mediciones se han transferido mediante proxies provinciales o zonales. Los resultados no constituyen una encuesta representativa de la población policial por subzona. Para las decisiones sustantivas deben consultarse la memoria metodológica y el informe de resultados de noviembre de 2026.

Los datos que se publican son agregados por subzona y no incluyen registros individuales ni de encuestados.
