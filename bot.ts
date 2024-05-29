import { Bot } from "https://deno.land/x/grammy@v1.24.0/mod.ts";
import { IMatchedFlight } from "~/search.ts";

export default class TelegramBot {
  private bot: Bot;
  private recipientId: string;

  constructor() {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!botToken?.length) throw new Error(`Bot token undefined`);

    const recipientId = Deno.env.get("TELEGRAM_RECIPIENT_ID");

    if (!recipientId?.length) throw new Error(`Recipient ID undefined`);

    this.recipientId = recipientId;
    this.bot = new Bot(botToken);
    this.registerBotHandler();
  }

  start(): void {
    this.bot.start();
  }

  async sendFlightInformation(matchedFlights: IMatchedFlight[]): Promise<void> {
    const flightInfoMessage = matchedFlights.map((flight) => {
      return `Price: ${
        Intl.NumberFormat("id-ID", {
          currency: "IDR",
          style: "currency",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(flight.fare)
      }\nAirlines: ${flight.airlines}\nDeparture Hour: ${flight.departureTime}\nFrom: ${flight.departureAirportCode}\nTo: ${flight.arrivalAirportCode}`;
    }).join("\n\n");

    const messageBody =
      `Found ${matchedFlights.length} flights match your criteria\n\n${flightInfoMessage}`;

    await this.bot.api.sendMessage(this.recipientId, messageBody);
  }

  private registerBotHandler(): void {
    this.bot.on("message:text", (ctx) => {
      const chatId = ctx.message.from.id;

      if (!chatId) throw Error(`Chat ID not available`);

      this.bot.api.sendMessage(chatId, "Pong!");
    });

    this.bot.catch((err) => {
      console.error(err.ctx);
    });
  }
}
