import Papa from 'papaparse';
import * as XLSX from 'xlsx';
export interface Parsed{columns:string[];rows:Record<string,unknown>[]}
const finish=(rows:Record<string,unknown>[],cols:string[]):Parsed=>{
 const clean=rows.filter(r=>Object.values(r).some(v=>String(v??'').trim()!==''));
 if(!cols.length)throw new Error('No header row found. The first row must contain column names.');
 if(!clean.length)throw new Error('The file has headers but no data rows.');return {columns:cols,rows:clean}};
export function parseCsvText(text:string):Parsed{
 if(!text.trim())throw new Error('The file is empty.');
 const r=Papa.parse<Record<string,unknown>>(text.replace(/^\uFEFF/,''),{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.trim()});
 if(r.errors.some(e=>e.type==='Delimiter'&&!r.data.length))throw new Error('Could not detect a CSV structure.');
 return finish(r.data,(r.meta.fields||[]).filter(Boolean))}
export function parseXlsxBuffer(buf:ArrayBuffer):Parsed{
 const u=new Uint8Array(buf.slice(0,8));const zip=u[0]===0x50&&u[1]===0x4b,ole=u[0]===0xd0&&u[1]===0xcf&&u[2]===0x11&&u[3]===0xe0;
 if(!zip&&!ole)throw new Error('This file is not a valid Excel workbook (it may be corrupt or have the wrong extension).');
 let wb:XLSX.WorkBook;try{wb=XLSX.read(buf,{type:'array'})}catch{throw new Error('Could not read this file as an Excel workbook.')}
 const ws=wb.Sheets[wb.SheetNames[0]];if(!ws)throw new Error('The workbook has no sheets.');
 const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:'',raw:true});
 const aoa=XLSX.utils.sheet_to_json<unknown[]>(ws,{header:1,defval:''});const cols=((aoa[0]||[]) as unknown[]).map(c=>String(c).trim()).filter(Boolean);
 return finish(rows,cols)}
export async function parseFile(f:File):Promise<Parsed>{
 const ext=f.name.split('.').pop()?.toLowerCase();
 if(ext==='csv'||ext==='txt')return parseCsvText(await f.text());
 if(ext==='xlsx'||ext==='xls')return parseXlsxBuffer(await f.arrayBuffer());
 throw new Error(`Unsupported file type ".${ext}". Upload a .csv or .xlsx file.`)}
export const toCsv=(rows:object[])=>Papa.unparse(rows as any[]);
export function download(name:string,content:string|Blob,type='text/csv'){const a=document.createElement('a');a.href=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
export function downloadXlsx(name:string,sheets:Record<string,object[]>){const wb=XLSX.utils.book_new();Object.entries(sheets).forEach(([n,rows])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{}]),n.slice(0,31)));XLSX.writeFile(wb,name)}
