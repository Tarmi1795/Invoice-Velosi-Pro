const fs = require('fs');
const path = require('path');

const entities = [
  {
    name: 'clients',
    model: 'clients_and_contracts',
    singular: 'Client',
    columns: ['client_name', 'contract_no', 'currency'],
    fields: ['client_name', 'contract_no', 'currency', 'original_contract_value', 'running_balance', 'description'],
    relationships: []
  },
  {
    name: 'projects',
    model: 'projects',
    singular: 'Project',
    columns: ['project_name', 'po_no', 'focal_name'],
    fields: ['contract_id', 'project_name', 'po_no', 'itp_code', 'budget', 'focal_name', 'focal_email'],
    relationships: [
      { field: 'contract_id', name: 'clients', endpoint: '/api/clients', labelKey: 'client_name' }
    ]
  },
  {
    name: 'inspectors',
    model: 'inspectors',
    singular: 'Inspector',
    columns: ['full_name', 'job_title', 'base_location'],
    fields: ['full_name', 'job_title', 'base_location'],
    relationships: []
  },
  {
    name: 'inspections',
    model: 'inspections_summary',
    singular: 'Inspection',
    columns: ['report_no', 'inspection_start_date', 'vendor_location'],
    fields: ['project_id', 'inspector_id', 'report_no', 'coordinator_name', 'vendor_location', 'inspection_start_date', 'inspection_end_date', 'work_duration', 'ot_duration', 'duration_tag', 'travel_routing', 'mileage', 'expenses_amount', 'ts_filename', 'ts_file_verified'],
    relationships: [
      { field: 'project_id', name: 'projects', endpoint: '/api/projects', labelKey: 'project_name' },
      { field: 'inspector_id', name: 'inspectors', endpoint: '/api/inspectors', labelKey: 'full_name' }
    ]
  },
  {
    name: 'invoices',
    model: 'proformas_and_invoices',
    singular: 'Invoice',
    columns: ['invoice_no', 'proforma_inv_no', 'total_amount', 'payment_status'],
    fields: ['inspection_id', 'proforma_inv_no', 'proforma_inv_date', 'sap_sales_order', 'invoice_no', 'invoice_date', 'conso_invoice_no', 'conso_filename', 'total_amount', 'credit_memo_no', 'credit_memo_amount', 'payment_status'],
    relationships: [
      { field: 'inspection_id', name: 'inspections', endpoint: '/api/inspections', labelKey: 'report_no' }
    ]
  },
  {
    name: 'ses',
    model: 'ses_records',
    singular: 'SES Record',
    columns: ['ses_no', 'ses_value', 'status'],
    fields: ['proforma_inv_id', 'ses_no', 'ses_date', 'ses_value', 'sap_work_order', 'status'],
    relationships: [
      { field: 'proforma_inv_id', name: 'invoices', endpoint: '/api/invoices', labelKey: 'invoice_no' }
    ]
  }
];

const getApiContent = (model) => `
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const data = await prisma.${model}.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    Object.keys(body).forEach(k => {
      if (['work_duration', 'ot_duration', 'mileage', 'expenses_amount', 'total_amount', 'credit_memo_amount', 'ses_value', 'original_contract_value', 'running_balance'].includes(k)) {
        if(body[k]) body[k] = Number(body[k]);
      }
      if (k.includes('date') && body[k]) {
        body[k] = new Date(body[k]);
      }
      if (typeof body[k] === 'string' && body[k].trim() === '') {
        body[k] = null;
      }
      if (k === 'active_status' || k === 'ts_file_verified') {
        if (typeof body[k] === 'string') body[k] = body[k].toLowerCase() === 'true';
      }
    });

    const newData = await prisma.${model}.create({
      data: body
    });
    return NextResponse.json(newData, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
`;

const getApiIdContent = (model) => `
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await request.json();
    Object.keys(body).forEach(k => {
      if (['work_duration', 'ot_duration', 'mileage', 'expenses_amount', 'total_amount', 'credit_memo_amount', 'ses_value', 'original_contract_value', 'running_balance'].includes(k)) {
        if(body[k]) body[k] = Number(body[k]);
      }
      if (k.includes('date') && body[k]) {
        body[k] = new Date(body[k]);
      }
      if (typeof body[k] === 'string' && body[k].trim() === '') {
        body[k] = null;
      }
      if (k === 'active_status' || k === 'ts_file_verified') {
        if (typeof body[k] === 'string') body[k] = body[k].toLowerCase() === 'true';
      }
    });
    const updated = await prisma.${model}.update({
      where: { id: id },
      data: body
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
      const { id } = await params;
    await prisma.${model}.delete({
      where: { id: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
`;

