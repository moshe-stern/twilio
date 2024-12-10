import {
  ServerlessFunctionSignature,
  Context,
  ServerlessCallback,
  ServerlessEventObject,
} from "@twilio-labs/serverless-runtime-types/types";
import "@twilio-labs/serverless-runtime-types";

export const handler: ServerlessFunctionSignature = async function (
  context: Context & { TWILIO_PHONE_NUMBER?: string },
  event: ServerlessEventObject & { phoneNumber?: string },
  callback: ServerlessCallback,
) {
  if (!event.phoneNumber) {
    callback("No phone number provided");
    return;
  }
  const twilioClient = context.getTwilioClient();
  try {
    await twilioClient.calls.create({
      from: context.TWILIO_PHONE_NUMBER!,
      to: event.phoneNumber,
      url: `https://${context.DOMAIN_NAME}/twiml-response?phoneNumber=${event.phoneNumber}`,
    });
    callback(null, "Call intiated");
  } catch (error) {
    callback((error as Error).message);
  }
};
