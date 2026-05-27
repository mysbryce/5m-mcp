<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import UiToggle from '../../shared/ui/UiToggle.vue';
import { useLogs } from './useLogs';
import { consoleLineToHtml } from './ansi';
import { useI18n } from '../../i18n/useI18n';

const { lines, entries, loadingAudit, initConsole, pollConsole, loadAudit } = useLogs();
const { t } = useI18n();

const view = ref<'console' | 'audit'>('console');
const live = ref(true);
const consoleBox = ref<HTMLElement | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

// audit controls
const filterTool = ref('');
const result = ref<'all' | 'ok' | 'error'>('all');
const sortField = ref<'ts' | 'tool'>('ts');
const sortDir = ref<'asc' | 'desc'>('desc');
const page = ref(0);
const pageSize = 50;

const fmtTime = (ts: number | string) => new Date(ts).toLocaleTimeString();

const filtered = computed(() => {
  let r = entries.value;
  const q = filterTool.value.trim().toLowerCase();
  if (q) r = r.filter((e) => e.tool.toLowerCase().includes(q));
  if (result.value === 'ok') r = r.filter((e) => e.result_code === 'OK');
  else if (result.value === 'error') r = r.filter((e) => e.result_code !== 'OK');
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...r].sort((a, b) => {
    if (sortField.value === 'tool') return a.tool.localeCompare(b.tool) * dir;
    return (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0) * dir;
  });
});
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));
const paged = computed(() => filtered.value.slice(page.value * pageSize, page.value * pageSize + pageSize));

watch([filterTool, result, sortField, sortDir], () => {
  page.value = 0;
});

function sortBy(field: 'ts' | 'tool') {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  else {
    sortField.value = field;
    sortDir.value = field === 'ts' ? 'desc' : 'asc';
  }
}

async function scrollBottom() {
  await nextTick();
  const el = consoleBox.value;
  if (el) el.scrollTop = el.scrollHeight;
}

watch(
  () => lines.value.length,
  () => {
    if (view.value === 'console') void scrollBottom();
  },
);

async function tick() {
  if (live.value && view.value === 'console') await pollConsole();
}

onMounted(async () => {
  await initConsole();
  await loadAudit();
  void scrollBottom();
  timer = setInterval(() => void tick(), 1500);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section>
    <div class="head">
      <div>
        <div class="section-title">{{ t('logs.title') }}</div>
        <div class="section-sub">{{ t('logs.sub') }}</div>
      </div>
      <UiButton v-if="view === 'audit'" variant="ghost" @click="loadAudit">
        {{ t('logs.refresh') }}
      </UiButton>
    </div>

    <nav class="subtabs">
      <button class="sub" :class="{ on: view === 'console' }" @click="view = 'console'">
        {{ t('logs.console') }}
      </button>
      <button class="sub" :class="{ on: view === 'audit' }" @click="view = 'audit'">
        {{ t('logs.audit') }}
      </button>
      <label v-if="view === 'console'" class="live">
        <UiToggle v-model="live" />
        <span>{{ t('logs.live') }}</span>
      </label>
    </nav>

    <!-- Console -->
    <div v-if="view === 'console'" ref="consoleBox" class="card console">
      <p v-if="!lines.length" class="muted pad">{{ t('logs.empty') }}</p>
      <div v-for="(l, i) in lines" :key="i" class="cline">
        <span class="ch">{{ l.channel }}</span>
        <span class="msg" v-html="consoleLineToHtml(l.message)" />
      </div>
    </div>

    <!-- Audit -->
    <template v-else>
      <div class="filters">
        <input v-model="filterTool" :placeholder="t('logs.filterTool')" class="f-tool" />
        <div class="chips">
          <button class="chip" :class="{ on: result === 'all' }" @click="result = 'all'">
            {{ t('logs.resultAll') }}
          </button>
          <button class="chip" :class="{ on: result === 'ok' }" @click="result = 'ok'">
            {{ t('logs.resultOk') }}
          </button>
          <button class="chip" :class="{ on: result === 'error' }" @click="result = 'error'">
            {{ t('logs.resultErr') }}
          </button>
        </div>
      </div>

      <p v-if="loadingAudit" class="muted">{{ t('common.loading') }}</p>
      <template v-else>
        <div class="card">
          <p v-if="!filtered.length" class="muted pad">{{ t('logs.empty') }}</p>
          <table v-else class="audit">
            <thead>
              <tr>
                <th class="sortable" @click="sortBy('ts')">
                  {{ t('logs.time') }}<span v-if="sortField === 'ts'">{{ sortDir === 'asc' ? ' ↑' : ' ↓' }}</span>
                </th>
                <th class="sortable" @click="sortBy('tool')">
                  {{ t('logs.tool') }}<span v-if="sortField === 'tool'">{{ sortDir === 'asc' ? ' ↑' : ' ↓' }}</span>
                </th>
                <th>{{ t('logs.result') }}</th>
                <th>{{ t('logs.caller') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in paged" :key="i">
                <td class="mono">{{ fmtTime(e.ts) }}</td>
                <td class="mono">{{ e.tool }}</td>
                <td>
                  <span class="tag" :class="e.result_code === 'OK' ? 'ok' : 'err'">{{ e.result_code }}</span>
                </td>
                <td class="mono muted">{{ e.caller }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filtered.length" class="pager">
          <UiButton variant="ghost" :disabled="page === 0" @click="page--">{{ t('logs.prev') }}</UiButton>
          <span class="pinfo">{{ t('logs.page', { n: page + 1, total: pageCount }) }}</span>
          <UiButton variant="ghost" :disabled="page >= pageCount - 1" @click="page++">
            {{ t('logs.next') }}
          </UiButton>
        </div>
      </template>
    </template>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.muted {
  color: var(--muted);
}
.pad {
  padding: 14px 16px;
}
.subtabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0;
}
.sub {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 5px 12px;
  font-family: var(--sans);
}
.sub.on {
  color: var(--fg);
  border-color: var(--primary);
  background: color-mix(in oklch, var(--primary) 18%, transparent);
}
.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-left: auto;
}
.console {
  max-height: 62vh;
  overflow-y: auto;
  padding: 10px 12px;
  font-family: var(--mono, monospace);
  font-size: 12px;
  line-height: 1.5;
}
.cline {
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
.ch {
  color: var(--muted);
  flex-shrink: 0;
  opacity: 0.7;
}
.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.f-tool {
  max-width: 240px;
}
.chips {
  display: flex;
  gap: 6px;
}
.chip {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
  font-family: var(--sans);
}
.chip.on {
  background: color-mix(in oklch, var(--primary) 30%, transparent);
  border-color: var(--primary);
  color: var(--fg);
}
.audit {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.audit th,
.audit td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.audit th {
  color: var(--muted);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover {
  color: var(--fg);
}
.mono {
  font-family: var(--mono, monospace);
}
.tag {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--border);
}
.tag.ok {
  color: oklch(0.72 0.16 160);
}
.tag.err {
  color: var(--danger);
}
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
.pinfo {
  color: var(--muted);
  font-size: 12px;
}
</style>
