// No external website or AI requests: actual Deno TLS + maintained HTTP parser.
// Generate a temporary CA:false fixture cert for company.invalid, then pass its paths.
import { fetchNativePinnedWebsite } from '../supabase/functions/generate-concept/native-https.ts';
const [certPath,keyPath]=Deno.args;
const cert=await Deno.readTextFile(certPath);const key=await Deno.readTextFile(keyPath);
const abort=new AbortController();
const listener=Deno.serve({hostname:'127.0.0.1',port:0,cert,key,signal:abort.signal,onListen:()=>{}}, req=>{
 const path=new URL(req.url).pathname;
 if(path==='/headers')return new Response('hello',{headers:{'x-long':'x'.repeat(17000)}});
 if(path==='/large')return new Response('x'.repeat(300001));
 if(path==='/compressed')return new Response('not gzip',{headers:{'content-encoding':'gzip'}});
 if(path==='/redirect')return Response.redirect('https://wrong.invalid/',302);
 if(path==='/slow')return new Response(new ReadableStream({start(){}}));
 return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('Company '));c.enqueue(new TextEncoder().encode('business page'));c.close();}}),{headers:{'content-type':'text/html'}});
});
const runtime={
 connect:async(options:{hostname:string;port:number})=>{if(options.hostname!=='127.0.0.1'||options.port!==443)throw new Error('Pin mismatch');return Deno.connect({hostname:options.hostname,port:listener.addr.port});},
 startTls:(conn:Deno.TcpConn,options:{hostname:string;alpnProtocols:string[]})=>Deno.startTls(conn,{...options,caCerts:[cert]}),
};
try{
 const good=await fetchNativePinnedWebsite(new URL('https://company.invalid/'),'127.0.0.1',AbortSignal.timeout(1000),runtime);
 if(good.status!==200||await good.text()!=='Company business page')throw new Error('Chunked response failed');
 console.log('PASS verified TLS + chunked body');
 for(const [url,timeout] of [['https://wrong.invalid/',1000],['https://company.invalid/headers',1000],['https://company.invalid/large',1000],['https://company.invalid/compressed',1000],['https://company.invalid/slow',50]] as const){let refused=false;try{await fetchNativePinnedWebsite(new URL(url),'127.0.0.1',AbortSignal.timeout(timeout),runtime);}catch{refused=true;}if(!refused)throw new Error('Expected rejection '+url);console.log('PASS rejection',url);}
 const redirect=await fetchNativePinnedWebsite(new URL('https://company.invalid/redirect'),'127.0.0.1',AbortSignal.timeout(1000),runtime);
 if(redirect.status!==302||redirect.headers.get('location')!=='https://wrong.invalid/')throw new Error('Redirect followed');
 console.log('PASS manual redirect');
}finally{abort.abort();await listener.finished;}

for (const raw of [
 'HTTP/1.1 200 OK\r\nContent-Length: 5\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n',
 'HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nZZ\r\nhello\r\n0\r\n\r\n',
 'HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\nshort',
]) {
 const listener = Deno.listenTls({hostname:'127.0.0.1',port:0,cert,key});
 const serving=(async()=>{const c=await listener.accept();try{await c.read(new Uint8Array(4096));const b=new TextEncoder().encode(raw);let n=0;while(n<b.length)n+=await c.write(b.subarray(n));}finally{c.close();}})();
 const localRuntime={...runtime,connect:()=>Deno.connect({hostname:'127.0.0.1',port:listener.addr.port})};
 let refused=false;
 try{await fetchNativePinnedWebsite(new URL('https://company.invalid/'),'127.0.0.1',AbortSignal.timeout(1000),localRuntime);}catch{refused=true;}finally{listener.close();await serving;}
 if(!refused)throw new Error('Malformed framing accepted');
 console.log('PASS malformed HTTP framing refused');
}
