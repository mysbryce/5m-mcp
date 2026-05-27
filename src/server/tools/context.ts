import { Convars } from "../config/convars";
import { RingBuffer } from "../console/buffer";

export type ToolContext = {
  convars: Convars;
  console: RingBuffer;
};
