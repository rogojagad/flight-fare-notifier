import puppeteer, {
  HTTPRequest,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { cheerio } from "https://deno.land/x/cheerio@1.0.7/mod.ts";
import config from "~/config.ts";
import { IFlightSearchResponse } from "~/search.ts";

const MAIN_URL =
  "https://www.tiket.com/ms-gateway/tix-flight-search/v3/search?origin={origin}&originType=CITY&destination={destination}&destinationType=CITY&adult=1&child=0&infant=0&cabinClass=ECONOMY&departureDate={departureDate}&flexiFare=true&resultType=DEPARTURE&searchType=ONE_WAY&returnDate={returnDate}";

export default async (): Promise<IFlightSearchResponse | null> => {
  const params = await config.getParams();

  if (!params) {
    console.error(`Params undefined`);
    return null;
  }

  const caps = {
    "browser": "chrome", // You can choose `chrome`, `edge` or `firefox` in this capability
    "browser_version": "125", // We support v83 and above. You can choose `latest`, `latest-beta`, `latest-1`, `latest-2` and so on, in this capability
    "build": "puppeteer-build-1",
    "name": "Scrape Ticket", // The name of your test and build. See browserstack.com/docs/automate/puppeteer/organize tests for more details
    "os": "os x",
    "os_version": "big sur",
    "browserstack.username": Deno.env.get("BROWSERSTACK_USERNAME"),
    "browserstack.accessKey": Deno.env.get("BROWSERSTACK_ACCESS_KEY"),
  };
  const browserWSEndpoint = `wss://cdp.browserstack.com/puppeteer?caps=${
    encodeURIComponent(JSON.stringify(caps))
  }`; // The BrowserStack CDP endpoint gives you a `browser` instance based on the `caps` that you specified

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

  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  page.on("request", (req: HTTPRequest) => {
    console.info(req.headers());
  });

  await page.goto(url);
  const content = await page.content();

  await browser.close();

  const $ = cheerio.load(content);
  const data = $("body").text();

  return JSON.parse(data);
};
