"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@overextended/ox_lib/dist/_virtual/_rolldown/runtime.js
var __defProp2, __exportAll;
var init_runtime = __esm({
  "node_modules/@overextended/ox_lib/dist/_virtual/_rolldown/runtime.js"() {
    __defProp2 = Object.defineProperty;
    __exportAll = (all, no_symbols) => {
      let target = {};
      for (var name in all) __defProp2(target, name, {
        get: all[name],
        enumerable: true
      });
      if (!no_symbols) __defProp2(target, Symbol.toStringTag, { value: "Module" });
      return target;
    };
  }
});

// node_modules/@overextended/ox_lib/dist/common/cache/index.js
var cacheEvents, cache, onCache;
var init_cache = __esm({
  "node_modules/@overextended/ox_lib/dist/common/cache/index.js"() {
    cacheEvents = {};
    cache = new Proxy({
      resource: GetCurrentResourceName(),
      game: GetGameName()
    }, { get(target, key) {
      const result = key ? target[key] : target;
      if (result !== void 0) return result;
      cacheEvents[key] = [];
      AddEventHandler(`ox_lib:cache:${key}`, (value) => {
        const oldValue = target[key];
        cacheEvents[key].forEach((cb) => cb(value, oldValue));
        target[key] = value;
      });
      target[key] = exports.ox_lib.cache(key) || false;
      return target[key];
    } });
    onCache = (key, cb) => {
      if (!cacheEvents[key]) cache[key];
      cacheEvents[key].push(cb);
    };
  }
});

// node_modules/@overextended/ox_lib/dist/client/callback/index.js
var callback_exports = {};
__export(callback_exports, {
  eventTimer: () => eventTimer,
  onServerCallback: () => onServerCallback,
  triggerServerCallback: () => triggerServerCallback
});
function eventTimer(eventName, delay) {
  if (delay && delay > 0) {
    const currentTime = GetGameTimer();
    if ((eventTimers[eventName] || 0) > currentTime) return false;
    eventTimers[eventName] = currentTime + delay;
  }
  return true;
}
function triggerServerCallback(eventName, delay, ...args) {
  if (!eventTimer(eventName, delay)) return;
  let key;
  do
    key = `${eventName}:${Math.floor(Math.random() * 100001)}`;
  while (pendingCallbacks[key]);
  emitNet(`ox_lib:validateCallback`, eventName, cache.resource, key);
  emitNet(`__ox_cb_${eventName}`, cache.resource, key, ...args);
  return new Promise((resolve3, reject) => {
    pendingCallbacks[key] = (args2) => {
      if (Array.isArray(args2) && args2[0] === "cb_invalid") reject(`callback '${eventName} does not exist`);
      resolve3(args2);
    };
    setTimeout(reject, callbackTimeout, `callback event '${key}' timed out`);
  });
}
function onServerCallback(eventName, cb) {
  exports.ox_lib.setValidCallback(eventName, true);
  onNet(`__ox_cb_${eventName}`, async (resource, key, ...args) => {
    let response;
    try {
      response = await cb(...args);
    } catch (e) {
      console.error(`an error occurred while handling callback event ${eventName}`);
      console.log(`^3${e.stack}^0`);
    }
    emitNet(`__ox_cb_${resource}`, key, response);
  });
}
var pendingCallbacks, callbackTimeout, eventTimers;
var init_callback = __esm({
  "node_modules/@overextended/ox_lib/dist/client/callback/index.js"() {
    init_cache();
    pendingCallbacks = {};
    callbackTimeout = GetConvarInt("ox:callbackTimeout", 3e5);
    onNet(`__ox_cb_${cache.resource}`, (key, ...args) => {
      if (!source) return;
      const resolve3 = pendingCallbacks[key];
      if (!resolve3) return;
      delete pendingCallbacks[key];
      resolve3(...args);
    });
    eventTimers = {};
  }
});

// node_modules/fast-printf/dist/src/boolean.js
var require_boolean = __commonJS({
  "node_modules/fast-printf/dist/src/boolean.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.boolean = void 0;
    var boolean = function(value) {
      switch (Object.prototype.toString.call(value)) {
        case "[object String]":
          return ["true", "t", "yes", "y", "on", "1"].includes(value.trim().toLowerCase());
        case "[object Number]":
          return value.valueOf() === 1;
        case "[object Boolean]":
          return value.valueOf();
        default:
          return false;
      }
    };
    exports2.boolean = boolean;
  }
});

// node_modules/fast-printf/dist/src/tokenize.js
var require_tokenize = __commonJS({
  "node_modules/fast-printf/dist/src/tokenize.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tokenize = void 0;
    var TokenRule = /(?:%(?<flag>([+0-]|-\+))?(?<width>\d+)?(?<position>\d+\$)?(?<precision>\.\d+)?(?<conversion>[%BCESb-iosux]))|(\\%)/g;
    var tokenize = (subject) => {
      let matchResult;
      const tokens = [];
      let argumentIndex = 0;
      let lastIndex = 0;
      let lastToken = null;
      while ((matchResult = TokenRule.exec(subject)) !== null) {
        if (matchResult.index > lastIndex) {
          lastToken = {
            literal: subject.slice(lastIndex, matchResult.index),
            type: "literal"
          };
          tokens.push(lastToken);
        }
        const match = matchResult[0];
        lastIndex = matchResult.index + match.length;
        if (match === "\\%" || match === "%%") {
          if (lastToken && lastToken.type === "literal") {
            lastToken.literal += "%";
          } else {
            lastToken = {
              literal: "%",
              type: "literal"
            };
            tokens.push(lastToken);
          }
        } else if (matchResult.groups) {
          lastToken = {
            conversion: matchResult.groups.conversion,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional per @gajus
            flag: matchResult.groups.flag || null,
            placeholder: match,
            position: matchResult.groups.position ? Number.parseInt(matchResult.groups.position, 10) - 1 : argumentIndex++,
            precision: matchResult.groups.precision ? Number.parseInt(matchResult.groups.precision.slice(1), 10) : null,
            type: "placeholder",
            width: matchResult.groups.width ? Number.parseInt(matchResult.groups.width, 10) : null
          };
          tokens.push(lastToken);
        }
      }
      if (lastIndex <= subject.length - 1) {
        if (lastToken && lastToken.type === "literal") {
          lastToken.literal += subject.slice(lastIndex);
        } else {
          tokens.push({
            literal: subject.slice(lastIndex),
            type: "literal"
          });
        }
      }
      return tokens;
    };
    exports2.tokenize = tokenize;
  }
});

// node_modules/fast-printf/dist/src/createPrintf.js
var require_createPrintf = __commonJS({
  "node_modules/fast-printf/dist/src/createPrintf.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createPrintf = void 0;
    var boolean_1 = require_boolean();
    var tokenize_1 = require_tokenize();
    var formatDefaultUnboundExpression = (_subject, token) => {
      return token.placeholder;
    };
    var createPrintf = (configuration) => {
      var _a;
      const padValue = (value, width, flag) => {
        if (flag === "-") {
          return value.padEnd(width, " ");
        } else if (flag === "-+") {
          return ((Number(value) >= 0 ? "+" : "") + value).padEnd(width, " ");
        } else if (flag === "+") {
          return ((Number(value) >= 0 ? "+" : "") + value).padStart(width, " ");
        } else if (flag === "0") {
          return value.padStart(width, "0");
        } else {
          return value.padStart(width, " ");
        }
      };
      const formatUnboundExpression = (_a = configuration === null || configuration === void 0 ? void 0 : configuration.formatUnboundExpression) !== null && _a !== void 0 ? _a : formatDefaultUnboundExpression;
      const cache2 = {};
      return (subject, ...boundValues) => {
        let tokens = cache2[subject];
        if (!tokens) {
          tokens = cache2[subject] = (0, tokenize_1.tokenize)(subject);
        }
        let result = "";
        for (const token of tokens) {
          if (token.type === "literal") {
            result += token.literal;
          } else {
            let boundValue = boundValues[token.position];
            if (boundValue === void 0) {
              result += formatUnboundExpression(subject, token, boundValues);
            } else if (token.conversion === "b") {
              result += (0, boolean_1.boolean)(boundValue) ? "true" : "false";
            } else if (token.conversion === "B") {
              result += (0, boolean_1.boolean)(boundValue) ? "TRUE" : "FALSE";
            } else if (token.conversion === "c") {
              result += boundValue;
            } else if (token.conversion === "C") {
              result += String(boundValue).toUpperCase();
            } else if (token.conversion === "i" || token.conversion === "d") {
              boundValue = String(Math.trunc(boundValue));
              if (token.width !== null) {
                boundValue = padValue(boundValue, token.width, token.flag);
              }
              result += boundValue;
            } else if (token.conversion === "e") {
              result += Number(boundValue).toExponential();
            } else if (token.conversion === "E") {
              result += Number(boundValue).toExponential().toUpperCase();
            } else if (token.conversion === "f") {
              if (token.precision !== null) {
                boundValue = Number(boundValue).toFixed(token.precision);
              }
              if (token.width !== null) {
                boundValue = padValue(String(boundValue), token.width, token.flag);
              }
              result += boundValue;
            } else if (token.conversion === "o") {
              result += (Number.parseInt(String(boundValue), 10) >>> 0).toString(8);
            } else if (token.conversion === "s") {
              if (token.width !== null) {
                boundValue = padValue(String(boundValue), token.width, token.flag);
              }
              result += boundValue;
            } else if (token.conversion === "S") {
              if (token.width !== null) {
                boundValue = padValue(String(boundValue), token.width, token.flag);
              }
              result += String(boundValue).toUpperCase();
            } else if (token.conversion === "u") {
              result += Number.parseInt(String(boundValue), 10) >>> 0;
            } else if (token.conversion === "x") {
              boundValue = (Number.parseInt(String(boundValue), 10) >>> 0).toString(16);
              if (token.width !== null) {
                boundValue = padValue(String(boundValue), token.width, token.flag);
              }
              result += boundValue;
            } else {
              throw new Error("Unknown format specifier.");
            }
          }
        }
        return result;
      };
    };
    exports2.createPrintf = createPrintf;
  }
});

// node_modules/fast-printf/dist/src/printf.js
var require_printf = __commonJS({
  "node_modules/fast-printf/dist/src/printf.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.printf = exports2.createPrintf = void 0;
    var createPrintf_1 = require_createPrintf();
    Object.defineProperty(exports2, "createPrintf", { enumerable: true, get: function() {
      return createPrintf_1.createPrintf;
    } });
    exports2.printf = (0, createPrintf_1.createPrintf)();
  }
});

// node_modules/@overextended/oxmysql/MySQL.js
var require_MySQL = __commonJS({
  "node_modules/@overextended/oxmysql/MySQL.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.oxmysql = void 0;
    var QueryStore = [];
    function assert(condition, message) {
      if (!condition)
        throw new TypeError(message);
    }
    var safeArgs = (query, params, cb, transaction) => {
      if (typeof query === "number") {
        query = QueryStore[query];
        assert(typeof query === "string", "First argument received invalid query store reference");
      }
      if (transaction) {
        assert(typeof query === "object", `First argument expected object, recieved ${typeof query}`);
      } else {
        assert(typeof query === "string", `First argument expected string, received ${typeof query}`);
      }
      if (params) {
        const paramType = typeof params;
        assert(paramType === "object" || paramType === "function", `Second argument expected object or function, received ${paramType}`);
        if (!cb && paramType === "function") {
          cb = params;
          params = void 0;
        }
      }
      if (cb !== void 0)
        assert(typeof cb === "function", `Third argument expected function, received ${typeof cb}`);
      return [query, params, cb];
    };
    var exp = global.exports.oxmysql;
    var currentResourceName = GetCurrentResourceName();
    function execute(method, query, params) {
      return new Promise((resolve3, reject) => {
        exp[method](query, params, (result, error) => {
          if (error)
            return reject(error);
          resolve3(result);
        }, currentResourceName, true);
      });
    }
    exports2.oxmysql = {
      store(query) {
        assert(typeof query !== "string", `Query expects a string, received ${typeof query}`);
        return QueryStore.push(query);
      },
      ready(callback) {
        setImmediate(async () => {
          while (GetResourceState("oxmysql") !== "started")
            await new Promise((resolve3) => setTimeout(resolve3, 50, null));
          callback();
        });
      },
      async query(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("query", query, params);
        return cb ? cb(result) : result;
      },
      async single(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("single", query, params);
        return cb ? cb(result) : result;
      },
      async scalar(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("scalar", query, params);
        return cb ? cb(result) : result;
      },
      async update(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("update", query, params);
        return cb ? cb(result) : result;
      },
      async insert(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("insert", query, params);
        return cb ? cb(result) : result;
      },
      async prepare(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("prepare", query, params);
        return cb ? cb(result) : result;
      },
      async rawExecute(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb);
        const result = await execute("rawExecute", query, params);
        return cb ? cb(result) : result;
      },
      async transaction(query, params, cb) {
        [query, params, cb] = safeArgs(query, params, cb, true);
        const result = await execute("transaction", query, params);
        return cb ? cb(result) : result;
      },
      isReady() {
        return exp.isReady();
      },
      async awaitConnection() {
        return await exp.awaitConnection();
      },
      async startTransaction(cb) {
        return exp.startTransaction(cb, currentResourceName);
      }
    };
  }
});

// src/server/config/convars.ts
function readString(name, fallback) {
  const v = GetConvar(name, "__missing__");
  return v === "__missing__" || v === "" ? fallback : v;
}
function readInt(name, fallback) {
  return GetConvarInt(name, fallback);
}
function readBool(name, fallback) {
  const v = GetConvar(name, fallback ? "true" : "false").toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
function readCsv(name) {
  return readString(name, "").split(",").map((s) => s.trim()).filter(Boolean);
}
function loadConvars() {
  const defaultRoot = readString("agent_api_root", "resources/[agent]");
  const extraWrite = readCsv("agent_api_allow_write_paths");
  const extraControl = readCsv("agent_api_allow_control_paths");
  return {
    rawToken: readString("agent_api_token", ""),
    readonly: readBool("agent_api_readonly", false),
    writeRoots: [defaultRoot, ...extraWrite],
    controlRoots: [defaultRoot, ...extraControl, ...extraWrite],
    consoleBufferLines: readInt("agent_api_console_buffer_lines", 2e3),
    maxFileBytes: readInt("agent_api_max_file_bytes", 2 * 1024 * 1024),
    ratePerMinute: readInt("agent_api_rate_per_minute", 120),
    testSessionTtlSeconds: readInt("agent_api_test_session_ttl_seconds", 1800),
    testMaxSubjects: readInt("agent_api_test_max_subjects", 4)
  };
}

// src/server/config/token.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var TOKEN_FILE = "dist/.agent_token";
var PLACEHOLDER = "change-me";
function resolveToken(rawConvar) {
  const resourceRoot = GetResourcePath(GetCurrentResourceName());
  const tokenPath = (0, import_node_path.join)(resourceRoot, TOKEN_FILE);
  if (rawConvar && rawConvar !== PLACEHOLDER) {
    return { token: rawConvar, generated: false };
  }
  if ((0, import_node_fs.existsSync)(tokenPath)) {
    const persisted = (0, import_node_fs.readFileSync)(tokenPath, "utf8").trim();
    if (persisted) return { token: persisted, generated: false };
  }
  const fresh = (0, import_node_crypto.randomBytes)(32).toString("hex");
  (0, import_node_fs.writeFileSync)(tokenPath, fresh + "\n", "utf8");
  try {
    (0, import_node_fs.chmodSync)(tokenPath, 384);
  } catch {
  }
  return { token: fresh, generated: true };
}
function logTokenBanner(token, generated) {
  const tag = `[${GetCurrentResourceName()}]`;
  if (!generated) {
    console.log(`${tag} Token loaded.`);
    return;
  }
  console.log(`${tag} No token configured. Generated new token.`);
  console.log(`${tag} Saved to: ${TOKEN_FILE}`);
  console.log(`${tag}`);
  console.log(`${tag} Add this to your Claude Code MCP config:`);
  console.log(`${tag}`);
  console.log(`${tag}   "agent_api": {`);
  console.log(`${tag}     "type": "http",`);
  console.log(`${tag}     "url": "http://127.0.0.1:30120/agent_api/mcp",`);
  console.log(`${tag}     "headers": { "x-agent-token": "${token}" }`);
  console.log(`${tag}   }`);
  console.log(`${tag}`);
  console.log(`${tag} For lifecycle tools, grant ACE permissions in server.cfg:`);
  console.log(`${tag}`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.ensure  allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.start   allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.stop    allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.restart allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.refresh allow`);
  console.log(`${tag}   add_ace resource.${GetCurrentResourceName()} command.say     allow`);
  console.log(`${tag}`);
}

// src/server/console/buffer.ts
var RingBuffer = class {
  cap;
  buf = [];
  constructor(cap) {
    this.cap = Math.max(64, cap);
  }
  push(line) {
    this.buf.push(line);
    if (this.buf.length > this.cap) {
      this.buf.splice(0, this.buf.length - this.cap);
    }
  }
  length() {
    return this.buf.length;
  }
  tail(opts) {
    let out = this.buf;
    if (opts.channel) {
      out = out.filter((l) => l.channel === opts.channel);
    }
    if (typeof opts.sinceTs === "number") {
      out = out.filter((l) => l.ts >= opts.sinceTs);
    }
    if (typeof opts.lines === "number" && opts.lines > 0) {
      out = out.slice(-opts.lines);
    }
    return out;
  }
  slice(fromIdx) {
    return this.buf.slice(fromIdx);
  }
};
function installConsoleListener(buffer) {
  RegisterConsoleListener((channel, message) => {
    buffer.push({ ts: Date.now(), channel, message });
  });
}

// src/server/util/envelope.ts
function ok(data) {
  return { ok: true, data };
}
function err(code, message, details) {
  const error = details === void 0 ? { code, message } : { code, message, details };
  return { ok: false, error };
}

// src/server/errors/codes.ts
var HTTP_STATUS = {
  UNAUTHORIZED: 401,
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  TOOL_NOT_FOUND: 404,
  RESOURCE_NOT_FOUND: 404,
  PATH_OUTSIDE_SANDBOX: 403,
  PATH_BLOCKED: 403,
  EXTENSION_NOT_ALLOWED: 403,
  FILE_TOO_LARGE: 413,
  COMMAND_NOT_ALLOWED: 403,
  RESOURCE_FAILED_TO_START: 500,
  PLAYER_NOT_FOUND: 404,
  PLAYER_NOT_OPTED_IN: 403,
  SUBJECT_LIMIT_REACHED: 429,
  CLIENT_PROBE_TIMEOUT: 504,
  BODY_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  TIMEOUT: 504,
  INTERNAL: 500
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params;
  const fullPath = [...path2, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message == null ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path2, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path2;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: (params == null ? void 0 : params.async) ?? false,
        contextualErrorMap: params == null ? void 0 : params.errorMap
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    var _a, _b;
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err2) {
        if ((_b = (_a = err2 == null ? void 0 : err2.message) == null ? void 0 : _a.toLowerCase()) == null ? void 0 : _b.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params == null ? void 0 : params.errorMap,
        async: true
      },
      path: (params == null ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && (decoded == null ? void 0 : decoded.typ) !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      offset: (options == null ? void 0 : options.offset) ?? false,
      local: (options == null ? void 0 : options.local) ?? false,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options == null ? void 0 : options.precision) === "undefined" ? null : options == null ? void 0 : options.precision,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options == null ? void 0 : options.position,
      ...errorUtil.errToObj(options == null ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (params == null ? void 0 : params.coerce) ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params == null ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params == null ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b;
          const defaultError = ((_b = (_a = this._def).errorMap) == null ? void 0 : _b.call(_a, issue, ctx).message) ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: void 0,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};

// node_modules/zod-to-json-schema/dist/esm/Refs.js
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== void 0 ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: void 0,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        // Resolution of references will be forced even though seen, so it's ok that the schema is undefined here for now.
        jsonSchema: void 0
      }
    ]))
  };
};

// node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  if (!(refs == null ? void 0 : refs.errorMessages))
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}

// node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};

// node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function parseArrayDef(def, refs) {
  var _a, _b, _c;
  const res = {
    type: "array"
  };
  if (((_a = def.type) == null ? void 0 : _a._def) && ((_c = (_b = def.type) == null ? void 0 : _b._def) == null ? void 0 : _c.typeName) !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check of def.checks) {
    switch (check.kind) {
      case "min":
        setResponseValueAndErrors(
          res,
          "minimum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
      case "max":
        setResponseValueAndErrors(
          res,
          "maximum",
          check.value,
          // This is in milliseconds
          check.message,
          refs
        );
        break;
    }
  }
  return res;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : void 0;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === void 0) {
        unevaluatedProperties = void 0;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = void 0;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : void 0;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function parseLiteralDef(def, refs) {
  const parsedType = typeof def.value;
  if (parsedType !== "bigint" && parsedType !== "number" && parsedType !== "boolean" && parsedType !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType === "bigint" ? "integer" : parsedType,
      enum: [def.value]
    };
  }
  return {
    type: parsedType === "bigint" ? "integer" : parsedType,
    const: def.value
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var emojiRegex2 = void 0;
var zodPatterns = {
  /**
   * `c` was changed to `[cC]` to replicate /i flag
   */
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  /**
   * `a-z` was added to replicate /i flag
   */
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  /**
   * Constructed a valid Unicode RegExp
   *
   * Lazily instantiate since this type of regex isn't supported
   * in all envs (e.g. React Native).
   *
   * See:
   * https://github.com/colinhacks/zod/issues/2433
   * Fix in Zod:
   * https://github.com/colinhacks/zod/commit/9340fd51e48576a75adc919bff65dbc4a5d4c99b
   */
  emoji: () => {
    if (emojiRegex2 === void 0) {
      emojiRegex2 = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex2;
  },
  /**
   * Unused
   */
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  /**
   * Unused
   */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  /**
   * Unused
   */
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check of def.checks) {
      switch (check.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check.message, refs);
          break;
        case "regex":
          addPattern(res, check.regex, check.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check.value, refs)}`), check.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check.value, refs)}$`), check.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check.message, refs);
          break;
        case "date":
          addFormat(res, "date", check.message, refs);
          break;
        case "time":
          addFormat(res, "time", check.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check.value) : check.value, check.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check.value) : check.value, check.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check.value, refs)), check.message, refs);
          break;
        }
        case "ip": {
          if (check.version !== "v6") {
            addFormat(res, "ipv4", check.message, refs);
          }
          if (check.version !== "v4") {
            addFormat(res, "ipv6", check.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check.message, refs);
          break;
        case "cidr": {
          if (check.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check.message, refs);
          }
          if (check.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          /* @__PURE__ */ ((_) => {
          })(check);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal) : literal;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source2) {
  let result = "";
  for (let i = 0; i < source2.length; i++) {
    if (!ALPHA_NUMERIC.has(source2[i])) {
      result += "\\";
    }
    result += source2[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  var _a;
  if (schema.format || ((_a = schema.anyOf) == null ? void 0 : _a.some((x) => x.format))) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  var _a;
  if (schema.pattern || ((_a = schema.allOf) == null ? void 0 : _a.some((x) => x.pattern))) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  var _a;
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
    // `.` matches newlines
  };
  const source2 = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0; i < source2.length; i++) {
    if (isEscaped) {
      pattern += source2[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source2[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source2[i];
            pattern += `${source2[i - 2]}-${source2[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source2[i + 1] === "-" && ((_a = source2[i + 2]) == null ? void 0 : _a.match(/[a-z]/))) {
            pattern += source2[i];
            inCharRange = true;
          } else {
            pattern += `${source2[i]}${source2[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source2[i].match(/[a-z]/)) {
        pattern += `[${source2[i]}${source2[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source2[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source2[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source2[i] === ".") {
      pattern += inCharGroup ? `${source2[i]}\r
` : `[${source2[i]}\r
]`;
      continue;
    }
    pattern += source2[i];
    if (source2[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source2[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source2[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex.source;
  }
  return pattern;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  var _a, _b, _c, _d, _e, _f;
  if (refs.target === "openAi") {
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  }
  if (refs.target === "openApi3" && ((_a = def.keyType) == null ? void 0 : _a._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (((_b = def.keyType) == null ? void 0 : _b._def.typeName) === ZodFirstPartyTypeKind.ZodString && ((_c = def.keyType._def.checks) == null ? void 0 : _c.length)) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (((_d = def.keyType) == null ? void 0 : _d._def.typeName) === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (((_e = def.keyType) == null ? void 0 : _e._def.typeName) === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && ((_f = def.keyType._def.type._def.checks) == null ? void 0 : _f.length)) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  const object = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object[object[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? void 0 : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => x._def.typeName in primitiveMappings && (!x._def.checks || !x._def.checks.length))) {
    const types = options.reduce((types2, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types2.includes(type) ? [...types2, type] : types2;
    }, []);
    return {
      type: types.length > 1 ? types : types[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types.length === options.length) {
      const uniqueTypes = types.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : void 0;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check of def.checks) {
    switch (check.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check.value, check.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check.inclusive) {
            setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check.value, check.message, refs);
          }
        } else {
          if (!check.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check.value, check.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check.value, check.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === void 0 || propDef._def === void 0) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === void 0) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required.push(propName);
    }
  }
  if (required.length) {
    result.required = required;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== void 0) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  var _a;
  if (refs.currentPath.toString() === ((_a = refs.propertyPath) == null ? void 0 : _a.toString())) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== void 0)
  };
};

// node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === void 0 ? acc : [...acc, x], [])
    };
  }
}

// node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return void 0;
    default:
      return /* @__PURE__ */ ((_) => void 0)(typeName);
  }
};

// node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  var _a;
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = (_a = refs.override) == null ? void 0 : _a.call(refs, def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== void 0) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: void 0 };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema) {
    addMeta(def, refs, jsonSchema);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : void 0;
    }
  }
};
var addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description;
    }
  }
  return jsonSchema;
};

