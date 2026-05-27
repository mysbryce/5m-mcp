import { ReadFileInput, readFile } from "../fs/read";
import { register } from "./registry";
import { ToolContext } from "./context";

export function registerReadFile(): void {
  register({
    name: "read_file",
    description:
      "Read a file from any resource within the read sandbox. Use offset/length to window large files.",
    input: ReadFileInput,
    handler: async (input, ctx: ToolContext) =>
      readFile(input as ReadFileInput, ctx.convars.maxFileBytes),
  });
}
