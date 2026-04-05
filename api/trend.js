const https = require('https');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
  const secretKey = process.env.NAVER_AD_SECRET_KEY;

  const { keyword } = req.query;
  console.log('customerId raw:', customerId, typeof customerId);
  if (!keyword) return res.status(400).json({ errorMessage: '키워드를 입력해주세요.' });

  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const path = '/keywordstool';
    const message = `${timestamp}.${method}.${path}`;
    
    // Buffer로 처리
    const secretKeyBuffer = Buffer.from(secretKey, 'utf8');
    const signature = crypto.createHmac('sha256', secretKeyBuffer).update(message).digest('base64');
    
    const queryString = `hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.naver.com',
        port: 443,
        path: `${path}?${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Timestamp': timestamp,
          'X-API-KEY': accessLicense,
'X-Customer': Number(customerId.trim()),
          'X-Signature': signature,
        }
      };

      function doRequest(opts) {
        https.request(opts, (r) => {
          if (r.statusCode === 301 || r.statusCode === 302 || r.statusCode === 308) {
            const location = r.headers['location'];
            const newUrl = new URL(location);
            const newOpts = {
              hostname: newUrl.hostname,
              port: 443,
              path: newUrl.pathname + newUrl.search,
              method: 'GET',
              headers: opts.headers
            };
            doRequest(newOpts);
            return;
          }
          let body = '';
          r.on('data', chunk => body += chunk);
          r.on('end', () => resolve({ status: r.statusCode, body }));
        }).on('error', reject).end();
      }

      doRequest(options);
    });

    res.status(data.status).send(data.body);
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};