// node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, true) ?? parseAnyDef(refs)
  }), {}) : void 0;
  const name = typeof options === "string" ? options : (options == null ? void 0 : options.nameStrategy) === "title" ? void 0 : options == null ? void 0 : options.name;
  const main2 = parseDef(schema._def, name === void 0 ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== void 0 && options.nameStrategy === "title" ? options.name : void 0;
  if (title !== void 0) {
    main2.title = title;
  }
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        // Skipping "object" as no properties can be defined and additionalProperties must be "false"
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name === void 0 ? definitions ? {
    ...main2,
    [refs.definitionPath]: definitions
  } : main2 : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main2
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && ("anyOf" in combined || "oneOf" in combined || "allOf" in combined || "type" in combined && Array.isArray(combined.type))) {
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  }
  return combined;
};

// src/server/tools/registry.ts
var tools = /* @__PURE__ */ new Map();
function register(tool) {
  tools.set(tool.name, tool);
}
function listTools() {
  return [...tools.values()];
}
function listToolDescriptors() {
  return listTools().map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.input, {
      target: "jsonSchema7",
      $refStrategy: "none"
    })
  }));
}
async function dispatch(name, rawInput, ctx) {
  const tool = tools.get(name);
  if (!tool) {
    return err("TOOL_NOT_FOUND", `Unknown tool: ${name}`);
  }
  const parsed = tool.input.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return err("INVALID_INPUT", "Input validation failed.", {
      issues: parsed.error.issues
    });
  }
  try {
    return await tool.handler(parsed.data, ctx);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err("INTERNAL", message);
  }
}

// src/server/audit/log.ts
var import_node_fs2 = require("node:fs");
var import_node_crypto2 = require("node:crypto");
var import_node_path2 = require("node:path");
var AUDIT_FILE = "dist/audit.log";
var resolvedPath = null;
function path() {
  if (resolvedPath) return resolvedPath;
  const root = GetResourcePath(GetCurrentResourceName());
  resolvedPath = (0, import_node_path2.join)(root, AUDIT_FILE);
  (0, import_node_fs2.mkdirSync)((0, import_node_path2.dirname)(resolvedPath), { recursive: true });
  return resolvedPath;
}
function hashToken(token) {
  return (0, import_node_crypto2.createHash)("sha256").update(token).digest("hex").slice(0, 12);
}
function audit(entry) {
  const line = JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), ...entry }) + "\n";
  try {
    (0, import_node_fs2.appendFileSync)(path(), line, "utf8");
  } catch (e) {
    console.error(`[${GetCurrentResourceName()}] audit write failed:`, e);
  }
}

// src/server/mcp/jsonrpc.ts
var RpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
};
function rpcSuccess(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id, code, message, data) {
  return {
    jsonrpc: "2.0",
    id,
    error: data === void 0 ? { code, message } : { code, message, data }
  };
}
function isJsonRpcRequest(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return v.jsonrpc === "2.0" && typeof v.method === "string";
}

// src/server/mcp/prompts.ts
var prompts = /* @__PURE__ */ new Map();
function registerPrompt(p) {
  prompts.set(p.name, p);
}
function getPrompt(name) {
  return prompts.get(name);
}
function listPrompts() {
  return [...prompts.values()].map((p) => ({
    name: p.name,
    description: p.description,
    ...p.arguments ? { arguments: p.arguments } : {}
  }));
}

// src/server/mcp/server.ts
var PROTOCOL_VERSION = "2024-11-05";
var SERVER_INFO = { name: "agent_api", version: "0.0.1" };
function isToolCallParams(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return typeof v.name === "string";
}
function isPromptGetParams(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return typeof v.name === "string";
}
async function handleMcpRequest(req, ctx) {
  const id = req.id ?? null;
  if (req.id === void 0 || req.id === null) {
    if (req.method === "notifications/initialized") return null;
    if (req.method === "notifications/cancelled") return null;
    return null;
  }
  switch (req.method) {
    case "initialize":
      return rpcSuccess(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          prompts: { listChanged: false }
        },
        serverInfo: SERVER_INFO
      });
    case "ping":
      return rpcSuccess(id, {});
    case "tools/list":
      return rpcSuccess(id, { tools: listToolDescriptors() });
    case "tools/call": {
      if (!isToolCallParams(req.params)) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, "Missing tool name.");
      }
      const envelope = await dispatch(req.params.name, req.params.arguments ?? {}, ctx);
      return rpcSuccess(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(envelope.ok ? envelope.data : envelope.error)
          }
        ],
        isError: !envelope.ok
      });
    }
    case "prompts/list":
      return rpcSuccess(id, { prompts: listPrompts() });
    case "prompts/get": {
      if (!isPromptGetParams(req.params)) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, "Missing prompt name.");
      }
      const prompt = getPrompt(req.params.name);
      if (!prompt) {
        return rpcError(id, RpcErrorCode.INVALID_PARAMS, `Unknown prompt: ${req.params.name}`);
      }
      return rpcSuccess(id, {
        description: prompt.description,
        messages: prompt.build(req.params.arguments ?? {})
      });
    }
    default:
      return rpcError(id, RpcErrorCode.METHOD_NOT_FOUND, `Unknown method: ${req.method}`);
  }
}

// src/server/runtime/rateLimit.ts
var TokenBucket = class {
  buckets = /* @__PURE__ */ new Map();
  capacity;
  refillPerMs;
  constructor(perMinute) {
    this.capacity = Math.max(1, perMinute);
    this.refillPerMs = this.capacity / 6e4;
  }
  consume(key, cost = 1) {
    const now2 = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now2 };
      this.buckets.set(key, bucket);
    } else {
      const elapsed = now2 - bucket.lastRefill;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillPerMs);
      bucket.lastRefill = now2;
    }
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterMs: 0 };
    }
    const deficit = cost - bucket.tokens;
    return { ok: false, remaining: 0, retryAfterMs: Math.ceil(deficit / this.refillPerMs) };
  }
};

