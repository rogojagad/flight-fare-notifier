import zod from "https://deno.land/x/zod@v3.23.8/mod.ts";

/** Request Validation */
export const paramsSchema = zod.object({
  maxPrice: zod.number().gt(0),
  airlines: zod.array(zod.string()),
  origin: zod.string().describe(`Origin city code`),
  originAirportCodes: zod.array(zod.string()),
  destination: zod.string().describe(`Destination city code`),
  destinationAirportCodes: zod.array(zod.string()),
  departureDate: zod.string().date().describe(
    `Departure date in string, YYYY-MM-DD`,
  ),
  returnDate: zod.string().date().describe(
    `Return date in string, YYYY-MM-DD`,
  ),
  minDepartureTime: zod.string().datetime({ offset: true }),
  maxDepartureTime: zod.string().datetime({ offset: true }),
});

/** Interfaces Definition */
export type Params = zod.infer<typeof paramsSchema>;

/** Implementations */
export const PARAMS_KEY = "params";
const kv = await Deno.openKv();

const setParams = async (params: Params): Promise<boolean> => {
  const result = await kv.set([PARAMS_KEY], params);

  return !!result;
};

const getParams = async (): Promise<Params | null> => {
  return (await kv.get<Params>([PARAMS_KEY])).value;
};

export default { getParams, setParams };
