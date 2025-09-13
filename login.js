export default async function handler(req, res) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    return res.status(403).json({ error: 'Acesso não permitido.' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { type } = req.body;

    if (type === 'login') {
      const { ra, senha } = req.body;
      if (!ra || !senha) {
        return res.status(400).json({ error: 'RA e senha são obrigatórios.' });
      }

      const loginURL = 'https://corsproxy.io/?https://edusp-api.ip.tv/registration/edusp';
      const response = await fetch(loginURL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-platform': 'webclient',
          'x-api-realm': 'edusp',
          'Host': 'edusp-api.ip.tv',
          'Referer': 'https://saladofuturo.educacao.sp.gov.br/'
        },
        body: JSON.stringify({ id: ra, password: senha }),
      });

      const data = response.ok ? await response.json() : await response.text();
      return res.status(response.status).send(data);

    } else if (type === 'auth') {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'O token é obrigatório.' });
      }

      const khanURL = 'https://corsproxy.io/?https://edusp-api.ip.tv/mas/external-auth/seducsp_token/generate?card_label=Khan+Academy';
      const response = await fetch(khanURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-platform': 'webclient',
          'x-api-realm': 'edusp',
          'Host': 'edusp-api.ip.tv',
          'x-api-key': token 
        },
      });

      const data = response.ok ? await response.json() : await response.text();
      return res.status(response.status).send(data);

    } else {
      return res.status(400).json({ error: 'O parâmetro "type" é inválido ou não foi fornecido.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