// src/server/http/router.ts
var MAX_BODY_BYTES = 5 * 1024 * 1024;
var JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};
function readBody(req) {
  return new Promise((resolve3) => {
    if (req.method === "GET" || req.method === "HEAD") {
      resolve3("");
      return;
    }
    try {
      req.setDataHandler((data) => resolve3(data ?? ""));
    } catch {
      resolve3("");
    }
  });
}
function reply(res, status, body) {
  res.writeHead(status, JSON_HEADERS);
  res.send(JSON.stringify(body));
}
function statusFor(envelope) {
  if (envelope.ok) return 200;
  return HTTP_STATUS[envelope.error.code] ?? 500;
}
function lowercaseHeaders(h) {
  const out = {};
  for (const [k, v] of Object.entries(h ?? {})) out[k.toLowerCase()] = v;
  return out;
}
function installHttpRouter(deps) {
  const bucket = new TokenBucket(deps.ctx.convars.ratePerMinute);
  function checkRate(token) {
    const r = bucket.consume(hashToken(token));
    return r.ok ? { ok: true } : { ok: false, retryAfterMs: r.retryAfterMs };
  }
  SetHttpHandler(async (req, res) => {
    try {
      const headers = lowercaseHeaders(req.headers);
      const path2 = (req.path ?? "/").split("?")[0] ?? "/";
      if (req.method === "GET" && path2 === "/health") {
        reply(res, 200, ok({ status: "up", resource: GetCurrentResourceName() }));
        return;
      }
      if (path2 === "/mcp") {
        if (req.method !== "POST") {
          reply(res, 405, err("NOT_FOUND", "MCP endpoint requires POST."));
          return;
        }
        const supplied2 = headers["x-agent-token"];
        if (supplied2 !== deps.token) {
          reply(res, 401, err("UNAUTHORIZED", "Invalid or missing token."));
          return;
        }
        const rate2 = checkRate(supplied2);
        if (!rate2.ok) {
          reply(
            res,
            429,
            err("RATE_LIMITED", "Too many requests.", { retryAfterMs: rate2.retryAfterMs })
          );
          return;
        }
        const body2 = await readBody(req);
        if (body2.length > MAX_BODY_BYTES) {
          reply(res, 413, err("BODY_TOO_LARGE", `Body exceeds ${MAX_BODY_BYTES} bytes.`));
          return;
        }
        let parsedBody2;
        try {
          parsedBody2 = JSON.parse(body2 || "null");
        } catch {
          reply(res, 400, rpcError(null, RpcErrorCode.PARSE_ERROR, "Body is not valid JSON."));
          return;
        }
        if (!isJsonRpcRequest(parsedBody2)) {
          reply(
            res,
            400,
            rpcError(null, RpcErrorCode.INVALID_REQUEST, "Not a JSON-RPC 2.0 request.")
          );
          return;
        }
        const rpcResp = await handleMcpRequest(parsedBody2, deps.ctx);
        audit({
          tool: `mcp:${parsedBody2.method}`,
          params: parsedBody2.method === "tools/call" ? parsedBody2.params ?? null : { method: parsedBody2.method },
          result_code: rpcResp && "error" in rpcResp ? `RPC_${rpcResp.error.code}` : "OK",
          caller: hashToken(supplied2 ?? "")
        });
        if (rpcResp === null) {
          res.writeHead(202, JSON_HEADERS);
          res.send("");
          return;
        }
        reply(res, 200, rpcResp);
        return;
      }
      if (req.method === "GET" && path2 === "/tools") {
        const supplied2 = headers["x-agent-token"];
        if (supplied2 !== deps.token) {
          reply(res, 401, err("UNAUTHORIZED", "Invalid or missing token."));
          return;
        }
        reply(
          res,
          200,
          ok({
            tools: listTools().map((t) => ({
              name: t.name,
              description: t.description
            }))
          })
        );
        return;
      }
      const toolMatch = path2.match(/^\/tools\/([a-z_][a-z0-9_]*)$/i);
      if (!toolMatch || req.method !== "POST") {
        reply(res, 404, err("NOT_FOUND", `No route for ${req.method} ${path2}`));
        return;
      }
      const supplied = headers["x-agent-token"];
      if (supplied !== deps.token) {
        reply(res, 401, err("UNAUTHORIZED", "Invalid or missing token."));
        return;
      }
      const rate = checkRate(supplied);
      if (!rate.ok) {
        reply(
          res,
          429,
          err("RATE_LIMITED", "Too many requests.", { retryAfterMs: rate.retryAfterMs })
        );
        return;
      }
      const body = await readBody(req);
      if (body.length > MAX_BODY_BYTES) {
        reply(res, 413, err("BODY_TOO_LARGE", `Body exceeds ${MAX_BODY_BYTES} bytes.`));
        return;
      }
      let parsedBody = {};
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          reply(res, 400, err("INVALID_INPUT", "Body is not valid JSON."));
          return;
        }
      }
      const toolName = toolMatch[1];
      const envelope = await dispatch(toolName, parsedBody, deps.ctx);
      audit({
        tool: toolName,
        params: parsedBody,
        result_code: envelope.ok ? "OK" : envelope.error.code,
        caller: hashToken(supplied ?? "")
      });
      reply(res, statusFor(envelope), envelope);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[${GetCurrentResourceName()}] router error:`, message);
      reply(res, 500, err("INTERNAL", message));
    }
  });
}

// src/server/fs/create.ts
var import_node_fs3 = require("node:fs");
var import_node_path4 = require("node:path");

// src/server/fs/sandbox.ts
var import_node_path3 = require("node:path");

// src/server/runtime/resources.ts
function listResources() {
  const count = GetNumResources();
  const out = [];
  for (let i = 0; i < count; i++) {
    const name = GetResourceByFindIndex(i);
    if (!name) continue;
    out.push({
      name,
      state: GetResourceState(name),
      path: GetResourcePath(name)
    });
  }
  return out;
}
function getResourceInfo(name) {
  const state = GetResourceState(name);
  if (!state || state === "missing") return null;
  return { name, state, path: GetResourcePath(name) };
}

// src/server/fs/sandbox.ts
var DEFAULT_WRITE_EXTENSIONS = /* @__PURE__ */ new Set([
  // FiveM runtime
  ".lua",
  ".cfg",
  // JS / TS family
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  // Web frameworks
  ".vue",
  ".svelte",
  ".astro",
  // Styles
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".styl",
  ".postcss",
  // Markup / docs
  ".html",
  ".htm",
  ".md",
  ".txt",
  // Data / config
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".csv",
  ".env",
  ".example",
  // Tool dotfiles (filename "foo.gitignore" style)
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
  ".npmrc",
  ".nvmrc",
  ".prettierrc",
  ".eslintrc",
  ".eslintignore",
  ".prettierignore",
  // Vector assets (text)
  ".svg"
]);
function readExtraExtensions() {
  const raw = GetConvar("agent_api_extra_write_extensions", "");
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).map((s) => s.startsWith(".") ? s : "." + s)
  );
}
function writeExtensions() {
  const out = new Set(DEFAULT_WRITE_EXTENSIONS);
  for (const e of readExtraExtensions()) out.add(e);
  return out;
}
function normalizeSlashes(p) {
  return p.replaceAll("\\", "/").replaceAll(/\/{2,}/g, "/");
}
function lowerNorm(p) {
  return normalizeSlashes(p).toLowerCase();
}
var BLOCKED_SEGMENTS = /* @__PURE__ */ new Set([".env", "txdata", "database", "cache"]);
var ALLOWED_EXTENSIONS = /* @__PURE__ */ new Set([
  ".lua",
  ".js",
  ".ts",
  ".json",
  ".cfg",
  ".md",
  ".html",
  ".css",
  ".txt"
]);
function lowerExt(p) {
  const i = p.lastIndexOf(".");
  return i < 0 ? "" : p.slice(i).toLowerCase();
}
function hasBlockedSegment(absPath, resourceRoot) {
  const lowerAbs = absPath.toLowerCase();
  const lowerRoot = resourceRoot.toLowerCase();
  const inside = lowerAbs.startsWith(lowerRoot) ? lowerAbs.slice(lowerRoot.length) : lowerAbs;
  const segs = inside.split(/[\\/]+/).filter(Boolean);
  return segs.some((s) => BLOCKED_SEGMENTS.has(s));
}
function resolveResourcePath(resourceName, relative) {
  if (!relative || relative.startsWith("/") || relative.startsWith("\\")) {
    return err("PATH_OUTSIDE_SANDBOX", "Path must be relative.");
  }
  if (/^[a-zA-Z]:[\\/]/.test(relative)) {
    return err("PATH_OUTSIDE_SANDBOX", "Absolute paths are rejected.");
  }
  const info = getResourceInfo(resourceName);
  if (!info) {
    return err("RESOURCE_NOT_FOUND", `Resource not found: ${resourceName}`);
  }
  const root = (0, import_node_path3.resolve)(info.path);
  const abs = (0, import_node_path3.resolve)(root, relative);
  const rootWithSep = root.endsWith(import_node_path3.sep) ? root : root + import_node_path3.sep;
  if (!abs.startsWith(rootWithSep) && abs !== root) {
    return err("PATH_OUTSIDE_SANDBOX", "Path escapes resource root.", {
      resource: resourceName,
      relative
    });
  }
  if (hasBlockedSegment(abs, root)) {
    return err("PATH_BLOCKED", "Path contains a blocked segment.", {
      blocked: [...BLOCKED_SEGMENTS]
    });
  }
  return ok({
    resource: resourceName,
    resourceRoot: root,
    absPath: abs,
    relPath: relative
  });
}
function checkReadExtension(absPath) {
  const ext = lowerExt(absPath);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return err("EXTENSION_NOT_ALLOWED", `Extension not allowed: ${ext}`, {
      allowed: [...ALLOWED_EXTENSIONS]
    });
  }
  return ok(true);
}
function checkWriteExtension(absPath) {
  const ext = lowerExt(absPath);
  const allowed = writeExtensions();
  if (!allowed.has(ext)) {
    return err("EXTENSION_NOT_ALLOWED", `Write extension not allowed: ${ext}`, {
      allowed: [...allowed]
    });
  }
  return ok(true);
}
function pathWithinAnyRoot(absPath, roots) {
  const target = lowerNorm(absPath);
  return roots.some((root) => {
    const r = lowerNorm(root);
    if (!r) return false;
    return target.includes(`/${r}/`);
  });
}
function checkWriteRoot(resourceAbsPath, writeRoots) {
  if (!pathWithinAnyRoot(resourceAbsPath, writeRoots)) {
    return err("PATH_OUTSIDE_SANDBOX", "Resource is not within any configured write root.", {
      writeRoots
    });
  }
  return ok(true);
}
function deriveWriteRootAbsolute(writeRoot) {
  const ourPath = (0, import_node_path3.resolve)(GetResourcePath(GetCurrentResourceName()));
  const lowerOur = lowerNorm(ourPath);
  const lowerRoot = lowerNorm(writeRoot);
  const needle = `/${lowerRoot}/`;
  const idx = lowerOur.indexOf(needle);
  if (idx < 0) return null;
  return normalizeSlashes(ourPath).slice(0, idx + 1 + writeRoot.length);
}
var VALID_RESOURCE_NAME = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

// src/server/fs/create.ts
var CreateResourceInput = external_exports.object({
  name: external_exports.string().min(1),
  writeRoot: external_exports.string().optional(),
  description: external_exports.string().optional(),
  author: external_exports.string().optional()
});
var MANIFEST_TEMPLATE = (name, author, description) => `fx_version 'cerulean'
game 'common'

author '${author}'
description '${description}'
version '0.1.0'

server_scripts {
  'server.lua',
}
`;
var SERVER_LUA = (name) => `print('^2[${name}]^7 up')
`;
var README_MD = (name) => `# ${name}

Scaffolded by agent_api.
`;
async function createResource(input, ctx) {
  if (ctx.readonly) {
    return err("COMMAND_NOT_ALLOWED", "Server is in read-only mode.");
  }
  if (!VALID_RESOURCE_NAME.test(input.name)) {
    return err("INVALID_INPUT", "Resource name must be [a-zA-Z][a-zA-Z0-9_-]{0,63}.", {
      name: input.name
    });
  }
  const writeRoot = input.writeRoot ?? ctx.writeRoots[0];
  if (!writeRoot) {
    return err("PATH_OUTSIDE_SANDBOX", "No write root configured.");
  }
  if (!ctx.writeRoots.includes(writeRoot)) {
    return err("PATH_OUTSIDE_SANDBOX", `writeRoot must be one of: ${ctx.writeRoots.join(", ")}`);
  }
  const rootAbs = deriveWriteRootAbsolute(writeRoot);
  if (!rootAbs) {
    return err(
      "PATH_OUTSIDE_SANDBOX",
      `Cannot resolve write root to absolute path: ${writeRoot}. agent_api must itself live inside this root.`
    );
  }
  const resourceAbs = (0, import_node_path4.join)(rootAbs, input.name);
  try {
    await import_node_fs3.promises.stat(resourceAbs);
    return err("INVALID_INPUT", `Resource folder already exists: ${input.name}`);
  } catch {
  }
  const author = input.author ?? "agent";
  const description = input.description ?? "Generated resource";
  await import_node_fs3.promises.mkdir(resourceAbs, { recursive: true });
  const files = [
    ["fxmanifest.lua", MANIFEST_TEMPLATE(input.name, author, description)],
    ["server.lua", SERVER_LUA(input.name)],
    ["README.md", README_MD(input.name)]
  ];
  await Promise.all(
    files.map(([name, content]) => import_node_fs3.promises.writeFile((0, import_node_path4.join)(resourceAbs, name), content, "utf8"))
  );
  return ok({
    name: input.name,
    absPath: resourceAbs,
    files: files.map(([n]) => n)
  });
}

// src/server/runtime/locks.ts
var chains = /* @__PURE__ */ new Map();
var GLOBAL_LOCK = "__global__";
async function withLock(key, fn) {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(
    () => fn(),
    () => fn()
  );
  const safe = next.catch(() => void 0);
  chains.set(key, safe);
  try {
    return await next;
  } finally {
    if (chains.get(key) === safe) {
      chains.delete(key);
    }
  }
}

// src/server/tools/createResource.ts
function registerCreateResource() {
  register({
    name: "create_resource",
    description: "Scaffold a new FiveM resource (fxmanifest.lua, server.lua, README.md) inside one of the configured write roots. Does not auto-refresh; call refresh_resources separately.",
    input: CreateResourceInput,
    handler: async (input, ctx) => {
      const key = input.name || GLOBAL_LOCK;
      return withLock(
        key,
        () => createResource(input, {
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly
        })
      );
    }
  });
}

// src/server/tools/getResourceState.ts
function registerGetResourceState() {
  register({
    name: "get_resource_state",
    description: "Look up the lifecycle state and path of a single resource.",
    input: external_exports.object({ name: external_exports.string().min(1) }).strict(),
    handler: async (input) => {
      const info = getResourceInfo(input.name);
      if (!info) {
        return err("RESOURCE_NOT_FOUND", `Resource not found: ${input.name}`);
      }
      return ok(info);
    }
  });
}

// src/server/tools/health.ts
function registerHealth(version) {
  register({
    name: "health",
    description: "Liveness probe. Returns version and uptime.",
    input: external_exports.object({}).strict(),
    handler: async () => ok({
      status: "up",
      resource: GetCurrentResourceName(),
      version,
      uptimeMs: Math.floor(process.uptime() * 1e3)
    })
  });
}

// src/server/runtime/capture.ts
var POLL_INTERVAL_MS = 50;
var sleep = (ms) => new Promise((res) => setTimeout(res, ms));
async function waitUntil(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await sleep(POLL_INTERVAL_MS);
  }
  return predicate();
}
async function captureAround(buffer, fn, opts) {
  const startIdx = buffer.length();
  const result = await fn();
  let reachedExpectedState = null;
  if ("waitForState" in opts) {
    reachedExpectedState = await waitUntil(
      () => GetResourceState(opts.waitForState.name) === opts.waitForState.expect,
      opts.timeoutMs ?? 3e3
    );
  } else {
    await sleep(opts.delayMs);
  }
  return {
    result,
    lines: buffer.slice(startIdx),
    reachedExpectedState
  };
}

// src/server/runtime/command.ts
var RESOURCE_VERBS = /* @__PURE__ */ new Set(["ensure", "start", "stop", "restart"]);
var SAFE_NO_ARG = /* @__PURE__ */ new Set(["refresh", "players"]);
var SAFE_TEXT_ARG = /* @__PURE__ */ new Set(["say"]);
var BANNED = /* @__PURE__ */ new Set([
  "quit",
  "exec",
  "set",
  "sets",
  "setr",
  "add_ace",
  "add_principal",
  "remove_ace",
  "remove_principal",
  "rcon_password",
  "endpoint_add_tcp",
  "endpoint_add_udp"
]);
function parseAllowedCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return err("INVALID_INPUT", "Empty command.");
  }
  const [verbRaw, ...rest] = trimmed.split(/\s+/);
  const verb = (verbRaw ?? "").toLowerCase();
  if (BANNED.has(verb)) {
    return err("COMMAND_NOT_ALLOWED", `Banned command: ${verb}`);
  }
  if (SAFE_NO_ARG.has(verb)) {
    if (rest.length > 0) {
      return err("INVALID_INPUT", `Command ${verb} takes no arguments.`);
    }
    return ok({ kind: "no_arg", verb });
  }
  if (RESOURCE_VERBS.has(verb)) {
    if (rest.length !== 1) {
      return err("INVALID_INPUT", `Command ${verb} requires exactly one resource name.`);
    }
    const resource = rest[0];
    if (!VALID_RESOURCE_NAME.test(resource)) {
      return err("INVALID_INPUT", `Invalid resource name: ${resource}`);
    }
    return ok({ kind: "resource", verb, resource });
  }
  if (SAFE_TEXT_ARG.has(verb)) {
    const text = rest.join(" ");
    if (!text) {
      return err("INVALID_INPUT", `Command ${verb} requires a message.`);
    }
    return ok({ kind: "text", verb, text });
  }
  return err("COMMAND_NOT_ALLOWED", `Command not in allowlist: ${verb}`);
}
function runConsole(command) {
  ExecuteCommand(command);
}

// src/server/runtime/lifecycle.ts
var EXPECTED_STATE = {
  ensure: "started",
  start: "started",
  stop: "stopped",
  restart: "started"
};
async function runLifecycle(verb, resource, ctx) {
  if (resource === GetCurrentResourceName()) {
    return err(
      "COMMAND_NOT_ALLOWED",
      "Refusing to run lifecycle command against the agent_api resource itself. Self-restart while serving an HTTP request can crash the FiveM Mono runtime. Use the FiveM server console (`restart agent_api`) instead.",
      { resource, verb }
    );
  }
  const info = getResourceInfo(resource);
  if (!info) {
    return err("RESOURCE_NOT_FOUND", `Resource not found: ${resource}`);
  }
  if (!pathWithinAnyRoot(info.path, ctx.controlRoots)) {
    return err("COMMAND_NOT_ALLOWED", "Resource is not within any configured control root.", {
      resource,
      controlRoots: ctx.controlRoots
    });
  }
  const expected = EXPECTED_STATE[verb];
  const stateBefore = info.state;
  const capture = await captureAround(ctx.console, () => runConsole(`${verb} ${resource}`), {
    waitForState: { name: resource, expect: expected },
    timeoutMs: ctx.timeoutMs ?? 3e3
  });
  const stateAfter = GetResourceState(resource);
  const reached = capture.reachedExpectedState ?? false;
  const data = {
    resource,
    verb,
    stateBefore,
    stateAfter,
    expectedState: expected,
    reachedExpectedState: reached,
    lines: capture.lines
  };
  if (!reached) {
    return err("RESOURCE_FAILED_TO_START", `${verb} ${resource} did not reach state ${expected}.`, {
      ...data
    });
  }
  return ok(data);
}

// src/server/tools/lifecycle.ts
var Input = external_exports.object({
  name: external_exports.string().min(1),
  timeoutMs: external_exports.number().int().min(100).max(3e4).optional()
}).strict();
function registerLifecycle(toolName, verb, description) {
  register({
    name: toolName,
    description,
    input: Input,
    handler: async (input, ctx) => withLock(
      input.name,
      () => runLifecycle(verb, input.name, {
        console: ctx.console,
        controlRoots: ctx.convars.controlRoots,
        ...input.timeoutMs !== void 0 ? { timeoutMs: input.timeoutMs } : {}
      })
    )
  });
}
function registerEnsureResource() {
  registerLifecycle(
    "ensure_resource",
    "ensure",
    "Run the FiveM `ensure` command for a resource and wait until it reaches state `started`. Returns state-before/after and console lines captured during the wait."
  );
}
function registerStartResource() {
  registerLifecycle(
    "start_resource",
    "start",
    "Start a stopped resource and wait until state == `started`."
  );
}
function registerStopResource() {
  registerLifecycle(
    "stop_resource",
    "stop",
    "Stop a started resource and wait until state == `stopped`."
  );
}
function registerRestartResource() {
  registerLifecycle(
    "restart_resource",
    "restart",
    "Restart a resource and wait until state == `started`."
  );
}

// src/server/tools/listResources.ts
function registerListResources() {
  register({
    name: "list_resources",
    description: "Enumerate all registered FiveM resources with their state.",
    input: external_exports.object({
      filterState: external_exports.string().optional()
    }).strict(),
    handler: async (input) => {
      const all = listResources();
      const filtered = input.filterState ? all.filter((r) => r.state === input.filterState) : all;
      return ok({ resources: filtered, count: filtered.length });
    }
  });
}

// src/server/fs/read.ts
var import_node_fs4 = require("node:fs");
var ReadFileInput = external_exports.object({
  resource: external_exports.string().min(1),
  path: external_exports.string().min(1),
  offset: external_exports.number().int().min(0).optional(),
  length: external_exports.number().int().min(1).optional()
});
async function readFile(input, maxBytes) {
  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;
  const extCheck = checkReadExtension(resolved.data.absPath);
  if (!extCheck.ok) return extCheck;
  let stat;
  try {
    stat = await import_node_fs4.promises.stat(resolved.data.absPath);
  } catch {
    return err("NOT_FOUND", "File not found.", {
      resource: input.resource,
      path: input.path
    });
  }
  if (!stat.isFile()) {
    return err("NOT_FOUND", "Path is not a regular file.");
  }
  const offset = input.offset ?? 0;
  const requested = input.length;
  const remaining = Math.max(0, stat.size - offset);
  const length = requested === void 0 ? Math.min(remaining, maxBytes) : Math.min(requested, remaining, maxBytes);
  if (requested === void 0 && remaining > maxBytes) {
    return err(
      "FILE_TOO_LARGE",
      `File exceeds ${maxBytes} bytes. Use offset/length to read a window.`,
      { size: stat.size, limit: maxBytes }
    );
  }
  const handle = await import_node_fs4.promises.open(resolved.data.absPath, "r");
  try {
    const buf = Buffer.alloc(length);
    if (length > 0) {
      await handle.read(buf, 0, length, offset);
    }
    return ok({
      resource: input.resource,
      path: input.path,
      size: stat.size,
      truncated: offset + length < stat.size,
      content: buf.toString("utf8")
    });
  } finally {
    await handle.close();
  }
}

// src/server/tools/readFile.ts
function registerReadFile() {
  register({
    name: "read_file",
    description: "Read a file from any resource within the read sandbox. Use offset/length to window large files.",
    input: ReadFileInput,
    handler: async (input, ctx) => readFile(input, ctx.convars.maxFileBytes)
  });
}

// src/server/runtime/refresh.ts
async function runRefresh() {
  ExecuteCommand("refresh");
}

// src/server/tools/refreshResources.ts
var Input2 = external_exports.object({
  waitMs: external_exports.number().int().min(0).max(5e3).optional()
}).strict();
var sleep2 = (ms) => new Promise((res) => setTimeout(res, ms));
function registerRefreshResources() {
  register({
    name: "refresh_resources",
    description: "Execute the FiveM `refresh` command so newly created folders are discovered. Returns console lines captured during the wait window.",
    input: Input2,
    handler: async (input, ctx) => {
      const wait = input.waitMs ?? 750;
      return withLock(GLOBAL_LOCK, async () => {
        const startIdx = ctx.console.length();
        await runRefresh();
        if (wait > 0) await sleep2(wait);
        const lines = ctx.console.slice(startIdx);
        return ok({ lines, count: lines.length });
      });
    }
  });
}

// src/server/players/registry.ts
var sessions = /* @__PURE__ */ new Map();
function now() {
  return Date.now();
}
function readLicense(serverId) {
  const n = GetNumPlayerIdentifiers(String(serverId));
  for (let i = 0; i < n; i++) {
    const id = GetPlayerIdentifier(String(serverId), i);
    if (id && id.startsWith("license:")) return id;
  }
  return GetPlayerIdentifier(String(serverId), 0) ?? `unknown:${serverId}`;
}
function addOptIn(serverId, ttlSeconds) {
  const license = readLicense(serverId);
  const name = GetPlayerName(String(serverId)) ?? `player_${serverId}`;
  const t = now();
  const session = {
    serverId,
    license,
    name,
    optedInAt: t,
    expiresAt: t + ttlSeconds * 1e3
  };
  sessions.set(serverId, session);
  return session;
}
function removeOptIn(serverId) {
  return sessions.delete(serverId);
}
function getOptIn(serverId) {
  const s = sessions.get(serverId);
  if (!s) return null;
  if (s.expiresAt < now()) {
    sessions.delete(serverId);
    return null;
  }
  return s;
}
function listOptedIn() {
  const t = now();
  for (const [id, s] of sessions) {
    if (s.expiresAt < t) sessions.delete(id);
  }
  return [...sessions.values()];
}
function dropPlayer(serverId) {
  sessions.delete(serverId);
}

// src/server/players/subjects.ts
var subjects = /* @__PURE__ */ new Map();
function addSubject(serverId, max) {
  if (!getOptIn(serverId)) {
    return err("PLAYER_NOT_OPTED_IN", `Player ${serverId} has not opted in.`);
  }
  if (subjects.has(serverId)) return ok(true);
  if (subjects.size >= max) {
    return err("SUBJECT_LIMIT_REACHED", `Active subject pool is full (${max}).`);
  }
  subjects.set(serverId, Date.now());
  return ok(true);
}
function removeSubject(serverId) {
  return subjects.delete(serverId);
}
function isSubject(serverId) {
  return subjects.has(serverId);
}
function listSubjects() {
  for (const id of subjects.keys()) {
    if (!getOptIn(id)) subjects.delete(id);
  }
  return [...subjects.keys()];
}
function dropPlayer2(serverId) {
  subjects.delete(serverId);
}

// src/server/players/probes.ts
var import_node_crypto3 = require("node:crypto");
var pending = /* @__PURE__ */ new Map();
function installProbeListener() {
  onNet("agent_api:probe:result", (payload) => {
    if (!payload || typeof payload.probeId !== "string") return;
    const cb = pending.get(payload.probeId);
    if (cb) cb(payload);
  });
}
async function callProbe(serverId, name, args, timeoutMs) {
  return callRemote(serverId, `agent_api:probe:${name}`, [args ?? {}], timeoutMs, name);
}
async function callRemote(serverId, event, args, timeoutMs, label) {
  const probeId = (0, import_node_crypto3.randomBytes)(8).toString("hex");
  return new Promise((resolve3) => {
    const timer = setTimeout(() => {
      pending.delete(probeId);
      resolve3(err("CLIENT_PROBE_TIMEOUT", `${label ?? event} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
    pending.set(probeId, (result) => {
      clearTimeout(timer);
      pending.delete(probeId);
      if (result.ok) resolve3(ok(result.data));
      else resolve3(err("INTERNAL", result.error));
    });
    emitNet(event, serverId, probeId, ...args);
  });
}

// src/server/players/events.ts
var listeners = /* @__PURE__ */ new Set();
var registeredEvents = /* @__PURE__ */ new Set();
function ensureNetHandler(event) {
  if (registeredEvents.has(event)) return;
  registeredEvents.add(event);
  onNet(event, (...args) => {
    const source2 = globalThis.source ?? 0;
    const matched = [];
    for (const l of listeners) {
      if (l.event !== event) continue;
      if (l.fromSubject !== void 0 && l.fromSubject !== source2) continue;
      matched.push(l);
    }
    for (const l of matched) {
      clearTimeout(l.timer);
      listeners.delete(l);
      l.resolve({ from: source2, args });
    }
  });
}
function waitForClientEvent(event, timeoutMs, fromSubject) {
  ensureNetHandler(event);
  return new Promise((resolve3) => {
    const timer = setTimeout(() => {
      listeners.delete(listener);
      resolve3(null);
    }, timeoutMs);
    const listener = fromSubject === void 0 ? { event, resolve: resolve3, timer } : { event, fromSubject, resolve: resolve3, timer };
    listeners.add(listener);
  });
}

// src/server/tools/players.ts
var SubjectInput = external_exports.object({ serverId: external_exports.number().int().min(1) }).strict();
var ProbeNameSchema = external_exports.enum(["entity_basic", "ped_status", "player_meta", "inventory_snap"]);
function registerListPlayers() {
  register({
    name: "list_players",
    description: "List players who have opted in via /agent_test_optin (with TTL countdown).",
    input: external_exports.object({}).strict(),
    handler: async () => {
      const now2 = Date.now();
      const opted = listOptedIn().map((s) => {
        const secondsLeft = Math.max(0, Math.floor((s.expiresAt - now2) / 1e3));
        return Object.assign({}, s, { secondsLeft, isActiveSubject: isSubject(s.serverId) });
      });
      return ok({
        optedIn: opted,
        activeSubjects: listSubjects()
      });
    }
  });
}
function registerRegisterTestSubject() {
  register({
    name: "register_test_subject",
    description: "Move an opted-in player into the active test-subject pool. Limited by agent_api_test_max_subjects convar.",
    input: SubjectInput,
    handler: async (input, ctx) => {
      const res = addSubject(input.serverId, ctx.convars.testMaxSubjects);
      if (!res.ok) return res;
      const session = getOptIn(input.serverId);
      return ok({ subject: session });
    }
  });
}
function registerUnregisterTestSubject() {
  register({
    name: "unregister_test_subject",
    description: "Remove a player from the active subject pool. Opt-in session is preserved.",
    input: SubjectInput,
    handler: async (input) => {
      const removed = removeSubject(input.serverId);
      return ok({ removed });
    }
  });
}
function ensureActiveSubject(serverId) {
  if (!getOptIn(serverId)) {
    return err("PLAYER_NOT_OPTED_IN", `Player ${serverId} has not opted in.`);
  }
  if (!isSubject(serverId)) {
    return err(
      "PLAYER_NOT_OPTED_IN",
      `Player ${serverId} is opted in but not registered as an active subject. Call register_test_subject first.`
    );
  }
  return ok(true);
}
function registerGetPlayerState() {
  register({
    name: "get_player_state",
    description: "Run client-side probes on a registered test subject and return collected snapshots.",
    input: external_exports.object({
      serverId: external_exports.number().int().min(1),
      probes: external_exports.array(ProbeNameSchema).min(1).optional(),
      timeoutMs: external_exports.number().int().min(100).max(1e4).optional()
    }).strict(),
    handler: async (input) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      const probes = input.probes ?? ["entity_basic", "ped_status", "player_meta"];
      const timeout = input.timeoutMs ?? 2e3;
      const results = {};
      for (const probe of probes) {
        const r = await callProbe(input.serverId, probe, {}, timeout);
        results[probe] = r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
      }
      return ok({ serverId: input.serverId, results });
    }
  });
}
function registerTriggerClientEvent() {
  register({
    name: "trigger_client_event",
    description: "Send an arbitrary net event to one registered test subject. The agent must already know what event the target resource expects.",
    input: external_exports.object({
      serverId: external_exports.number().int().min(1),
      event: external_exports.string().min(1),
      args: external_exports.array(external_exports.unknown()).optional()
    }).strict(),
    handler: async (input) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      emitNet(input.event, input.serverId, ...input.args ?? []);
      return ok({ sent: { serverId: input.serverId, event: input.event, args: input.args ?? [] } });
    }
  });
}
function registerSendChat() {
  register({
    name: "send_chat",
    description: "Push a single chat message to one registered test subject via chat:addMessage.",
    input: external_exports.object({
      serverId: external_exports.number().int().min(1),
      text: external_exports.string().min(1).max(1024),
      color: external_exports.tuple([external_exports.number(), external_exports.number(), external_exports.number()]).optional()
    }).strict(),
    handler: async (input) => {
      const guard = ensureActiveSubject(input.serverId);
      if (!guard.ok) return guard;
      emitNet("chat:addMessage", input.serverId, {
        color: input.color ?? [180, 180, 240],
        args: ["[agent_api]", input.text]
      });
      return ok({ sent: true });
    }
  });
}
function registerWaitForClientEvent() {
  register({
    name: "wait_for_client_event",
    description: "Block until a matching client net event is received (optionally only from one subject) or the timeout elapses.",
    input: external_exports.object({
      event: external_exports.string().min(1),
      fromSubject: external_exports.number().int().min(1).optional(),
      timeoutMs: external_exports.number().int().min(100).max(6e4).optional()
    }).strict(),
    handler: async (input) => {
      if (input.fromSubject !== void 0) {
        const guard = ensureActiveSubject(input.fromSubject);
        if (!guard.ok) return guard;
      }
      const result = await waitForClientEvent(
        input.event,
        input.timeoutMs ?? 5e3,
        input.fromSubject
      );
      if (!result) return err("TIMEOUT", `No matching ${input.event} within timeout.`);
      return ok(result);
    }
  });
}

