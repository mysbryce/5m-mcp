#!/usr/bin/env node
"use strict";var P=Object.defineProperty;var d=(r,e)=>P(r,"name",{value:e,configurable:!0});var g=require("node:fs"),k=require("node:path");function f(r){process.stdout.write(JSON.stringify(r)+`
`)}d(f,"report");function x(r){let e=r.toLowerCase();return!(e.startsWith("devtools://")||e.startsWith("chrome://")||e.startsWith("chrome-untrusted://")||e==="about:blank")}d(x,"isLikelyNui");async function $(r){let e=await fetch(`${r.replace(/\/$/,"")}/json`);if(!e.ok)throw new Error(`CDP /json returned ${e.status}`);return(await e.json()).filter(s=>s.type==="page"&&!!s.webSocketDebuggerUrl)}d($,"listTargets");var w=class w{ws;nextId=1;pending=new Map;constructor(e){let n=globalThis.WebSocket;if(!n)throw new Error("WebSocket not available (need Node 22+).");this.ws=new n(e),this.ws.addEventListener("message",s=>{try{let t=JSON.parse(typeof s.data=="string"?s.data:"");if(typeof t.id!="number")return;let u=this.pending.get(t.id);u&&(this.pending.delete(t.id),u(t))}catch{}})}ready(e){return new Promise((n,s)=>{if(this.ws.readyState===1){n();return}let t=setTimeout(()=>s(new Error("ws open timeout")),e);this.ws.addEventListener("open",()=>{clearTimeout(t),n()}),this.ws.addEventListener("error",u=>{clearTimeout(t);let l=u.message??"unknown";s(new Error(`ws error: ${l}`))})})}send(e,n={},s=1e4){let t=this.nextId++;return new Promise((u,l)=>{let o=setTimeout(()=>{this.pending.delete(t),l(new Error(`CDP ${e} timed out after ${s}ms`))},s);this.pending.set(t,a=>{clearTimeout(o),a.error?l(new Error(`${e}: ${a.error.message}`)):u(a.result)}),this.ws.send(JSON.stringify({id:t,method:e,params:n}))})}close(){try{this.ws.close()}catch{}}};d(w,"CdpClient");var h=w;async function E(r,e){var t;let n=`(() => {
    const sel = ${JSON.stringify(`iframe[name="${e.replaceAll('"','\\"')}"]`)};
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`;return((t=(await r.send("Runtime.evaluate",{expression:n,returnByValue:!0})).result)==null?void 0:t.value)??null}d(E,"findIframeRect");async function C(r,e){var t;let n=`(() => {
    const keep = ${JSON.stringify(e)};
    const hidden = [];
    for (const f of document.querySelectorAll('iframe')) {
      if (f.getAttribute('name') === keep) continue;
      f.dataset.agentApiPrevDisplay = f.style.display || '';
      f.style.display = 'none';
      hidden.push(f.getAttribute('name') || '');
    }
    return hidden;
  })()`;return((t=(await r.send("Runtime.evaluate",{expression:n,returnByValue:!0})).result)==null?void 0:t.value)??[]}d(C,"hideSiblingIframes");async function R(r){await r.send("Runtime.evaluate",{expression:`(() => {
    for (const f of document.querySelectorAll('iframe')) {
      if (f.dataset.agentApiPrevDisplay !== undefined) {
        f.style.display = f.dataset.agentApiPrevDisplay;
        delete f.dataset.agentApiPrevDisplay;
      }
    }
    return true;
  })()`,returnByValue:!0}).catch(()=>{})}d(R,"restoreSiblingIframes");async function D(){let r=process.argv[2],e=process.argv[3]??"http://localhost:13172",n=Number(process.argv[4]??"15000"),s=(process.argv[5]??"").toLowerCase(),t=process.argv[6]??"",u=(process.argv[7]??"isolate").toLowerCase();r||(f({ok:!1,error:"usage: screenshot-nui <outputPath> [cdpUrl] [timeoutMs] [targetFilter] [iframeName] [mode=isolate|clip|full]"}),process.exit(2));try{(0,g.mkdirSync)((0,k.dirname)(r),{recursive:!0})}catch(i){f({ok:!1,error:`mkdir failed: ${i.message}`}),process.exit(2)}let l;try{l=await $(e)}catch(i){f({ok:!1,error:`cannot reach CDP at ${e}: ${i.message}`}),process.exit(3)}l.length===0&&(f({ok:!1,error:`no page targets exposed by ${e}. Ensure the FiveM client is running.`}),process.exit(4));let o;s&&(o=l.find(i=>i.url.toLowerCase().includes(s))),o||(o=l.find(i=>x(i.url))),o||(o=l[0]);let a=new h(o.webSocketDebuggerUrl),m=[];try{await a.ready(n);let i=null,p;if(t){let c=await E(a,t);p={name:t,found:!!c,rect:c},c||(f({ok:!1,error:`iframe[name="${t}"] not found in ${o.url}. Is the resource's UI open?`,iframe:p}),a.close(),process.exit(7)),(c.width<1||c.height<1)&&(f({ok:!1,error:`iframe[name="${t}"] has zero size (${c.width}x${c.height}) \u2014 UI is likely hidden.`,iframe:p}),a.close(),process.exit(8)),u==="clip"&&(i=c),u==="isolate"&&(m=await C(a,t))}let y={format:"png",fromSurface:!0};i&&(y.clip={...i,scale:1});let b=await a.send("Page.captureScreenshot",y,n);if(!b.data)throw new Error("CDP response missing result.data");let v=Buffer.from(b.data,"base64");(0,g.writeFileSync)(r,v);let S=(0,g.statSync)(r).size??v.length;f({ok:!0,path:r,bytes:S,mode:u,target:{url:o.url,title:o.title,id:o.id},candidates:l.map(c=>({url:c.url,title:c.title})),iframe:p,hiddenSiblings:m})}catch(i){f({ok:!1,error:i instanceof Error?i.message:String(i)}),process.exit(5)}finally{m.length>0&&await R(a),a.close()}}d(D,"main");D();
