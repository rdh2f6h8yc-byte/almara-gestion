// ALMARA Gestión · Lee una factura (foto o PDF) con Claude y devuelve sus datos.
// Variables de entorno en Vercel:
//   ANTHROPIC_API_KEY  (obligatoria)  clave de la API de Anthropic
//   SUPABASE_URL       (recomendada)  URL del proyecto de Supabase; si está, solo usuarios con sesión pueden usarlo
//   SUPABASE_ANON_KEY  (recomendada)  clave anon del mismo proyecto
//   ANTHROPIC_MODEL    (opcional)     por defecto claude-sonnet-5-5

const CATS = ['Material', 'Herramientas', 'Vehículo y combustible', 'Cuota de autónomos', 'Teléfono e internet',
  'Software y suscripciones', 'Seguros', 'Gestoría y asesoría', 'Publicidad', 'Ropa de trabajo', 'Formación', 'Otros'];

const TOOL = {
  name: 'registrar_factura',
  description: 'Registra los datos de una factura de gasto recibida por un autónomo español.',
  input_schema: {
    type: 'object',
    properties: {
      es_factura: { type: 'boolean', description: 'false si la imagen no es una factura, ticket o recibo' },
      fecha: { type: 'string', description: 'Fecha de la factura en formato AAAA-MM-DD' },
      proveedor: { type: 'string', description: 'Nombre o razón social de quien emite la factura' },
      nif_proveedor: { type: 'string', description: 'NIF/CIF del emisor, sin espacios ni guiones; vacío si no aparece' },
      numero: { type: 'string', description: 'Número de la factura' },
      concepto: { type: 'string', description: 'Resumen corto (máx. 8 palabras) de lo comprado' },
      categoria: { type: 'string', enum: CATS },
      desglose: {
        type: 'array',
        description: 'Una entrada por cada tipo de IVA de la factura. Si no lleva IVA, una entrada con tipo_iva 0.',
        items: {
          type: 'object',
          properties: {
            tipo_iva: { type: 'number', enum: [21, 10, 4, 0] },
            base: { type: 'number', description: 'Base imponible en euros, sin IVA' },
            cuota: { type: 'number', description: 'Cuota de IVA en euros' }
          },
          required: ['tipo_iva', 'base', 'cuota']
        }
      },
      total: { type: 'number', description: 'Total de la factura con IVA, en euros' },
      ticket_simplificado: { type: 'boolean', description: 'true si es un ticket o factura simplificada sin los datos del comprador' }
    },
    required: ['es_factura', 'fecha', 'proveedor', 'desglose', 'total', 'categoria']
  }
};

const env = k => String(process.env[k] || '').trim().replace(/^["']|["']$/g, '');

async function comprobarUsuario(req) {
  const url = env('SUPABASE_URL').replace(/\/+$/, '').replace(/\/(rest|auth)\/v1.*$/, ''), key = env('SUPABASE_ANON_KEY');
  if (!url || !key) return null; // sin Supabase configurado no se comprueba la sesión
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return 'falta la sesión';
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: key, Authorization: auth } });
    if (r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return `Supabase ${r.status}: ${j.msg || j.message || j.error_description || j.error || 'sin detalle'}`;
  } catch (e) {
    return 'no se puede conectar con ' + url + ' (' + e.message + ')';
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!env('ANTHROPIC_API_KEY')) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en Vercel' });
  try {
    const fallo = await comprobarUsuario(req);
    if (fallo) return res.status(401).json({ error: 'No se pudo comprobar tu sesión: ' + fallo });
    const { data, mediaType } = req.body || {};
    if (!data || !mediaType) return res.status(400).json({ error: 'No llega la imagen' });
    const isPdf = mediaType === 'application/pdf';
    const archivo = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data } };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env('ANTHROPIC_MODEL') || 'claude-sonnet-5-5',
        max_tokens: 1024,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'registrar_factura' },
        messages: [{
          role: 'user',
          content: [archivo, {
            type: 'text',
            text: 'Es una factura de gasto de un autónomo instalador (Starlink, WiFi, redes, cámaras, electricidad) en España. ' +
              'Extrae los datos con la herramienta. Los importes en euros con punto decimal. Si solo aparece el total con IVA incluido, ' +
              'calcula la base y la cuota. Elige la categoría más adecuada (gasolina o peajes: Vehículo y combustible; cable, conectores, equipos: Material).'
          }]
        }]
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j.error?.message || 'Error al leer la factura' });
    const out = (j.content || []).find(c => c.type === 'tool_use');
    if (!out) return res.status(502).json({ error: 'No se pudo leer la factura' });
    return res.status(200).json(out.input);
  } catch (e) {
    return res.status(500).json({ error: 'Error del servidor: ' + e.message });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '4mb' } } };