// src/server/plugins/dynamic.ts
var READ_VERBS = ["get", "is", "has", "list", "find", "count", "show", "fetch", "read", "check"];
var WRITE_VERBS = [
  "set",
  "add",
  "remove",
  "update",
  "delete",
  "create",
  "do",
  "trigger",
  "kick",
  "ban",
  "give",
  "take",
  "spawn",
  "register",
  "unregister",
  "save",
  "reset",
  "clear",
  "send",
  "enable",
  "disable"
];
function classifyMethod(name) {
  const lower = name.toLowerCase();
  for (const v of READ_VERBS) if (lower.startsWith(v)) return "read";
  for (const v of WRITE_VERBS) if (lower.startsWith(v)) return "write";
  return "unknown";
}
function isAllowed(name, ctx) {
  if (ctx.blocklist.has(name)) {
    return { ok: false, reason: `${name} is in the blocklist.` };
  }
  if (ctx.readonly) {
    const cls = classifyMethod(name);
    if (cls !== "read") {
      return {
        ok: false,
        reason: `agent_api_readonly is true; only getter-style methods are allowed (got ${cls}).`
      };
    }
  }
  return { ok: true };
}
function listCallable(obj) {
  if (!obj || typeof obj !== "object" && typeof obj !== "function") return [];
  const names = /* @__PURE__ */ new Set();
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === "function") names.add(k);
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto && proto !== Object.prototype) {
    for (const k of Object.getOwnPropertyNames(proto)) {
      if (k === "constructor") continue;
      const v = obj[k];
      if (typeof v === "function") names.add(k);
    }
  }
  return [...names].sort();
}
var MAX_DEPTH = 6;
var MAX_ARRAY = 500;
var MAX_KEYS = 200;
function safeSerialize(value, depth = 0, seen = /* @__PURE__ */ new WeakSet()) {
  if (value === null || value === void 0) return value;
  const t = typeof value;
  if (t === "function") {
    const fn = value;
    return `[Function: ${fn.name || "anonymous"}]`;
  }
  if (t === "bigint") return String(value);
  if (t === "symbol") return String(value);
  if (t !== "object") return value;
  if (depth > MAX_DEPTH) return "[depth-cap]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (Array.isArray(value)) {
    const out2 = value.slice(0, MAX_ARRAY).map((v) => safeSerialize(v, depth + 1, seen));
    if (value.length > MAX_ARRAY) out2.push(`[+${value.length - MAX_ARRAY} more]`);
    return out2;
  }
  const obj = value;
  const out = {};
  let count = 0;
  for (const k of Object.keys(obj)) {
    if (count++ >= MAX_KEYS) {
      out["__truncated__"] = `(${Object.keys(obj).length - MAX_KEYS} more keys)`;
      break;
    }
    out[k] = safeSerialize(obj[k], depth + 1, seen);
  }
  return out;
}
function csvSet(name) {
  return new Set(
    GetConvar(name, "").split(",").map((s) => s.trim()).filter(Boolean)
  );
}

// src/server/tools/clientNative.ts
var READ_PREFIXES = ["Get", "Has", "Is", "Does", "Can", "Will", "Network"];
function isReadOnlyNative(name) {
  return READ_PREFIXES.some((p) => name.startsWith(p));
}
function ensureActiveSubject2(serverId) {
  if (!getOptIn(serverId)) {
    return err("PLAYER_NOT_OPTED_IN", `Player ${serverId} has not opted in.`);
  }
  if (!isSubject(serverId)) {
    return err(
      "PLAYER_NOT_OPTED_IN",
      `Player ${serverId} is opted in but not in the active subject pool.`
    );
  }
  return ok(true);
}
var NativeInput = external_exports.object({
  serverId: external_exports.number().int().min(1),
  native: external_exports.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  args: external_exports.array(external_exports.unknown()).max(32).optional(),
  timeoutMs: external_exports.number().int().min(100).max(1e4).optional()
}).strict();
var ListInput = external_exports.object({
  serverId: external_exports.number().int().min(1),
  prefix: external_exports.string().optional(),
  limit: external_exports.number().int().min(1).max(2e3).optional(),
  timeoutMs: external_exports.number().int().min(100).max(1e4).optional()
}).strict();
function registerClientCallNative() {
  register({
    name: "client_call_native",
    description: 'Invoke ANY FiveM client native on one registered test subject. Args support special tokens: "$ped" / "$player" / "$serverId" / "$vehicle" / "$lastVehicle" / "$coords" / "$heading" resolved client-side. Read-only natives (prefix Get/Has/Is/Does/Can/Will/Network) always allowed. Mutating natives need agent_api_readonly=false. Block specific natives via agent_api_client_blocked_natives (csv).',
    input: NativeInput,
    handler: async (input, ctx) => {
      const guard = ensureActiveSubject2(input.serverId);
      if (!guard.ok) return guard;
      const blocklist = csvSet("agent_api_client_blocked_natives");
      if (blocklist.has(input.native)) {
        return err("COMMAND_NOT_ALLOWED", `native ${input.native} is in the blocklist.`);
      }
      if (ctx.convars.readonly && !isReadOnlyNative(input.native)) {
        return err(
          "COMMAND_NOT_ALLOWED",
          `readonly mode: ${input.native} does not start with Get/Has/Is/Does/Can/Will/Network.`
        );
      }
      return callRemote(
        input.serverId,
        "agent_api:client_native",
        [input.native, input.args ?? []],
        input.timeoutMs ?? 3e3,
        input.native
      );
    }
  });
}
function registerClientListNatives() {
  register({
    name: "client_list_natives",
    description: "Enumerate function names available in client globalThis. Filter by case-insensitive prefix substring. Useful before client_call_native to discover what is callable.",
    input: ListInput,
    handler: async (input) => {
      const guard = ensureActiveSubject2(input.serverId);
      if (!guard.ok) return guard;
      return callRemote(
        input.serverId,
        "agent_api:client_native_list",
        [input.prefix ?? "", input.limit ?? 500],
        input.timeoutMs ?? 3e3,
        "client_list_natives"
      );
    }
  });
}

// src/server/tools/serverNative.ts
var READ_PREFIXES2 = ["Get", "Has", "Is", "Does", "Can", "Will", "Network"];
var DEFAULT_DANGER_BLOCKLIST = /* @__PURE__ */ new Set([
  "DropPlayer",
  "ExecuteCommand",
  "StopResource",
  "StartResource",
  "ScheduleResourceTick",
  "PrintStructuredTrace",
  "CancelEvent",
  "TempBanPlayer",
  "BanPlayer"
]);
function isReadOnlyNative2(name) {
  return READ_PREFIXES2.some((p) => name.startsWith(p));
}
var NativeInput2 = external_exports.object({
  native: external_exports.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),
  args: external_exports.array(external_exports.unknown()).max(32).optional()
}).strict();
var ListInput2 = external_exports.object({
  prefix: external_exports.string().optional(),
  limit: external_exports.number().int().min(1).max(2e3).optional()
}).strict();
function callOnServer(native, args, ctx) {
  if (DEFAULT_DANGER_BLOCKLIST.has(native)) {
    return err(
      "COMMAND_NOT_ALLOWED",
      `server native ${native} is in the built-in danger list. To override, expose it through a dedicated tool with a narrower input schema.`
    );
  }
  if (ctx.blocklist.has(native)) {
    return err("COMMAND_NOT_ALLOWED", `server native ${native} is in the blocklist.`);
  }
  if (ctx.readonly && !isReadOnlyNative2(native)) {
    return err(
      "COMMAND_NOT_ALLOWED",
      `readonly mode: ${native} does not start with Get/Has/Is/Does/Can/Will/Network.`
    );
  }
  const fn = globalThis[native];
  if (typeof fn !== "function") {
    return err("INVALID_INPUT", `server native ${native} not found in global scope.`);
  }
  try {
    const raw = fn(...args);
    return ok({ native, args, result: safeSerialize(raw) });
  } catch (e) {
    return err("INTERNAL", e instanceof Error ? e.message : String(e));
  }
}
function registerServerCallNative() {
  register({
    name: "server_call_native",
    description: "Invoke ANY FiveM server-side native directly in the agent_api script context. No client round-trip; runs synchronously on the server. Read-only natives (prefix Get/Has/Is/Does/Can/Will/Network) always allowed. Mutating natives require agent_api_readonly=false. Block specific natives via agent_api_server_blocked_natives (csv).",
    input: NativeInput2,
    handler: async (input, ctx) => {
      const blocklist = csvSet("agent_api_server_blocked_natives");
      return callOnServer(input.native, input.args ?? [], {
        readonly: ctx.convars.readonly,
        blocklist
      });
    }
  });
}
function registerServerListNatives() {
  register({
    name: "server_list_natives",
    description: "Enumerate function names available in the server-side global scope. Filter by case-insensitive substring. Use before server_call_native to discover.",
    input: ListInput2,
    handler: async (input) => {
      const wanted = (input.prefix ?? "").toLowerCase();
      const max = Math.max(1, Math.min(2e3, input.limit ?? 500));
      const names = [];
      for (const k of Object.keys(globalThis)) {
        if (typeof globalThis[k] !== "function") continue;
        if (wanted && !k.toLowerCase().includes(wanted)) continue;
        names.push(k);
        if (names.length >= max) break;
      }
      return ok({ count: names.length, names: names.sort() });
    }
  });
}

// src/server/tools/runShell.ts
var import_node_child_process = require("node:child_process");
var import_node_path5 = require("node:path");
var DEFAULT_ALLOWLIST = ["npm", "npx", "pnpm", "yarn", "bun", "vite", "git", "node"];
var MAX_OUTPUT_BYTES = 1048576;
var HARD_TIMEOUT_MS = 3e5;
var Input3 = external_exports.object({
  resource: external_exports.string().min(1),
  command: external_exports.string().min(1),
  args: external_exports.array(external_exports.string()).max(64).optional(),
  cwd: external_exports.string().optional(),
  stdin: external_exports.string().max(65536).optional(),
  timeoutMs: external_exports.number().int().min(500).max(HARD_TIMEOUT_MS).optional(),
  env: external_exports.record(external_exports.string()).optional()
}).strict();
function allowlist() {
  const extra = csvSet("agent_api_shell_allowed_commands");
  if (extra.size === 0) return new Set(DEFAULT_ALLOWLIST);
  return extra;
}
function resolveCwd(resourceRoot, sub) {
  if (!sub) return { ok: true, path: resourceRoot };
  if (sub.includes("..") || sub.startsWith("/") || sub.startsWith("\\") || /^[a-z]:[\\/]/i.test(sub)) {
    return { ok: false, reason: "cwd must be a relative subpath of the resource root." };
  }
  const abs = (0, import_node_path5.resolve)(resourceRoot, sub);
  const root = (0, import_node_path5.resolve)(resourceRoot);
  if (!abs.startsWith(root)) {
    return { ok: false, reason: "cwd escapes the resource root." };
  }
  return { ok: true, path: abs };
}
function registerRunShell() {
  register({
    name: "run_shell",
    description: "Run an allowlisted shell binary (default: npm, npx, pnpm, yarn, bun, vite, git, node) inside a resource folder. Use for `npm install`, `npx vite create`, `pnpm build`, etc. cwd is always anchored to the target resource root; relative subpaths are allowed. Override allowlist via convar agent_api_shell_allowed_commands (csv). Requires agent_api_readonly=false. Output is captured up to 1MB per stream.",
    input: Input3,
    handler: async (input, ctx) => {
      if (ctx.convars.readonly) {
        return err("COMMAND_NOT_ALLOWED", "Server is in read-only mode.");
      }
      const allowed = allowlist();
      if (!allowed.has(input.command)) {
        return err("COMMAND_NOT_ALLOWED", `Shell command not in allowlist: ${input.command}`, {
          allowed: [...allowed]
        });
      }
      const info = getResourceInfo(input.resource);
      if (!info) {
        return err("RESOURCE_NOT_FOUND", `Resource not found: ${input.resource}`);
      }
      const cwd = resolveCwd(info.path, input.cwd);
      if (!cwd.ok) {
        return err("PATH_OUTSIDE_SANDBOX", cwd.reason);
      }
      const timeoutMs = input.timeoutMs ?? 3e4;
      const args = input.args ?? [];
      return new Promise((resolveTool) => {
        const child = (0, import_node_child_process.spawn)(input.command, args, {
          cwd: cwd.path,
          env: { ...process.env, ...input.env },
          shell: false,
          windowsHide: true
        });
        let stdout = "";
        let stderr = "";
        let stdoutCapped = false;
        let stderrCapped = false;
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
          setTimeout(() => child.kill("SIGKILL"), 1e3).unref();
        }, timeoutMs);
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => {
          if (stdoutCapped) return;
          if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
            stdout += chunk.slice(0, MAX_OUTPUT_BYTES - stdout.length);
            stdoutCapped = true;
          } else {
            stdout += chunk;
          }
        });
        child.stderr.on("data", (chunk) => {
          if (stderrCapped) return;
          if (stderr.length + chunk.length > MAX_OUTPUT_BYTES) {
            stderr += chunk.slice(0, MAX_OUTPUT_BYTES - stderr.length);
            stderrCapped = true;
          } else {
            stderr += chunk;
          }
        });
        child.on("error", (e) => {
          clearTimeout(timer);
          resolveTool(err("INTERNAL", `spawn failed: ${e.message}`));
        });
        child.on("close", (code, signal) => {
          clearTimeout(timer);
          if (timedOut) {
            resolveTool(
              err("TIMEOUT", `${input.command} timed out after ${timeoutMs}ms.`, {
                signal,
                stdout,
                stderr,
                stdoutCapped,
                stderrCapped
              })
            );
            return;
          }
          resolveTool(
            ok({
              command: input.command,
              args,
              cwd: cwd.path,
              exitCode: code,
              signal,
              durationMs: Date.now() - startedAt,
              stdout,
              stderr,
              stdoutCapped,
              stderrCapped
            })
          );
        });
        const startedAt = Date.now();
        if (input.stdin !== void 0) {
          child.stdin.write(input.stdin);
        }
        child.stdin.end();
      });
    }
  });
}

// src/server/tools/runCommand.ts
var Input4 = external_exports.object({
  command: external_exports.string().min(1),
  waitMs: external_exports.number().int().min(0).max(5e3).optional(),
  timeoutMs: external_exports.number().int().min(100).max(3e4).optional()
}).strict();
function registerRunCommand() {
  register({
    name: "run_command",
    description: "Run a console command from the allowlist (refresh, ensure/start/stop/restart <name>, players, say <text>). Returns captured console lines and, for lifecycle verbs, a structured state-before/after envelope.",
    input: Input4,
    handler: async (input, ctx) => {
      const parsed = parseAllowedCommand(input.command);
      if (!parsed.ok) return parsed;
      const cmd = parsed.data;
      if (cmd.kind === "resource") {
        return withLock(
          cmd.resource,
          () => runLifecycle(cmd.verb, cmd.resource, {
            console: ctx.console,
            controlRoots: ctx.convars.controlRoots,
            ...input.timeoutMs !== void 0 ? { timeoutMs: input.timeoutMs } : {}
          })
        );
      }
      const wait = input.waitMs ?? 1e3;
      const literal = cmd.kind === "no_arg" ? cmd.verb : `${cmd.verb} ${cmd.text}`;
      return withLock(GLOBAL_LOCK, async () => {
        const capture = await captureAround(ctx.console, () => runConsole(literal), {
          delayMs: wait
        });
        return ok({
          command: literal,
          lines: capture.lines,
          count: capture.lines.length
        });
      });
    }
  });
}

// src/server/tools/tailConsole.ts
var Input5 = external_exports.object({
  lines: external_exports.number().int().min(1).max(5e3).optional(),
  sinceTs: external_exports.number().int().min(0).optional(),
  channel: external_exports.string().optional()
}).strict();
function registerTailConsole() {
  register({
    name: "tail_console",
    description: "Return recent lines from the in-memory console ring buffer. Filter by since timestamp (ms epoch) or channel.",
    input: Input5,
    handler: async (input, ctx) => {
      const opts = {};
      if (input.lines !== void 0) opts.lines = input.lines;
      if (input.sinceTs !== void 0) opts.sinceTs = input.sinceTs;
      if (input.channel !== void 0) opts.channel = input.channel;
      const lines = ctx.console.tail(opts);
      return ok({
        lines,
        count: lines.length,
        bufferLength: ctx.console.length()
      });
    }
  });
}

// src/server/fs/write.ts
var import_node_fs5 = require("node:fs");
var import_node_path6 = require("node:path");
var WriteFileInput = external_exports.object({
  resource: external_exports.string().min(1),
  path: external_exports.string().min(1),
  content: external_exports.string(),
  createDirs: external_exports.boolean().optional()
});
async function writeFile(input, ctx) {
  if (ctx.readonly) {
    return err("COMMAND_NOT_ALLOWED", "Server is in read-only mode.");
  }
  const bytes = Buffer.byteLength(input.content, "utf8");
  if (bytes > ctx.maxBytes) {
    return err("FILE_TOO_LARGE", `Content exceeds ${ctx.maxBytes} bytes.`, {
      size: bytes,
      limit: ctx.maxBytes
    });
  }
  const resolved = resolveResourcePath(input.resource, input.path);
  if (!resolved.ok) return resolved;
  const rootCheck = checkWriteRoot(resolved.data.resourceRoot, ctx.writeRoots);
  if (!rootCheck.ok) return rootCheck;
  const extCheck = checkWriteExtension(resolved.data.absPath);
  if (!extCheck.ok) return extCheck;
  let existed = true;
  try {
    await import_node_fs5.promises.stat(resolved.data.absPath);
  } catch {
    existed = false;
  }
  if (input.createDirs) {
    await import_node_fs5.promises.mkdir((0, import_node_path6.dirname)(resolved.data.absPath), { recursive: true });
  }
  await import_node_fs5.promises.writeFile(resolved.data.absPath, input.content, "utf8");
  return ok({
    resource: input.resource,
    path: input.path,
    bytes,
    created: !existed
  });
}

// src/server/tools/writeFile.ts
function registerWriteFile() {
  register({
    name: "write_file",
    description: "Write a file inside a resource that lives under one of the configured write roots. Pass createDirs:true to mkdir -p the parent directory.",
    input: WriteFileInput,
    handler: async (input, ctx) => {
      const key = input.resource || GLOBAL_LOCK;
      return withLock(
        key,
        () => writeFile(input, {
          maxBytes: ctx.convars.maxFileBytes,
          writeRoots: ctx.convars.writeRoots,
          readonly: ctx.convars.readonly
        })
      );
    }
  });
}

// src/server/players/optin.ts
function chat(serverId, color, text) {
  emitNet("chat:addMessage", serverId, {
    color,
    args: ["[agent_api]", text]
  });
}
function installOptInCommands(ttlSeconds) {
  RegisterCommand(
    "agent_test_optin",
    (source2) => {
      if (source2 === 0) {
        console.log("[agent_api] /agent_test_optin must be run by a player, not the console.");
        return;
      }
      const session = addOptIn(source2, ttlSeconds);
      const minutes = Math.round(ttlSeconds / 60);
      chat(
        source2,
        [120, 200, 120],
        `You are now a test subject for ${minutes} minutes. Type /agent_test_optout to revoke.`
      );
      console.log(
        `[agent_api] opt-in: serverId=${source2} name=${session.name} expires=${new Date(session.expiresAt).toISOString()}`
      );
    },
    false
  );
  RegisterCommand(
    "agent_test_optout",
    (source2) => {
      if (source2 === 0) return;
      const had = removeOptIn(source2);
      dropPlayer2(source2);
      if (had) {
        chat(source2, [200, 120, 120], "Test subject opt-out confirmed.");
        console.log(`[agent_api] opt-out: serverId=${source2}`);
      }
    },
    false
  );
  RegisterCommand(
    "agent_test_status",
    (source2) => {
      if (source2 === 0) return;
      const s = getOptIn(source2);
      if (!s) {
        chat(source2, [200, 200, 120], "You are NOT a test subject.");
      } else {
        const left = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1e3));
        chat(source2, [120, 200, 200], `Opted in. ${left}s remaining.`);
      }
    },
    false
  );
  on("playerDropped", () => {
    const source2 = globalThis.source;
    if (typeof source2 === "number") {
      dropPlayer(source2);
      dropPlayer2(source2);
    }
  });
}

// src/server/plugins/helpers.ts
function isResourceStarted(name) {
  const state = GetResourceState(name);
  if (state === "started") return { ok: true };
  return { ok: false, reason: `${name} is ${state || "missing"}` };
}
function safeExport(resource, name) {
  var _a;
  try {
    const ex = (_a = globalThis.exports) == null ? void 0 : _a[resource];
    if (!ex) return null;
    const fn = ex[name];
    return fn ?? null;
  } catch {
    return null;
  }
}
function callExport(resource, name, args) {
  const fn = safeExport(resource, name);
  if (!fn) return null;
  try {
    return fn(...args);
  } catch {
    return null;
  }
}

