/** Import Deps */
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";
import config from "~/config.ts";
import { IFlightSearchResponse } from "~/search.ts";

/** Implementation */
const MAIN_URL =
  "https://www.tiket.com/ms-gateway/tix-flight-search/v3/search?origin={origin}&originType=CITY&destination={destination}&destinationType=CITY&adult=1&child=0&infant=0&cabinClass=ECONOMY&departureDate={departureDate}&flexiFare=true&resultType=DEPARTURE&searchType=ONE_WAY&returnDate={returnDate}";

export default async (): Promise<IFlightSearchResponse> => {
  const params = await config.getParams();

  if (!params) {
    console.error(`Params undefined`);
    throw Error(`Search params not configured`);
  }

  const caps = {
    "browser": "chrome",
    "browser_version": "125", // Based on Github discussion, Chrome 125 is the most compatible with Puppeteer
    "build": "puppeteer-build-1",
    "name": "Scrape Ticket",
    "os": "os x", // Somehow more stable and not detected as bot if coming from MacOS platform
    "os_version": "big sur",
    "browserstack.username": Deno.env.get("BROWSERSTACK_USERNAME"),
    "browserstack.accessKey": Deno.env.get("BROWSERSTACK_ACCESS_KEY"),
  };
  const browserWSEndpoint = `wss://cdp.browserstack.com/puppeteer?caps=${
    encodeURIComponent(JSON.stringify(caps))
  }`;

  const url = MAIN_URL.replace(
    `{destination}`,
    params.destination,
  ).replace(`{origin}`, params.origin)
    .replace(
      `{departureDate}`,
      params.departureDate,
    ).replace(
      `{arrivalDate}`,
      params.returnDate,
    );

  /**
   * Even if we access an API URL, the URL is guarded using Cloudflare to prevent bot.
   * So, accessing using `fetch` or other simple HTTP client mechanism will result in HTTP Error 403.
   *
   * Use Pupetteer to simulate real browser access which could bypass the guarding.
   */
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  await page.goto(url);
  const content = await page.content();

  await browser.close();

  /**
   * Even if we call an API URL, Puppeteer return the body as an HTML with the JSON result in its body
   * So, need to load the data via DOM.
   */
  const $ = cheerio.load(content);
  const data = $("body").text();

  return JSON.parse(data);
};
