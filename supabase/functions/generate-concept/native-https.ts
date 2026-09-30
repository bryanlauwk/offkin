import { Agent, request } from 'npm:undici@7.30.0';
import { Duplex } from 'node:stream';
import { Buffer } from 'node:buffer';

export interface NativeConnection {
  read(buffer: Uint8Array): Promise<number | null>;
  write(buffer: Uint8Array): Promise<number>;
  close(): void;
  ref(): void;
  unref(): void;
  handshake?(): Promise<unknown>;
}
export interface NativeTlsRuntime {
  connect(options: { hostname: string; port: number; transport: 'tcp'; signal: AbortSignal }): Promise<NativeConnection>;
  startTls(connection: NativeConnection, options: { hostname: string; alpnProtocols: string[] }): Promise<NativeConnection>;
}

/** Thin I/O adapter only. Undici's maintained llhttp parser owns HTTP framing. */
export class NativeTlsSocket extends Duplex {
  readonly alpnProtocol = 'http/1.1';
  private reading = false;
  constructor(private connection: NativeConnection) { super(); }
  ref() { this.connection.ref(); return this; }
  unref() { this.connection.unref(); return this; }
  override _read() {
    if (this.reading || this.destroyed) return;
    this.reading = true;
    const buffer = new Uint8Array(16_384);
    this.connection.read(buffer).then(length => {
      this.reading = false;
      if (!this.destroyed) this.push(length === null ? null : Buffer.from(buffer.subarray(0, length)));
    }, error => { this.reading = false; if (!this.destroyed) this.destroy(error); });
  }
  override _write(chunk: Buffer, _encoding: string, callback: (error?: Error | null) => void) {
    (async () => {
      let offset = 0;
      while (offset < chunk.length) {
        const written = await this.connection.write(chunk.subarray(offset));
        if (written <= 0) throw new Error('Secure connection stopped accepting data');
        offset += written;
      }
    })().then(() => callback(), callback);
  }
  override _destroy(error: Error | null, callback: (error?: Error | null) => void) {
    try { this.connection.close(); } catch { /* Already closed by cancellation. */ }
    callback(error);
  }
}

/** Caller validates the URL and all DNS answers before supplying this literal IP. */
export async function fetchNativePinnedWebsite(url: URL, address: string, signal: AbortSignal, runtime: NativeTlsRuntime): Promise<Response> {
  let connection: NativeConnection | undefined;
  const close = () => { try { connection?.close(); } catch { /* Idempotent cleanup. */ } };
  const abort = () => close();
  signal.addEventListener('abort', abort, { once: true });
  const agent = new Agent({
    connections: 1, pipelining: 0, maxHeaderSize: 16_384, maxResponseSize: 300_000,
    connect: async (options, callback) => {
      try {
        signal.throwIfAborted();
        if (options.hostname !== url.hostname || !['', '443'].includes(String(options.port ?? '')) || options.protocol !== 'https:') throw new Error('Unexpected secure destination');
        connection = await runtime.connect({ hostname: address, port: 443, transport: 'tcp', signal });
        signal.throwIfAborted();
        // Native TLS verifies the original name on the already pinned TCP socket.
        // No custom trust roots, disabled verification, second DNS, or redirects.
        connection = await runtime.startTls(connection, { hostname: url.hostname, alpnProtocols: ['http/1.1'] });
        signal.throwIfAborted();
        if (!connection.handshake) throw new Error('Native TLS handshake verification unavailable');
        await connection.handshake();
        signal.throwIfAborted();
        // Undici uses the Duplex read/write/ref/unref contract here; native TLS already verified identity.
        callback(null, new NativeTlsSocket(connection) as unknown as import('node:net').Socket);
      } catch (error) {
        close();
        callback(error instanceof Error ? error : new Error('Secure connection failed'), null);
      }
    },
  });
  try {
    signal.throwIfAborted();
    const result = await request(url.href, {
      dispatcher: agent, method: 'GET', signal,
      headersTimeout: 6000, bodyTimeout: 6000,
      headers: { Accept: 'text/html, text/plain;q=0.8', 'Accept-Encoding': 'identity', 'User-Agent': 'BRIQ-CompanyReader/1.0' },
    });
    const headers = new Headers();
    for (const [key, value] of Object.entries(result.headers)) {
      if (Array.isArray(value)) value.forEach(item => headers.append(key, item));
      else if (value !== undefined) headers.set(key, value);
    }
    const status = result.statusCode;
    if (status < 200 || status > 599) throw new Error('Unsupported HTTP response');
    // The caller validates every redirect separately; do not read irrelevant bodies.
    if (status >= 300 || status === 204 || status === 205) return new Response(null, { status, headers });
    const encoding = headers.get('content-encoding')?.trim().toLowerCase();
    if (encoding && encoding !== 'identity') throw new Error('Compressed website response refused');
    if (Number(headers.get('content-length') || 0) > 300_000) throw new Error('Website response too large');
    let size = 0;
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.body) {
      signal.throwIfAborted();
      size += chunk.byteLength;
      if (size > 300_000) throw new Error('Website response too large');
      chunks.push(new Uint8Array(chunk));
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    headers.delete('transfer-encoding');
    headers.set('content-length', String(size));
    return new Response(bytes, { status, headers });
  } finally {
    close();
    await agent.destroy();
    signal.removeEventListener('abort', abort);
  }
}