// src/server/plugins/esx/index.ts
var RESOURCE = "es_extended";
var cachedEsx = null;
function getEsx() {
  if (cachedEsx) return cachedEsx;
  const obj = callExport(RESOURCE, "getSharedObject", []);
  if (obj) cachedEsx = obj;
  return obj;
}
function snapshot(p) {
  var _a, _b, _c, _d;
  return {
    serverId: p.source,
    identifier: p.identifier,
    name: (_a = p.getName) == null ? void 0 : _a.call(p),
    money: (_b = p.getMoney) == null ? void 0 : _b.call(p),
    accounts: ((_c = p.getAccounts) == null ? void 0 : _c.call(p)) ?? null,
    job: ((_d = p.getJob) == null ? void 0 : _d.call(p)) ?? null
  };
}
var esxPlugin = {
  name: "esx",
  description: "ESX Legacy framework \u2014 read player data, money, job, inventory ops.",
  detect: () => {
    const started = isResourceStarted(RESOURCE);
    if (!started.ok) return started;
    if (!safeExport(RESOURCE, "getSharedObject")) {
      return { ok: false, reason: `${RESOURCE} export getSharedObject not callable` };
    }
    return { ok: true };
  },
  install: ({ register: register2, convars }) => {
    register2({
      name: "esx_list_players",
      description: "List all online ESX players with identifier, money, accounts, and job.",
      input: external_exports.object({}).strict(),
      handler: async () => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const ids = esx.GetPlayers();
        const players = ids.map((id) => esx.GetPlayerFromId(id)).filter((p) => !!p).map((p) => snapshot(p));
        return ok({ count: players.length, players });
      }
    });
    register2({
      name: "esx_get_player",
      description: "Fetch one ESX player snapshot by server id.",
      input: external_exports.object({ serverId: external_exports.number().int().min(1) }).strict(),
      handler: async (input) => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err("PLAYER_NOT_FOUND", `No ESX player for serverId ${input.serverId}.`);
        return ok(snapshot(p));
      }
    });
    if (convars.readonly) return;
    register2({
      name: "esx_add_money",
      description: 'Add money to an ESX player. Pass account="cash"/"bank"/"black_money" or omit for primary money.',
      input: external_exports.object({
        serverId: external_exports.number().int().min(1),
        amount: external_exports.number().int(),
        account: external_exports.string().optional()
      }).strict(),
      handler: async (input) => {
        var _a, _b, _c, _d;
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err("PLAYER_NOT_FOUND", `serverId ${input.serverId} not found.`);
        if (input.account) {
          if (input.amount >= 0) (_a = p.addAccountMoney) == null ? void 0 : _a.call(p, input.account, input.amount);
          else (_b = p.removeAccountMoney) == null ? void 0 : _b.call(p, input.account, -input.amount);
        } else {
          if (input.amount >= 0) (_c = p.addMoney) == null ? void 0 : _c.call(p, input.amount);
          else (_d = p.removeMoney) == null ? void 0 : _d.call(p, -input.amount);
        }
        return ok(snapshot(p));
      }
    });
    register2({
      name: "esx_set_job",
      description: "Assign a job + grade to an ESX player.",
      input: external_exports.object({
        serverId: external_exports.number().int().min(1),
        job: external_exports.string().min(1),
        grade: external_exports.number().int().min(0)
      }).strict(),
      handler: async (input) => {
        var _a;
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err("PLAYER_NOT_FOUND", `serverId ${input.serverId} not found.`);
        (_a = p.setJob) == null ? void 0 : _a.call(p, input.job, input.grade);
        return ok(snapshot(p));
      }
    });
    register2({
      name: "esx_list_shared_methods",
      description: "Discover every callable method on the ESX shared object \u2014 use before esx_call_shared.",
      input: external_exports.object({}).strict(),
      handler: async () => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        return ok({ methods: listCallable(esx) });
      }
    });
    register2({
      name: "esx_list_player_methods",
      description: "Discover every callable method on an xPlayer (e.g. getInventory, getJob, addMoney).",
      input: external_exports.object({ serverId: external_exports.number().int().min(1) }).strict(),
      handler: async (input) => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const p = esx.GetPlayerFromId(input.serverId);
        if (!p) return err("PLAYER_NOT_FOUND", `serverId ${input.serverId} not found.`);
        return ok({ serverId: input.serverId, methods: listCallable(p) });
      }
    });
    const blocklist = csvSet("agent_api_plugin_esx_blocked_methods");
    register2({
      name: "esx_call_shared",
      description: "Call any method on the ESX shared object dynamically. Read-only methods (get/is/has/list/find/count/...) are always allowed. Mutating methods require agent_api_readonly=false. Methods listed in agent_api_plugin_esx_blocked_methods are always denied.",
      input: external_exports.object({
        method: external_exports.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
        args: external_exports.array(external_exports.unknown()).optional()
      }).strict(),
      handler: async (input) => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const guard = isAllowed(input.method, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        const fn = esx[input.method];
        if (typeof fn !== "function") {
          return err(
            "INVALID_INPUT",
            `ESX.${input.method} is not a function on the shared object.`
          );
        }
        try {
          const raw = await Promise.resolve(fn.apply(esx, input.args ?? []));
          return ok({ method: input.method, result: safeSerialize(raw) });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
    register2({
      name: "esx_call_player",
      description: "Call any method on one xPlayer dynamically (e.g. getInventory, getAccount, setJob). Same read/write gating as esx_call_shared.",
      input: external_exports.object({
        serverId: external_exports.number().int().min(1),
        method: external_exports.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
        args: external_exports.array(external_exports.unknown()).optional()
      }).strict(),
      handler: async (input) => {
        const esx = getEsx();
        if (!esx) return err("INTERNAL", "ESX shared object unavailable.");
        const player = esx.GetPlayerFromId(input.serverId);
        if (!player) {
          return err("PLAYER_NOT_FOUND", `serverId ${input.serverId} not found.`);
        }
        const guard = isAllowed(input.method, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        const fn = player[input.method];
        if (typeof fn !== "function") {
          return err(
            "INVALID_INPUT",
            `xPlayer.${input.method} is not a function on player ${input.serverId}.`
          );
        }
        try {
          const raw = await Promise.resolve(fn.apply(player, input.args ?? []));
          return ok({
            serverId: input.serverId,
            method: input.method,
            result: safeSerialize(raw)
          });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
  }
};

// node_modules/@overextended/ox_lib/dist/server/index.js
var server_exports = {};
__export(server_exports, {
  GameEntity: () => GameEntity,
  HookPipeline: () => HookPipeline,
  Ped: () => Ped,
  Player: () => Player,
  Prop: () => Prop,
  StateBag: () => StateBag,
  Vehicle: () => Vehicle,
  Zone: () => Zone,
  addAce: () => addAce,
  addCommand: () => addCommand,
  addPrincipal: () => addPrincipal,
  cache: () => cache,
  checkDependency: () => checkDependency,
  context: () => context,
  createLocales: () => createLocales,
  createObject: () => createObject,
  createPed: () => createPed,
  createVehicle: () => createVehicle,
  getLocale: () => getLocale,
  getLocales: () => getLocales,
  getNearbyVehicles: () => getNearbyVehicles,
  getRandomAlphanumeric: () => getRandomAlphanumeric,
  getRandomChar: () => getRandomChar,
  getRandomInt: () => getRandomInt,
  getRandomString: () => getRandomString,
  getServerLocale: () => getServerLocale,
  initLocale: () => initLocale,
  lib: () => server_exports2,
  locale: () => locale,
  onCache: () => onCache,
  onClientCallback: () => onClientCallback,
  registerHook: () => registerHook,
  removeAce: () => removeAce,
  removePrincipal: () => removePrincipal,
  setVehicleProperties: () => setVehicleProperties,
  sleep: () => sleep3,
  triggerClientCallback: () => triggerClientCallback,
  versionCheck: () => versionCheck,
  waitFor: () => waitFor
});
init_runtime();
init_cache();

// node_modules/@overextended/ox_lib/dist/common/game/StateBag/index.js
init_cache();
var allowStateBagReplication = cache.game === "fxserver" || !GetConvarBool("sv_stateBagStrictMode", false);
var StateBag = class {
  statebag;
  constructor(statebag = "") {
    this.statebag = statebag;
  }
  /** Writes a value to the statebag. Replicated values set from the client are send to the server for validation. */
  async set(key, value, replicated = false) {
    if (replicated && !allowStateBagReplication) return Promise.resolve().then(() => (init_callback(), callback_exports)).then((m) => m.triggerServerCallback("ox_lib:requestSetStateBag", null, this.statebag, key, value));
    const packed = msgpack_pack(value);
    SetStateBagValue(this.statebag, key, packed, packed.length, replicated);
    return true;
  }
  /** Returns a value from the statebag. */
  get(key) {
    return GetStateBagValue(this.statebag, key);
  }
  /** Returns if a key exists on the statebag. */
  has(key) {
    return !!StateBagHasKey(this.statebag, key);
  }
  /** Returns an array of all keys on the statebag. */
  keys() {
    return GetStateBagKeys(this.statebag);
  }
};

// node_modules/@overextended/ox_lib/dist/common/misc.js
var context = IsDuplicityVersion() ? "server" : "client";
function sleep3(ms) {
  return new Promise((resolve3) => setTimeout(resolve3, ms, null));
}
async function waitFor(cb, errMessage, timeout) {
  let value = await cb();
  if (value !== void 0) return value;
  if (timeout || timeout == null) {
    if (typeof timeout !== "number") timeout = 1e3;
  }
  const start = GetGameTimer();
  let id;
  return new Promise((resolve3, reject) => {
    id = setTick(async () => {
      const elapsed = timeout && GetGameTimer() - start;
      if (elapsed && elapsed > timeout) return reject(`${errMessage || "failed to resolve callback"} (waited ${elapsed}ms)`);
      value = await cb();
      if (value !== void 0) resolve3(value);
    });
  }).finally(() => clearTick(id));
}
function getRandomInt(min = 0, max = 9) {
  if (min > max) [min, max] = [max, min];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomChar(lowercase) {
  const str = String.fromCharCode(getRandomInt(65, 90));
  return lowercase ? str.toLowerCase() : str;
}
function getRandomAlphanumeric(lowercase) {
  return Math.random() > 0.5 ? getRandomChar(lowercase) : getRandomInt();
}
var formatChar = {
  "1": getRandomInt,
  A: getRandomChar,
  ".": getRandomAlphanumeric,
  a: getRandomChar
};
function getRandomString(pattern, length) {
  const len = length || pattern.replace(/\^/g, "").length;
  const arr = Array(len).fill(0);
  let size = 0;
  let i = 0;
  while (size < len) {
    i += 1;
    let char = pattern.charAt(i - 1);
    if (char === "") {
      arr[size] = " ".repeat(len - size);
      break;
    } else if (char === "^") {
      i += 1;
      char = pattern.charAt(i - 1);
    } else {
      const fn = formatChar[char];
      char = fn ? fn(char === "a") : char;
    }
    size += 1;
    arr[size - 1] = char;
  }
  return arr.join("");
}

// node_modules/@overextended/core/dist/math.js
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// node_modules/@overextended/core/dist/vector.js
var Vector = class _Vector {
  static size;
  static keys;
  /**
   * Constructs a new vector with optional components.
   *
   * @param x - The x-component of the vector.
   * @param y - The y-component of the vector. Defaults to `x` if not provided.
   * @param z - The z-component of the vector (optional).
   * @param w - The w-component of the vector (optional).
   */
  constructor(...args) {
    for (let i = 0; i < this.size; i++) {
      if (typeof args[i] !== "number") {
        throw new TypeError(`${this.constructor.name} argument at index ${i} must be a number, but got ${typeof args[i]}`);
      }
    }
  }
  get size() {
    return this.constructor.size;
  }
  /**
   * Creates a vector from an array of numbers.
   *
   * @param primitive - An array representing the components of a vector.
   * @returns A new vector instance corresponding to the provided array length.
   */
  static fromArray(primitive) {
    const [x, y, z, w] = primitive;
    return new this(x, y, z, w);
  }
  /**
   * Creates a vector from a number, array, or object.
   *
   * @param primitive - A number, array, or object with vector-like components.
   * @returns A new vector instance corresponding to the input.
   */
  static fromInput(primitive) {
    if (typeof primitive === "number")
      return new this(primitive, primitive, primitive, primitive);
    if (Array.isArray(primitive))
      return this.fromArray(primitive);
    const { x, y, z, w } = primitive;
    return new this(x, y, z, w);
  }
  /**
   * Converts a list of component arrays into an array of vector instances.
   *
   * @param primitives - An array of number arrays representing multiple vectors.
   * @returns An array of vector instances.
   */
  static fromArrays(primitives) {
    return primitives.map(this.fromArray);
  }
  /**
   * Applies a mathematical operation to each component of the vector.
   *
   * @param v The other vector or scalar to operate with.
   * @param operator - A function that defines the operation to apply.
   * @returns A reference to the vector.
   */
  operate(v, operator) {
    const vec = this.constructor === v.constructor ? v : this.constructor.fromInput(v);
    this.x = operator(this.x, vec.x);
    this.y = operator(this.y, vec.y);
    if (this.size > 2)
      this.z = operator(this.z, vec.z);
    if (this.size > 3)
      this.w = operator(this.w, vec.w);
    return this;
  }
  /**
   * Adds the components of the vector by the components of another vector or scalar value.
   * @param v The target vector or scalar value.
   * @returns A reference to the vector.
   */
  add(v) {
    return this.operate(v, (x, y) => x + y);
  }
  /**
   * Subtracts the components of the vector by the components of another vector or scalar value.
   * @param v The target vector or scalar value.
   * @returns A reference to the vector.
   */
  subtract(v) {
    return this.operate(v, (x, y) => x - y);
  }
  /**
   * Multiplies the components of the vector by the components of another vector or scalar value.
   * @param v The target vector or scalar value.
   * @returns A reference to the vector.
   */
  multiply(v) {
    return this.operate(v, (x, y) => x * y);
  }
  /**
   * Divides the components of the vector by the components of another vector or scalar value.
   * @param v The target vector or scalar vector.
   * @returns A reference to the vector.
   */
  divide(v) {
    return this.operate(v, (x, y) => x / y);
  }
  /**
   * Linearly interpolates each component of the vector towards another vector or scalar value.
   * @param v The target vector or scalar value.
   * @param factor The interpolation factor, typically between 0 and 1.
   * @returns A reference to the vector.
   */
  lerp(v, factor) {
    return this.operate(v, (a, b) => a + (b - a) * factor);
  }
  /**
   * Computes the dot product of this vector and another.
   *
   * @param v The vector to perform the dot product with.
   * @returns The scalar dot product value.
   */
  dot(v) {
    const vec = v instanceof _Vector ? v : this.constructor.fromInput(v);
    if (this.size !== vec.size)
      throw new Error("Vectors must have the same dimensions.");
    return this.x * vec.x + this.y * vec.y + (this.size > 2 ? this.z * vec.z : 0) + (this.size > 3 ? this.w * vec.w : 0);
  }
  /**
   * Returns a normalized copy of this vector with magnitude 1.
   *
   * @returns A normalized vector.
   */
  normalize() {
    return this.divide(this.length());
  }
  /**
   * Calculates the squared Euclidean length (magnitude) of this vector.
   *
   * @returns The magnitude of the vector.
   */
  lengthSquared() {
    return this.x * this.x + this.y * this.y + (this.size > 2 ? this.z * this.z : 0) + (this.size > 3 ? this.w * this.w : 0);
  }
  /**
   * Calculates the Euclidean length (magnitude) of this vector.
   *
   * @returns The magnitude of the vector.
   */
  length() {
    return Math.sqrt(this.lengthSquared());
  }
  forEach(callback) {
    const keys = this.constructor.keys;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      callback(this[key], key, i);
    }
  }
  /**
   * Returns a string representation of the vector, such as "vector3(1, 2, 3)".
   */
  toString() {
    return `vector${this.size}(${this.toArray().join(", ")})`;
  }
  /**
   * Creates a new vector with the same component values as this one.
   *
   * @returns A cloned vector.
   */
  clone() {
    return this.constructor.fromInput(this);
  }
  /**
   * Computes the squared Euclidean distance to another vector.
   *
   * @param v The vector to compute distance to.
   * @returns The squared distance.
   */
  distanceSquared(v) {
    const vec = v instanceof _Vector ? v : this.constructor.fromInput(v);
    return (this.x - vec.x) ** 2 + (this.y - vec.y) ** 2 + (this.size > 2 ? (this.z - vec.z) ** 2 : 0) + (this.size > 3 ? (this.w - vec.w) ** 2 : 0);
  }
  /**
   * Computes the Euclidean distance to another vector.
   *
   * @param v The vector to compute distance to.
   * @returns The distance.
   */
  distance(v) {
    return Math.sqrt(this.distanceSquared(v));
  }
  /**
   * Converts the vector to an array of component values.
   *
   * @returns An array representing the vector.
   */
  toArray() {
    return [...this];
  }
  /**
   * Replaces the current vector's components with another vector's values.
   *
   * @param v The vector to copy components from.
   * @returns A reference to the vector.
   */
  copy(v) {
    return this.operate(v, (_, y) => y);
  }
  /**
   * Creates a new vector by reordering or duplicating components using a swizzle string.
   *
   * @param components - A string like 'xy', 'zyx', or 'wzyx' specifying the desired component order.
   * @returns A new vector based on the swizzle pattern.
   */
  swizzle(components) {
    if (!/^[xyzw]+$/.test(components))
      throw new Error(`Invalid key in swizzle components (${components}).`);
    const arr = components.split("").map((char) => this[char] ?? 0);
    return new this.constructor(...arr);
  }
  /**
   * Compares this vector to another for exact component equality.
   *
   * @param v The vector to compare with.
   * @returns `true` if all components are equal, otherwise `false`.
   */
  equals(v) {
    if (this.size !== v.size)
      return false;
    const keys = this.constructor.keys;
    for (const key of keys)
      if (this[key] !== v[key])
        return false;
    return true;
  }
  /**
   * Clamps a vector's components between the corresponding components of `min` and `max`.
   * @param min A scalar or vector defining the minimum value for each component.
   * @param max A scalar or vector defining the maximum value for each component.
   * @returns A reference to the vector.
   */
  clamp(min, max) {
    const minVec = typeof min === "number" || min instanceof _Vector ? min : this.constructor.fromInput(min);
    const maxVec = typeof max === "number" || max instanceof _Vector ? max : this.constructor.fromInput(max);
    const minIsNumber = typeof min === "number";
    const maxIsNumber = typeof max === "number";
    this.forEach((value, key) => {
      const minValue = minIsNumber ? min : minVec[key];
      const maxValue = maxIsNumber ? max : maxVec[key];
      this[key] = clamp(value, minValue, maxValue);
    });
    return this;
  }
  /**
   * Rounds the components of the vector up to the nearest integer.
   * @returns A reference to the vector.
   */
  ceil() {
    return this.operate(this, (x) => Math.ceil(x));
  }
  /**
   * Rounds the components of the vector down to the nearest integer.
   * @returns A reference to the vector.
   */
  floor() {
    return this.operate(this, (x) => Math.floor(x));
  }
  /**
   * Rounds the components of the vector to the nearest integer.
   * @returns A reference to the vector.
   */
  round() {
    return this.operate(this, (x) => Math.round(x));
  }
};
var Vector2 = class _Vector2 extends Vector {
  static size = 2;
  static keys = ["x", "y"];
  /**
   * Constructs a new 2D vector.
   * @param x The x-component of the vector.
   * @param y The y-component of the vector.
   */
  constructor(x = 0, y = 0) {
    super(x, y);
    this.x = x;
    this.y = y;
  }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }
  /**
   * Computes the cross product between this and another vector.
   *
   * @param v The other vector.
   * @returns A new vector orthogonal to both inputs.
   */
  cross(v) {
    const vec = v instanceof Vector ? v : _Vector2.fromInput(v);
    return this.x * vec.y - this.y * vec.x;
  }
};
var Vector3 = class _Vector3 extends Vector {
  static size = 3;
  static keys = ["x", "y", "z"];
  z = 0;
  /**
   * Constructs a new 3D vector.
   * @param x The x-component of the vector.
   * @param y The y-component of the vector.
   * @param z The z-component of the vector.
   */
  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z);
    this.x = x;
    this.y = y;
    this.z = z;
  }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }
  /**
   * Computes the cross product between this and another vector.
   *
   * @param v The other vector.
   * @returns A new vector orthogonal to both inputs.
   */
  cross(v) {
    const vec = v instanceof _Vector3 ? v : _Vector3.fromInput(v);
    return new _Vector3(this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
  }
};

// node_modules/@overextended/ox_lib/dist/common/game/Entity/index.js
var isServer = context === "server";
var GameEntity = class extends StateBag {
  #handle = 0;
  type = "";
  netId = 0;
  get handle() {
    return this.#handle;
  }
  setHandle(handle) {
    this.#handle = handle;
    this.netId = NetworkGetNetworkIdFromEntity(handle);
    this.statebag = this.netId ? `${this.type === "Player" ? "player" : "entity"}:${this.netId}` : `localEntity:${handle}`;
    if ((!this.netId || isServer) && this.type !== "Player") EnsureEntityStateBag(handle);
  }
  getCoords() {
    return Vector3.fromArray(GetEntityCoords(this.handle));
  }
  setCoords(x, y, z, deadFlag = false, ragdollFlag = false, clearArea = false) {
    SetEntityCoords(this.handle, x, y, z, true, deadFlag, ragdollFlag, clearArea);
  }
  getModel() {
    return GetEntityModel(this.handle);
  }
  getHeading() {
    return GetEntityHeading(this.handle);
  }
  setHeading(heading) {
    SetEntityHeading(this.handle, heading);
  }
  getRoutingBucket() {
    return isServer ? GetEntityRoutingBucket(this.handle) : this.get("bucket") ?? 0;
  }
  setRoutingBucket(bucket) {
    if (!isServer) return;
    SetEntityRoutingBucket(this.handle, bucket);
    this.set("bucket", bucket, true);
  }
};

// node_modules/@overextended/ox_lib/dist/common/game/Prop/index.js
var Prop = class extends GameEntity {
  type = "Prop";
  constructor(handle) {
    super();
    this.setHandle(handle);
  }
  setOnGround() {
    if (context === "client") return PlaceObjectOnGroundProperly(this.handle);
    return this.set("ox_entity_setonground", true, true);
  }
};

// node_modules/@overextended/ox_lib/dist/common/game/Ped/index.js
var Ped = class extends GameEntity {
  type = "Ped";
  constructor(handle) {
    super();
    if (IsPedAPlayer(handle)) this.type = "Player";
    this.setHandle(handle);
  }
  getArmour() {
    return GetPedArmour(this.handle);
  }
  setArmour(amount) {
    SetPedArmour(this.handle, amount);
  }
};

// node_modules/@overextended/ox_lib/dist/common/game/Player/index.js
var isServer2 = context === "server";
var Player = class extends Ped {
  type = "Player";
  playerId;
  constructor(netId) {
    if (netId === -1) netId = isServer2 ? Number(GetPlayerFromIndex(0)) : GetPlayerServerId(PlayerId());
    const playerId = isServer2 ? netId : GetPlayerFromServerId(netId);
    super(GetPlayerPed(playerId));
    this.playerId = playerId;
  }
  get handle() {
    return isServer2 ? super.handle : GetPlayerPed(this.playerId);
  }
  setModel(model) {
    SetPlayerModel(this.playerId, model);
  }
  getRoutingBucket() {
    return isServer2 ? GetPlayerRoutingBucket(this.playerId) : this.get("bucket") ?? 0;
  }
  setRoutingBucket(bucket) {
    if (!isServer2) return;
    SetPlayerRoutingBucket(this.playerId, bucket);
    this.set("bucket", bucket, true);
  }
};

// node_modules/@overextended/ox_lib/dist/common/game/Vehicle/index.js
var Vehicle = class extends GameEntity {
  constructor(handle) {
    super();
    this.setHandle(handle);
  }
  getType() {
    return GetVehicleType(this.handle);
  }
  getPlate() {
    return GetVehicleNumberPlateText(this.handle);
  }
  setPlate(plate) {
    SetVehicleNumberPlateText(this.handle, plate);
  }
  setOnGround() {
    if (context === "client") return SetVehicleOnGroundProperly(this.handle);
    return this.set("ox_entity_setonground", true, true);
  }
};

// node_modules/@overextended/ox_lib/dist/common/getNearbyVehicles/index.js
init_cache();
function getNearbyVehicles(coords, maxDistance = 2, includePlayerVehicle = false) {
  const vehicles = GetGamePool("CVehicle");
  const nearbyVehicles = [];
  for (const vehicle of vehicles) if (context === "server" || !cache.vehicle || vehicle !== cache.vehicle || includePlayerVehicle) {
    const vehicleCoords = Vector3.fromArray(GetEntityCoords(vehicle, true));
    if (vehicleCoords.distance(coords) < maxDistance && NetworkGetEntityIsNetworked(vehicle)) nearbyVehicles.push({
      vehicle,
      coords: vehicleCoords
    });
  }
  return nearbyVehicles;
}

// node_modules/@overextended/ox_lib/dist/common/hooks/index.js
init_cache();
var hooks = /* @__PURE__ */ new Set();
on("onResourceStop", (resource) => {
  for (let hook of hooks) hook.remove(resource);
});
var HookPipeline = class {
  hooks;
  event;
  filter;
  /**
  * Creates a hook pipeline for a specific event.
  * The pipeline manages a collection of registered hooks and controls execution
  * flow through filtering, rejection, and dispatching.
  *
  * It also exposes external resource hooks:
  * - `registerHook:<event>` adds a hook to the pipeline
  * - `removeHook:<event>` removes a hook from the pipeline
  */
  constructor(event, filter) {
    this.hooks = [];
    this.event = event;
    this.filter = filter;
    hooks.add(this);
    exports(`registerHook:${event}`, (ref, options) => this.registerHook(ref, options));
    exports(`removeHook:${event}`, (hookId) => {
      const resource = GetInvokingResource() || cache.resource;
      this.remove(resource, hookId);
    });
  }
  /**
  * Registers a hook into the pipeline for the current event.
  * @param options Optional metadata attached to the hook.
  */
  registerHook(cb, options) {
    const idx = this.hooks.length;
    const resource = GetInvokingResource() || cache.resource;
    const hook = {};
    if (options) Object.assign(hook, options);
    if (cb) hook.cb = cb;
    hook.resource = resource || cache.resource;
    hook.hookId = `${resource}:${this.event}:${idx}`;
    this.hooks.push(hook);
    return hook.hookId;
  }
  /**
  * Removes hooks from the pipeline.
  * - If `hookId` is provided, only the matching hook is removed.
  * - If omitted, all hooks belonging to the invoking resource are removed.
  */
  remove(resource, hookId) {
    for (let i = this.hooks.length - 1; i >= 0; i--) {
      const hook = this.hooks[i];
      if (hook.resource === resource && (!hookId || hook.hookId === hookId)) this.hooks.splice(i, 1);
    }
  }
  /**
  * Executes the hook pipeline for the payload.
  *
  * Each registered hook is evaluated in order of registration, checking the payload against a provided filter\
  * using the hook options and executing the hook callback.
  *
  * A hook may block execution by returning `false` from the pipeline filter or its own callback.
  *
  * If any hook rejects the execution, dispatch is cancelled and `result.ok` is set to `false`.
  *
  * The returned object acts as a finalisation handle and emits results to registered handlers once closed.
  */
  dispatch(payload) {
    var _a, _b;
    const events = [];
    const result = {
      ok: true,
      size: 0,
      [Symbol.dispose]: () => {
        const packed = msgpack_pack([result.ok, payload]);
        for (let event of events) TriggerEventInternal(event, packed, packed.length);
      }
    };
    for (let hook of this.hooks) {
      const runHook = ((_a = this.filter) == null ? void 0 : _a.call(this, hook, payload)) !== false;
      if (runHook && ((_b = hook.cb) == null ? void 0 : _b.call(hook, payload)) === false) {
        result.ok = false;
        break;
      }
      if (runHook) events.push(hook.hookId);
    }
    result.size = events.length;
    return result;
  }
};
var EventHook = class {
  hookId;
  resource;
  event;
  handler;
  /** Creates a new EventHook instance bound to a specific exported hook. */
  constructor(hookId, resource, event) {
    this.hookId = hookId;
    this.resource = resource;
    this.event = event;
  }
  /**
  * ---Attaches a post-execution event handler for this hook.
  * The handler is triggered after the hooked event completes and receives:
  * - `ok` whether the original event execution succeeded
  * - `payload` the returned or processed event data
  *
  * If a handler is already registered, it will be replaced.
  */
  on(handler) {
    this.off();
    this.handler = handler;
    on(this.hookId, this.handler);
  }
  /** Detaches the currently registered post-hook event handler, if one exists. */
  off() {
    if (!this.handler) return;
    removeEventListener(this.hookId, this.handler);
  }
  /**
  * Fully removes this hook from both the local event system and the external
  * hook registry provided by the originating resource.
  *
  * This invalidates the hook instance; it should not be used afterward.
  */
  remove() {
    this.off();
    exports[this.resource][`removeHook:${this.event}`](this.hookId);
  }
};
function registerHook(eventName, handler, options) {
  const [resource, event] = eventName.split(":", 2);
  if (!resource || !event) throw new Error(`Invalid event format: ${eventName} (expected "resourceName:eventName")`);
  if (handler && !options && typeof handler !== "function") {
    options = handler;
    handler = null;
  }
  return new EventHook(exports[resource][`registerHook:${event}`](handler, options), resource, event);
}

// node_modules/@overextended/ox_lib/dist/common/locale/index.js
init_cache();
var import_fast_printf = __toESM(require_printf(), 1);
var dict = {};
function flattenDict(source2, target, prefix) {
  for (const key in source2) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = source2[key];
    if (typeof value === "object") flattenDict(value, target, fullKey);
    else target[fullKey] = String(value);
  }
  return target;
}
function locale(str, ...args) {
  const lstr = dict[str];
  if (!lstr) return str;
  if (lstr) {
    if (typeof lstr !== "string") return lstr;
    if (args.length > 0) return (0, import_fast_printf.printf)(lstr, ...args);
    return lstr;
  }
  return str;
}
var getLocales = () => dict;
function getLocale(resource, key) {
  let locale2 = dict[key];
  if (locale2) console.warn(`overwritin existing locale '${key} (${locale2})`);
  locale2 = exports[resource].getLocale(key);
  dict[key] = locale2;
  if (!locale2) console.warn(`no locale exists with key '${key} in resource '${resource}`);
  return locale2;
}
function loadLocale(key) {
  const data = LoadResourceFile(cache.resource, `locales/${key}.json`);
  if (!data) console.warn(`could not load 'locales/${key}.json'`);
  return JSON.parse(data) || {};
}
var initLocale = (key) => {
  const lang = key || exports.ox_lib.getLocaleKey();
  let locales = loadLocale("en");
  if (lang !== "en") Object.assign(locales, loadLocale(lang));
  const flattened = flattenDict(locales, {});
  for (let [k, v] of Object.entries(flattened)) {
    if (typeof v === "string") {
      const regExp = /* @__PURE__ */ new RegExp(/\$\{([^}]+)\}/g);
      const matches = v.match(regExp);
      if (matches) for (const match of matches) {
        if (!match) break;
        let locale2 = flattened[match.substring(2, match.length - 1)];
        if (locale2) v = v.replace(match, locale2);
      }
    }
    dict[k] = v;
  }
};
initLocale();
function createLocales() {
  return (key, ...args) => locale(key, ...args);
}

// node_modules/@overextended/ox_lib/dist/common/version/index.js
var checkDependency = (resource, minimumVersion, printMessage) => exports.ox_lib.checkDependency(resource, minimumVersion, printMessage);

// node_modules/@overextended/ox_lib/dist/common/zones/index.js
init_cache();

// node_modules/@overextended/core/dist/grid.js
function filterSet(set, predicate) {
  const result = /* @__PURE__ */ new Set();
  for (const value of set) {
    if (predicate(value))
      result.add(value);
  }
  return result;
}
var Grid = class {
  cellWidth;
  cellHeight;
  #rows = /* @__PURE__ */ new Map();
  #cache = {};
  /** All registered entries in the grid. Should not be directly modified. */
  entries = /* @__PURE__ */ new Set();
  constructor(cellWidth = 128, cellHeight = cellWidth) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.resetCache();
  }
  /**
   * Calculates the grid cell boundaries occupied by a rectangle.
   *
   * @param wx The x-coordinate to convert to grid space.
   * @param wy The y-coordinate to convert to grid space.
   * @param width The width of the rectangle (optional, defaults to cellWidth).
   * @param height The height of the rectangle (optional, defaults to cellHeight).
   * @returns A tuple representing grid cell indices.
   */
  getDimensions(wx, wy, width = this.cellWidth, height = this.cellHeight) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const left = Math.floor((wx - halfWidth) / this.cellWidth);
    const right = Math.floor((wx + halfWidth) / this.cellWidth);
    const top = Math.floor((wy - halfHeight) / this.cellHeight);
    const bottom = Math.floor((wy + halfHeight) / this.cellHeight);
    return [left, right, top, bottom];
  }
  /**
   * Clears the internal cache used to optimise repeated queries.
   */
  resetCache() {
    const entries = this.#cache.entries ?? /* @__PURE__ */ new Set();
    const lastCell = this.#cache.lastCell ?? /* @__PURE__ */ new Set();
    lastCell.clear();
    entries.clear();
    return this.#cache = {
      entries,
      lastCell
    };
  }
  /**
   * Converts world space coordinates to grid-space indices.
   *
   * @param wx The `x` position in world space.
   * @param wy The `y` position in world space.
   * @returns A tuple representing the grid cell indices.
   */
  getGridPosition(wx, wy) {
    const x = Math.floor(wx / this.cellWidth);
    const y = Math.floor(wy / this.cellHeight);
    return [x, y];
  }
  /**
   * Converts grid-space indices to world space coordinates.
   * @param gx The horizontal grid-space index (column).
   * @param gy The vertical grid-space index (row).
   * @returns A tuple representing the centre of the grid cell in world space.
   */
  getWorldPosition(gx, gy) {
    const wx = gx * this.cellWidth + 0.5 * this.cellWidth;
    const wy = gy * this.cellHeight + 0.5 * this.cellHeight;
    return [wx, wy];
  }
  /**
   * Retrieves the set of entries in the cell containing the specified world coordinates.
   * @param wx The `x` position in world space.
   * @param wy The `y` position in world space.
   * @returns A read-only set of entries in the cell.
   */
  getCell(wx, wy) {
    var _a;
    const [gx, gy] = this.getGridPosition(wx, wy);
    if (this.#cache.lastX !== gx || this.#cache.lastY !== gy) {
      this.#cache.lastX = gx;
      this.#cache.lastY = gy;
      this.#cache.lastCell = ((_a = this.#rows.get(gy)) == null ? void 0 : _a.get(gx)) || /* @__PURE__ */ new Set();
    }
    const cell = this.#cache.lastCell;
    return cell;
  }
  /**
   * Retrieves all entries occupying the same or neighbouring grid cells around a point.
   * @param wx The `x` position in world space.
   * @param wy The `y` position in world space.
   * @param predicate An optional filter applied to the entries.
   * @returns A read-only set of matching entries.
   */
  getEntries(wx, wy, predicate) {
    const [left, right, top, bottom] = this.getDimensions(wx, wy);
    if (this.#cache.left === left && this.#cache.right === right && this.#cache.top === top && this.#cache.bottom === bottom) {
      return predicate ? filterSet(this.#cache.entries, predicate) : this.#cache.entries;
    }
    const entries = /* @__PURE__ */ new Set();
    for (let y = top; y <= bottom; y++) {
      const row = this.#rows.get(y);
      if (!row)
        continue;
      for (let x = left; x <= right; x++) {
        const cell = row.get(x);
        if (!cell)
          continue;
        for (const entry of cell) {
          entries.add(entry);
        }
      }
    }
    this.#cache.left = left;
    this.#cache.right = right;
    this.#cache.top = top;
    this.#cache.bottom = bottom;
    this.#cache.entries = entries;
    return predicate ? filterSet(this.#cache.entries, predicate) : this.#cache.entries;
  }
  /**
   * Adds a new entry to the grid.
   * @param entry A new object to add to the grid.
   */
  add(entry) {
    if (this.entries.has(entry)) {
      throw new Error(`Entry already exists in the grid.`);
    }
    const [left, right, top, bottom] = this.getDimensions(entry.x, entry.y, entry.width, entry.height);
    for (let y = top; y <= bottom; y++) {
      let row = this.#rows.get(y);
      if (!row) {
        this.#rows.set(y, row = /* @__PURE__ */ new Map());
      }
      for (let x = left; x <= right; x++) {
        if (!row.has(x))
          row.set(x, /* @__PURE__ */ new Set());
        row.get(x).add(entry);
      }
    }
    this.resetCache();
    this.entries.add(entry);
  }
  /**
   * Removes an entry from the grid.
   * @param entry An existing grid entry.
   */
  remove(entry) {
    if (!this.entries.has(entry))
      return false;
    const [left, right, top, bottom] = this.getDimensions(entry.x, entry.y, entry.width, entry.height);
    let success = false;
    for (let y = top; y <= bottom; y++) {
      const row = this.#rows.get(y);
      if (!row)
        continue;
      for (let x = left; x <= right; x++) {
        const cell = row.get(x);
        if (!cell)
          continue;
        if (cell.delete(entry))
          success = true;
        if (cell.size === 0)
          row.delete(x);
      }
      if (row.size === 0)
        this.#rows.delete(y);
    }
    if (success) {
      this.resetCache();
      this.entries.delete(entry);
    }
    return success;
  }
  /**
   * Adds multiple entries to the grid.
   * @param entries An array of entries to add.
   */
  addAll(entries) {
    for (const entry of entries)
      this.add(entry);
  }
  /**
   * Removes multiple entries from the grid.
   * @param entries An array of entries to remove.
   */
  removeAll(entries) {
    for (const entry of entries)
      this.remove(entry);
  }
  /**
   * Updates the position and dimensions of an existing entry in the grid.
   * @param entry The entry to update.
   */
  update(entry, { x, y, width, height }) {
    if (!this.entries.has(entry)) {
      throw new Error(`Cannot update an entry that doesn't exist in the grid.`);
    }
    this.remove(entry);
    if (typeof x === "number")
      entry.x = x;
    if (typeof y === "number")
      entry.y = y;
    if (typeof width === "number")
      entry.width = width;
    if (typeof height === "number")
      entry.height = height;
    this.add(entry);
  }
  /**
   * Removes all entries from the grid.
   */
  clear() {
    this.#rows.clear();
    this.entries.clear();
    this.resetCache();
  }
};

// node_modules/@overextended/core/dist/geometry.js
var Sphere = class _Sphere {
  coords;
  radius;
  #bounds;
  /**
   * Creates a new sphere.
   * @param coords The centre of the sphere.
   * @param radius The radius of the sphere.
   */
  constructor(coords, radius) {
    if (radius <= 0)
      throw new Error("Radius must be positive.");
    this.coords = coords;
    this.radius = radius;
  }
  /**
   * Calculates the axis-aligned bounding box of the sphere.
   */
  calculateBounds() {
    const { x, y, z } = this.coords;
    const r = this.radius;
    return {
      minX: x - r,
      minY: y - r,
      minZ: z - r,
      maxX: x + r,
      maxY: y + r,
      maxZ: z + r
    };
  }
  /**
   * Checks if a point (x, y, z) lies within the sphere.
   * @param x The x coordinate of the point.
   * @param y The y coordinate of the point.
   * @param z The z coordinate of the point.
   */
  contains(x, y, z) {
    const dx = x - this.coords.x;
    const dy = y - this.coords.y;
    const dz = z - this.coords.z;
    return dx * dx + dy * dy + dz * dz <= this.radius ** 2;
  }
  /**
   * Calculates the geometric centre of the sphere.
   */
  calculateCentroid() {
    return this.coords;
  }
  /**
   * The volume of the sphere.
   */
  get volume() {
    return 4 / 3 * Math.PI * this.radius ** 3;
  }
  /**
   * The axis-aligned bounding box of the sphere.
   */
  get bounds() {
    return this.#bounds ??= Object.freeze(this.calculateBounds());
  }
  /**
   * The geometric centre of the sphere.
   */
  get centroid() {
    return this.coords;
  }
  /**
   * Returns a deep clone of the sphere.
   */
  clone() {
    return new _Sphere(new Vector3(this.coords.x, this.coords.y, this.coords.z), this.radius);
  }
  /**
   * Returns the closest point on the sphere's surface to a given point.
   * @param point The point to project onto the sphere.
   */
  closestPoint(point) {
    const direction = point.clone().subtract(this.coords);
    const distance = direction.length();
    if (distance === 0) {
      direction.x = this.coords.x + this.radius;
      direction.y = this.coords.y;
      direction.z = this.coords.z;
      return direction;
    }
    direction.multiply(this.radius / distance);
    return direction.add(this.coords);
  }
};
var Polygon = class _Polygon {
  vertices;
  #signedArea;
  #bounds;
  #centroid;
  #triangles;
  /**
   * Creates a new 2D polygon.
   * @param vertices An array containing at least 3 vertices.
   */
  constructor(vertices) {
    if (vertices.length < 3)
      throw new Error("A polygon requires at least 3 vertices.");
    this.vertices = vertices;
  }
  /**
   * Calculates the area of the polygon using the shoelace formula.
   *
   * @param signed If `true` returns the signed area, otherwise returns the absolute area of the polygon.
   */
  calculateArea(signed = false) {
    const vertices = this.vertices;
    let area = 0;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const { x: ax, y: ay } = vertices[i];
      const { x: bx, y: by } = vertices[j];
      area += ax * by - bx * ay;
    }
    area /= 2;
    return signed ? area : Math.abs(area);
  }
  /**
   * Calculates the axis-aligned bounding box of the polygon.
   */
  calculateBounds() {
    let [minX, maxX] = [Infinity, -Infinity];
    let [minY, maxY] = [Infinity, -Infinity];
    for (const v of this.vertices) {
      if (v.x < minX)
        minX = v.x;
      if (v.y < minY)
        minY = v.y;
      if (v.x > maxX)
        maxX = v.x;
      if (v.y > maxY)
        maxY = v.y;
    }
    return { minX, minY, maxX, maxY };
  }
  /**
   * Calculates the geometric centre of the polygon.
   */
  calculateCentroid() {
    const vertices = this.vertices;
    let x = 0;
    let y = 0;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const { x: ax, y: ay } = vertices[i];
      const { x: bx, y: by } = vertices[j];
      const cross = ax * by - bx * ay;
      x += (ax + bx) * cross;
      y += (ay + by) * cross;
    }
    const f = 1 / (6 * this.signedArea);
    return new Vector2(x * f, y * f);
  }
  calculateTriangles() {
    const triangles = [];
    if (this.isConvex()) {
      for (let i = 1; i < this.vertices.length - 1; i++) {
        triangles.push([
          this.vertices[0],
          this.vertices[i],
          this.vertices[i + 1]
        ]);
      }
      return triangles;
    }
    const isCCW = this.signedArea > 0;
    const indices = Array.from({ length: this.vertices.length }, (_, i) => isCCW ? this.vertices.length - 1 - i : i);
    while (true) {
      let foundEar = false;
      for (let i = 0; i < indices.length; i++) {
        const i1 = indices[(i - 1 + indices.length) % indices.length];
        const i2 = indices[i];
        const i3 = indices[(i + 1) % indices.length];
        const a = this.vertices[i1];
        const b = this.vertices[i2];
        const c = this.vertices[i3];
        const cross = _Polygon.cross(a, b, c);
        if (cross <= 0)
          continue;
        let isEar = true;
        for (let j = 0; j < indices.length; j++) {
          const idx = indices[j];
          if (idx === i1 || idx === i2 || idx === i3)
            continue;
          const p = this.vertices[idx];
          const c1 = _Polygon.cross(a, b, p);
          const c2 = _Polygon.cross(b, c, p);
          const c3 = _Polygon.cross(c, a, p);
          const hasNeg = c1 < 0 || c2 < 0 || c3 < 0;
          const hasPos = c1 > 0 || c2 > 0 || c3 > 0;
          const pointInTriangle = !(hasNeg && hasPos);
          if (pointInTriangle) {
            isEar = false;
            break;
          }
        }
        if (isEar) {
          foundEar = true;
          triangles.push([a, b, c]);
          indices.splice(i, 1);
          break;
        }
      }
      if (!foundEar) {
        console.error("Triangulation failed: possible non-simple or degenerate polygon");
        break;
      }
      if (indices.length === 3) {
        const [i1, i2, i3] = indices;
        triangles.push([
          this.vertices[i1],
          this.vertices[i2],
          this.vertices[i3]
        ]);
        break;
      }
    }
    return triangles;
  }
  /**
   * The absolute area of the polygon.
   */
  get area() {
    return Math.abs(this.signedArea);
  }
  /**
   * The signed area of the polygon.
   */
  get signedArea() {
    return this.#signedArea ??= this.calculateArea(true);
  }
  /**
   * The axis-aligned bounding box of the polygon.
   */
  get bounds() {
    return this.#bounds ??= Object.freeze(this.calculateBounds());
  }
  /**
   * The geometric centre of the polygon.
   */
  get centroid() {
    return this.#centroid ??= Object.freeze(this.calculateCentroid());
  }
  get triangles() {
    return this.#triangles ??= Object.freeze(this.calculateTriangles());
  }
  /**
   * Returns a deep clone of the polygon.
   */
  clone() {
    return new _Polygon(this.vertices.map((v) => new Vector2(v.x, v.y)));
  }
  /**
   * Checks if a point (x, y) lies within the polygon using the ray-casting algorithm.
   * @param x The x coordinate of the point.
   * @param y The y coordinate of the point.
   */
  contains(x, y) {
    const vertices = this.vertices;
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const { x: ax, y: ay } = vertices[i];
      const { x: bx, y: by } = vertices[j];
      const intersect = ay > y !== by > y && x < (bx - ax) * (y - ay) / (by - ay || Number.EPSILON) + ax;
      if (intersect)
        inside = !inside;
    }
    return inside;
  }
  /**
   * Returns the closest point on the polygon's edges to a given point.
   * @param point The point to project onto the polygon.
   */
  closestPoint(point) {
    const closestPoint = new Vector2();
    const edgeVector = new Vector2();
    const pointVector = new Vector2();
    const projectedPoint = new Vector2();
    const vertices = this.vertices;
    let minDistanceSq = Infinity;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const startVertex = vertices[j];
      const endVertex = vertices[i];
      edgeVector.x = endVertex.x - startVertex.x;
      edgeVector.y = endVertex.y - startVertex.y;
      pointVector.x = point.x - startVertex.x;
      pointVector.y = point.y - startVertex.y;
      const factor = clamp(pointVector.dot(edgeVector) / edgeVector.lengthSquared(), 0, 1);
      projectedPoint.x = startVertex.x + edgeVector.x * factor;
      projectedPoint.y = startVertex.y + edgeVector.y * factor;
      const distanceSq = projectedPoint.distanceSquared(point);
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestPoint.copy(projectedPoint);
      }
    }
    return closestPoint;
  }
  /**
   * Calculates the cross product of three points.
   */
  static cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }
  /**
   * Determines if the polygon is convex.
   */
  isConvex() {
    const vertices = this.vertices;
    const n = vertices.length;
    let sign = 0;
    for (let i = 0; i < n; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % n];
      const c = vertices[(i + 2) % n];
      const cross = _Polygon.cross(a, b, c);
      if (cross !== 0) {
        const currentSign = cross > 0 ? 1 : -1;
        if (sign === 0) {
          sign = currentSign;
        } else if (sign !== currentSign) {
          return false;
        }
      }
    }
    return true;
  }
};
var Prism = class _Prism {
  /**
   * Creates a rectangular prism extending out from the origin coordinates.
   *
   * @param origin The centre position of the prism.
   * @param width  The length of the prism along the X axis.
   * @param depth  The length of the prism along the Y axis.
   * @param height The length of the prism along the Z axis.
   * @param heading Rotation of the prism in degrees.
   */
  static createCuboid(origin, width, depth, height, heading = 0) {
    let { x, y, z } = origin;
    const hw = width / 2;
    const hd = depth / 2;
    const vertices = [
      new Vector2(x - hw, y - hd),
      new Vector2(x + hw, y - hd),
      new Vector2(x + hw, y + hd),
      new Vector2(x - hw, y + hd)
    ];
    if (heading) {
      const rad = heading * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      vertices.forEach((v) => {
        const dx = v.x - x;
        const dy = v.y - y;
        v.x = x + dx * cos - dy * sin;
        v.y = y + dx * sin + dy * cos;
      });
    }
    height = Math.abs(height);
    return new _Prism(vertices, height, z);
  }
  z;
  height;
  polygon;
  #bounds;
  #centroid;
  /**
   * Creates a new extruded polygon.
   * @param vertices An array containing at least 3 vertices.
   * @param height Total height of the prism.
   * @param z The centre Z position of the prism.
   */
  constructor(vertices, height, z) {
    if (height <= 0)
      throw new Error("Height must be positive number.");
    this.polygon = new Polygon(vertices);
    this.z = z;
    this.height = height;
  }
  /**
   * The axis-aligned bounding box of the extruded polygon.
   */
  get bounds() {
    return this.#bounds ??= Object.freeze(this.calculateBounds());
  }
  /**
   * The geometric centre of the extruded polygon.
   */
  get centroid() {
    return this.#centroid ??= Object.freeze(this.calculateCentroid());
  }
  /**
   * The volume of the extruded polygon.
   */
  get volume() {
    return this.polygon.area * this.height;
  }
  /**
   * Returns a deep clone of the extruded polygon.
   */
  clone() {
    return new _Prism(this.polygon.vertices.map((v) => new Vector2(v.x, v.y)), this.height, this.z);
  }
  /**
   * Calculates the axis-aligned bounding box of the extruded polygon.
   */
  calculateBounds() {
    const bounds = this.polygon.calculateBounds();
    const half = this.height / 2;
    bounds.minZ = this.z - half;
    bounds.maxZ = this.z + half;
    return bounds;
  }
  /**
   * Calculates the geometric centre of the extruded polygon.
   */
  calculateCentroid() {
    const { x, y } = this.polygon.calculateCentroid();
    return new Vector3(x, y, this.z);
  }
  /**
   * Checks if a point (x, y, z) lies within the extruded polygon.
   * @param x The x coordinate of the point.
   * @param y The y coordinate of the point.
   * @param z The z coordinate of the point.
   */
  contains(x, y, z) {
    const half = this.height / 2;
    if (z < this.z - half || z > this.z + half)
      return false;
    return this.polygon.contains(x, y);
  }
  /**
   * Returns the closest point on the prism's surface to a given point.
   * @param point The 3D point to project onto the prism.
   */
  closestPoint(point) {
    const [x, y] = this.polygon.closestPoint(point);
    const half = this.height / 2;
    const z = clamp(point.z, this.z - half, this.z + half);
    return new Vector3(x, y, z);
  }
};

