import "@twilio-labs/serverless-runtime-types";
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { IClientResponseRecord } from "attain-aba-types";

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

enum EStatus {
  THERE_WILL_BE_A_CHANGE = 1,
  NO_CHANGE = 2,
  I_DO_NOT_KNOW_YET = 3,
}

async function doPost(data: {}, url: string) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error(error);
  }
}

export const handler: ServerlessFunctionSignature = async function (
  context: Context & {
    AZURE_FUNCTION_URL?: string;
    TWILIO_PHONE_NUMBER?: string;
    TWILIO_DEV_PHONE_NUMBER?: string;
  },
  event: {},
  callback: ServerlessCallback,
) {
  const twiml = new Twilio.twiml.MessagingResponse();
  const clientResponse = event as IClientResponse;
  if (!EStatus[+clientResponse.Body]) {
    twiml.message(
      "This is an invalid response, please select a valid response",
    );
    return callback(null, twiml);
  }

  const clientResponseRecord: Omit<IClientResponseRecord, "id"> = {
    phoneNumber: clientResponse.From,
    responseType: "OPEN ENROLLMENT 2025",
    body: clientResponse.Body,
    responseDate: new Date(),
  };
  const res = await doPost(clientResponseRecord, context.AZURE_FUNCTION_URL!);
  if (res) {
    twiml.message(
      "Thank you for your response! We’ve noted your selection and will reach out to you with any questions.",
    );
    return callback(null, twiml);
  }

  const twilioClient = context.getTwilioClient();
  twilioClient.messages.create({
    to: context.TWILIO_DEV_PHONE_NUMBER!,
    from: context.TWILIO_PHONE_NUMBER,
    body: "Twilio failed to save the clients response",
  });
  return callback("Failed to saved response");
};
