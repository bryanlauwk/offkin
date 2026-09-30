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