// node_modules/@overextended/ox_lib/dist/common/zones/index.js
console.warn(`The ox_lib zones module is experimental and may change in future versions.`);
var Zone = class Zone2 {
  static nextId = 1;
  static map = /* @__PURE__ */ new Map();
  static grid = new Grid();
  static Prism(...args) {
    return new Zone2(new Prism(...args));
  }
  static Cuboid(...args) {
    return new Zone2(Prism.createCuboid(...args));
  }
  static Sphere(...args) {
    return new Zone2(new Sphere(...args));
  }
  static delete(id) {
    const zone = Zone2.map.get(id);
    if (zone) {
      Zone2.map.delete(id);
      Zone2.grid.remove(zone);
    }
  }
  static getNearby(point) {
    return Zone2.grid.getEntries(point.x, point.y);
  }
  static has(id) {
    return Zone2.map.has(id);
  }
  shouldDraw = false;
  constructor(shape) {
    this.shape = shape;
    this.x = shape.centroid.x;
    this.y = shape.centroid.y;
    this.id = `zone:${Zone2.nextId++}`;
    if (shape instanceof Prism) {
      const bounds = shape.bounds;
      this.width = Math.abs(bounds.maxX - bounds.minX);
      this.height = Math.abs(bounds.maxY - bounds.minY);
    } else {
      const diametre = ("circle" in shape ? shape.circle.radius : shape.radius) * 2;
      this.width = diametre;
      this.height = diametre;
    }
    Zone2.grid.add(this);
    Zone2.map.set(this.id, this);
  }
  draw(red = 255, green = 42, blue = 24, alpha = 100) {
    if (cache.game === "fxserver") return;
    if (this.shape instanceof Sphere) {
      const { x, y, z } = this.shape.coords;
      const radius = this.shape.radius;
      return DrawMarker(28, x, y, z, 0, 0, 0, 0, 0, 0, radius, radius, radius, red, green, blue, alpha, false, false, 0, false, null, null, false);
    }
    if (this.shape instanceof Prism) {
      const polygon = this.shape.polygon;
      const half = this.shape.height / 2;
      const minZ = this.shape.z - half;
      const maxZ = this.shape.z + half;
      for (let i = 0; i < polygon.vertices.length; i++) {
        const curr = polygon.vertices[i];
        const next = polygon.vertices[i + 1] || polygon.vertices[0];
        DrawLine(curr.x, curr.y, minZ, curr.x, curr.y, maxZ, red, green, blue, 225);
        DrawLine(curr.x, curr.y, maxZ, next.x, next.y, maxZ, red, green, blue, 225);
        DrawLine(curr.x, curr.y, minZ, next.x, next.y, minZ, red, green, blue, 225);
        DrawPoly(curr.x, curr.y, minZ, curr.x, curr.y, maxZ, next.x, next.y, maxZ, red, green, blue, alpha);
        DrawPoly(curr.x, curr.y, minZ, next.x, next.y, maxZ, next.x, next.y, minZ, red, green, blue, alpha);
        DrawPoly(curr.x, curr.y, minZ, next.x, next.y, maxZ, curr.x, curr.y, maxZ, red, green, blue, alpha);
        DrawPoly(curr.x, curr.y, minZ, next.x, next.y, minZ, next.x, next.y, maxZ, red, green, blue, alpha);
      }
      for (let i = 0; i < polygon.triangles.length; i++) {
        const [a, b, c] = polygon.triangles[i];
        DrawPoly(a.x, a.y, minZ, b.x, b.y, minZ, c.x, c.y, minZ, red, green, blue, alpha);
        DrawPoly(a.x, a.y, maxZ, b.x, b.y, maxZ, c.x, c.y, maxZ, red, green, blue, alpha);
        DrawPoly(b.x, b.y, minZ, a.x, a.y, minZ, c.x, c.y, minZ, red, green, blue, alpha);
        DrawPoly(b.x, b.y, maxZ, a.x, a.y, maxZ, c.x, c.y, maxZ, red, green, blue, alpha);
      }
      return;
    }
  }
};
function startPolling() {
  if (cache.game === "fxserver") return;
  let nearbyZones = /* @__PURE__ */ new Set();
  let insideZones = /* @__PURE__ */ new Set();
  let lastZones = /* @__PURE__ */ new Set();
  setInterval(() => {
    const coords = Vector3.fromArray(GetEntityCoords(cache.ped, true));
    cache.coords = coords;
    nearbyZones = Zone.getNearby(coords);
    [lastZones, insideZones] = [insideZones, lastZones];
    insideZones.clear();
    for (const zone of nearbyZones) if (zone.shape.contains(coords.x, coords.y, coords.z)) {
      insideZones.add(zone);
      if (!lastZones.has(zone)) {
        if (zone.onEnter) zone.onEnter();
      } else lastZones.delete(zone);
    }
    for (const zone of lastZones) if (zone.onExit) zone.onExit();
  }, 300);
  setTick(() => {
    for (const zone of nearbyZones) if (zone.shouldDraw) zone.draw();
    for (const zone of insideZones) if (zone.inside) zone.inside();
  });
}
startPolling();

