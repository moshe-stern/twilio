import "@twilio-labs/serverless-runtime-types";
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import {
  auth,
  createClientResponse,
  EStatus,
} from "attain-aba-shared";

interface IClientResponse {
  ApiVersion: string;
  SmsSid: string;
  SmsStatus: string;
  SmsMessageSid: string;
  NumSegments: string;
  ToState: string;
  From: string;
  MessageSid: string;
  AccountSid: string;
  ToCity: string;
  FromCountry: string;
  ToZip: string;
  FromCity: string;
  To: string;
  FromZip: string;
  ToCountry: string;
  Body: string;
  NumMedia: string;
  FromState: string;
}

export const handler: ServerlessFunctionSignature = async function (
  context: Context & {
    DEFAULT_COORDINATOR_NUMBER?: string;
    TWILIO_PHONE_NUMBER?: string;
    TWILIO_DEV_PHONE_NUMBER?: string;
    DB_API_KEY?: string;
  },
  event: {},
  callback: ServerlessCallback,
) {
  auth(context.DB_API_KEY!)
  const { getMsg } = require(Runtime.getFunctions()["shared/get-message"].path);
  const twiml = new Twilio.twiml.MessagingResponse();
  const clientResponse = event as IClientResponse;
  const clientsPhone = clientResponse.From.replace(/^\+1/, "");
  if (!EStatus[+clientResponse.Body]) {
    twiml.message(
      "This is an invalid response, please select a valid response",
    );
    return callback(null, twiml);
  }
  const clientResponseMsg = await getMsg(
    +clientResponse.Body,
    clientsPhone,
    context.DEFAULT_COORDINATOR_NUMBER!,
  );
  const res = await createClientResponse({
    phoneNumber: clientsPhone,
    responseType: "OPEN ENROLLMENT 2025",
    body: clientResponse.Body,
    responseDate: new Date(),
  });
  if (res) {
    twiml.message(clientResponseMsg as string);
    return callback(null, twiml);
  }

  const twilioClient = context.getTwilioClient();
  const res2 = await twilioClient.messages.create({
    to: context.TWILIO_DEV_PHONE_NUMBER!,
    from: context.TWILIO_PHONE_NUMBER,
    body: "Twilio failed to save the clients response",
  });
  return callback(`Failed to saved response, Sending the following Msg to Developer: ${res2.body}`);
};
