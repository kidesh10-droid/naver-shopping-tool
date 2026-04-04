const https = require('https');
const crypto = require('crypto');

function makeSignature(timestamp, method, path, secretKey) {
  const message = `${timestamp}.${method}.${path}`;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

async function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const accessLicense = process.env.NAVER_AD_ACCESS_LICENSE;
  const secretKey = process.env.NAVER_AD_SECRET_KEY;

  if (!customerId || !accessLicense || !secretKey) {
    return res.status(500).json({ errorMessage: '서버 광고 API 키가 설정되지 않았습니다.' });
  }

  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ errorMessage: '키워드를 입력해주세요.' });
  }

  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/keywordstool';
  const signature = makeSignature(timestamp, method, path, secretKey);

  const body = JSON.stringify({
    hintKeywords: [keyword],
    showDetail: 1
  });

  const options = {
    hostname: 'api.naver.com',
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-API-KEY': accessLicense,
      'X-Customer': customerId,
      'X-Signature': signature,
    }
  };

  try {
    const result = await httpsRequest(options, body);
    res.status(result.status).send(result.body);
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};
