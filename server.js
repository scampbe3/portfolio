const http = require('http');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const zlib = require('zlib');

const rootDir = process.cwd();
const port = Number(process.env.PORT || 4173);
const hostArgumentIndex = process.argv.indexOf('--host');
const hostArgument = hostArgumentIndex >= 0 ? process.argv[hostArgumentIndex + 1] : null;
const host = process.env.HOST || (
  hostArgument && !hostArgument.startsWith('-') ? hostArgument : hostArgumentIndex >= 0 ? '0.0.0.0' : '127.0.0.1'
);

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    let value = trimmedLine.slice(equalsIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv(path.join(rootDir, '.env'));

const contactRecipient = process.env.CONTACT_TO || 'campbell.t.stephen@gmail.com';
const maxContactPayloadBytes = 32 * 1024;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
};

function getCacheControl(extension) {
  if (['.html', '.js', '.css'].includes(extension)) {
    return 'no-cache';
  }

  if (['.glb', '.gltf', '.mp4', '.jpg', '.jpeg', '.png', '.svg', '.webp'].includes(extension)) {
    return 'public, max-age=3600';
  }

  return 'no-cache';
}

function send(response, statusCode, headers, body) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function sendJson(response, statusCode, payload) {
  send(
    response,
    statusCode,
    { 'Content-Type': 'application/json; charset=utf-8' },
    JSON.stringify(payload),
  );
}

function sendFile(request, response, filePath, stats, headers) {
  const fileSize = stats.size;
  const extension = path.extname(filePath).toLowerCase();
  const etag = `W/"${fileSize.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
  const rangeHeader = request.headers.range;
  const streamHeaders = {
    ...headers,
    'Accept-Ranges': 'bytes',
    'ETag': etag,
    'Last-Modified': stats.mtime.toUTCString(),
  };

  if (!rangeHeader && request.headers['if-none-match'] === etag) {
    response.writeHead(304, streamHeaders);
    response.end();
    return;
  }

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);

    if (!match) {
      send(response, 416, { ...streamHeaders, 'Content-Range': `bytes */${fileSize}` }, '');
      return;
    }

    let requestedStart;
    let requestedEnd;

    if (!match[1] && match[2]) {
      const suffixLength = Number(match[2]);
      requestedStart = Math.max(fileSize - suffixLength, 0);
      requestedEnd = fileSize - 1;
    } else {
      requestedStart = match[1] ? Number(match[1]) : 0;
      requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
    }

    const start = Math.max(0, requestedStart);
    const end = Math.min(fileSize - 1, requestedEnd);

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) {
      send(response, 416, { ...streamHeaders, 'Content-Range': `bytes */${fileSize}` }, '');
      return;
    }

    response.writeHead(206, {
      ...streamHeaders,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    fs.createReadStream(filePath, { start, end })
      .on('error', () => response.destroy())
      .pipe(response);
    return;
  }

  const compressible = ['.css', '.html', '.js', '.json', '.svg'].includes(extension);
  const acceptedEncoding = request.headers['accept-encoding'] || '';
  const contentEncoding = compressible
    ? acceptedEncoding.includes('br')
      ? 'br'
      : acceptedEncoding.includes('gzip')
        ? 'gzip'
        : null
    : null;

  if (contentEncoding) {
    response.writeHead(200, {
      ...streamHeaders,
      'Content-Encoding': contentEncoding,
      'Vary': 'Accept-Encoding',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const compressor = contentEncoding === 'br'
      ? zlib.createBrotliCompress({
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
          },
        })
      : zlib.createGzip({ level: 6 });

    fs.createReadStream(filePath)
      .on('error', () => response.destroy())
      .pipe(compressor)
      .on('error', () => response.destroy())
      .pipe(response);
    return;
  }

  response.writeHead(200, {
    ...streamHeaders,
    'Content-Length': fileSize,
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath)
    .on('error', () => response.destroy())
    .pipe(response);
}

function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .trim()
    .slice(0, maxLength);
}

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let receivedBytes = 0;
    const chunks = [];

    request.on('data', (chunk) => {
      receivedBytes += chunk.length;

      if (receivedBytes > maxContactPayloadBytes) {
        reject(Object.assign(new Error('Message is too large.'), { statusCode: 413 }));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const bodyText = Buffer.concat(chunks).toString('utf8');
        resolve(bodyText ? JSON.parse(bodyText) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON request.'), { statusCode: 400 }));
      }
    });

    request.on('error', reject);
  });
}

function buildContactMessage(payload) {
  const senderEmail = cleanText(payload.senderEmail, 254);
  const title = cleanText(payload.messageTitle, 120);
  const body = cleanText(payload.messageBody, 2400);

  if (!isEmailAddress(senderEmail)) {
    throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 });
  }

  if (!title || !body) {
    throw Object.assign(new Error('Add an email title and body.'), { statusCode: 400 });
  }

  const subject = `[Portfolio Site Contact] ${title}`;
  const submittedAt = new Date().toISOString();
  const text = [
    'Source: Portal Portfolio contact form',
    `Reply-to: ${senderEmail}`,
    `Submitted: ${submittedAt}`,
    '',
    body,
  ].join('\n');
  const html = `
    <p><strong>Source:</strong> Portal Portfolio contact form</p>
    <p><strong>Reply-to:</strong> ${escapeHtml(senderEmail)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <hr />
    <p>${escapeHtml(body).replace(/\n/g, '<br />')}</p>
  `;

  return { senderEmail, subject, text, html };
}

async function sendContactEmail(payload) {
  const message = buildContactMessage(payload);
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw Object.assign(
      new Error('Contact delivery is not configured yet. Set SMTP_HOST, SMTP_USER, and SMTP_PASS on the server.'),
      { statusCode: 200 },
    );
  }

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transport.sendMail({
    to: contactRecipient,
    from: process.env.CONTACT_FROM || smtpUser,
    replyTo: message.senderEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

async function handleContactRequest(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    await sendContactEmail(payload);
    sendJson(response, 200, { ok: true, message: 'Message sent. Thank you.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    sendJson(response, statusCode, {
      ok: false,
      message: statusCode === 500 ? 'Message delivery failed. Please try again later.' : error.message,
    });
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = request.url.split('?')[0];

  if (pathname === '/api/contact') {
    await handleContactRequest(request, response);
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    send(response, 405, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Method not allowed');
    return;
  }

  const requestPath = pathname === '/'
    ? '/index.html'
    : pathname === '/favicon.ico'
      ? '/favicon.svg'
      : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(rootDir, requestPath));

  if (!filePath.startsWith(rootDir)) {
    send(response, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(response, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = contentTypes[extension] || 'application/octet-stream';
    const headers = {
      'Cache-Control': getCacheControl(extension),
      'Content-Type': contentType,
    };

    sendFile(request, response, filePath, stats, headers);
  });
});

server.listen(port, host, () => {
  console.log(`Static server running at http://localhost:${port}`);

  if (host === '0.0.0.0' || host === '::') {
    const os = require('os');
    const networkUrls = Object.values(os.networkInterfaces())
      .flat()
      .filter((address) => address && address.family === 'IPv4' && !address.internal)
      .map((address) => `http://${address.address}:${port}`);

    if (networkUrls.length) {
      console.log('Available on your local network:');
      for (const url of networkUrls) {
        console.log(`  ${url}`);
      }
    }
  }
});
