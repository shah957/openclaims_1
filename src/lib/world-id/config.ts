import { deviceLegacy, type IDKitErrorCode } from "@worldcoin/idkit-core";

const DEFAULT_WORLD_ACTION = "openclaims-verify";

export function getWorldAction(programSlug?: string) {
  void programSlug;
  return process.env.NEXT_PUBLIC_WORLD_ACTION?.trim() || DEFAULT_WORLD_ACTION;
}

export function getWorldLegacyPreset() {
  return deviceLegacy();
}

export function getWorldErrorMessage(error: IDKitErrorCode | string) {
  switch (error) {
    case "credential_unavailable":
      return "World App could not find a matching credential on this account. Try a different verified method or account.";
    case "invalid_network":
      return "World App and this app are using different environments. Use World App for production apps and the simulator for staging apps.";
    case "malformed_request":
      return "World ID rejected the request payload. The request format was updated, so please try again.";
    case "max_verifications_reached":
      return "This account has already used the maximum number of verifications for this action.";
    case "verification_rejected":
      return "Verification was rejected in World App. Please confirm the request in the app and try again.";
    case "user_rejected":
    case "cancelled":
      return "Verification was cancelled before it completed.";
    case "connection_failed":
      return "Could not connect to World App. Check the network connection on both devices and try again.";
    case "inclusion_proof_pending":
      return "Your credential is not ready yet. Please wait a bit and try again.";
    case "inclusion_proof_failed":
      return "World App could not assemble a proof this time. Please retry.";
    default:
      return `World ID did not complete successfully: ${error}`;
  }
}
