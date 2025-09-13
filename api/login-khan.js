export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      const khanResponse = await fetch(khanURL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-platform': 'webclient',
          'x-api-realm': 'edusp',
          'Host': 'edusp-api.ip.tv',
          'x-api-key': token 
        },
      });
      
      const tokenSSO = await khanResponse.json();
      const seducToken = tokenSSO?.token;

      if (!seducToken) {
        return res.status(400).json({ error: 'Não foi possível obter o token SSO do Khan.' });
      }

      const finalTokenURL = `https://app-pcvg7ng6sq-uc.a.run.app/cmsp/login?token=${seducToken}&app_id=e50a9862bc4fdeafda80`;
      const finalTokenCookies = await openFastKhan(finalTokenURL);
      
      const cookieHeader = finalTokenCookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');

      return res.status(200).json({ token: cookieHeader, copyhard: 'MoonScripts<@1345031606082998345>' });

    } else {
      return res.status(400).json({ error: 'O parâmetro "type" é inválido ou não foi fornecido.' });
    }
  } catch (error) {
    console.error('❌ Erro na API:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

async function openFastKhan(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    },
    redirect: 'manual' 
  });

  const rawCookies = response.headers.get('set-cookie');
  if (!rawCookies) {
    return [];
  }

  return rawCookies.split(/, |;/).map(cookiePart => {
    const [name, ...rest] = cookiePart.split('=');
    return { name: name.trim(), value: rest.join('=').trim() };
  }).filter(c => c.name && c.value);
}
