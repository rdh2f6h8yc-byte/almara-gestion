# ALMARA Gestión

App web para llevar la gestión del autónomo de ALMARA: facturas, gastos, modelos 303 y 130, cuota de autónomos y calendario fiscal.

- Es una sola página (`index.html`), sin compilación. En Vercel: importar el repositorio y desplegar sin cambiar nada.
- Los datos se guardan en el navegador y, si se conecta desde Ajustes, se sincronizan en Supabase.
- Para Supabase: ejecutar `supabase.sql` en el SQL Editor del proyecto.

Los cálculos de impuestos son orientativos (estimación directa simplificada).
