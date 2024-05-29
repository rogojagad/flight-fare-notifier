import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
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

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setExtraHTTPHeaders({
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "priority": "u=1, i",
    "sec-ch-ua": '"Brave";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"5.11.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "cookie":
      "cf_clearance=FJOt4NXrN.pB0BiEfMbGe3YD_1hbgeZQFL1Ly.Nwo54-1714794388-1.0.1.1-7L1ztseHyOSXbU91U2RTX.g.wn0ZF8k8MkxuCHrdUEt1BZUFdi6XbnsKSWL66DdlAWlAzzkZPWtZbsXeNvGpow; session_access_token=eyJraWQiOiJSeVpmRjlGaHdVdEh2UVdiTGFaaGpfQWplNFNqZHR6VSJ9.eyJhdWQiOiJ0aWtldC5jb20iLCJzdWIiOiI2NTU4MzlmNjczY2U1ZTU3YWEyMTFmMzAiLCJuYmYiOjE3MTQ3OTQ0MjQsImlzcyI6Imh0dHBzOi8vd3d3LnRpa2V0LmNvbSIsImV4cCI6MTczMDU3NDQyNCwiZW1haWwiOiJyb2dvamFnYWRhbGl0QGdtYWlsLmNvbSJ9.PkJp2Ekiap3OGfKtmoUr1DH2qPOoNDTx7X58LBHsfTvmV5-qGEkg0V7v8uG-CwSe; session_refresh_token=eyJraWQiOiJqZkhLRjFrNllUMTJoODVDU0lmczd4aUdsSWtYcjkxSyJ9.eyJhdWQiOiJ0aWtldC5jb20vcnQiLCJzdWIiOiI2NTU4MzlmNjczY2U1ZTU3YWEyMTFmMzAiLCJuYmYiOjE3MTQ3OTQ0MjQsImlzcyI6Imh0dHBzOi8vd3d3LnRpa2V0LmNvbSIsImV4cCI6MTc0NjM1NDQyNCwiZW1haWwiOiJyb2dvamFnYWRhbGl0QGdtYWlsLmNvbSJ9.pPVVaAf2mqwBTqL88ZW5OaH8xQScR-BcAYRkUA4-ShJ55zWf2eyqB562v3j5Lnnf; device_id=7a5e2d51-0e37-4372-8ce1-d50bf3788caa; AMP_MKTG_b34eb5901c=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRmRldnBvc3QuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMmRldnBvc3QuY29tJTIyJTdE; AMP_b34eb5901c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjI3YTVlMmQ1MS0wZTM3LTQzNzItOGNlMS1kNTBiZjM3ODhjYWElMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIzNDQyODQyNSUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3MTY2NDUwMjI0NTElMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzE2NjQ1MDI0NTAxJTJDJTIybGFzdEV2ZW50SWQlMjIlM0E0NiU3RA==; __cf_bm=4wY7TriHbj6_yisxRxKtzZYcyumySH98PMyeIt3TF8o-1716701523-1.0.1.1-TWxvROGNKd6ykuvAov1UN6BDhcPuTNUTY2JmGKWjKCtcy9nZEvwIzjVuQ16pB_Qk_IhYgv4Q6ZdHEulZZfSuadaMsljv4eQkSt7eK2RUW68; _cfuvid=m0qZyKfXMdjO75PgzV2F8pOvKmjXw1Vmz0oDsHK0K7w-1716701523163-0.0.1.1-604800000",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });

  await page.goto(url);
  const content = await page.content();

  await browser.close();

  const $ = cheerio.load(content);
  const data = $("body").text();

  return JSON.parse(data);
};
