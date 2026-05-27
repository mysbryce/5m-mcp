<script setup lang="ts">
import { onMounted, ref } from 'vue';
import UiButton from '../../shared/ui/UiButton.vue';
import { useLogs } from './useLogs';
import { useI18n } from '../../i18n/useI18n';

const { lines, entries, loading, load } = useLogs();
const { t } = useI18n();

const view = ref<'console' | 'audit'>('console');

const fmtTime = (ts: number | string) => new Date(ts).toLocaleTimeString();

onMounted(load);
</script>

<template>
  <section>
    <div class="head">
      <div>
        <div class="section-title">{{ t('logs.title') }}</div>
        <div class="section-sub">{{ t('logs.sub') }}</div>
      </div>
      <UiButton variant="ghost" @click="load">{{ t('logs.refresh') }}</UiButton>
    </div>

    <nav class="subtabs">
      <button class="sub" :class="{ on: view === 'console' }" @click="view = 'console'">
        {{ t('logs.console') }}
      </button>
      <button class="sub" :class="{ on: view === 'audit' }" @click="view = 'audit'">
        {{ t('logs.audit') }}
      </button>
    </nav>

    <p v-if="loading" class="muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div v-if="view === 'console'" class="card console">
        <p v-if="!lines.length" class="muted pad">{{ t('logs.empty') }}</p>
        <div v-for="(l, i) in lines" :key="i" class="cline">
          <span class="ch">{{ l.channel }}</span>
          <span class="msg">{{ l.message }}</span>
        </div>
      </div>

      <div v-else class="card">
        <p v-if="!entries.length" class="muted pad">{{ t('logs.empty') }}</p>
        <table v-else class="audit">
          <thead>
            <tr>
              <th>{{ t('logs.time') }}</th>
              <th>{{ t('logs.tool') }}</th>
              <th>{{ t('logs.result') }}</th>
              <th>{{ t('logs.caller') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in entries.slice().reverse()" :key="i">
              <td class="mono">{{ fmtTime(e.ts) }}</td>
              <td class="mono">{{ e.tool }}</td>
              <td>
                <span class="tag" :class="e.result_code === 'OK' ? 'ok' : 'err'">
                  {{ e.result_code }}
                </span>
              </td>
              <td class="mono muted">{{ e.caller }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
  gap: 4px;
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
.console {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px 12px;
  font-family: var(--mono, monospace);
  font-size: 12px;
}
.cline {
  display: flex;
  gap: 8px;
  padding: 1px 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.ch {
  color: var(--muted);
  flex-shrink: 0;
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
</style>
