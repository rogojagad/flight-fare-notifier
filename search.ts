/** Import Deps */
import response from "~/response.json" with { type: "json" };
import luxon from "npm:ts-luxon@4.5.2";

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

interface IFlightSearchResponse {
  data: IFlightSearchData;
}

/** Implementations */
const flightSearchData = response as IFlightSearchResponse;

const desiredDepartureAirportCode = [
  "SUB", // surabaya juanda
]; // TODO: Refactor into system param

const desiredArrivalAirportCode = [
  "HLP", // jkt halim
  "CGK", // jkt soetta
]; // TODO: Refactor into system param

const desiredAirlines = [
  "QG", // citilink
  "ID", // batik
  "GA", // garuda
]; // TODO: Refactor into system param

const maxPrice = 1_222_000; // TODO: Refactor into system param

// User inputted time is on UTC+7
// According to Luxon docs, it is recommended for the server to work on UTC
// https://tonysamperi.github.io/ts-luxon/docs/#/zones?id=don39t-worry
const desiredMinDepartureTime = luxon.DateTime.fromISO(
  "2024-10-13T11:00:00+07:00",
); // TODO: Refactor into system param
const desiredMaxDepartureTime = luxon.DateTime.fromISO(
  "2024-10-13T13:30:00+07:00",
); // TODO: Refactor into system param

// console.log(desiredMinDepartureTime.toISO(), desiredMaxDepartureTime.toISO());

const matchedFlights = flightSearchData.data.searchList.departureFlights
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
    const isOnlyDesiredAirlines = desiredAirlines.includes(
      flight.schedule.airlineCode,
    );

    const isOnlyDesiredDepartureAndArrivalAirport =
      desiredDepartureAirportCode.includes(flight.departureAirportCode) &&
      desiredArrivalAirportCode.includes(flight.arrivalAirportCode);

    const isPriceWithinRange = flight.fareDetail.cheapestFare <= maxPrice;

    // filter departure time within desired range
    const { date, time } = flight.schedule.departureDetail;
    const departureTime = luxon.DateTime.fromISO(`${date}T${time}+07:00`); // returned data from API is on UTC+7

    const isDepartureTimeWithinRange =
      desiredMinDepartureTime <= departureTime &&
      departureTime <= desiredMaxDepartureTime;

    return isOnlyDesiredAirlines && isOnlyDesiredDepartureAndArrivalAirport &&
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
    airlines:
      flightSearchData.data.airlines[flight.schedule.airlineCode].displayName,
  }));

console.log(matchedFlights);
