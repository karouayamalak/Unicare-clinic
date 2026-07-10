import { OAuth2Client } from "google-auth-library";
import { env } from "../config";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GooglePayload {
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

export const verifyGoogleIdToken = async (
  idToken: string,
): Promise<GooglePayload> => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid Google token payload");
  }
  return {
    email: payload.email,
    given_name: payload.given_name,
    family_name: payload.family_name,
    name: payload.name,
    picture: payload.picture,
  };
};
