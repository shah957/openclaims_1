import type { IDKitResult } from "@worldcoin/idkit-core";

export interface VerifyProofResponse {
  success?: boolean;
  detail?: string;
  message?: string;
  nullifier?: string;
  nullifier_hash?: string;
  results?: Array<{
    identifier?: string;
    success?: boolean;
    nullifier?: string;
    detail?: string;
  }>;
}

export async function verifyWorldProof(proof: IDKitResult) {
  const response = await fetch(
    `https://developer.world.org/api/v4/verify/${process.env.WORLD_RP_ID}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(proof),
    },
  );

  const result = (await response.json()) as VerifyProofResponse;

  return {
    ok: response.ok && result.success === true,
    status: response.status,
    result,
  };
}
