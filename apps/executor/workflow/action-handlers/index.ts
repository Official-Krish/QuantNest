import { ActionHandlerFactory, type IActionHandler } from "./base.handler";
import { noopHandler, delayHandler, recheckHandler } from "./flow-control";
import {
  gmailHandler,
  discordHandler,
  slackHandler,
  telegramHandler,
  whatsappHandler,
} from "./notifications";
import {
  googleDriveHandler,
  googleSheetsHandler,
  notionHandler,
} from "./reporting";
import { zerodhaHandler, growwHandler, lighterHandler } from "./trading";
import { postgresHandler } from "./database";
import { solanaSwapHandler } from "./solana";

export const actionHandlerFactory = new ActionHandlerFactory();

function register(handler: IActionHandler): void {
  actionHandlerFactory.register(handler);
}

register(noopHandler);
register(delayHandler);
register(recheckHandler);
register(zerodhaHandler);
register(growwHandler);
register(lighterHandler);
register(gmailHandler);
register(slackHandler);
register(telegramHandler);
register(discordHandler);
register(whatsappHandler);
register(notionHandler);
register(googleDriveHandler);
register(googleSheetsHandler);
register(postgresHandler);
register(solanaSwapHandler);

export type {
  ActionHandler,
  ActionHandlerParams,
  ExecuteActionNodeParams,
} from "./shared";
