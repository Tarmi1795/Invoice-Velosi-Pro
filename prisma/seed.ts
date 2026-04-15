import { prisma } from "../src/lib/db";

const DEFAULT_PRESETS = [
  {
    preset_name: "Standard Inspection Workflow",
    description: "Default workflow for inspection projects with Proforma → SES → Invoice steps",
    visible_fields: JSON.stringify(["client_name", "contract_no", "inspector_id", "inspection_start_date", "report_no", "proforma_inv_no", "ses_no", "invoice_no"]),
    workflow_steps: JSON.stringify(["Proforma", "SES", "Invoice"]),
    default_values: JSON.stringify({ currency: "QAR", payment_status: "Pending", active_status: true }),
  },
  {
    preset_name: "Quick Turnaround",
    description: "Streamlined workflow for fast-track inspections with abbreviated steps",
    visible_fields: JSON.stringify(["client_name", "contract_no", "inspector_id", "inspection_start_date", "proforma_inv_no", "invoice_no"]),
    workflow_steps: JSON.stringify(["Proforma", "Invoice"]),
    default_values: JSON.stringify({ currency: "QAR", payment_status: "Pending", active_status: true }),
  },
];

async function main() {
  console.log("Seeding default workflow presets...");

  const existing = await prisma.workflow_presets.findMany();
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing presets, skipping seed.`);
    return;
  }

  for (const preset of DEFAULT_PRESETS) {
    await prisma.workflow_presets.create({ data: preset });
    console.log(`Created preset: ${preset.preset_name}`);
  }

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
