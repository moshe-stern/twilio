import {
  ServerlessFunctionSignature,
  Context,
  ServerlessCallback,
  ServerlessEventObject,
} from "@twilio-labs/serverless-runtime-types/types";
import { EStatus } from "attain-aba-shared";

export const handler: ServerlessFunctionSignature = async function (
  context: Context & { TWILIO_PHONE_NUMBER?: string },
  event: ServerlessEventObject & {
    Digits?: string;
    SpeechResult?: string;
    phoneNumber?: string;
  },
  callback: ServerlessCallback,
) {
  const { getMsg } = require(Runtime.getFunctions()["shared/get-message"].path);
  const response = new Twilio.twiml.VoiceResponse();
  const userInput = event.Digits || event.SpeechResult;
  if (!event.phoneNumber || !context.TWILIO_PHONE_NUMBER) {
    callback("No phone number provided");
    return;
  }
  if (userInput && EStatus[+userInput]) {
    const msg = await getMsg(
      +userInput,
      event.phoneNumber!,
      context.TWILIO_PHONE_NUMBER!,
    );
    response.say({ voice: "man" }, msg);
  } else if (userInput === "4") {
    response.redirect(
      `https://${context.DOMAIN_NAME}/twiml-response?phoneNumber=${event.phoneNumber}`,
    );
  } else {
    response.say({ voice: "man" }, "Invalid input. Please try again.");
    response.redirect(
      `https://${context.DOMAIN_NAME}/twiml-response?phoneNumber=${event.phoneNumber}`,
    );
  }
  callback(null, response);
};
