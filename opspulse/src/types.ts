export type Status='Completed'|'In Progress'|'Pending';
export type Priority='Low'|'Medium'|'High'|'Critical';
export interface Rec{id:string;title:string;category:string;employee:string;department:string;created:string;due:string;completed:string;status:Status;priority:Priority;sla:number|null;resolution:number|null}
export interface Filters{from:string;to:string;dept:string;emp:string;status:string;priority:string}
export const NOFILTER:Filters={from:'',to:'',dept:'',emp:'',status:'',priority:''};
