import * as hono from "https://deno.land/x/hono@v4.3.11/mod.ts";
import config, { Params, paramsSchema } from "~/config.ts";
import scrape from "~/scrape.ts";
import search from "~/search.ts";
import luxon from "npm:ts-luxon@4.5.2";

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
Deno.cron("Scrape and search flight according to stored params", {
  minute: { every: 1 },
}, async () => {
  console.info(
    `Running scrape and search at ${luxon.DateTime.now().toISO()}`,
  );

  await scrape();

  await search();
});
