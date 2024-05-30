import * as hono from "https://deno.land/x/hono@v4.3.11/mod.ts";
import luxon from "npm:ts-luxon@4.5.2";

import config, { Params, paramsSchema } from "~/config.ts";
import scrape from "~/scrape.ts";
import search from "~/search.ts";
import TelegramBot from "~/bot.ts";

/**
 * Setup Browser Cache
 *
 * It's better to run this as a pre-start script. But Deno deployment platform doesn't support this at the moment.
 */

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

/** Init Bot */
const bot = new TelegramBot();

bot.start();

/** Cron */
Deno.cron("Scrape and search flight according to stored params", {
  minute: { every: 2 },
}, async () => {
  console.info(
    `Running scrape and search at ${luxon.DateTime.now().toISO()}`,
  );

  const flights = await scrape();

  if (!flights) {
    console.error(`Scrape is not running or no data found`);
    return;
  }

  const matchedFlights = await search(flights);

  if (matchedFlights.length) await bot.sendFlightInformation(matchedFlights);
});
// console.info(
//   `Running scrape and search at ${luxon.DateTime.now().toISO()}`,
// );

// const flights = await scrape();

// if (!flights) {
//   console.error(`Scrape is not running or no data found`);
// } else {
//   const matchedFlights = await search(flights);

//   if (matchedFlights.length) await bot.sendFlightInformation(matchedFlights);
// }
