import zod from "https://deno.land/x/zod@v3.23.8/mod.ts";

/** Request Validation */
export const paramsSchema = zod.object({
  origin: zod.string(),
  destination: zod.string(),
  departureDate: zod.coerce.date(),
  returnDate: zod.coerce.date(),
});

/** Interfaces Definition */
export type Params = zod.infer<typeof paramsSchema>;

/** Implementations */
export const PARAMS_KEY = "params";

const setParams = async (params: Params): Promise<boolean> => {
  const kv = await Deno.openKv();

  const result = await kv.set([PARAMS_KEY], params);

  return !!result;
};

const getParams = async (): Promise<Params | null> => {
  const kv = await Deno.openKv();

  return (await kv.get<Params>([PARAMS_KEY])).value;
};

export default { getParams, setParams };
