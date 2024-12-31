import { EStatus, getClientByPhoneNumber, ICoordinator } from "attain-aba-shared";

export async function getMsg(body: EStatus, number: string, defaultNumber: string) {
    const client = await getClientByPhoneNumber(number);
    let coordinator: ICoordinator | undefined;
    const assetPath = Runtime.getAssets()["/data.json"];
    const asset = assetPath.open();
    const coordinators: ICoordinator[] = JSON.parse(asset);
    if (client && client.state) {
      const state = client.state;
      const clientsCoordinator = coordinators.find(
        (c: ICoordinator) =>
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