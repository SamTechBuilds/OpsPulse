import {createContext,useContext,useEffect,useMemo,useState,useCallback,ReactNode} from 'react';
import {Rec,Filters,NOFILTER} from '../types';
import {sampleData,applyFilters,buildRecord,FIELDS} from './data';
export interface ImportLog{sig:string;name:string;at:string;ok:number;rej:number;dup:number}
const KEY='opspulse-v1';
const load=():{records:Rec[];imports:ImportLog[]}=>{try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch{}return {records:sampleData(),imports:[]}};
interface Ctx{records:Rec[];filtered:Rec[];imports:ImportLog[];filters:Filters;setFilters:(f:Filters)=>void;toasts:{id:number;m:string;k:string}[];toast:(m:string,k?:'ok'|'err'|'warn')=>void;
 importRecords:(r:Rec[],replace:boolean,log:ImportLog)=>void;saveRecord:(r:Rec,origId?:string)=>string|null;deleteRecord:(id:string)=>void;restoreSample:()=>void;clearAll:()=>void}
const C=createContext<Ctx>(null as any);export const useApp=()=>useContext(C);
export function Provider({children}:{children:ReactNode}){
 const [d,setD]=useState(load);const [filters,setFilters]=useState<Filters>(NOFILTER);const [toasts,setT]=useState<Ctx['toasts']>([]);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}},[d]);
 const toast=useCallback((m:string,k:'ok'|'err'|'warn'='ok')=>{const id=Date.now()+Math.random();setT(t=>[...t,{id,m,k}]);setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),4500)},[]);
 const filtered=useMemo(()=>applyFilters(d.records,filters),[d.records,filters]);
 const importRecords=(r:Rec[],replace:boolean,log:ImportLog)=>{setD({records:replace?r:[...d.records,...r],imports:[log,...d.imports].slice(0,20)});toast(`Imported ${r.length} records`)};
 const saveRecord=(r:Rec,origId?:string):string|null=>{
  if(d.records.some(x=>x.id===r.id&&x.id!==origId))return `Record ID "${r.id}" already exists`;
  setD({...d,records:origId?d.records.map(x=>x.id===origId?r:x):[...d.records,r]});toast(origId?'Record updated':'Record added');return null};
 const deleteRecord=(id:string)=>{setD({...d,records:d.records.filter(x=>x.id!==id)});toast('Record deleted')};
 const restoreSample=()=>{setD({records:sampleData(),imports:[]});setFilters(NOFILTER);toast('Sample dataset restored')};
 const clearAll=()=>{setD({records:[],imports:[]});setFilters(NOFILTER);toast('All data cleared','warn')};
 return <C.Provider value={{records:d.records,filtered,imports:d.imports,filters,setFilters,toasts,toast,importRecords,saveRecord,deleteRecord,restoreSample,clearAll}}>{children}</C.Provider>}
export {buildRecord,FIELDS};
