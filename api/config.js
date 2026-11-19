// Datos públicos de Supabase para la pantalla de inicio de sesión (la clave publishable es pública).
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const env = k => String(process.env[k] || '').trim().replace(/^["']|["']$/g, '');
  res.status(200).json({ url: env('SUPABASE_URL').replace(/\/+$/, ''), key: env('SUPABASE_ANON_KEY') });
};
