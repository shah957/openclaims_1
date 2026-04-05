import { NextResponse } from "next/server";
import { getProgramDashboard } from "@/lib/dashboard";

type ExportRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: ExportRouteProps) {
  const { id } = await params;
  const dashboard = await getProgramDashboard(id);

  if (!dashboard.program) {
    return NextResponse.json(
      {
        error: "not_found",
        message: "Program not found.",
      },
      { status: 404 },
    );
  }

  const approvedClaims = dashboard.claims.filter((claim) =>
    ["auto_approved", "manually_approved"].includes(claim.status),
  );

  const lines = [
    "claim_id,claimant_pseudonym,amount_approved,category,submitted_at,status",
    ...approvedClaims.map((claim) =>
      [
        claim.id,
        claim.nullifier_hash.slice(0, 12),
        (claim.amount_approved ?? claim.amount_requested).toFixed(2),
        claim.category,
        claim.submitted_at,
        claim.status,
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${dashboard.program.slug}-approved-claims.csv"`,
    },
  });
}
