import { NextResponse } from "next/server";
import { getProgramDashboard } from "@/lib/dashboard";

type ProgramRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: ProgramRouteProps) {
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

  return NextResponse.json({
    data: dashboard,
  });
}
