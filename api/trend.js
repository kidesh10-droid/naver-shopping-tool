const https = require('https');
const crypto = require('crypto');

function makeSignature(timestamp, method, path, secretKey) {
  const message = `${timestamp}.${method}.${path}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
  const secretKey = process.env.NAVER_AD_SECRET_KEY;

  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ errorMessage: '키워드를 입력해주세요.' });

  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = `/keywordstool?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;
  const signature = makeSignature(timestamp, method, '/keywordstool', secretKey);

  const options = {
    hostname: 'api.naver.com',
    path: path,
    method: 'GET',
    headers: {
      'X-Timestamp': timestamp,
      'X-API-KEY': accessLicense,
      'X-Customer': customerId,
      'X-Signature': signature,
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
