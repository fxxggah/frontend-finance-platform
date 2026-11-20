// QA com microfone sintético e transporte controlado. Não chama Gemini nem backend real.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = process.env.SMOKE_URL || "http://localhost:3006";
const profile = await mkdtemp(join(tmpdir(), "fin-voice-"));
const shots = process.env.VOICE_SCREENSHOT_DIR || join(profile, "screens");
await mkdir(shots, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", "--no-first-run", "--no-default-browser-check", "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream", "--remote-debugging-port=9238", "--user-data-dir=" + profile, "about:blank"],
  { windowsHide: true, stdio: "ignore" });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const spec = JSON.parse(await readFile(new URL("../openapi.json", import.meta.url), "utf8"));
let socket;
const failures = [], exceptions = [], voices = [], confirmations = [];
let plan = "PRO";
const full = { description: "Compra na padaria", type: "EXPENSE", amount: 45.01, date: "2026-11-16", categoryId: 2, accountId: 1,
  creditCardId: null, installments: 1, missingFields: [], requiresConfirmation: true };
let scenario = { status: 200, body: full, delay: 100 };
try {
  let target;
  for (let i = 0; i < 70; i++) {
    try { target = await (await fetch("http://localhost:9238/json/new?about:blank", { method: "PUT" })).json(); break; }
    catch { await sleep(100); }
  }
  assert.ok(target, "Chrome não iniciou");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
  let next = 0;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++next; pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  function sample(schema = {}, key = "") {
    if (schema.$ref) return sample(spec.components.schemas[schema.$ref.split("/").at(-1)], key);
    if (schema.enum) return schema.enum[0];
    if (schema.type === "array") return [sample(schema.items)];
    if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties || {}).map(([k,v]) => [k, sample(v,k)]));
    if (schema.type === "integer") return key === "page" ? 0 : 1;
    if (schema.type === "number") return 12.34;
    if (schema.type === "boolean") return false;
    if (schema.format === "date") return "2026-11-16";
    if (schema.format === "date-time") return "2100-01-01T00:00:00Z";
    if (key === "pictureUrl") return null;
    if (key === "color") return "#5B3DF5";
    if (key === "icon") return "wallet";
    if (key === "reference" || key === "invoiceReference") return "2026-11";
    return "Exemplo de teste";
  }
  socket.addEventListener("message", async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id); pending.delete(message.id);
      if (message.error) item?.reject(new Error(message.error.message)); else item?.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === "Fetch.requestPaused") {
      const { request, requestId } = message.params;
      const url = new URL(request.url);
      const fulfill = async (body, status = 200, extra = []) => send("Fetch.fulfillRequest", {
        requestId, responseCode: status,
        responseHeaders: [{ name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: origin },
          { name: "Access-Control-Allow-Headers", value: "authorization,content-type,accept,idempotency-key" },
          { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { name: "Access-Control-Expose-Headers", value: "Retry-After" }, ...extra],
        body: Buffer.from(body === undefined ? "" : JSON.stringify(body)).toString("base64"),
      });
      try {
        if (url.pathname === "/api/auth/refresh") { await fulfill({ accessToken: "voice-synthetic-jwt" }); return; }
        if (url.pathname.startsWith("/api/v1/")) {
          if (request.method === "OPTIONS") { await fulfill(undefined, 200); return; }
          const auth = Object.entries(request.headers).find(([key]) => key.toLowerCase() === "authorization")?.[1];
          assert.equal(auth, "Bearer voice-synthetic-jwt");
          assert.equal(url.searchParams.has("userId"), false);
          if (url.pathname === "/api/v1/ai/transaction-drafts") {
            const headers = Object.fromEntries(Object.entries(request.headers).map(([key,value]) => [key.toLowerCase(), value]));
            assert.match(headers["content-type"], /^audio\/(webm|mp4)$/);
            assert.match(headers["idempotency-key"], /^[a-f0-9-]{36}$/);
            voices.push(headers["idempotency-key"]);
            const current = scenario;
            if (current.status === 403) plan = "BASIC";
            await sleep(current.delay || 0);
            await fulfill(current.body, current.status, current.status === 429 ? [{ name: "Retry-After", value: "30" }] : []);
            return;
          }
          const path = Object.keys(spec.paths).find(path => new RegExp("^" + path.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(url.pathname));
          const operation = spec.paths[path]?.[request.method.toLowerCase()];
          assert.ok(operation, request.method + " " + url.pathname);
          const response = Object.entries(operation.responses).find(([code]) => Number(code) < 300)?.[1];
          let body = sample(Object.values(response?.content || {})[0]?.schema);
          if (url.pathname === "/api/v1/users/me") body = { ...body, id: 1, name: "Pessoa de teste", plan, proExpiresAt: "2100-01-01T00:00:00Z" };
          if (url.pathname === "/api/v1/categories") body = [
            { ...sample(spec.components.schemas.CategoryResponse), id: 1, type: "INCOME", name: "Salário" },
            { ...sample(spec.components.schemas.CategoryResponse), id: 2, type: "EXPENSE", name: "Alimentação" },
          ];
          if (url.pathname === "/api/v1/transactions" && request.method === "POST") {
            const value = JSON.parse(request.postData); confirmations.push(value);
            await sleep(200);
            body = { ...body, type: value.type, amount: value.amount, date: value.date };
          }
          await fulfill(body, request.method === "POST" ? 201 : 200);
          return;
        }
        if (url.origin === origin) { await send("Fetch.continueRequest", { requestId }); return; }
        await send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
      } catch (error) {
        // Fechar a tela durante o envio invalida requestId; o cancelamento é esperado.
        if (!/Invalid InterceptionId|Invalid requestId|No resource|interception|Target closed/i.test(error.message)) failures.push(error.message);
        await send("Fetch.failRequest", { requestId, errorReason: "Failed" }).catch(() => {});
      }
    }
  });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: "(" + (() => {
    window.__voiceStreams = []; window.__micCalls = 0;
    if (new URL(location.href).searchParams.has("unsupported-voice")) window.MediaRecorder = undefined;
    if (!navigator.mediaDevices?.getUserMedia) return;
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      window.__micCalls++;
      if (window.__denyVoice) throw new DOMException("Synthetic", "NotAllowedError");
      const capture = async () => { const stream = await original(constraints); window.__voiceStreams.push(stream); return stream; };
      if (window.__delayVoice) return new Promise(resolve => { window.__resolveVoice = () => capture().then(resolve); });
      return capture();
    };
  }).toString() + ")();" });
  await send("Network.setCookie", { name: "fin_session", value: "synthetic-voice-cookie", url: origin, httpOnly: true, sameSite: "Lax" });

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await sleep(100); }
    throw new Error("Tempo esgotado: " + expression);
  }
  const button = text => "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === " + JSON.stringify(text) + ")";
  async function click(text) { await waitFor("!!(" + button(text) + ")"); await evaluate("(" + button(text) + ").click()"); }
  async function fill(id, value) {
    await evaluate("(() => {const input = document.getElementById(" + JSON.stringify(id) + "); if(!input) throw new Error('Input ausente'); const prototype = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype,'value').set.call(input," + JSON.stringify(value) + "); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await sleep(70);
  }
  async function navigate(query = "", userPlan = "PRO") {
    plan = userPlan; scenario = { status: 200, body: full, delay: 100 };
    await send("Page.navigate", { url: origin + "/transactions/new" + query });
    await waitFor("!!document.querySelector('#amount')");
    await waitFor("!!(" + button("Usar gravação") + ")");
    await waitFor("document.body.innerText.includes('Pessoa de teste')");
    await waitFor((userPlan === "PRO" ? "!" : "") + "(" + button("Usar gravação") + ").disabled");
  }
  const allEnded = "(window.__voiceStreams || []).every(stream => stream.getTracks().every(track => track.readyState === 'ended'))";
  async function capture() {
    await click("Usar gravação"); await click("Gravar áudio");
    await waitFor("!!(" + button("Parar gravação") + ")");
    assert.equal(await evaluate("(" + button("Registrar") + ").disabled"), true);
    await sleep(650);
    await click("Parar gravação"); await waitFor("!!document.querySelector('audio')");
    assert.equal(await evaluate(allEnded), true);
  }
  async function extract(body = full, status = 200) {
    const before = voices.length;
    scenario = { status, body, delay: 120 };
    await evaluate("(" + button("Preparar rascunho") + ").click();(" + button("Preparar rascunho") + ").click();");
    await waitFor(status === 200 ? "!!document.querySelector('#voice-review')" : "!!document.querySelector('[aria-label=\"Cadastro por voz\"] [role=\"alert\"]')");
    assert.equal(voices.length, before + 1);
  }
  async function completeAndConfirm(card = false) {
    if (card) { await click("− Despesa"); await fill("date", "2026-11-16"); await fill("installments", "3"); }
    const before = confirmations.length;
    await evaluate("document.querySelector('form').requestSubmit()");
    await sleep(100); assert.equal(confirmations.length, before, "Não deve criar sem revisão");
    await evaluate("document.querySelector('#voice-review').click()");
    if (card) {
      await fill("description", "Compra de teste revisada");
      assert.equal(await evaluate("document.querySelector('#voice-review').checked"), false);
      await evaluate("document.querySelector('#voice-review').click()");
    }
    await waitFor("!(" + button("Registrar") + ").disabled");
    await evaluate("(" + button("Registrar") + ").click();(" + button("Registrar") + ").click()");
    await waitFor("!document.querySelector('[role=\"dialog\"]')");
    assert.equal(confirmations.length, before + 1, "Confirmar duas vezes não duplica");
    assert.equal(confirmations.at(-1).amount, 45.01);
    assert.equal(confirmations.at(-1).categoryId, 2);
    if (card) { assert.equal(confirmations.at(-1).creditCardId, 1); assert.equal(confirmations.at(-1).installments, 3); }
    else {
      assert.equal(confirmations.at(-1).accountId, 1);
      assert.equal(confirmations.at(-1).description, "Compra na padaria");
      assert.equal(confirmations.at(-1).date, "2026-11-16");
    }
  }

  for (const width of [390, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024 });
    if (process.argv.includes("--disabled-only")) {
      await send("Page.navigate", { url: origin + "/transactions/new" });
      await waitFor("!!document.querySelector('#amount')");
      assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Cadastro por voz\"]')"), false);
      assert.equal(await evaluate("window.__micCalls"), 0);
      assert.equal(voices.length, 0);
      console.log("OK " + width + "px: flag desligada esconde voz e mantém o formulário manual");
      continue;
    }
    await navigate(); const before = voices.length; await capture();
    assert.equal(voices.length, before, "Parar gravação não envia automaticamente");
    await extract(); assert.equal(await evaluate("document.querySelector('#amount').value"), "45,01");
    assert.equal(await evaluate("document.querySelector('#description').value"), "Compra na padaria");
    assert.equal(await evaluate("document.querySelector('#date').value"), "2026-11-16");
    assert.equal(await evaluate("(" + button("Registrar") + ").disabled"), true);
    await completeAndConfirm();
    await navigate(); await capture();
    await extract({ ...full, type: null, accountId: null, creditCardId: 1, installments: 1,
      missingFields: ["type"] });
    assert.equal(await evaluate("document.querySelector('#date').value"), "2026-11-16");
    assert.equal(await evaluate("document.querySelector('#installments').value"), "1");
    assert.equal(await evaluate("document.querySelector('#categoryId').value"), "2");
    assert.equal(await evaluate("(" + button("− Despesa") + ").getAttribute('aria-pressed')"), "false");
    assert.ok(await evaluate("document.querySelector('[role=\"dialog\"]').getBoundingClientRect().width <= innerWidth"));
    const shot = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(join(shots, "voice-review-" + width + ".png"), Buffer.from(shot.data, "base64"));
    await completeAndConfirm(true);
    for (const [status, code] of [[403, "PRO_REQUIRED"], [409, "AI_REQUEST_ALREADY_USED"], [422, "MULTIPLE_TRANSACTIONS"],
      [429, "USER_AI_QUOTA_EXCEEDED"], [503, "AI_UNAVAILABLE"]]) {
      await navigate(); await capture();
      const count = confirmations.length;
      await extract({ status, title: "Teste", detail: "Falha controlada", code }, status);
      await sleep(350);
      assert.equal(confirmations.length, count);
      assert.equal(await evaluate("document.querySelector('#amount').disabled || document.querySelector('fieldset').disabled"), false);
      if (status === 429) assert.match(await evaluate("document.body.innerText"), /30 segundos/);
    }
    await navigate(); await click("Usar gravação"); await evaluate("window.__denyVoice = true");
    const old = voices.length; await click("Gravar áudio");
    await waitFor("document.body.innerText.includes('Microfone bloqueado')");
    assert.equal(voices.length, old); assert.equal(await evaluate(allEnded), true);
    await navigate(); await click("Usar gravação"); await evaluate("window.__delayVoice = true");
    await click("Gravar áudio"); await waitFor("typeof window.__resolveVoice === 'function'");
    await click("Cancelar"); await evaluate("window.__resolveVoice()");
    await sleep(350); assert.equal(await evaluate(allEnded), true);
    await navigate(); await capture(); await click("Gravar novamente");
    await waitFor("!!(" + button("Parar gravação") + ")");
    await click("Cancelar"); await sleep(250); assert.equal(await evaluate(allEnded), true);

    await navigate("", "BASIC");
    assert.equal(await evaluate("(" + button("Usar gravação") + ").disabled"), true);
    assert.equal(await evaluate("window.__micCalls"), 0);
    await navigate("?unsupported-voice=1"); await click("Usar gravação");
    assert.equal(await evaluate("(" + button("Gravar áudio") + ").disabled"), true);
    assert.equal(await evaluate("window.__micCalls"), 0);
    await navigate(); await capture();
    await extract({ ...full, type: null, categoryId: null, accountId: null, creditCardId: null,
      installments: 1, missingFields: ["type", "categoryId", "paymentSource"] });
    assert.equal(await evaluate("document.querySelector('#date').value"), "2026-11-16");
    assert.equal(await evaluate("document.querySelector('#categoryId').value"), "");
    assert.equal(await evaluate("!!document.querySelector('#accountId') || !!document.querySelector('#creditCardId')"), false);
    await click("Conta bancária");
    assert.equal(await evaluate("document.querySelector('#accountId').value"), "");
    await fill("accountId", "1"); await click("− Despesa"); await fill("categoryId", "2"); await fill("date", "2026-11-16");
    await completeAndConfirm();
    await navigate(); await click("Usar gravação");
    await evaluate("window.__timer = window.setTimeout; window.setTimeout = (callback, delay, ...args) => window.__timer(callback, delay === 29000 ? 350 : delay, ...args)");
    await click("Gravar áudio"); await waitFor("!!document.querySelector('audio')");
    assert.equal(await evaluate(allEnded), true);
    await navigate(); await capture();
    const oldCount = confirmations.length, oldVoices = voices.length;
    scenario = { status: 200, body: full, delay: 1500 };
    await click("Preparar rascunho");
    await waitFor("(" + button("Registrar") + ").disabled");
    for (let attempt = 0; attempt < 50 && voices.length === oldVoices; attempt++) await sleep(20);
    assert.equal(voices.length, oldVoices + 1);
    await click("Cancelar"); await sleep(1800);
    assert.equal(confirmations.length, oldCount); assert.equal(voices.length, oldVoices + 1);
    assert.equal(await evaluate(allEnded), true);
    console.log("OK " + width + "px: gravação, parada automática, PRO, pendências, revisão, confirmação única, erros e cancelamento");
  }
  assert.deepEqual(failures, []); assert.deepEqual(exceptions, []);
  console.log("Capturas de tela: " + shots);
  console.log("Chrome com dispositivo sintético; Safari real e provedor real não foram testados por este script.");
} finally {
  socket?.close(); chrome.kill();
}
