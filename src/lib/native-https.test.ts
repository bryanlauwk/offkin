// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { fetchNativePinnedWebsite, NativeTlsSocket, type NativeConnection, type NativeTlsRuntime } from '../../supabase/functions/generate-concept/native-https';

function connection(): NativeConnection {
 return { read:vi.fn(async()=>null), write:vi.fn(async b=>b.length), close:vi.fn(), ref:vi.fn(), unref:vi.fn(), handshake:vi.fn(async()=>{}) };
}

describe('native transport cancellation and socket lifecycle',()=>{
 for(const stage of ['connect','startTls','handshake'] as const)it(`closes late connection after abort during ${stage}`,async()=>{
  const tcp=connection(),tls=connection();
  let release:()=>void;const pending=new Promise<void>(r=>{release=r;});
  const runtime:NativeTlsRuntime={connect:async()=>{if(stage==='connect')await pending;return tcp;},startTls:async()=>{if(stage==='startTls')await pending;return tls;}};
  if(stage==='handshake')tls.handshake=async()=>{await pending;};
  const controller=new AbortController();
  const result=fetchNativePinnedWebsite(new URL('https://company.com/'),'93.184.216.34',controller.signal,runtime).catch(e=>e);
  await new Promise(r=>setTimeout(r,10));controller.abort();release!();
  expect(await result).toBeInstanceOf(Error);
  expect(stage==='connect'?tcp.close:tls.close).toHaveBeenCalled();
  expect(tls.write).not.toHaveBeenCalled();
 });
 it('completes partial writes without losing bytes',async()=>{
  const conn=connection();const seen:number[]=[];conn.write=vi.fn(async bytes=>{seen.push(bytes[0]);return 1;});
  const socket=new NativeTlsSocket(conn);
  await new Promise<void>((resolve,reject)=>socket.write(Buffer.from([1,2,3]),e=>e?reject(e):resolve()));
  expect(seen).toEqual([1,2,3]);socket.destroy();expect(conn.close).toHaveBeenCalledOnce();
 });
 it('ignores a read completed after destruction',async()=>{
  const conn=connection();let finish:(n:number|null)=>void;conn.read=vi.fn(()=>new Promise<number|null>(r=>{finish=r;}));
  const socket=new NativeTlsSocket(conn);const data=vi.fn();socket.on('data',data);socket.resume();
  await new Promise(r=>setTimeout(r,0));socket.destroy();finish!(1);await new Promise(r=>setTimeout(r,0));
  expect(data).not.toHaveBeenCalled();expect(conn.close).toHaveBeenCalledOnce();
 });
});

describe('native pinned HTTP response budgets', () => {
 function httpRuntime(body: string, declaredLength = Buffer.byteLength(body)) {
  const bytes = Buffer.from(`HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: ${declaredLength}\r\nConnection: close\r\n\r\n${body}`);
  let offset = 0;
  const tcp = connection(), tls = connection();
  tls.read = vi.fn(async buffer => {
   if (offset === bytes.length) return null;
   const size = Math.min(buffer.length, bytes.length - offset);
   buffer.set(bytes.subarray(offset, offset + size));offset += size;return size;
  });
  const runtime: NativeTlsRuntime = { connect: vi.fn(async () => tcp), startTls: vi.fn(async () => tls) };
  return { runtime, tcp, tls };
 }
 it('accepts a 1.25 MB public homepage over the same pinned, verified TLS socket', async () => {
  const body = `<html><head><title>Public site</title><style>${' '.repeat(1_250_000)}</style></head><body>Electric vehicles and home energy storage.</body></html>`;
  const {runtime,tls,tcp} = httpRuntime(body);
  const response = await fetchNativePinnedWebsite(new URL('https://company.com/'),'93.184.216.34',new AbortController().signal,runtime);
  expect(response.status).toBe(200);expect(await response.text()).toBe(body);
  expect(runtime.connect).toHaveBeenCalledWith(expect.objectContaining({hostname:'93.184.216.34',port:443}));
  expect(runtime.startTls).toHaveBeenCalledWith(tcp,{hostname:'company.com',alpnProtocols:['http/1.1']});
  expect(tls.handshake).toHaveBeenCalledOnce();expect(tls.close).toHaveBeenCalled();
 });
 it('rejects larger bodies and destroys the pinned connection with a useful size error', async () => {
  const {runtime,tls} = httpRuntime('x'.repeat(2_000_001));
  await expect(fetchNativePinnedWebsite(new URL('https://company.com/'),'93.184.216.34',new AbortController().signal,runtime)).rejects.toMatchObject({code:'too_large'});
  expect(tls.close).toHaveBeenCalled();
 });
 it('rejects incomplete responses instead of returning truncated source evidence', async () => {
  const {runtime,tls} = httpRuntime('<p>Incomplete company facts.</p>',1000);
  await expect(fetchNativePinnedWebsite(new URL('https://company.com/'),'93.184.216.34',new AbortController().signal,runtime)).rejects.toBeInstanceOf(Error);
  expect(tls.close).toHaveBeenCalled();
 });
});
