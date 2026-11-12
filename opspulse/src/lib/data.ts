import {Rec,Status,Priority,Filters} from '../types';
const pad=(n:number)=>String(n).padStart(2,'0');
export const isoDate=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const today=()=>isoDate(new Date());
export const addDays=(s:string,n:number)=>{const [y,m,d]=s.split('-').map(Number);return isoDate(new Date(y,m-1,d+n))};
const dayNum=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return Math.round(Date.UTC(y,m-1,d)/86400000)};
export const diffDays=(a:string,b:string)=>dayNum(b)-dayNum(a);
// ---------- field definitions & mapping ----------
export const FIELDS=[
 {k:'id',l:'Record ID',req:true,syn:['id','recordid','ticketid','ticketno','ticketnumber','taskid','ref','reference']},
 {k:'title',l:'Title',req:true,syn:['title','summary','subject','task','taskname','description','ticket']},
 {k:'category',l:'Category',req:false,syn:['category','type','tasktype']},
 {k:'employee',l:'Assigned employee',req:true,syn:['employee','assignee','assignedto','assignedemployee','owner','agent']},
 {k:'department',l:'Department',req:true,syn:['department','dept','team','function']},
 {k:'created',l:'Created date',req:true,syn:['created','createddate','opened','openeddate','startdate','date']},
 {k:'due',l:'Due date',req:false,syn:['due','duedate','targetdate','deadline']},
 {k:'completed',l:'Completed date',req:false,syn:['completed','completeddate','closed','closeddate','resolved','resolveddate','completiondate']},
 {k:'status',l:'Status',req:true,syn:['status','state']},
 {k:'priority',l:'Priority',req:false,syn:['priority','severity','urgency']},
 {k:'sla',l:'SLA target (hours)',req:false,syn:['sla','slatarget','slahours','target','slatargethours','slatargethrs','slahrs']},
 {k:'resolution',l:'Actual resolution (hours)',req:false,syn:['resolution','resolutiontime','actualresolutiontime','resolutionhours','hourstaken','hours','tat','actualresolutionhrs','resolutionhrs']}] as const;
export type Mapping=Record<string,string>;
const norm=(h:string)=>h.toLowerCase().replace(/[^a-z0-9]/g,'');
export function autoMap(cols:string[]):Mapping{const m:Mapping={};const used=new Set<string>();
 for(const f of FIELDS){const hit=cols.find(c=>!used.has(c)&&(f.syn as readonly string[]).includes(norm(c)));if(hit){m[f.k]=hit;used.add(hit)}}return m}