const getPageContent = (e) => `
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";

export default function ${e.singular.replace(' ', '')}Page() {
  const [data, setData] = useState<any[]>([]);
  ${e.relationships.map(rel => `const [${rel.name}, set${rel.name.charAt(0).toUpperCase() + rel.name.slice(1)}] = useState<any[]>([]);`).join('\n  ')}
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const initialForm = {
    ${e.fields.map(f => {
      if(f === 'ts_file_verified' || f === 'active_status') return `${f}: false`;
      return `${f}: ""`;
    }).join(',\n    ')}
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/${e.name}', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      await Promise.all([
        ${e.relationships.map(rel => `
          fetch('${rel.endpoint}', { cache: 'no-store' }).then(r => r.json()).then(d => {
            set${rel.name.charAt(0).toUpperCase() + rel.name.slice(1)}(Array.isArray(d) ? d : []);
          })
        `).join(',')}
      ]);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    ${e.relationships.length > 0 ? `fetchRelationships();` : ''}
  }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? \`/api/${e.name}/\${editingItem.id}\` : '/api/${e.name}';
    const method = editingItem ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await fetch(\`/api/${e.name}/\${id}\`, { method: 'DELETE' });
      fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const fd: any = {};
    Object.keys(initialForm).forEach(k => {
      if(k.includes('date') && item[k]) {
        fd[k] = new Date(item[k]).toISOString().split('T')[0];
      } else {
        fd[k] = item[k] !== null ? item[k] : "";
      }
    });
    setFormData(fd);
    setIsModalOpen(true);
  };

  const columns = [
    ${e.columns.map(c => {
      if(c.includes('date')) return `{ key: "${c}", label: "${c.replace(/_/g, ' ').toUpperCase()}", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' }`;
      return `{ key: "${c}", label: "${c.replace(/_/g, ' ').toUpperCase()}" }`;
    }).join(',\n    ')},
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-blue-500 hover:text-blue-400 p-1">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">${e.singular}s</h1>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsBatchModalOpen(true)}
                className="btn-secondary flex items-center gap-2"
            >
                <UploadCloud size={18} /> Batch Input
            </button>
            <button 
                onClick={() => {
                    setEditingItem(null);
                    setFormData(initialForm);
                    setIsModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} /> Add ${e.singular}
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="${e.columns[0]}" />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit ${e.singular}" : "New ${e.singular}"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          ${e.fields.map(f => {
            const rel = e.relationships.find(r => r.field === f);
            if (rel) {
              return `
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">${rel.name.toUpperCase()}</label>
                <select 
                  className="input !bg-[#0f1117]" 
                  value={formData.${f}} 
                  onChange={ev => setFormData({...formData, ${f}: ev.target.value})}
                >
                  <option value="">Select ${f.replace(/_/g, ' ')}...</option>
                  {${rel.name}.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.${rel.labelKey} || opt.id}</option>
                  ))}
                </select>
              </div>
              `;
            }

            if(f.includes('date')) {
              return `
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">${f.replace(/_/g, ' ').toUpperCase()}</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.${f}} 
                  onChange={ev => setFormData({...formData, ${f}: ev.target.value})} 
                />
              </div>
              `;
            }

             if(f === 'ts_file_verified' || f === 'active_status' || f.includes('status')) {
               if(f === 'payment_status') {
                 return `
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-300">PAYMENT STATUS</label>
                   <select className="input" value={formData.payment_status} onChange={ev => setFormData({...formData, payment_status: ev.target.value})}>
                     <option value="Pending">Pending</option>
                     <option value="Paid">Paid</option>
                     <option value="With Term">With Term</option>
                     <option value="Cancelled">Cancelled</option>
                   </select>
                 </div>
                 `;
               }
               if(f === 'status' && e.name === 'ses') {
                 return `
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-300">SES STATUS</label>
                   <select className="input" value={formData.status} onChange={ev => setFormData({...formData, status: ev.target.value})}>
                     <option value="Pending">Pending</option>
                     <option value="Received">Received</option>
                     <option value="Returned for Revision">Returned for Revision</option>
                     <option value="Approved">Approved</option>
                   </select>
                 </div>
                 `;
               }
               if(f === 'ts_file_verified' || f === 'active_status') {
                   return `
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-300">${f.replace(/_/g, ' ').toUpperCase()}</label>
                     <select className="input" value={String(formData.${f})} onChange={ev => setFormData({...formData, ${f}: ev.target.value === 'true'})}>
                       <option value="true">True</option>
                       <option value="false">False</option>
                     </select>
                   </div>
                   `;
               }
            }

            return `
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">${f.replace(/_/g, ' ').toUpperCase()}</label>
              <input 
                type="${f.includes('amount') || f.includes('duration') || f.includes('value') || f.includes('balance') ? 'number' : 'text'}" 
                step="any"
                className="input" 
                value={formData.${f}} 
                onChange={ev => setFormData({...formData, ${f}: ev.target.value})} 
              />
            </div>
            `;
          }).join('')}

          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#2d2f3d]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          entityName="${e.singular}"
          apiEndpoint="/api/${e.name}"
          onSuccess={fetchData}
          expectedHeaders={[${e.fields.map(f => `'${f}'`).join(', ')}]}
      />
    </div>
  );
}
`;

entities.forEach(e => {
  const pageDir = path.join(__dirname, 'src', 'app', e.name);
  const apiDir = path.join(__dirname, 'src', 'app', 'api', e.name);
  const apiIdDir = path.join(__dirname, 'src', 'app', 'api', e.name, '[id]');
  
  [pageDir, apiDir, apiIdDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  fs.writeFileSync(path.join(pageDir, 'page.tsx'), getPageContent(e));
  fs.writeFileSync(path.join(apiDir, 'route.ts'), getApiContent(e.model));
  fs.writeFileSync(path.join(apiIdDir, 'route.ts'), getApiIdContent(e.model));
});

console.log('Pages generated successfully with Batch Upload support!');
