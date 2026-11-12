import fs from 'fs';
import {parseCsvText,parseXlsxBuffer} from '../src/lib/importer';
import {autoMap,validateRows,parseDate,kpis,sampleData,applyFilters,groupBy,insights,buildRecord,slaMet} from '../src/lib/data';
import {NOFILTER,Rec} from '../src/types';
let fail=0,n=0;const t=(name:string,ok:boolean,info='')=>{n++;if(!ok)fail++;console.log(ok?'PASS':'FAIL',name,info)};
const eq=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
// dates
t('date ISO',parseDate('2026-02-03')==='2026-02-03');t('date dd/mm/yyyy',parseDate('31/12/2025')==='2025-12-31');t('date serial',parseDate(45000)==='2023-03-15');
t('date invalid Feb 30',parseDate('2026-02-30')===null);t('date garbage',parseDate('abc')===null);t('date empty',parseDate('')==='');
// KPI maths on a known dataset
const R=(o:Partial<Rec>):Rec=>({id:'x',title:'t',category:'c',employee:'e',department:'d',created:'2026-01-01',due:'2026-01-10',completed:'',status:'Pending',priority:'Medium',sla:null,resolution:null,...o});
const small=[R({id:'1',status:'Completed',completed:'2026-01-02',sla:24,resolution:10}),R({id:'2',status:'Completed',completed:'2026-01-03',sla:24,resolution:30}),R({id:'3',status:'Pending',due:'2026-01-05'}),R({id:'4',status:'In Progress',due:'2099-01-01'})];
const k=kpis(small,'2026-06-01');
t('KPI counts',eq([k.total,k.completed,k.pending,k.inProgress,k.overdue],[4,2,1,1,1]),JSON.stringify(k));
t('KPI completion 50%',k.completionPct===50);t('KPI avg resolution 20h',k.avgResolution===20);t('KPI SLA 50%',k.slaPct===50&&k.slaEligible===2);
const z=kpis([]);t('Empty dataset: no divide-by-zero',z.total===0&&z.completionPct===0&&z.avgResolution===0&&z.slaPct===null);
t('Incomplete never SLA-eligible',slaMet(R({status:'Pending',sla:10,resolution:5}))===null);
t('Completed without date rejected',buildRecord(k=>({id:'1',title:'a',employee:'e',department:'d',created:'2026-01-01',status:'Done'} as any)[k]).reasons.length>0);
// sample data
const s=sampleData(120,'2026-11-10');const ks=kpis(s,'2026-11-10');
t('Sample ≥100 unique records',s.length>=100&&new Set(s.map(r=>r.id)).size===s.length);
t('Sample status totals add up',ks.completed+ks.pending+ks.inProgress===ks.total,JSON.stringify({...ks}));
t('Sample completed all have dates',s.filter(r=>r.status==='Completed').every(r=>r.completed&&r.completed>=r.created));
t('Sample has overdue + pending + completed',ks.overdue>0&&ks.pending>0&&ks.completed>0);
t('Group totals = total',groupBy(s,'department').reduce((a,x)=>a+x.total,0)===s.length);
// filters
const fd=applyFilters(s,{...NOFILTER,dept:'Logistics'});t('Dept filter',fd.length>0&&fd.every(r=>r.department==='Logistics'));
t('Combined filters',applyFilters(s,{...NOFILTER,status:'Completed',priority:'High'}).every(r=>r.status==='Completed'&&r.priority==='High'));
t('Date filter',applyFilters(s,{...NOFILTER,from:'2026-10-01',to:'2026-10-31'}).every(r=>r.created>='2026-10-01'&&r.created<='2026-10-31'));
t('Insights produced',insights(s,'2026-11-10').length>=4);t('Insights on empty',insights([]).length===1);
// CSV import (clean) + XLSX import equivalence
const csv=parseCsvText(fs.readFileSync('public/samples/sample-ops.csv','utf8'));const m=autoMap(csv.columns);
t('Auto-map all 12 fields',Object.keys(m).length===12,JSON.stringify(m));
const v1=validateRows(csv.rows,m,new Set());t('CSV: 120 valid, 0 rejected',v1.valid.length===120&&v1.rejected.length===0&&v1.duplicates.length===0);
t('CSV import reproduces KPIs',eq(kpis(v1.valid,'2026-11-10'),ks));
const xl=parseXlsxBuffer(fs.readFileSync('public/samples/sample-ops.xlsx').buffer.slice(0) as ArrayBuffer);const v2=validateRows(xl.rows,autoMap(xl.columns),new Set());
t('XLSX: 120 valid (date serials parsed)',v2.valid.length===120&&v2.rejected.length===0);t('XLSX records equal CSV records',eq(v2.valid,v1.valid));
t('Re-import: all rows flagged duplicate',validateRows(csv.rows,m,new Set(v1.valid.map(r=>r.id))).duplicates.length===120);
// messy file
const mc=parseCsvText(fs.readFileSync('public/samples/sample-ops-messy.csv','utf8'));const mm=autoMap(mc.columns);
t('Messy headers auto-mapped (≥9 fields)',Object.keys(mm).length>=9,JSON.stringify(mm));
const v3=validateRows(mc.rows,mm,new Set());t('Messy: 14 valid / 5 rejected / 2 duplicate',v3.valid.length===14&&v3.rejected.length===5&&v3.duplicates.length===2,`${v3.valid.length}/${v3.rejected.length}/${v3.duplicates.length}`);
t('Rejected rows carry reasons',v3.rejected.every(r=>r.reasons.length>0&&r.row>1),JSON.stringify(v3.rejected.map(r=>r.reasons[0])));
// bad files
for(const [name,fn] of [['empty file',()=>parseCsvText('   ')],['header only',()=>parseCsvText('a,b,c\n')],['garbage xlsx',()=>parseXlsxBuffer(new TextEncoder().encode('not excel').buffer as ArrayBuffer)]] as const){let e=false;try{fn()}catch{e=true}t('Graceful error: '+name,e)}
console.log(`\n${n-fail}/${n} passed`);process.exit(fail?1:0);
