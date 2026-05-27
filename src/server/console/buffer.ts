export type ConsoleLine = {
  ts: number;
  channel: string;
  message: string;
};

export class RingBuffer {
  private readonly cap: number;
  private buf: ConsoleLine[] = [];

  constructor(cap: number) {
    this.cap = Math.max(64, cap);
  }

  push(line: ConsoleLine): void {
    this.buf.push(line);
    if (this.buf.length > this.cap) {
      this.buf.splice(0, this.buf.length - this.cap);
    }
  }

  length(): number {
    return this.buf.length;
  }

  tail(opts: { lines?: number; sinceTs?: number; channel?: string }): ConsoleLine[] {
    let out = this.buf;
    if (opts.channel) {
      out = out.filter((l) => l.channel === opts.channel);
    }
    if (typeof opts.sinceTs === "number") {
      out = out.filter((l) => l.ts >= opts.sinceTs!);
    }
    if (typeof opts.lines === "number" && opts.lines > 0) {
      out = out.slice(-opts.lines);
    }
    return out;
  }

  slice(fromIdx: number): ConsoleLine[] {
    return this.buf.slice(fromIdx);
  }
}

export function installConsoleListener(buffer: RingBuffer): void {
  RegisterConsoleListener((channel: string, message: string) => {
    buffer.push({ ts: Date.now(), channel, message });
  });
}
