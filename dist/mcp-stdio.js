#!/usr/bin/env node
"use strict";var f=Object.defineProperty;var o=(e,t)=>f(e,"name",{value:t,configurable:!0});var d=process.env.AGENT_API_URL??"http://127.0.0.1:30120/agent_api/mcp",a=process.env.AGENT_API_TOKEN;a||(process.stderr.write(`[mcp-stdio] AGENT_API_TOKEN is required
`),process.exit(1));function n(e){process.stderr.write(`[mcp-stdio] ${e}
`)}o(n,"logErr");async function p(e){if(!e.trim())return;let t;try{t=JSON.parse(e)}catch(i){n(`bad JSON frame from stdin: ${i.message}`);return}let s;try{s=await fetch(d,{method:"POST",headers:{"Content-Type":"application/json","x-agent-token":a},body:JSON.stringify(t)})}catch(i){n(`fetch failed: ${i.message}`);return}if(s.status===202)return;let c=await s.text();c&&process.stdout.write(c+`
`)}o(p,"forward");var r="";process.stdin.setEncoding("utf8");process.stdin.on("data",e=>{r+=e;let t;for(;(t=r.indexOf(`
`))>=0;){let s=r.slice(0,t);r=r.slice(t+1),p(s)}});process.stdin.on("end",()=>{r.trim()&&p(r)});process.stdin.on("error",e=>{n(`stdin error: ${e.message}`),process.exit(1)});n(`bridge ready -> ${d}`);