// node_modules/@overextended/ox_lib/dist/server/acl/index.js
var addAce = (principal, ace, allow) => exports.ox_lib.addAce(principal, ace, allow);
var removeAce = (principal, ace, allow) => exports.ox_lib.addAce(principal, ace, allow);
var addPrincipal = (child, parent) => exports.ox_lib.addPrincipal(child, parent);
var removePrincipal = (child, parent) => exports.ox_lib.removePrincipal(child, parent);

// node_modules/@overextended/ox_lib/dist/server/addCommand/index.js
var registeredCommmands = [];
var shouldSendCommands = false;
setTimeout(() => {
  shouldSendCommands = true;
  emitNet("chat:addSuggestions", -1, registeredCommmands);
}, 1e3);
on("playerJoining", () => {
  emitNet("chat:addSuggestions", source, registeredCommmands);
});
function parseArguments(source2, args, raw, params) {
  if (!params) return args;
  return params.every((param, index) => {
    const arg = args[index];
    let value;
    switch (param.paramType) {
      case "number":
        value = +arg;
        break;
      case "string":
        value = !Number(arg) ? arg : false;
        break;
      case "playerId":
        value = arg === "me" ? source2 : +arg;
        if (!value || !DoesPlayerExist(value.toString())) value = false;
        break;
      case "longString":
        value = raw.substring(raw.indexOf(arg));
        break;
      default:
        value = arg;
        break;
    }
    if (value === void 0 && (!param.optional || param.optional && arg)) return Citizen.trace(`^1command '${raw.split(" ")[0] || raw}' received an invalid ${param.paramType} for argument ${index + 1} (${param.name}), received '${arg}'^0`);
    args[param.name] = value;
    delete args[index];
    return true;
  }) ? args : void 0;
}
function addCommand(commandName, cb, properties) {
  const restricted = properties == null ? void 0 : properties.restricted;
  const params = properties == null ? void 0 : properties.params;
  if (params) params.forEach((param) => {
    if (param.paramType) param.help = param.help ? `${param.help} (type: ${param.paramType})` : `(type: ${param.paramType})`;
  });
  const commands = typeof commandName !== "object" ? [commandName] : commandName;
  const numCommands = commands.length;
  const commandHandler = (source2, args, raw) => {
    const parsed = parseArguments(source2, args, raw, params);
    if (!parsed) return;
    cb(source2, parsed, raw).catch((e) => Citizen.trace(`^1command '${raw.split(" ")[0] || raw}' failed to execute!^0
${e.message}`));
  };
  commands.forEach((commandName2, index) => {
    RegisterCommand(commandName2, commandHandler, restricted ? true : false);
    if (restricted) {
      const ace = `command.${commandName2}`;
      const restrictedType = typeof restricted;
      if (restrictedType === "string" && !IsPrincipalAceAllowed(restricted, ace)) addAce(restricted, ace, true);
      else if (restrictedType === "object") restricted.forEach((principal) => {
        if (!IsPrincipalAceAllowed(principal, ace)) addAce(principal, ace, true);
      });
    }
    if (properties) {
      properties.name = `/${commandName2}`;
      delete properties.restricted;
      registeredCommmands.push(properties);
      if (index !== numCommands && numCommands !== 1) properties = { ...properties };
      if (shouldSendCommands) emitNet("chat:addSuggestions", -1, properties);
    }
  });
}

// node_modules/@overextended/ox_lib/dist/server/callback/index.js
init_cache();
var pendingCallbacks2 = {};
var callbackTimeout2 = GetConvarInt("ox:callbackTimeout", 3e5);
onNet(`__ox_cb_${cache.resource}`, (key, ...args) => {
  const resolve3 = pendingCallbacks2[key];
  if (!resolve3) return;
  delete pendingCallbacks2[key];
  resolve3(...args);
});
function triggerClientCallback(eventName, playerId, ...args) {
  let key;
  do
    key = `${eventName}:${Math.floor(Math.random() * 100001)}:${playerId}`;
  while (pendingCallbacks2[key]);
  emitNet(`ox_lib:validateCallback`, playerId, eventName, cache.resource, key);
  emitNet(`__ox_cb_${eventName}`, playerId, cache.resource, key, ...args);
  return new Promise((resolve3, reject) => {
    pendingCallbacks2[key] = (args2) => {
      if (Array.isArray(args2) && args2[0] === "cb_invalid") reject(`callback '${eventName} does not exist`);
      resolve3(args2);
    };
    setTimeout(reject, callbackTimeout2, `callback event '${key}' timed out`);
  });
}
function onClientCallback(eventName, cb) {
  exports.ox_lib.setValidCallback(eventName, true);
  onNet(`__ox_cb_${eventName}`, async (resource, key, ...args) => {
    const src = source;
    let response;
    try {
      response = await cb(src, ...args);
    } catch (e) {
      console.error(`an error occurred while handling callback event ${eventName}`);
      console.log(`^3${e.stack}^0`);
    }
    emitNet(`__ox_cb_${resource}`, src, key, response);
  });
}

// node_modules/@overextended/ox_lib/dist/server/game/Prop/index.js
async function createObject(model, x, y, z, heading = 0, isNetworked = false, netMissionEntity = false, dynamic = false) {
  const prop = new Prop(CreateObjectNoOffset(model, x, y, z, isNetworked, netMissionEntity, dynamic));
  if (heading) prop.setHeading(heading);
  return prop;
}

// node_modules/@overextended/ox_lib/dist/server/game/Ped/index.js
async function createPed(model, x, y, z, heading = 0) {
  return new Ped(CreatePed(0, model, x, y, z, heading, true, true));
}

// node_modules/@overextended/ox_lib/dist/server/game/Vehicle/index.js
var CreateVehicleServerSetter = globalThis.CreateVehicleServerSetter || ((model, type, x, y, z, heading = 0) => {
  return CreateVehicle(model, x, y, z, heading, true, true);
});
async function createVehicle(model, type, x, y, z, heading = 0) {
  return new Vehicle(CreateVehicleServerSetter(model, type, x, y, z, heading));
}

// node_modules/@overextended/ox_lib/dist/server/locale/index.js
var getServerLocale = () => exports.ox_lib.getServerLocale();

// node_modules/@overextended/ox_lib/dist/server/version/index.js
var versionCheck = (repository) => exports.ox_lib.versionCheck(repository);

// node_modules/@overextended/ox_lib/dist/server/misc.js
function setVehicleProperties(vehicle, props) {
  Entity(vehicle).state.set("ox_lib:setVehicleProperties", props, true);
}

// node_modules/@overextended/ox_lib/dist/server/index.js
var server_exports2 = /* @__PURE__ */ __exportAll({
  GameEntity: () => GameEntity,
  HookPipeline: () => HookPipeline,
  Ped: () => Ped,
  Player: () => Player,
  Prop: () => Prop,
  StateBag: () => StateBag,
  Vehicle: () => Vehicle,
  Zone: () => Zone,
  addAce: () => addAce,
  addCommand: () => addCommand,
  addPrincipal: () => addPrincipal,
  cache: () => cache,
  checkDependency: () => checkDependency,
  context: () => context,
  createLocales: () => createLocales,
  createObject: () => createObject,
  createPed: () => createPed,
  createVehicle: () => createVehicle,
  getLocale: () => getLocale,
  getLocales: () => getLocales,
  getNearbyVehicles: () => getNearbyVehicles,
  getRandomAlphanumeric: () => getRandomAlphanumeric,
  getRandomChar: () => getRandomChar,
  getRandomInt: () => getRandomInt,
  getRandomString: () => getRandomString,
  getServerLocale: () => getServerLocale,
  initLocale: () => initLocale,
  lib: () => server_exports2,
  locale: () => locale,
  onCache: () => onCache,
  onClientCallback: () => onClientCallback,
  registerHook: () => registerHook,
  removeAce: () => removeAce,
  removePrincipal: () => removePrincipal,
  setVehicleProperties: () => setVehicleProperties,
  sleep: () => sleep3,
  triggerClientCallback: () => triggerClientCallback,
  versionCheck: () => versionCheck,
  waitFor: () => waitFor
});

