const https = require('https');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
  const secretKey = process.env.NAVER_AD_SECRET_KEY;

  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ errorMessage: '키워드를 입력해주세요.' });

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/keywordstool';
    const message = timestamp + '.' + method + '.' + path;
    const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');

    const queryString = `hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.naver.com',
        path: `${path}?${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Timestamp': timestamp,
          'X-API-KEY': accessLicense,
          'X-Customer': String(customerId),
          'X-Signature': signature,
        }
      };
      const req2 = https.request(options, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body }));
      });
      req2.on('error', reject);
      req2.end();
    });

    if (!data.body) {
      return res.status(500).json({ errorMessage: '빈 응답. 광고 API 키를 확인해주세요.' });
    }

    res.status(data.status).send(data.body);
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};
