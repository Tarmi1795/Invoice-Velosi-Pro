export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Given a project_id, resolve the contract → preset chain and return the config
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const contractId = searchParams.get("contract_id");

    let presetData = null;

    if (projectId) {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: {
          clients_and_contracts: {
            include: { workflow_presets: true }
          }
        }
      });
      presetData = project?.clients_and_contracts?.workflow_presets;
    } else if (contractId) {
      const contract = await prisma.clients_and_contracts.findUnique({
        where: { id: contractId },
        include: { workflow_presets: true }
      });
      presetData = contract?.workflow_presets;
    }

    if (!presetData) {
      // Return "show all" config
      return NextResponse.json({ preset: null, showAll: true });
    }

    return NextResponse.json({
      preset: {
        id: presetData.id,
        name: presetData.preset_name,
        visible_fields: JSON.parse(presetData.visible_fields || "{}"),
        workflow_steps: JSON.parse(presetData.workflow_steps || "[]"),
        default_values: JSON.parse(presetData.default_values || "{}"),
        invoice_template: presetData.invoice_template,
        company_address: presetData.company_address,
        company_contact: presetData.company_contact,
        bank_details: presetData.bank_details,
      },
      showAll: false
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ preset: null, showAll: true });
  }
}
