import "@twilio-labs/serverless-runtime-types";
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
import {
  auth,
  createClientResponse,
  getClientByPhoneNumber,
} from "attain-aba-shared";

const coordinators: Coordinator[] = [
  {
    Company: 1098187,
    States: ["FL", "IN", "NC", "PA", "TX", "UT"],
    Coordinator: "Blima Merlin",
    Email: "bmerlin@attainaba.com",
    Phone: "732-314-0993",
  },
  {
    Company: 1098187,
    States: ["DC", "MD", "VA"],
    Coordinator: "Esther Sokol",
    Email: "esther.sokol@attainaba.com",
    Phone: "732-515-5044",
  },
  {
    Company: 1098187,
    States: ["AZ", "CO", "IL", "NE", "NJ"],
    Coordinator: "Faye Baruch",
    Email: "faye.baruch@attainaba.com",
    Phone: "732-515-3720",
  },
  {
    Company: 427999,
    States: ["CA", "GA", "OH", "OR", "WA"],
    Coordinator: "Faye Baruch",
    Email: "faye.baruch@attainaba.com",
    Phone: "732-515-3720",
  },
];

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

interface Coordinator {
  Company: number;
  States: string[];
  Coordinator: string;
  Email: string;
  Phone: string;
}

enum EStatus {
  THERE_WILL_BE_A_CHANGE = 1,
  NO_CHANGE = 2,
  I_DO_NOT_KNOW_YET = 3,
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
  twilioClient.messages.create({
    to: context.TWILIO_DEV_PHONE_NUMBER!,
    from: context.TWILIO_PHONE_NUMBER,
    body: "Twilio failed to save the clients response",
  });
  return callback("Failed to saved response");
};

async function getMsg(body: EStatus, number: string, defaultNumber: string) {
  const client = await getClientByPhoneNumber(number);
  let coordinator: Coordinator | undefined;
  if (client && client.state) {
    const state = client.state;
    const clientsCoordinator = coordinators.find(
      (c: Coordinator) =>
        c.States.includes(state) && c.Company === client.orgId,
    );
    if (clientsCoordinator) {
      coordinator = clientsCoordinator;
    }
  }
  const coordinatorPhone = coordinator ? coordinator.Phone : defaultNumber;
  switch (body) {
    case EStatus.THERE_WILL_BE_A_CHANGE:
      return `Thank you! To ensure there is no disruption to your child's services, please fill out this form https://forms.office.com/r/TU7nRX3cWs with your plan details. A member of our team will review the information and follow up with you. Should you have any questions or concerns, please contact ${coordinatorPhone}. We appreciate the opportunity to work with your child!`;
    case EStatus.NO_CHANGE:
      return `Thank you! We have noted your response. If there's anything else we can assist you with, please don't hesitate to reach out to ${coordinatorPhone}. Thank you for the opportunity to work with your child!`;
    case EStatus.I_DO_NOT_KNOW_YET:
      return `Thank you! We have noted your response. We aim to ensure that there is no disruption to your child's services. Please let our office know as soon as you have an update so that we can ensure the smooth continuation of services in 2025. If you have any questions about insurance or if we can assist you in any way, please feel free to reach out to ${coordinatorPhone}. Thank you for the opportunity to work with your child!`;
  }
}
