const https = require('https');
const url = require('url');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { clientId, clientSecret, query, start, display, sort, filter } = req.query;

  if (!clientId || !clientSecret || !query) {
    return res.status(400).json({ errorMessage: '필수 파라미터가 없습니다.' });
  }

  const params = new URLSearchParams({ query, start: start||'1', display: display||'100', sort: sort||'sim' });
  if (filter) params.append('filter', filter);

  const options = {
    hostname: 'openapi.naver.com',
    path: `/v1/search/shop.json?${params}`,
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    }
  };

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body }));
      }).on('error', reject);
    });

    res.status(data.status).send(data.body);
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};
