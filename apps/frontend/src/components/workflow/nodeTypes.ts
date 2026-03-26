import { PriceTrigger } from "@/components/nodes/triggers/PriceTrigger";
import { Timer } from "@/components/nodes/triggers/timers";
import { zerodhaAction } from "@/components/nodes/actions/zerodha";
import { growwAction } from "@/components/nodes/actions/growwAction";
import { gmailAction } from "@/components/nodes/actions/gmailAction";
import { delayAction } from "@/components/nodes/actions/delayAction";
import { slackAction } from "@/components/nodes/actions/slackAction";
import { discordAction } from "@/components/nodes/actions/discordAction";
import { ifAction } from "@/components/nodes/actions/ifAction";
import { whatsappAction } from "@/components/nodes/actions/whatsappAction";
import { notionDailyReportAction } from "@/components/nodes/actions/notionDailyReportAction";
import { googleDriveDailyCsvAction } from "@/components/nodes/actions/googleDriveDailyCsvAction";
import { lighterAction } from "@/components/nodes/actions/lighterAction";
import { conditionTrigger } from "@/components/nodes/triggers/condtional";

export const workflowNodeTypes = {
  "price-trigger": PriceTrigger,
  timer: Timer,
  zerodha: zerodhaAction,
  groww: growwAction,
  delay: delayAction,
  if: ifAction,
  gmail: gmailAction,
  slack: slackAction,
  discord: discordAction,
  whatsapp: whatsappAction,
  "notion-daily-report": notionDailyReportAction,
  "google-drive-daily-csv": googleDriveDailyCsvAction,
  lighter: lighterAction,
  "conditional-trigger": conditionTrigger,
};