// ---------- parsing helpers ----------
const chk=(y:number,mo:number,d:number)=>{const x=new Date(Date.UTC(y,mo-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===mo-1&&x.getUTCDate()===d?`${y}-${pad(mo)}-${pad(d)}`:null};
/** '' = empty, null = invalid, else YYYY-MM-DD. Accepts ISO, dd/mm/yyyy, Excel serials, Date objects. */
export function parseDate(v:unknown):string|null{
 if(v==null||v==='')return '';
 if(v instanceof Date)return isNaN(+v)?null:isoDate(v);
 if(typeof v==='number'){if(v<20000||v>80000)return null;return new Date(Math.round((v-25569)*86400000)).toISOString().slice(0,10)}
 const t=String(v).trim();if(!t)return '';
 let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return chk(+m[1],+m[2],+m[3]);
 m=t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);if(m)return chk(+m[3],+m[2],+m[1]);
 return null}
const ST:Record<string,Status>={completed:'Completed',complete:'Completed',done:'Completed',closed:'Completed',resolved:'Completed',inprogress:'In Progress',wip:'In Progress',ongoing:'In Progress',working:'In Progress',pending:'Pending',open:'Pending',new:'Pending',todo:'Pending',onhold:'Pending'};
const PR:Record<string,Priority>={low:'Low',p4:'Low',medium:'Medium',med:'Medium',normal:'Medium',p3:'Medium',high:'High',p2:'High',critical:'Critical',urgent:'Critical',p1:'Critical'};
const num=(v:unknown):number|null|''=>{if(v==null||String(v).trim()==='')return '';const n=Number(String(v).replace(/,/g,''));return isFinite(n)&&n>=0?n:null};
/** Validate one row (via getter). Returns a record or the list of reasons it is invalid. */
export function buildRecord(get:(k:string)=>unknown):{rec?:Rec;reasons:string[]}{
 const R:string[]=[];const s=(k:string)=>String(get(k)??'').trim();
 for(const f of FIELDS)if(f.req&&!s(f.k))R.push(`Missing ${f.l}`);
 const status=ST[norm(s('status'))];if(s('status')&&!status)R.push(`Unrecognised status "${s('status')}"`);
 const dt=(k:string,l:string)=>{const d=parseDate(get(k));if(d===null){R.push(`Invalid ${l}: "${s(k)}"`);return ''}return d};
 const created=s('created')?dt('created','created date'):'',due=dt('due','due date'),completed=dt('completed','completed date');
 const pr=s('priority')?PR[norm(s('priority'))]:'Medium' as Priority;if(!pr)R.push(`Unrecognised priority "${s('priority')}"`);
 const sla=num(get('sla')),res=num(get('resolution'));if(sla===null)R.push('SLA target must be a non-negative number');if(res===null)R.push('Resolution time must be a non-negative number');
 if(status==='Completed'&&!completed&&!R.some(r=>/completed date/.test(r)))R.push('Completed record has no completed date');
 if(status&&status!=='Completed'&&completed)R.push('Completed date given but status is not Completed');
 if(created&&completed&&completed<created)R.push('Completed date is before created date');
 if(created&&due&&due<created)R.push('Due date is before created date');
 if(R.length)return {reasons:R};
 let resolution=res===''?null:res as number;if(resolution===null&&status==='Completed')resolution=diffDays(created,completed)*24;
 return {reasons:[],rec:{id:s('id'),title:s('title'),category:s('category')||'General',employee:s('employee'),department:s('department'),created,due,completed:status==='Completed'?completed:'',status,priority:pr as Priority,sla:sla===''?null:sla as number,resolution:status==='Completed'?resolution:null}}}
export interface Rejected{row:number;data:Record<string,unknown>;reasons:string[]}
export function validateRows(rows:Record<string,unknown>[],map:Mapping,existing:Set<string>){
 const valid:Rec[]=[],rejected:Rejected[]=[],duplicates:{row:number;id:string}[]=[];const seen=new Set(existing);
 rows.forEach((data,i)=>{const {rec,reasons}=buildRecord(k=>map[k]?data[map[k]]:'');
  if(!rec){rejected.push({row:i+2,data,reasons});return}
  if(seen.has(rec.id)){duplicates.push({row:i+2,id:rec.id});return}
  seen.add(rec.id);valid.push(rec)});
 return {valid,rejected,duplicates}}
// ---------- metrics ----------
export const isOverdue=(r:Rec,t=today())=>r.status!=='Completed'&&!!r.due&&r.due<t;
/** SLA rule: only Completed records with both an SLA target and a resolution time are eligible; met when resolution <= target. */
export const slaMet=(r:Rec):boolean|null=>r.status==='Completed'&&r.sla!=null&&r.resolution!=null?r.resolution<=r.sla:null;
const pct=(a:number,b:number)=>b>0?a/b*100:0;
export function kpis(rs:Rec[],t=today()){
 const total=rs.length,c=rs.filter(r=>r.status==='Completed'),res=c.filter(r=>r.resolution!=null),el=rs.map(slaMet).filter(x=>x!==null);
 return {total,completed:c.length,pending:rs.filter(r=>r.status==='Pending').length,inProgress:rs.filter(r=>r.status==='In Progress').length,overdue:rs.filter(r=>isOverdue(r,t)).length,
  completionPct:pct(c.length,total),avgResolution:res.length?res.reduce((a,r)=>a+(r.resolution as number),0)/res.length:0,slaEligible:el.length,slaPct:el.length?pct(el.filter(Boolean).length,el.length):null as number|null}}
export function groupBy(rs:Rec[],key:'department'|'employee',t=today()){const m=new Map<string,Rec[]>();rs.forEach(r=>m.set(r[key],[...(m.get(r[key])||[]),r]));
 return [...m].map(([name,l])=>{const k=kpis(l,t);return {name,total:k.total,completed:k.completed,open:k.pending+k.inProgress,overdue:k.overdue,completion:k.completionPct,sla:k.slaPct}}).sort((a,b)=>b.total-a.total)}
export function dailyTrend(rs:Rec[],days=30){const ds=rs.flatMap(r=>[r.created,r.completed]).filter(Boolean).sort();const end=ds.length?ds[ds.length-1]:today();
 return Array.from({length:days},(_,i)=>{const d=addDays(end,i-days+1);return {day:d.slice(5),created:rs.filter(r=>r.created===d).length,completed:rs.filter(r=>r.completed===d).length}})}
export function monthly(rs:Rec[]){const m=new Map<string,{completed:number;notCompleted:number}>();rs.forEach(r=>{const k=r.created.slice(0,7);const v=m.get(k)||{completed:0,notCompleted:0};r.status==='Completed'?v.completed++:v.notCompleted++;m.set(k,v)});return [...m].sort().map(([month,v])=>({month,...v}))}
export function slaTrend(rs:Rec[]){const m=new Map<string,Rec[]>();rs.filter(r=>slaMet(r)!==null).forEach(r=>{const k=r.completed.slice(0,7);m.set(k,[...(m.get(k)||[]),r])});return [...m].sort().map(([month,l])=>({month,sla:+pct(l.filter(r=>slaMet(r)).length,l.length).toFixed(1),n:l.length}))}
export function applyFilters(rs:Rec[],f:Filters){return rs.filter(r=>(!f.from||r.created>=f.from)&&(!f.to||r.created<=f.to)&&(!f.dept||r.department===f.dept)&&(!f.emp||r.employee===f.emp)&&(!f.status||r.status===f.status)&&(!f.priority||r.priority===f.priority))}
/** Transparent rule-based insights. Every rule states its threshold. */
export function insights(rs:Rec[],t=today()):{level:'warn'|'info';text:string}[]{
 const out:{level:'warn'|'info';text:string}[]=[];if(!rs.length)return [{level:'info',text:'No records match the current filters.'}];
 const d=groupBy(rs,'department',t),avgOpen=d.reduce((a,x)=>a+x.open,0)/d.length;
 const hd=d.filter(x=>x.open>=3&&x.open>=1.5*avgOpen);
 out.push(hd.length?{level:'warn',text:`High pending workload (open ≥ 1.5× department average of ${avgOpen.toFixed(1)}): ${hd.map(x=>`${x.name} (${x.open} open)`).join(', ')}.`}:{level:'info',text:`No department has an open workload ≥ 1.5× the department average (${avgOpen.toFixed(1)}).`});
 const e=groupBy(rs,'employee',t),avgE=e.reduce((a,x)=>a+x.open,0)/e.length,he=e.filter(x=>x.open>=3&&x.open>=1.5*avgE);
 out.push(he.length?{level:'warn',text:`Employees with high workload (open ≥ 1.5× average of ${avgE.toFixed(1)}): ${he.map(x=>`${x.name} (${x.open})`).join(', ')}.`}:{level:'info',text:`No employee has an open workload ≥ 1.5× the average (${avgE.toFixed(1)}).`});
 const od=rs.filter(r=>isOverdue(r,t));
 if(od.length){const hp=od.filter(r=>r.priority==='High'||r.priority==='Critical').length,top=groupBy(od,'department',t)[0];out.push({level:'warn',text:`${od.length} overdue records: ${hp} are High/Critical priority; most overdue in ${top.name} (${top.total}).`})}else out.push({level:'info',text:'No overdue records.'});
 const latest=rs.map(r=>r.created).sort().pop() as string,cut=addDays(latest,-30),cut2=addDays(latest,-60);
 const a=rs.filter(r=>r.created>cut),b=rs.filter(r=>r.created>cut2&&r.created<=cut);
 if(a.length>=5&&b.length>=5){const ca=pct(a.filter(r=>r.status==='Completed').length,a.length),cb=pct(b.filter(r=>r.status==='Completed').length,b.length),dl=ca-cb;
  out.push({level:Math.abs(dl)>=10&&dl<0?'warn':'info',text:`Completion rate of records created in the last 30 days (to ${latest}) is ${ca.toFixed(1)}% vs ${cb.toFixed(1)}% in the previous 30 days (${dl>=0?'+':''}${dl.toFixed(1)} pts). Recent records are naturally less complete.`})}
 else out.push({level:'info',text:'Not enough records (need ≥5 in each of two 30-day windows) to compare completion rates.'});
 return out}
// ---------- sample data ----------
export const DEPTS=['Customer Support','Finance Operations','HR Services','IT Service Desk','Logistics'];
const EMPS:Record<string,string[]>={'Customer Support':['Asha Menon','Rohan Iyer','Fatima Khan'],'Finance Operations':['Karthik Rao','Meera Nair'],'HR Services':['Sneha Pillai','Vikram Joshi'],'IT Service Desk':['Arvind Kumar','Divya Shah','Imran Ali','Lakshmi Devi'],'Logistics':['Naveen Reddy','Pooja Verma','Suresh Babu']};
const TASKS:Record<string,string[]>={'Customer Support':['Refund request','Order status query','Complaint escalation','Account update'],'Finance Operations':['Invoice reconciliation','Vendor payment','Expense audit','Ledger correction'],'HR Services':['Onboarding paperwork','Leave policy query','Payroll correction','Exit clearance'],'IT Service Desk':['Password reset','Laptop provisioning','VPN access issue','Software install'],'Logistics':['Shipment delay','Route replanning','Warehouse stock mismatch','Delivery reschedule']};
const SLA_H:Record<Priority,number>={Critical:8,High:24,Medium:48,Low:96};
export function sampleData(n=120,now=today()):Rec[]{let r=11;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};const pick=<T,>(a:T[])=>a[Math.floor(rnd()*a.length)];
 const prs:Priority[]=['Low','Medium','Medium','High','High','Critical'];
 return Array.from({length:n},(_,i)=>{const dept=DEPTS[i%5],emp=pick(EMPS[dept]),pr=pick(prs),created=addDays(now,-Math.floor(rnd()*110)-(i<10?0:1)),due=addDays(created,3+Math.floor(rnd()*10));
  const age=diffDays(created,now),roll=rnd(),doneP=dept==='Logistics'?0.6:0.82;const done=roll<doneP||age>100&&roll<0.95;const status:Status=done?'Completed':rnd()<0.45?'In Progress':'Pending';
  const sla=SLA_H[pr],factor=0.4+rnd()*(dept==='IT Service Desk'?1.1:dept==='Logistics'?1.5:0.9),res=+(sla*factor).toFixed(1);
  const comp=done?addDays(created,Math.min(Math.max(0,Math.ceil(res/24)),Math.max(0,age))):'';
  return {id:`OPS-${String(1001+i)}`,title:`${pick(TASKS[dept])} #${100+i}`,category:dept.split(' ')[0],employee:emp,department:dept,created,due,completed:comp,status,priority:pr,sla,resolution:done?res:null}})}
