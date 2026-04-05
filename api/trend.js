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

    // 디버깅: 실제 응답 그대로 반환
    res.status(200).json({ 
      status: data.status, 
      body: data.body,
      debug: {
        customerId: customerId ? '설정됨' : '없음',
        accessLicense: accessLicense ? '설정됨' : '없음',
        secretKey: secretKey ? '설정됨' : '없음',
      }
    });
  } catch (e) {
    res.status(500).json({ errorMessage: e.message });
  }
};
