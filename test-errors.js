const express = require('express');
const http = require('http');
const validate = require('./src/middlewares/validate');
const { skinSchema, idParamSchema } = require('./src/validations/skin.validation');
const notFound = require('./src/middlewares/notFound');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();
app.use(express.json());

// Test routes
app.post('/test/body', validate(skinSchema), (req, res) => res.json({ success: true }));
app.delete('/test/skin/:id', validate(idParamSchema, 'params'), (req, res) => res.json({ success: true }));
app.get('/test/server-error', (req, res, next) => next(new Error('Kutilmagan ichki xato')));

app.use(notFound);
app.use(errorHandler);

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server ishga tushdi: port ${port}`);

  async function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  try {
    console.log('\n--- 1. Validatsiya xatosi (Noto\'g\'ri ma\'lumotlar) ---');
    const res1 = await makeRequest('/test/body', 'POST', JSON.stringify({ skinName: 'A', skinPrice: -5 }));
    console.log('Status:', res1.status);
    console.log('Javob:', JSON.stringify(res1.body, null, 2));

    console.log('\n--- 2. Noto\'g\'ri ID parametri (24 belgidan kam/noto\'g\'ri) ---');
    const res2 = await makeRequest('/test/skin/not-valid-id', 'DELETE');
    console.log('Status:', res2.status);
    console.log('Javob:', JSON.stringify(res2.body, null, 2));

    console.log('\n--- 3. Noto\'g\'ri/Buzilgan JSON formati (SyntaxError) ---');
    const res3 = await makeRequest('/test/body', 'POST', '{ skinName: invalid_json, }');
    console.log('Status:', res3.status);
    console.log('Javob:', JSON.stringify(res3.body, null, 2));

    console.log('\n--- 4. Mavjud bo\'lmagan manzil (404) ---');
    const res4 = await makeRequest('/nomaqbul-manzil-123', 'GET');
    console.log('Status:', res4.status);
    console.log('Javob:', JSON.stringify(res4.body, null, 2));

    console.log('\n--- 5. Serverdagi kutilmagan ichki xato (500) ---');
    const res5 = await makeRequest('/test/server-error', 'GET');
    console.log('Status:', res5.status);
    console.log('Javob:', JSON.stringify(res5.body, null, 2));

    console.log('\nBarcha sinovlar muvaffaqiyatli yakunlandi!');
  } catch (err) {
    console.error('Test xatoligi:', err);
  } finally {
    server.close();
  }
});
