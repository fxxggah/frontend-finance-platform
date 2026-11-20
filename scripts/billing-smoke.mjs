// Navegador real com transporte controlado: nenhuma chamada ao Stripe/backend real.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const origin=process.env.SMOKE_URL || 'http://127.0.0.1:3006';
const profile=await mkdtemp(join(tmpdir(),'fin-billing-'));
const shots=process.env.BILLING_SCREENSHOT_DIR || join(profile,'screens');await mkdir(shots,{recursive:true});
const chrome=spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 ['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9239','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const spec=JSON.parse(await readFile(new URL('../openapi.json',import.meta.url),'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const basic={status:'NONE',paidUntil:null,manualProExpiresAt:null,effectiveProExpiresAt:null,cancelAtPeriodEnd:false,canCheckout:true,canManage:false,reviewRequired:false,testMode:true};
let current={...basic}, checkoutStatus=200, checkoutUrl='https://checkout.stripe.com/c/pay/fixture', socket;
const calls=[],visits=[],failures=[],exceptions=[];
try {
 let target;for(let i=0;i<70;i++){try{target=await(await fetch('http://localhost:9239/json/new?about:blank',{method:'PUT'})).json();break;}catch{await sleep(100);}}
 assert.ok(target,'Chrome não iniciou');socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let next=0;const pending=new Map();
 function send(method,params={}){return new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
 function sample(schema={},key=''){
  if(schema.$ref)return sample(spec.components.schemas[schema.$ref.split('/').at(-1)],key);
  if(schema.enum)return schema.enum[0];if(schema.type==='array')return [sample(schema.items)];
  if(schema.type==='object'||schema.properties)return Object.fromEntries(Object.entries(schema.properties||{}).map(([k,v])=>[k,sample(v,k)]));
  if(schema.type==='boolean')return false;if(schema.type==='integer')return 1;if(schema.type==='number')return 100;
  if(schema.format==='date')return '2026-11-16';if(schema.format==='date-time')return '2026-11-16T12:00:00Z';return 'Teste';
 }
 socket.addEventListener('message',async event=>{
  const message=JSON.parse(event.data);if(message.id){const callback=pending.get(message.id);pending.delete(message.id);if(message.error)callback?.reject(new Error(message.error.message));else callback?.resolve(message.result);return;}
  if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.text);
  if(message.method!=='Fetch.requestPaused')return;
  const {requestId,request}=message.params;const url=new URL(request.url);
  const fulfill=(body,status=200,html=false)=>send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:html?'text/html':'application/json'},
   {name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Headers',value:'Authorization,Content-Type,Idempotency-Key'},{name:'Access-Control-Allow-Methods',value:'GET,POST,OPTIONS'}],body:Buffer.from(html?body:JSON.stringify(body??{})).toString('base64')});
  try {
   if(['checkout.stripe.com','billing.stripe.com'].includes(url.hostname)){visits.push(url.href);await fulfill('<html><body>Página hospedada de teste</body></html>',200,true);return;}
   if(url.pathname==='/api/auth/refresh'){await fulfill({accessToken:'billing-synthetic-jwt'});return;}
   if(url.pathname.startsWith('/api/v1/')){
    if(request.method==='OPTIONS'){await fulfill({},200);return;}
    const headers=Object.fromEntries(Object.entries(request.headers).map(([k,v])=>[k.toLowerCase(),v]));
    assert.equal(headers.authorization,'Bearer billing-synthetic-jwt');assert.equal(url.searchParams.has('userId'),false);
    if(url.pathname.startsWith('/api/v1/billing/')){
     calls.push({path:url.pathname,method:request.method,key:headers['idempotency-key'],body:request.postData});
     if(url.pathname.endsWith('/plan')){await fulfill({amount:39.9,currency:'BRL',interval:'MONTH',testMode:true});return;}
     if(url.pathname.endsWith('/subscription')){await fulfill(current);return;}
     assert.equal(request.postData,undefined);assert.equal(request.method,'POST');await sleep(200);
     if(url.pathname.endsWith('/checkout-sessions')){
      assert.match(headers['idempotency-key'],/^[a-f0-9-]{36}$/);
      await fulfill(checkoutStatus===200?{url:checkoutUrl}:{status:checkoutStatus,title:'Cobrança de teste',detail:'Falha de cobrança controlada',code:'BILLING_UNAVAILABLE'},checkoutStatus);return;
     }
     await fulfill({url:'https://billing.stripe.com/p/fixture'});return;
    }
    if(url.pathname==='/api/v1/users/me'){await fulfill({id:1,name:'Pessoa de teste',email:'fixture@example.test',pictureUrl:null,plan:current.paidUntil?'PRO':'BASIC',proExpiresAt:current.effectiveProExpiresAt});return;}
    const path=Object.keys(spec.paths).find(p=>new RegExp('^'+p.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(url.pathname));
    const operation=spec.paths[path]?.[request.method.toLowerCase()];assert.ok(operation,request.method+' '+url.pathname);
    const response=Object.entries(operation.responses).find(([code])=>Number(code)<300)?.[1];await fulfill(sample(Object.values(response?.content||{})[0]?.schema));return;
   }
   if(url.origin===origin){await send('Fetch.continueRequest',{requestId});return;}
   await send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});
  }catch(error){if(!/Invalid InterceptionId|Invalid requestId/.test(error.message)) failures.push(error.message);await send('Fetch.failRequest',{requestId,errorReason:'Failed'}).catch(()=>{});}
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await send('Network.setCookie',{name:'fin_session',value:'synthetic-billing-cookie',url:origin,httpOnly:true,sameSite:'Lax'});
 async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 async function waitFor(expression){for(let i=0;i<150;i++){if(await evaluate(expression))return;await sleep(100);}throw new Error('Tempo esgotado: '+expression);}
 const button=text=>"Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==="+JSON.stringify(text)+')';
 const panel="document.querySelector('[data-testid=\"billing-panel\"]')";
 async function navigate(query=''){await send('Page.navigate',{url:origin+'/settings'+query});await waitFor("document.body?.innerText.includes('Pessoa de teste')");await waitFor('!!'+panel);}
 const checkoutCalls=()=>calls.filter(c=>c.path.endsWith('/checkout-sessions'));
 const portalCalls=()=>calls.filter(c=>c.path.endsWith('/portal-sessions'));
 for(const width of [390,1440]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:width<1024});
  if(process.argv.includes('--disabled-only')){
   await send('Page.navigate',{url:origin+'/settings'});await waitFor("document.body?.innerText.includes('Pessoa de teste')");await sleep(300);
   assert.equal(await evaluate('!!'+panel),false);assert.equal(calls.length,0);console.log('OK '+width+'px: billing desligado sem chamadas');continue;
  }
  current={...basic};checkoutStatus=200;checkoutUrl='https://checkout.stripe.com/c/pay/fixture';
  await navigate('?billing=return');
  await waitFor("document.body?.innerText.includes('Aguardando confirmação do pagamento')");
  assert.equal(await evaluate('!!('+button('Assinar PRO')+')'),false);
  assert.equal(await evaluate("document.body?.innerText.includes('Aguardando confirmação do pagamento')"),true);
  assert.equal(await evaluate("document.body?.innerText.includes('Acesso pago confirmado até')"),false);
  assert.equal(await evaluate("document.body?.innerText.includes('39,90')"),true);
  current={...basic,status:'ACTIVE',paidUntil:'2026-12-16T12:00:00Z',effectiveProExpiresAt:'2026-12-16T12:00:00Z',canCheckout:false,canManage:true};
  await waitFor("document.body?.innerText.includes('Acesso pago confirmado até')");
  assert.equal(await evaluate("document.body?.innerText.includes('Aguardando confirmação do pagamento')"),false);
  current={...basic};await navigate();await waitFor('!!('+button('Assinar PRO')+')');
  const before=checkoutCalls().length;
  await evaluate('('+button('Assinar PRO')+').click();('+button('Assinar PRO')+').click()');
  await waitFor("location.hostname === 'checkout.stripe.com'");assert.equal(checkoutCalls().length,before+1);
  current={...basic,status:'ACTIVE',paidUntil:'2026-12-16T12:00:00Z',effectiveProExpiresAt:'2026-12-16T12:00:00Z',cancelAtPeriodEnd:true,canCheckout:false,canManage:true};
  await navigate();await waitFor('!!('+button('Gerenciar assinatura')+')');
  assert.equal(await evaluate("document.body?.innerText.includes('Acesso pago confirmado até 16/12/2026')"),true);
  assert.equal(await evaluate("document.body?.innerText.includes('A renovação está cancelada')"),true);
  assert.equal(await evaluate('!!('+button('Assinar PRO')+')'),false);
  await evaluate(panel+".scrollIntoView({block:'start'})");assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(shots,'billing-'+width+'.png'),Buffer.from(shot.data,'base64'));
  const portals=portalCalls().length;await evaluate('('+button('Gerenciar assinatura')+').click();('+button('Gerenciar assinatura')+').click()');
  await waitFor("location.hostname === 'billing.stripe.com'");assert.equal(portalCalls().length,portals+1);
  current={...basic};checkoutStatus=503;await navigate();await waitFor('!!('+button('Assinar PRO')+')');
  const errors=checkoutCalls().length;await evaluate('('+button('Assinar PRO')+').click()');
  await waitFor("document.body?.innerText.includes('Falha de cobrança controlada')");await sleep(500);assert.equal(checkoutCalls().length,errors+1);
  await waitFor('!('+button('Assinar PRO')+').disabled');await evaluate('('+button('Assinar PRO')+').click()');await sleep(500);
  assert.equal(checkoutCalls().length,errors+2);assert.equal(checkoutCalls().at(-1).key,checkoutCalls().at(-2).key);
  checkoutStatus=200;checkoutUrl='https://evil.example/fixture';await navigate();await waitFor('!!('+button('Assinar PRO')+')');
  await evaluate('('+button('Assinar PRO')+').click()');await waitFor("document.body?.innerText.includes('Não foi possível abrir o pagamento com segurança')");
  assert.equal(await evaluate('location.origin'),origin);
  for(const state of ['loading','empty','error']){await navigate('?state='+state);await sleep(150);assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);}
  console.log('OK '+width+'px: preço/status, retorno sem grant, checkout/portal únicos, URL bloqueada, erro sem retry e estados');
 }
 assert.deepEqual(failures,[]);assert.deepEqual(exceptions,[]);
 console.log('Stripe, backend e login reais não foram chamados. Capturas: '+shots);
}finally{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(100);socket.close();}chrome.kill();}