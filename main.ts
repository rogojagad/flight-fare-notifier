import * as hono from "https://deno.land/x/hono@v4.3.11/mod.ts";
import config, { Params, paramsSchema } from "~/config.ts";

/** HTTP Server */
const app = new hono.Hono();

app.get("/ping", (c) => {
  return c.json({ data: "pong" });
});

app.put("/params", async (c) => {
  try {
    const reqPayload = (await c.req.json()) as Params;

    paramsSchema.parse(reqPayload);

    const result = await config.setParams(reqPayload);

    return c.json({ isSuccess: result });
  } catch (error) {
    console.error(`error happens`, error);
    console.error(error);

    throw error;
  }
});

app.get("/params", async (c) => {
  const result = await config.getParams();

  return c.json(result);
});

Deno.serve({ port: 8080 }, app.fetch);

/** Cron */
