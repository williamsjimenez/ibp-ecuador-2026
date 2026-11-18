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

## Portal de cuatro módulos (propuesta de actualización, noviembre de 2026)

La navegación compartida ofrece cuatro secciones que conservan versiones metodológicas independientes.

**IBP 1.0 (index.html)** mantiene el mapa histórico de 26 subzonas, el índice global, cinco dimensiones y 30 indicadores; las puntuaciones originales no se alteran.

**IBP 2.0 (ibp-2-0.html)** presenta un catálogo técnico de 29 indicadores, sus fuentes, sentidos, relación con la versión anterior y estado de disponibilidad. No publica resultados territoriales 2.0 sin cálculo y validación.

**SAT 1.0 (sat-1-0.html)** muestra los rangos relativos de las 26 subzonas mediante los cortes fijos de la línea de base 2026, calculados desde el IBP 1.0. Se entregan además datos/clasificacion_sat_1_0_26_subzonas.csv y datos/sat_1_0_metadatos.json para auditoría y reproducción. El grupo R4 incluye siete subzonas, R3 seis, R2 seis y R1 siete.

**SAT 2.0 (sat-2-0.html)** conserva la cartografía territorial neutra y presenta la estructura de vigilancia propuesta, sin asignar clases ni valores a las subzonas hasta disponer de puntuaciones IBP 2.0 recalculadas y de reglas de comparabilidad validadas.

Los cortes de SAT 1.0 son: R4, IBP ≤ 44,9593; R3, (44,9593; 47,2917]; R2, (47,2917; 49,5282]; R1, IBP > 49,5282. Son clases relativas, no límites legales o clínicos. La activación y declaración de alertas es un procedimiento institucional diferente de su representación cartográfica, sujeto a aprobación del mecanismo SAT-BP.

La trazabilidad del SAT se fundamenta en el documento técnico de consultoría 20261113_SAT(1).docx, en particular los numerales 5.4.6.2, 5.4.6.6 y 5.4.16. El documento fuente no se incluye en el repositorio.

### Conservación de mapas en los cuatro módulos

La interfaz mantiene cartografía geográfica navegable para los **cuatro** módulos. En IBP 1.0 se conserva íntegro el mapa histórico, sus cinco dimensiones, la ficha territorial y el detalle de 30 indicadores, y se añade un interruptor para colorear el **mismo mapa** con las categorías R4–R1 procedentes del IBP global. En IBP 2.0 se utiliza la **misma estructura cartográfica y navegación territorial**, pero con polígonos neutrales y estados «pendiente» hasta completar los 29 indicadores; el catálogo detallado se conserva en `catalogo-ibp-2-0.html`. Las páginas SAT 1.0 y SAT 2.0 muestran igualmente sus mapas, fichas territoriales y filtros, manteniendo neutral el mapa SAT 2.0 mientras no haya puntuaciones. Ninguna versión hereda cifras de otra sin recálculo.
