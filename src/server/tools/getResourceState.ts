import { z } from "zod";
import { err, ok } from "../util/envelope";
import { getResourceInfo } from "../runtime/resources";
import { register } from "./registry";

export function registerGetResourceState(): void {
  register({
    name: "get_resource_state",
    description: "Look up the lifecycle state and path of a single resource.",
    input: z.object({ name: z.string().min(1) }).strict(),
    handler: async (input: { name: string }) => {
      const info = getResourceInfo(input.name);
      if (!info) {
        return err("RESOURCE_NOT_FOUND", `Resource not found: ${input.name}`);
      }
      return ok(info);
    },
  });
}