// src/server/plugins/oxlib/index.ts
var RESOURCE2 = "ox_lib";
var NotifyInput = external_exports.object({
  serverId: external_exports.number().int().min(1),
  title: external_exports.string().min(1).max(120),
  description: external_exports.string().max(2048).optional(),
  type: external_exports.enum(["inform", "success", "warning", "error"]).optional(),
  duration: external_exports.number().int().min(500).max(6e4).optional(),
  position: external_exports.enum([
    "top",
    "top-right",
    "top-left",
    "bottom",
    "bottom-right",
    "bottom-left",
    "center-right",
    "center-left"
  ]).optional()
}).strict();
var CallbackInput = external_exports.object({
  serverId: external_exports.number().int().min(1),
  event: external_exports.string().min(1),
  args: external_exports.array(external_exports.unknown()).optional(),
  timeoutMs: external_exports.number().int().min(100).max(3e4).optional()
}).strict();
var oxLibPlugin = {
  name: "oxlib",
  description: "ox_lib bridge \u2014 notifications, client callbacks, version check.",
  detect: () => isResourceStarted(RESOURCE2),
  install: ({ register: register2, convars }) => {
    register2({
      name: "oxlib_notify",
      description: "Trigger an ox_lib UI notification on one player.",
      input: NotifyInput,
      handler: async (input) => {
        emitNet("ox_lib:notify", input.serverId, {
          title: input.title,
          description: input.description,
          type: input.type ?? "inform",
          duration: input.duration,
          position: input.position
        });
        return ok({ sent: true });
      }
    });
    register2({
      name: "oxlib_trigger_client_callback",
      description: "Round-trip call: trigger an ox_lib client callback on one player and return their reply.",
      input: CallbackInput,
      handler: async (input) => {
        try {
          const timer = new Promise(
            (res) => setTimeout(() => res(TIMEOUT_SYMBOL), input.timeoutMs ?? 5e3)
          );
          const call = triggerClientCallback(
            input.event,
            input.serverId,
            ...input.args ?? []
          );
          const result = await Promise.race([call, timer]);
          if (result === TIMEOUT_SYMBOL) {
            return err("TIMEOUT", `ox_lib callback ${input.event} timed out.`);
          }
          return ok({ result });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
    register2({
      name: "oxlib_check_dependency",
      description: "Use ox_lib versionCheck to confirm a resource meets a minimum semver version.",
      input: external_exports.object({
        resource: external_exports.string().min(1),
        minVersion: external_exports.string().min(1)
      }).strict(),
      handler: async (input) => {
        try {
          versionCheck(`${input.resource}@${input.minVersion}`);
          return ok({ checked: true });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
    register2({
      name: "oxlib_list_methods",
      description: "List every exported function from @overextended/ox_lib/server \u2014 use before oxlib_call.",
      input: external_exports.object({}).strict(),
      handler: async () => {
        const fns = [];
        const ns = [];
        for (const k of Object.keys(server_exports)) {
          const v = server_exports[k];
          if (typeof v === "function") fns.push(k);
          else if (v !== null && typeof v === "object") ns.push(k);
        }
        return ok({ methods: fns.sort(), namespaces: ns.sort() });
      }
    });
    const blocklist = csvSet("agent_api_plugin_oxlib_blocked_methods");
    register2({
      name: "oxlib_call",
      description: 'Call any exported function from @overextended/ox_lib/server dynamically. Pass a dotted path (e.g. "addAce" or "cache.serverId") and arguments. Read-only verbs always allowed; mutating verbs require agent_api_readonly=false.',
      input: external_exports.object({
        path: external_exports.string().regex(/^[a-zA-Z_][a-zA-Z0-9_.]*$/),
        args: external_exports.array(external_exports.unknown()).optional()
      }).strict(),
      handler: async (input) => {
        const parts = input.path.split(".");
        const leaf = parts.at(-1) ?? input.path;
        const guard = isAllowed(leaf, { readonly: convars.readonly, blocklist });
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        let target = server_exports;
        for (let i = 0; i < parts.length - 1; i++) {
          target = target[parts[i]];
          if (target == null) {
            return err("INVALID_INPUT", `ox_lib path segment not found: ${parts[i]}`);
          }
        }
        const fnOrValue = target[leaf];
        if (typeof fnOrValue !== "function") {
          return ok({ path: input.path, kind: "value", value: safeSerialize(fnOrValue) });
        }
        try {
          const raw = await Promise.resolve(
            fnOrValue.apply(target, input.args ?? [])
          );
          return ok({ path: input.path, kind: "call", result: safeSerialize(raw) });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
  }
};
var TIMEOUT_SYMBOL = Symbol("oxlib-callback-timeout");

// src/server/plugins/oxmysql/index.ts
var import_oxmysql = __toESM(require_MySQL());
var RESOURCE3 = "oxmysql";
function firstWord(q) {
  var _a;
  return ((_a = q.trim().split(/\s+/)[0]) == null ? void 0 : _a.toUpperCase()) ?? "";
}
function readonlyMode() {
  const v = GetConvar("agent_api_plugin_oxmysql_readonly", "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "no" && v !== "off";
}
function statementAllowlist() {
  return new Set(
    GetConvar("agent_api_plugin_oxmysql_allow_statements", "SELECT").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  );
}
function guardQuery(query) {
  const verb = firstWord(query);
  if (!verb) return { ok: false, reason: "empty query" };
  if (readonlyMode() && verb !== "SELECT") {
    return { ok: false, reason: `oxmysql is in readonly mode (only SELECT allowed, got ${verb})` };
  }
  if (!statementAllowlist().has(verb)) {
    return {
      ok: false,
      reason: `statement ${verb} is not in agent_api_plugin_oxmysql_allow_statements`
    };
  }
  return { ok: true };
}
var QueryInput = external_exports.object({
  query: external_exports.string().min(1).max(1e4),
  params: external_exports.array(external_exports.unknown()).max(64).optional(),
  rowLimit: external_exports.number().int().min(1).max(1e3).optional()
}).strict();
var oxMysqlPlugin = {
  name: "oxmysql",
  description: "oxmysql bridge \u2014 gated SQL via @overextended/oxmysql. SELECT-only by default.",
  detect: () => isResourceStarted(RESOURCE3),
  install: ({ register: register2 }) => {
    register2({
      name: "oxmysql_query",
      description: "Run a SELECT query and return rows. Statement type is restricted by agent_api_plugin_oxmysql_readonly (default true) and agent_api_plugin_oxmysql_allow_statements (default SELECT).",
      input: QueryInput,
      handler: async (input) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        try {
          const rows = await import_oxmysql.oxmysql.query(input.query, input.params ?? []);
          const limit = input.rowLimit ?? 100;
          const arr = Array.isArray(rows) ? rows : rows == null ? [] : [rows];
          const trimmed = arr.slice(0, limit);
          return ok({
            rowCount: arr.length,
            truncated: arr.length > limit,
            rows: trimmed
          });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
    register2({
      name: "oxmysql_scalar",
      description: "Run a query and return only the first column of the first row.",
      input: QueryInput,
      handler: async (input) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        try {
          const value = await import_oxmysql.oxmysql.scalar(input.query, input.params ?? []);
          return ok({ value });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
    register2({
      name: "oxmysql_execute",
      description: "Run a non-SELECT statement (INSERT/UPDATE/DELETE/DDL). Requires agent_api_plugin_oxmysql_readonly=false AND the statement verb to be in agent_api_plugin_oxmysql_allow_statements.",
      input: QueryInput,
      handler: async (input) => {
        const guard = guardQuery(input.query);
        if (!guard.ok) return err("COMMAND_NOT_ALLOWED", guard.reason);
        try {
          const result = await import_oxmysql.oxmysql.rawExecute(input.query, input.params ?? []);
          return ok({ result });
        } catch (e) {
          return err("INTERNAL", e instanceof Error ? e.message : String(e));
        }
      }
    });
  }
};

// src/server/plugins/index.ts
var ALL_PLUGINS = [esxPlugin, oxLibPlugin, oxMysqlPlugin];

// src/server/plugins/loader.ts
function pluginConvar(name) {
  return `agent_api_plugin_${name}_enabled`;
}
function isExplicitlyDisabled(plugin) {
  const v = GetConvar(pluginConvar(plugin.name), "auto").toLowerCase();
  return v === "false" || v === "0" || v === "no" || v === "off";
}
function isExplicitlyEnabled(plugin) {
  const v = GetConvar(pluginConvar(plugin.name), "auto").toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on" || v === "force";
}
function loadPlugins(plugins, convars) {
  const before = new Set(listTools().map((t) => t.name));
  const statuses = [];
  for (const plugin of plugins) {
    if (isExplicitlyDisabled(plugin)) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: `${pluginConvar(plugin.name)} = false`,
        toolNames: []
      });
      continue;
    }
    const detected = plugin.detect();
    if (!detected.ok && !isExplicitlyEnabled(plugin)) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: detected.reason,
        toolNames: []
      });
      continue;
    }
    try {
      plugin.install({ convars, register });
      const after = new Set(listTools().map((t) => t.name));
      const added = [...after].filter((n) => !before.has(n));
      for (const n of added) before.add(n);
      statuses.push({ name: plugin.name, enabled: true, toolNames: added });
    } catch (e) {
      statuses.push({
        name: plugin.name,
        enabled: false,
        reason: `install failed: ${e instanceof Error ? e.message : String(e)}`,
        toolNames: []
      });
    }
  }
  return statuses;
}
function logPluginStatuses(statuses) {
  const tag = `[${GetCurrentResourceName()}]`;
  if (statuses.length === 0) {
    console.log(`${tag} plugins: (none registered)`);
    return;
  }
  for (const s of statuses) {
    if (s.enabled) {
      console.log(
        `${tag} plugin enabled : ${s.name} (+${s.toolNames.length} tools: ${s.toolNames.join(", ") || "-"})`
      );
    } else {
      console.log(`${tag} plugin skipped : ${s.name} (${s.reason})`);
    }
  }
}

// src/server/tools/plugins.ts
var snapshotRef = [];
function setPluginSnapshot(snapshot2) {
  snapshotRef = snapshot2;
}
function registerListPlugins() {
  register({
    name: "list_plugins",
    description: "Show which framework plugins (ESX, ox_lib, oxmysql, ...) are enabled.",
    input: external_exports.object({}).strict(),
    handler: async () => ok({ plugins: snapshotRef })
  });
}

// src/server/mcp/prompts/scaffoldFivem.ts
var SCAFFOLD_FIVEM_SCRIPT = `# FiveM Resource Scaffold \u2014 Grill Mode

You are about to scaffold a brand new FiveM resource for the user via the **agent_api** MCP tools. This prompt is a **hard contract**. Read it once, then follow it exactly.

---

## Mandatory rules

1. **DO NOT call \`create_resource\`, \`write_file\`, \`refresh_resources\`, or \`ensure_resource\` until every question in this script has been answered and you have replayed the full summary back to the user and they have explicitly confirmed.**
2. **Ask one question at a time.** Never batch questions. Wait for the user's answer before moving on.
3. **Every question MUST include a "Recommended:" line** with one option pre-picked and a one-sentence reason. The user should be able to type "ok"/"\u0E40\u0E2D\u0E32" and move forward.
4. **Never assume.** If a downstream question only makes sense given a specific previous answer (e.g. UI framework only matters if UI=yes), still ask it explicitly when its branch becomes active. Do not skip silently.
5. **Capture every answer** \u2014 at the end, replay all of them as a checklist before scaffolding starts.
6. **Reply in the user's language.** The user's prior turns set the language. Match it. Keep tone tight and direct.

---

## Question tree

Walk this tree top-to-bottom. **Branches in bold** activate based on prior answers. Skip nothing in an active branch.

### 1. Identity

1.1 **Resource name?** (snake_case, [a-zA-Z][a-zA-Z0-9_-]{0,63})
    Recommended: ask the user, no good default exists.

1.2 **One-line description?** (used in fxmanifest and README)
    Recommended: derive from prior conversation, but confirm.

1.3 **Author?**
    Recommended: \`agent\` \u2014 they can change it later in fxmanifest.

### 2. Layout

2.1 **File layout?**
    - **A) One file** \u2014 single \`server.lua\` (or \`client.lua\`) doing everything. Good for prototypes, single-purpose utilities.
    - **B) Multiple files** \u2014 split by responsibility into subfolders. Required if the resource has more than ~150 LOC, has both client + server logic, or you want \`ox_lib\` integration.

    Recommended: **B** unless the user explicitly wants a one-file utility.

2.2 **If B \u2014 folder layout enforcement:**
    - **NEVER flat**. Group every file into a purpose-named subfolder.
    - Use this skeleton as the baseline (omit folders the resource doesn't need):
      \`\`\`
      <name>/
        fxmanifest.lua
        config/
          shared.lua            # values exposed to both runtimes
          client.lua            # client-only, visible to all clients
          server.lua            # server-only, never sent to client
        shared/
          types.lua             # type aliases / enums shared cl+sv
          util.lua              # pure helpers cl+sv
        server/
          main.lua              # entry: event registration, lifecycle
          state/                # in-memory stores, persistence bridges
          handlers/             # one file per event group
          db.lua                # oxmysql wrapper (if used)
        client/
          main.lua              # entry
          nui.lua               # NUI bridge (if UI exists)
          handlers/             # net event handlers
        README.md
      \`\`\`
    - Always create the README.md.
    - Group small files into sub-sub-folders only if there are 4+ siblings on the same concern.

    Recommended: keep the baseline above and prune empty folders at scaffold time.

2.3 **Module style?** (only relevant if 2.1 = B)
    - **A) Globals via manifest** \u2014 every file lives in \`server_scripts {}\` / \`client_scripts {}\` / \`shared_scripts {}\` and shares one big global namespace. Helpers in \`shared/util.lua\` just declare \`function MyHelper(...) end\` and any other file can call \`MyHelper(...)\` directly. Familiar, zero ceremony, hard to navigate at scale.
    - **B) Returning modules + \`lib.require\`** \u2014 each file ends with \`return M\` and consumers write \`local util = lib.require('shared.util')\`. Only the entry file is in the manifest's \`*_scripts\` block; everything else is in \`files {}\`. Requires \`ox_lib\`. Explicit dependencies, no global pollution, easy to refactor.

    Recommended: **B** if ox_lib is enabled AND the resource has more than ~3 files per side. Otherwise **A**.

    If **B**, the fxmanifest must:
    - put only the entry files in \`server_scripts\` / \`client_scripts\` (\`'server/main.lua'\`, \`'client/main.lua'\`)
    - list every other Lua file under \`files {}\` so \`lib.require\` can load them
    - declare \`@ox_lib/init.lua\` in \`shared_scripts\` so \`lib\` is available to both sides

### 3. Configuration

3.1 **Does the resource need user-tunable configuration?**
    - **A) None** \u2014 hard-coded defaults.
    - **B) Yes**

    Recommended: **B**. Even tiny resources benefit from one \`config/shared.lua\`.

3.2 **If B \u2014 config split (security-critical, do not skip):**
    - \`config/shared.lua\` \u2014 values that BOTH runtimes need (cooldowns, item names, blip sprites). Sent to clients.
    - \`config/client.lua\` \u2014 client-only UI/UX (theme, key bindings, distances). Sent to clients.
    - \`config/server.lua\` \u2014 secrets and trust-boundary values (webhook URLs, admin lists, gate thresholds). **NEVER required from client**.

    Confirm the user understands: anything in \`shared.lua\` or \`client.lua\` is visible to every client. Webhook URLs, API keys, admin steam IDs MUST go in \`server.lua\`.

    Recommended: create all three even if only one has values for now.

### 4. Framework integration

4.1 **Framework integration?**
    - **A) Standalone** \u2014 no external framework deps.
    - **B) ESX** \u2014 \`es_extended\`
    - **C) QBCore** \u2014 \`qb-core\` (currently no agent_api plugin; agent_api will still work, manual export wiring needed)
    - **D) ox_core** \u2014 \`ox_core\`
    - **E) Multiple** \u2014 adapter layer per framework.

    Recommended: pick the one the server actually runs; if unsure, use \`list_resources\` to detect and confirm with the user.

4.2 **ox_lib?** (cache, callback, addCommand, locales, zones, etc.)
    Recommended: **yes** if the server has \`ox_lib\` started; it removes a lot of boilerplate.

4.3 **oxmysql?** (DB persistence)
    - **A) None** \u2014 in-memory only.
    - **B) Yes** \u2014 list the tables the resource will own (one row per table: name + columns + purpose).

    Recommended: **A** unless the resource owns persistent state across restarts.

### 5. UI

5.1 **Does the resource need a UI?**
    - **A) None** \u2014 server-only or chat-driven.
    - **B) Yes**

    Recommended: ask the user; the default depends entirely on the resource purpose.

5.2 **If B \u2014 UI stack:**
    - **A) Pure** \u2014 single \`html/index.html\` + \`app.js\` + \`style.css\`. No build step. Good for: modals, simple HUDs.
    - **B) Framework with Vite** \u2014 separate \`web/\` source tree, \`npm run build\` outputs to \`html/\`.

    Recommended: **A** if the UI is <300 LOC; otherwise **B**.

5.3 **If 5.2 = B (framework):**

    5.3.1 **Which framework?**
      - **A) Vue 3** (Composition API + SFC)
      - **B) React 18**
      - **C) Svelte 5**
      - **D) Solid**
      - **E) Preact**

      Recommended: **A) Vue 3** for FiveM NUI \u2014 smallest runtime, good DX, large existing FiveM community example pool.

    5.3.2 **State management?**
      - **A) Built-in** (ref/signals/useState)
      - **B) Pinia** (Vue) / **Zustand** (React) / **Svelte stores** / **Solid stores**
      - **C) None \u2014 derive from props/events only**

      Recommended: **A** under 5 components, **B** above.

    5.3.3 **CSS approach?**
      - **A) Plain CSS** in one file
      - **B) Scoped CSS** (SFC \`<style scoped>\`)
      - **C) Tailwind**
      - **D) UnoCSS**

      Recommended: **B** for Vue, **C/D** if the user wants utility-first.

    5.3.4 **Animations?**
      - **A) None**
      - **B) CSS transitions only**
      - **C) Vue \`<Transition>\` / Framer Motion / Svelte transitions**
      - **D) GSAP** for complex sequences.

      Recommended: **B**; bump to **C** only if the UI has timed sequences.

    5.3.5 **Form validation / data fetching libs?**
      - **A) None**
      - **B) Hand-rolled validators + native fetch wrappers**
      - **C) Zod / Valibot + custom fetch hook**

      Recommended: **B** unless forms are the main feature.

    5.3.6 **Icons?**
      - **A) None**
      - **B) Inline SVG**
      - **C) Lucide / Heroicons**
      - **D) Phosphor**

      Recommended: **B** for one or two icons, **C** for >5.

5.4 **Open key / command?**
    Recommended: **F6 + \`/<resource_name>\`** chat command. Confirm with user \u2014 F6 may clash with other resources on their server.

5.5 **NUI focus model?**
    - **A) Modal** \u2014 cursor freed, game input blocked while open.
    - **B) Overlay** \u2014 passive HUD, never takes focus.
    - **C) Hybrid** \u2014 overlay by default, modal when interaction needed.

    Recommended: **A** for menus/forms, **B** for HUDs.

### 6. Lifecycle behavior

6.1 **What should happen on resource start?**
    Recommended: print one banner line and register handlers. No automatic side effects until first interaction.

6.2 **What should happen on player drop?**
    Recommended: clean up any per-player state to avoid memory leaks; confirm with user what state the resource holds per player.

6.3 **What should happen on resource stop?**
    Recommended: persist (if oxmysql is enabled) and emit a graceful shutdown event for clients.

### 7. Audit + security

7.1 **Any verbs the user wants logged?** (e.g. money grants, admin actions)
    Recommended: log every mutating action through \`print\` with structured fields; agent_api's audit log captures the call but per-action logs help in-game admins.

7.2 **Rate limit on user-initiated events?**
    Recommended: a one-per-second per-player throttle on any spam-able event (chat send, button click that triggers server work).

### 8. Confirmation

8.1 Replay everything as a markdown checklist. Example shape:

    \`\`\`
    Ready to scaffold \`my_resource\`:
    - layout: multi-file (server/, client/, shared/, config/)
    - framework: ESX + ox_lib (+ oxmysql for table \`my_resource_logs\`)
    - UI: Vue 3 + Pinia + scoped CSS + Vue Transitions; F6 + /myres; modal
    - lifecycle: print banner, drop-cleanup yes, stop persist yes
    - audit: log money grants + admin force-stop
    - throttle: 1 req/s on \`my_resource:doThing\`
    \`\`\`

8.2 Ask: "Confirm to scaffold? (ok / cancel / edit <number>)"
    - "ok" \u2192 proceed.
    - "edit N" \u2192 re-ask question N, then return to confirmation.
    - "cancel" \u2192 stop, do not scaffold.

---

## Scaffolding phase (only after confirmed)

1. Call \`create_resource({ name, description, author })\`.
2. Call \`refresh_resources({ waitMs: 700 })\` so FiveM picks up the folder.
3. **If the user picked a Vite-based UI framework (5.2 = B):**
   - Use \`run_shell\` to scaffold the web tree inside the resource:
     \`run_shell({ resource, command: 'npm', args: ['create', 'vite@latest', 'web', '--', '--template', '<vue|react|svelte|...>'], timeoutMs: 60000 })\`
   - Then \`run_shell({ resource, command: 'npm', args: ['install'], cwd: 'web', timeoutMs: 120000 })\`.
   - Then write any additional config (state mgmt setup, CSS framework install) via subsequent \`run_shell\` calls.
   - Edit \`web/vite.config.*\` so \`build.outDir\` points at \`../html\` and \`base\` is \`'./'\` so NUI can load the bundle relatively.
   - Run \`run_shell({ resource, command: 'npm', args: ['run', 'build'], cwd: 'web', timeoutMs: 120000 })\` to produce \`html/\`.
4. Call \`write_file\` for each Lua/config file you planned. Use \`createDirs: true\` for first write into any subfolder. Order: fxmanifest (last so file lists are correct), config/*, shared/*, server/*, client/*, html/* (pure-UI only \u2014 Vite bundles are emitted by step 3), README.md.
5. Call \`ensure_resource({ name, timeoutMs: 5000 })\`.
6. If \`stateAfter\` is not \`started\`, immediately call \`tail_console({ lines: 50 })\`, find the error, propose a single-file fix, ask the user before re-writing.
7. Print a final summary listing every file written, every shell command run, the open key, and the next thing the user should do.

---

## Begin

Start with question **1.1 \u2014 Resource name**. Do not skip ahead. Do not offer to write code yet.
`;
var scaffoldFivemPrompt = {
  name: "scaffold-fivem-resource",
  description: "Grill-mode workflow for scaffolding a new FiveM resource end-to-end via agent_api. The assistant MUST run through every question one at a time before any file is written, and every question MUST present a recommended default.",
  build: () => [
    {
      role: "user",
      content: { type: "text", text: SCAFFOLD_FIVEM_SCRIPT }
    }
  ]
};

// src/server/tools/scaffoldWorkflow.ts
function registerScaffoldFivemWorkflow() {
  register({
    name: "scaffold_fivem_resource_workflow",
    description: 'MANDATORY pre-flight for ANY new FiveM resource. CALL THIS TOOL FIRST whenever the user expresses intent to create, scaffold, build, set up, or generate a new FiveM resource \u2014 including phrases like "create a resource", "make a script", "build a new resource", "new fivem script", "scaffold a resource", "\u0E17\u0E33 resource \u0E43\u0E2B\u0E21\u0E48", "\u0E2A\u0E23\u0E49\u0E32\u0E07 resource", "\u0E2A\u0E23\u0E49\u0E32\u0E07 script", "\u0E2D\u0E22\u0E32\u0E01\u0E44\u0E14\u0E49 resource \u0E17\u0E35\u0E48...", "\u0E02\u0E2D resource ...", "\u0E40\u0E02\u0E35\u0E22\u0E19 resource \u0E43\u0E2B\u0E21\u0E48", "build a chat system in fivem", or any equivalent in any language. It returns a hard-contract grill workflow that you MUST follow before calling create_resource / write_file / refresh_resources / ensure_resource. Do not call those four tools before invoking this one.',
    input: external_exports.object({}).strict(),
    handler: async () => ok({
      contract: SCAFFOLD_FIVEM_SCRIPT,
      instructions: "Read `contract` in full, then begin executing the grill workflow against the user. Ask question 1.1 first. Do not skip ahead. Do not call any scaffolding tool until the workflow signals confirmation."
    })
  });
}

// src/server/index.ts
var VERSION = "0.0.1";
var RESOURCE_NAME = GetCurrentResourceName();
function main() {
  const convars = loadConvars();
  const tokenInfo = resolveToken(convars.rawToken);
  logTokenBanner(tokenInfo.token, tokenInfo.generated);
  const consoleBuffer = new RingBuffer(convars.consoleBufferLines);
  installConsoleListener(consoleBuffer);
  registerHealth(VERSION);
  registerListResources();
  registerGetResourceState();
  registerReadFile();
  registerTailConsole();
  registerWriteFile();
  registerCreateResource();
  registerRefreshResources();
  registerEnsureResource();
  registerStartResource();
  registerStopResource();
  registerRestartResource();
  registerRunCommand();
  registerListPlayers();
  registerRegisterTestSubject();
  registerUnregisterTestSubject();
  registerGetPlayerState();
  registerTriggerClientEvent();
  registerSendChat();
  registerWaitForClientEvent();
  registerClientCallNative();
  registerClientListNatives();
  registerServerCallNative();
  registerServerListNatives();
  registerRunShell();
  installOptInCommands(convars.testSessionTtlSeconds);
  installProbeListener();
  registerPrompt(scaffoldFivemPrompt);
  registerScaffoldFivemWorkflow();
  registerListPlugins();
  const pluginSnapshot = loadPlugins(ALL_PLUGINS, convars);
  setPluginSnapshot(pluginSnapshot);
  logPluginStatuses(pluginSnapshot);
  installHttpRouter({
    token: tokenInfo.token,
    ctx: { convars, console: consoleBuffer }
  });
  console.log(`[${RESOURCE_NAME}] up \u2014 v${VERSION} (M6)`);
  console.log(`[${RESOURCE_NAME}] HTTP ready at http://127.0.0.1:30120/${RESOURCE_NAME}/`);
}
main();
