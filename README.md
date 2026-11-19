# ALMARA Gestión

App web para llevar la gestión del autónomo de ALMARA: facturas, gastos, modelos 303 y 130, cuota de autónomos y calendario fiscal.

- `index.html`: la app (una sola página, sin compilación).
- `api/leer-factura.js`: lee una foto o PDF de una factura con Claude y devuelve sus datos.
- Usa el mismo Supabase que la app ALMARA (tabla `datos`, clave `gestion`; fotos en la carpeta `fotos/<usuario>/gestion/`). Lee los presupuestos de ALMARA (clave `presupuestos`) para pasarlos a factura.
- `supabase.sql`: ya no hace falta (era del proyecto anterior).

## Vercel
Importar el repositorio y desplegar sin cambiar nada. En *Settings → Environment Variables* añadir:

| Variable | Valor |
| --- | --- |
| `ANTHROPIC_API_KEY` | clave de la API de Anthropic |

Después, *Redeploy*.

## Archivos para Hacienda
En Impuestos, el botón «Archivo para Hacienda» genera `303.txt` y `130.txt` con el diseño de registro oficial de la AEAT (303 versión 1.01 de 2026; 130 versión 1.2), listos para «Importar» en el formulario de la sede.

Los cálculos son orientativos (estimación directa simplificada): revisar antes de presentar.
