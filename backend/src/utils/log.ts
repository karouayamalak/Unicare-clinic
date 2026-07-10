import { ActionLog } from "../models/actionLog.model";
import { IUser } from "../models/user.model";

export const logAction = async (
  actor: IUser,
  action: string,
  objectType: string,
  objectId?: string,
  details?: string,
): Promise<void> => {
  try {
    await ActionLog.create({
      actorId: actor._id?.toString() ?? "",
      actorEmail: actor.email,
      actorName: `${actor.firstName} ${actor.lastName}`.trim(),
      actorRole: actor.role,
      action,
      objectType,
      objectId: objectId ?? "",
      details: details ?? "",
    });
  } catch {
    // Logging failure should never crash the main request
  }
};
