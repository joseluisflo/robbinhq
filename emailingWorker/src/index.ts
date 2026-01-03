

export default {
  /**
   * 1. MANEJADOR HTTP (FETCH)
   * Responde a las visitas web para que no generen errores en tus logs.
   */
  async fetch(request, env, ctx) {
    // Si la petición es para una ruta específica del partykit, la maneja el Durable Object.
    const url = new URL(request.url);
    if (url.pathname.startsWith("/party/")) {
        const pathParts = url.pathname.split("/");
        const roomId = pathParts[2];

        if (!roomId) {
            return new Response("Room ID not found", { status: 404 });
        }
        
        // Asegúrate de que el nombre del binding "PARTYKIT_DURABLE" coincida
        // con el nombre que has configurado en tu archivo wrangler.toml
        const id = env.PARTYKIT_DURABLE.idFromName(roomId);
        const stub = env.PARTYKIT_DURABLE.get(id);
        return stub.fetch(request);
    }
    
    // Para cualquier otra ruta, devolvemos un mensaje simple.
    return new Response("Email & Voice Worker is Active", {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },

  /**
   * 2. MANEJADOR DE EMAIL
   * Procesa los correos entrantes.
   */
  async email(message, env, ctx) {
    const from = message.from;
    const to = message.to;
    const subject = message.headers.get('subject') || 'No Subject';
    const messageId = message.headers.get('message-id') || null;
    const references = message.headers.get('references') || null;
    const inReplyTo = message.headers.get('in-reply-to') || null;

    try {
      const rawEmail = await new Response(message.raw).text();
      // Usamos la nueva función robusta para obtener y limpiar el cuerpo del email.
      const body = await getCleanedBody(rawEmail);

      const payload = {
        from,
        to,
        subject,
        body,
        messageId,
        references,
        inReplyTo,
        receivedAt: new Date().toISOString(),
      };

      const response = await fetch(env.API_ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.EMAIL_INGEST_SECRET}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Email forwarded successfully: ${from} → ${to}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Critical error processing email:', error);
      // No relanzamos el error para evitar que el remitente reciba un rebote.
    }
  },
};

// --------------------------------------------------
// --- LÓGICA MEJORADA PARA PARSEAR Y LIMPIAR EL CUERPO DEL EMAIL ---
// --------------------------------------------------

function cleanReplyText(text) {
    // Regex para detectar líneas de respuesta comunes en varios idiomas
    const replySeparators = [
        /^\s*On\s.*(wrote|escribió|a écrit):/im, // English, Spanish, French
        /^\s*El\s.*(escribió):/im, // Spanish variant
        /^\s*From:.*$/im,
        /^\s*Sent from my.*$/im,
        /^\s*---[- ]*Original Message[- ]*---*$/im,
        /^\s*_{2,}\s*$/im, // Underscore separators
        /^>.*$/gm, // Quoted lines
    ];
    
    let cleanedText = text;
    for (const separator of replySeparators) {
        const match = cleanedText.search(separator);
        if (match !== -1) {
            cleanedText = cleanedText.substring(0, match);
        }
    }

    // Eliminar las líneas de citación restantes (> o >>) y espacios en blanco excesivos
    return cleanedText.replace(/^>.*$/gm, '').replace(/\n\s*\n/g, '\n').trim();
}

async function getCleanedBody(rawEmail) {
  const bodyStartIndex = rawEmail.indexOf('\r\n\r\n');
  if (bodyStartIndex === -1) return rawEmail;

  const headersPart = rawEmail.substring(0, bodyStartIndex);
  let bodyPart = rawEmail.substring(bodyStartIndex + 4);

  const contentTypeHeader = headersPart.match(/^Content-Type:.*$/im);
  if (!contentTypeHeader) return cleanReplyText(bodyPart.trim());

  const contentType = contentTypeHeader[0];

  if (contentType.includes('multipart/')) {
    const boundaryMatch = contentType.match(/boundary="?([^"]+)"?/i);
    if (!boundaryMatch) return cleanReplyText(bodyPart.trim());

    const boundary = boundaryMatch[1];
    const parts = bodyPart.split(new RegExp(`--${boundary}(--)?\\r?\\n`));
    
    // Priorizar text/plain
    for (const part of parts) {
      if (part.includes('Content-Type: text/plain')) {
        return cleanReplyText(extractContent(part));
      }
    }
    // Si no hay text/plain, intentar con text/html (y quitarle las etiquetas)
     for (const part of parts) {
      if (part.includes('Content-Type: text/html')) {
        const htmlContent = extractContent(part);
        const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return cleanReplyText(textContent);
      }
    }
  }
  
  // Si no es multipart, pero tiene Content-Transfer-Encoding
  if (headersPart.match(/^Content-Transfer-Encoding: quoted-printable/im)) {
      return cleanReplyText(decodeQuotedPrintable(bodyPart));
  }

  return cleanReplyText(bodyPart.trim());
}

function extractContent(part) {
  const contentStartIndex = part.indexOf('\r\n\r\n');
  if (contentStartIndex === -1) return part;
  let content = part.substring(contentStartIndex + 4);
  
  if (part.includes('Content-Transfer-Encoding: base64')) {
    try {
        // La función atob() está disponible globalmente en los workers de Cloudflare
        return atob(content.replace(/\s/g, ''));
    } catch(e) {
        console.error("Error decoding base64 content:", e);
        return content;
    }
  }
  
  if (part.includes('Content-Transfer-Encoding: quoted-printable')) {
    return decodeQuotedPrintable(content);
  }
  
  return content.trim();
}

function decodeQuotedPrintable(input) {
  // Une las líneas que terminan con "="
  let joined = input.replace(/=\r\n/g, '');
  // Reemplaza los caracteres codificados (ej. =3D por '=')
  return joined.replace(/=([0-9A-F]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}
