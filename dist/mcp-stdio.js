#!/usr/bin/env node
"use strict";var url=process.env.AGENT_API_URL??"http://127.0.0.1:30120/agent_api/mcp",token=process.env.AGENT_API_TOKEN;token||(process.stderr.write(`[mcp-stdio] AGENT_API_TOKEN is required
`),process.exit(1));function logErr(msg){process.stderr.write(`[mcp-stdio] ${msg}
`)}async function forward(frame){if(!frame.trim())return;let parsed;try{parsed=JSON.parse(frame)}catch(e){logErr(`bad JSON frame from stdin: ${e.message}`);return}let res;try{res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","x-agent-token":token},body:JSON.stringify(parsed)})}catch(e){logErr(`fetch failed: ${e.message}`);return}if(res.status===202)return;let text=await res.text();text&&process.stdout.write(text+`
`)}var pending="";process.stdin.setEncoding("utf8");process.stdin.on("data",chunk=>{pending+=chunk;let idx;for(;(idx=pending.indexOf(`
`))>=0;){let line=pending.slice(0,idx);pending=pending.slice(idx+1),forward(line)}});process.stdin.on("end",()=>{pending.trim()&&forward(pending)});process.stdin.on("error",e=>{logErr(`stdin error: ${e.message}`),process.exit(1)});logErr(`bridge ready -> ${url}`);
