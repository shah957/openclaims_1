import { signRequest } from "@worldcoin/idkit-core/signing";

export function createRpContext(action: string) {
  const signature = signRequest({
    signingKeyHex: process.env.WORLD_RP_SIGNING_KEY!,
    action,
    ttl: 60 * 5,
  });

  return {
    rp_id: process.env.WORLD_RP_ID!,
    nonce: signature.nonce,
    created_at: signature.createdAt,
    expires_at: signature.expiresAt,
    signature: signature.sig,
  };
}
