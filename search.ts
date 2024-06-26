/** Import Deps */
import luxon from "npm:ts-luxon@4.5.2";
import config from "~/config.ts";

/** Interfaces Definition */
interface IAirline {
  [key: string]: { code: string; displayName: string };
}

interface IAirport {
  [key: string]: {
    airportCode: string;
    airportName: string;
    cityCode: string;
    cityName: string;
    countryCode: string;
  };
}

interface IScheduleDetail {
  date: string;
  time: string;
  timezone: number;
  airportCode: string;
  terminal: string;
  visaRequired: boolean;
}

interface IFareDetail {
  cheapestFare: number;
}

interface IDepartureSchedule {
  flightNumber: string;
  cabinClass: string;
  departureDetail: IScheduleDetail;
  arrivalDetail: IScheduleDetail;
  airlineCode: string;
  totalTravelTimeInMinutes: number;
}

interface IDepartureFlight {
  arrivalAirportCode: string;
  departureAirportCode: string;
  flightSelect: string; // flight numbers separated with '|'. To search without transit, search the one without `|` sign
  schedules: IDepartureSchedule[];
  fareDetail: IFareDetail;
}

interface IFlightSearchData {
  airlines: IAirline;
  airports: IAirport;
  searchList: {
    departureFlights: IDepartureFlight[];
  };
}

export interface IFlightSearchResponse {
  data: IFlightSearchData;
}

export interface IMatchedFlight {
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  airlines: string;
}

/** Implementations */
export default async (
  response: IFlightSearchResponse,
): Promise<IMatchedFlight[]> => {
  const params = await config.getParams();

  if (!params) throw new Error(`Params undefined`);

  console.info(
    `Searching flights with criteria => ${JSON.stringify(params, null, 2)}`,
  );

  const desiredDepartureAirportCode = params.originAirportCodes;
  const desiredArrivalAirportCode = params.destinationAirportCodes;
  const desiredAirlines = params.airlines;
  const maxPrice = params.maxPrice;
  const departureDate = params.departureDate;

  // User inputted time is on UTC+7
  // According to Luxon docs, it is recommended for the server to work on UTC
  // https://tonysamperi.github.io/ts-luxon/docs/#/zones?id=don39t-worry
  const desiredMinDepartureTime = luxon.DateTime.fromISO(
    `${departureDate}T${params.minDepartureTime}+07:00`,
  );
  const desiredMaxDepartureTime = luxon.DateTime.fromISO(
    `${departureDate}T${params.maxDepartureTime}+07:00`,
  );

  return response.data.searchList.departureFlights
    // as high priority and affecting further schedules filtering, do this first
    .filter((flight) => {
      // filter only direct flight (no transit)
      return flight.flightSelect.split("|").length !== 2;
    })
    // map new field schedule containing single object, because no transit flight will always have one schedule only
    .map((flight) => ({
      ...flight,
      schedule: flight.schedules[0],
    }))
    .filter((flight) => {
      const isDesiredAirline = desiredAirlines.includes(
        flight.schedule.airlineCode,
      );

      const isDesiredDepartureAndArrivalAirport =
        desiredDepartureAirportCode.includes(flight.departureAirportCode) &&
        desiredArrivalAirportCode.includes(flight.arrivalAirportCode);

      const isPriceWithinRange = flight.fareDetail.cheapestFare <= maxPrice;

      const { date, time } = flight.schedule.departureDetail;
      const departureTime = luxon.DateTime.fromISO(`${date}T${time}+07:00`); // returned data from API is on UTC+7

      const isDepartureTimeWithinRange =
        desiredMinDepartureTime <= departureTime &&
        departureTime <= desiredMaxDepartureTime;

      return isDesiredAirline && isDesiredDepartureAndArrivalAirport &&
        isDepartureTimeWithinRange && isPriceWithinRange;
    }).map((flight) => ({
      flightNumber: flight.flightSelect,
      departureAirportCode: flight.departureAirportCode,
      arrivalAirportCode: flight.arrivalAirportCode,
      departureTime:
        `${flight.schedule.departureDetail.date} ${flight.schedule.departureDetail.time}`,
      arrivalTime:
        `${flight.schedule.arrivalDetail.date} ${flight.schedule.arrivalDetail.time}`,
      fare: flight.fareDetail.cheapestFare,
      airlines: response.data.airlines[flight.schedule.airlineCode].displayName,
    }));
};
