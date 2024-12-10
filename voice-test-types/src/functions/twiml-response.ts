import {
  Context,
  ServerlessCallback,
  ServerlessEventObject,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import { getClientByPhoneNumber } from "attain-aba-shared";

export const handler: ServerlessFunctionSignature = async function (
  context: Context,
  event: ServerlessEventObject & { Digits?: string; phoneNumber?: string },
  callback: ServerlessCallback,
) {
  if (!event.phoneNumber) {
    return callback("No Phone number provided");
  }
  const response = new Twilio.twiml.VoiceResponse();
  const gather = response.gather({
    input: ["dtmf", "speech"],
    numDigits: 1,
    timeout: 30,
    action: `https://${context.DOMAIN_NAME}/handle-response?phoneNumber=${event.phoneNumber}`,
  });
  const client = await getClientByPhoneNumber(event.phoneNumber);
  gather.say(
    { voice: "man", language: "en-US" },
    `Warmest holiday greetings from your Attain ABA family!
    IMPORTANT UPDATE: Open Enrollment season is here! Can you please let us know about any changes to your insurance so we can avoid any disruption to your child's services? 
    Please press or say the number that best describes your current insurance status: 
    1 - My insurance policy will be changing 
    2 - There will be no change to my current policy 
    3 - I do not yet know if there will be any changes to my policy 
    We look forward to accomplishing many more amazing milestones in 2025. Have a wonderful day! `,
  );
  gather.say("To repeat these options please press 4");
  response.redirect(
    `https://${context.DOMAIN_NAME}/twiml-response?phoneNumber=${event.phoneNumber}`,
  );
  callback(null, response);
};
