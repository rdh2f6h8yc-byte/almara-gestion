// Datos públicos de Supabase (mismo proyecto que la app ALMARA).
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ url: 'https://ugryeciokjktvuuxvqcu.supabase.co', key: 'sb_publishable_QPBtZJ8mDOM7XMNzU9Hm_g_dhMBUTla' });
};
