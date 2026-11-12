import {ReactNode,useState} from 'react';
import {X,Filter} from 'lucide-react';
import {useApp} from '../lib/store';
import {NOFILTER} from '../types';
export const Modal=({title,onClose,children,wide}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean})=>(
 <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-2 overflow-y-auto"><div className={`bg-white rounded-xl w-full ${wide?'max-w-3xl':'max-w-lg'} my-6`}><div className="flex items-center justify-between border-b px-4 py-3 no-print"><h3 className="font-semibold">{title}</h3><button onClick={onClose} aria-label="Close"><X size={18}/></button></div><div className="p-4">{children}</div></div></div>);
export const Confirm=({msg,onYes,onNo,label='Confirm'}:{msg:string;onYes:()=>void;onNo:()=>void;label?:string})=>(<Modal title="Please confirm" onClose={onNo}><p className="text-sm mb-4">{msg}</p><div className="flex justify-end gap-2"><button className="btn" onClick={onNo}>Cancel</button><button className="btn btn-d" onClick={onYes}>{label}</button></div></Modal>);
export const Field=({label,children}:{label:string;children:ReactNode})=>(<label className="block text-sm"><span className="text-slate-600 text-xs font-medium">{label}</span>{children}</label>);
export const Err=({e}:{e:string|null})=>e?<p role="alert" className="text-sm text-red-700 bg-red-50 rounded p-2 mt-2">{e}</p>:null;
const col:Record<string,string>={Completed:'bg-emerald-100 text-emerald-700','In Progress':'bg-sky-100 text-sky-700',Pending:'bg-amber-100 text-amber-700',Critical:'bg-red-100 text-red-700',High:'bg-orange-100 text-orange-700',Medium:'bg-slate-200 text-slate-700',Low:'bg-slate-100 text-slate-600'};
export const Badge=({v}:{v:string})=><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${col[v]||''}`}>{v}</span>;
export const Head=({title,children}:{title:string;children?:ReactNode})=>(<div className="flex flex-wrap items-center justify-between gap-2 mb-4 no-print"><h1 className="text-xl font-bold text-slate-900">{title}</h1><div className="flex flex-wrap gap-2">{children}</div></div>);
export const Empty=({title,hint,children}:{title:string;hint:string;children?:ReactNode})=>(<div className="card text-center py-10"><div className="font-semibold">{title}</div><p className="text-sm text-slate-500 mb-3">{hint}</p>{children}</div>);
export const fmt=(n:number,d=1)=>n.toLocaleString('en-IN',{maximumFractionDigits:d});
export const fdate=(s:string)=>s?new Date(s+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
export function FilterBar(){const {records,filters,setFilters,filtered,toast}=useApp();const [f,setF]=useState(filters);
 const u=(k:string)=>[...new Set(records.map(r=>(r as any)[k] as string))].sort();const set=(k:string,v:string)=>setF({...f,[k]:v});
 const sel=(k:string,l:string,o:string[])=><select aria-label={l} className="input" value={(f as any)[k]} onChange={e=>set(k,e.target.value)}><option value="">{l}</option>{o.map(x=><option key={x}>{x}</option>)}</select>;
 return <div className="card mb-4 no-print"><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 items-end">
  <Field label="Created from"><input type="date" className="input" value={f.from} onChange={e=>set('from',e.target.value)}/></Field><Field label="Created to"><input type="date" className="input" value={f.to} onChange={e=>set('to',e.target.value)}/></Field>
  {sel('dept','All departments',u('department'))}{sel('emp','All employees',u('employee'))}{sel('status','All statuses',['Completed','In Progress','Pending'])}{sel('priority','All priorities',['Critical','High','Medium','Low'])}
  <div className="flex gap-2"><button className="btn btn-p" onClick={()=>{if(f.from&&f.to&&f.from>f.to){toast('"From" date is after "To" date','err');return}setFilters(f)}}><Filter size={14}/>Apply</button><button className="btn" onClick={()=>{setF(NOFILTER);setFilters(NOFILTER)}}>Clear</button></div></div>
  <p className="text-xs text-slate-500 mt-2">Showing {filtered.length} of {records.length} records{JSON.stringify(filters)!==JSON.stringify(NOFILTER)?' (filters active)':''}. Date filter applies to the created date.</p></div>}
