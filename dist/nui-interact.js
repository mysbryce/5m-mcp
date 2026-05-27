#!/usr/bin/env node
"use strict";function report(payload){process.stdout.write(JSON.stringify(payload)+`
`)}function isLikelyNui(url){let u=url.toLowerCase();return!(u.startsWith("devtools://")||u.startsWith("chrome://")||u.startsWith("chrome-untrusted://")||u==="about:blank")}async function listTargets(cdpUrl){let r=await fetch(`${cdpUrl.replace(/\/$/,"")}/json`);if(!r.ok)throw new Error(`CDP /json returned ${r.status}`);return(await r.json()).filter(p=>(p.type==="page"||p.type==="iframe")&&!!p.webSocketDebuggerUrl)}var CdpClient=class{ws;nextId=1;pending=new Map;constructor(wsUrl){let WS=globalThis.WebSocket;if(!WS)throw new Error("WebSocket not available (need Node 22+).");this.ws=new WS(wsUrl),this.ws.addEventListener("message",ev=>{try{let msg=JSON.parse(typeof ev.data=="string"?ev.data:"");if(typeof msg.id!="number")return;let cb=this.pending.get(msg.id);cb&&(this.pending.delete(msg.id),cb(msg))}catch{}})}ready(timeoutMs){return new Promise((resolve,reject)=>{if(this.ws.readyState===1){resolve();return}let t=setTimeout(()=>reject(new Error("ws open timeout")),timeoutMs);this.ws.addEventListener("open",()=>{clearTimeout(t),resolve()}),this.ws.addEventListener("error",e=>{clearTimeout(t);let msg=e.message??"unknown";reject(new Error(`ws error: ${msg}`))})})}send(method,params={},timeoutMs=1e4){let id=this.nextId++;return new Promise((resolve,reject)=>{let t=setTimeout(()=>{this.pending.delete(id),reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`))},timeoutMs);this.pending.set(id,msg=>{clearTimeout(t),msg.error?reject(new Error(`${method}: ${msg.error.message}`)):resolve(msg.result)}),this.ws.send(JSON.stringify({id,method,params}))})}close(){try{this.ws.close()}catch{}}};function buildExpression(action,p){let sel=JSON.stringify(p.selector??""),val=JSON.stringify(p.value??"");switch(action){case"eval":return p.expression??"undefined";case"click":return`(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });
        el.click();
        return { found: true, tag: el.tagName };
      })()`;case"fill":return`(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        if (el.focus) el.focus();
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) desc.set.call(el, ${val}); else el.value = ${val};
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return { found: true, value: el.value };
      })()`;case"get":return`(() => {
        const el = document.querySelector(${sel});
        if (!el) return { found: false };
        const r = el.getBoundingClientRect();
        return {
          found: true,
          tag: el.tagName,
          text: (el.textContent || '').trim().slice(0, 1000),
          value: ('value' in el) ? el.value : undefined,
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          html: el.outerHTML.slice(0, 1000),
        };
      })()`;default:return"undefined"}}async function main(){var _a,_b;let action=process.argv[2]??"",cdpUrl=process.argv[3]??"http://localhost:13172",timeoutMs=Number(process.argv[4]??"15000"),targetFilter=(process.argv[5]??"").toLowerCase(),payload={};try{payload=JSON.parse(process.argv[6]??"{}")}catch{report({ok:!1,error:"invalid payload JSON"}),process.exit(2)}["eval","click","fill","get"].includes(action)||(report({ok:!1,error:`unknown action: ${action}`}),process.exit(2));let targets;try{targets=await listTargets(cdpUrl)}catch(e){report({ok:!1,error:`cannot reach CDP at ${cdpUrl}: ${e.message}`}),process.exit(3)}targets.length===0&&(report({ok:!1,error:`no targets exposed by ${cdpUrl}. Is the FiveM client running?`}),process.exit(4));let chosen;targetFilter&&(chosen=targets.find(p=>p.url.toLowerCase().includes(targetFilter))),chosen||(chosen=targets.find(p=>isLikelyNui(p.url))),chosen||(chosen=targets[0]);let client=new CdpClient(chosen.webSocketDebuggerUrl);try{await client.ready(timeoutMs);let expression=buildExpression(action,payload),res=await client.send("Runtime.evaluate",{expression,returnByValue:!0,awaitPromise:!0},timeoutMs);if(res.exceptionDetails){let msg=((_a=res.exceptionDetails.exception)==null?void 0:_a.description)??res.exceptionDetails.text??"eval error";report({ok:!1,error:msg,target:{url:chosen.url,id:chosen.id}}),client.close(),process.exit(6)}report({ok:!0,action,result:(_b=res.result)==null?void 0:_b.value,target:{url:chosen.url,title:chosen.title,id:chosen.id},candidates:targets.map(p=>({url:p.url,title:p.title,type:p.type}))})}catch(e){report({ok:!1,error:e instanceof Error?e.message:String(e)}),process.exit(5)}finally{client.close()}}main();
