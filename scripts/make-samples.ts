import fs from 'fs';import * as XLSX from 'xlsx';import Papa from 'papaparse';
import {sampleData} from '../src/lib/data';
const NOW='2026-11-10';const d=sampleData(120,NOW);
const std=d.map(r=>({'Record ID':r.id,'Title':r.title,'Category':r.category,'Assigned Employee':r.employee,'Department':r.department,'Created Date':r.created,'Due Date':r.due,'Completed Date':r.completed,'Status':r.status,'Priority':r.priority,'SLA Target (hrs)':r.sla??'','Actual Resolution (hrs)':r.resolution??''}));
fs.writeFileSync('public/samples/sample-ops.csv',Papa.unparse(std));
const serial=(s:string)=>s?Math.round(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/86400000)+25569:'';
const heads=Object.keys(std[0]);const aoa:any[][]=[heads,...d.map(r=>[r.id,r.title,r.category,r.employee,r.department,serial(r.created),serial(r.due),serial(r.completed),r.status,r.priority,r.sla??'',r.resolution??''])];
const ws=XLSX.utils.aoa_to_sheet(aoa);for(let R=1;R<aoa.length;R++)for(const C of [5,6,7]){const c=ws[XLSX.utils.encode_cell({r:R,c:C})];if(c&&c.t==='n')c.z='yyyy-mm-dd'}
const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Operations');XLSX.writeFile(wb,'public/samples/sample-ops.xlsx');
// messy file: different headers, 14 valid, 5 rejected, 2 duplicates (21 data rows)
const H=['Ticket No','Summary','Owner','Team','Opened','Target Date','Closed','State','Severity','Hours Taken','SLA Hours'];
const ok=(i:number)=>['T-'+(100+i),'Task '+i,'Priya S','IT Service Desk','2026-10-0'+(1+i%8),'2026-10-20',i%2?'2026-10-1'+(i%8):'',i%2?'Done':'Open','High',i%2?'12':'', '24'];
const rows:string[][]=[];for(let i=0;i<14;i++)rows.push(ok(i));
const bad=(f:(r:string[])=>void)=>{const r=ok(1);f(r);return r};
rows.push(bad(r=>r[4]='2026-02-31'));rows.push(bad(r=>r[2]=''));rows.push(bad(r=>r[7]='Banana'));rows.push(bad(r=>r[6]=''));rows.push(bad(r=>{r[4]='2026-10-05';r[6]='2026-10-01'}));
rows.push(ok(2));rows.push(ok(3));
fs.writeFileSync('public/samples/sample-ops-messy.csv',Papa.unparse({fields:H,data:rows}));
console.log('samples written');
