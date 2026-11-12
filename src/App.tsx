import {useState} from 'react';
import {BrowserRouter,Routes,Route,NavLink,Navigate} from 'react-router-dom';
import {LayoutDashboard,Table2,Upload,FileText,Menu,X,Activity} from 'lucide-react';
import {Provider,useApp} from './lib/store';
import Dashboard from './pages/Dashboard';import Records from './pages/Records';import ImportPage from './pages/Import';import Reports from './pages/Reports';
const NAV=[['/',LayoutDashboard,'Dashboard'],['/records',Table2,'Records'],['/import',Upload,'Import'],['/reports',FileText,'Reports']] as const;
function Shell(){const [o,setO]=useState(false);const {toasts}=useApp();
 const link=(to:string,I:any,l:string)=><NavLink key={to} to={to} end={to==='/'} onClick={()=>setO(false)} className={({isActive})=>`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isActive?'bg-teal-600 text-white':'text-slate-300 hover:bg-slate-700'}`}><I size={16}/>{l}</NavLink>;
 return <div className="min-h-screen"><header className="no-print bg-slate-900 text-white"><div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2 font-bold"><Activity className="text-teal-400"/>OpsPulse<span className="hidden sm:inline text-xs font-normal text-slate-400">by Sam Tech Builds</span></div>
  <nav className="hidden md:flex gap-1">{NAV.map(([t,I,l])=>link(t,I,l))}</nav><button className="md:hidden" onClick={()=>setO(!o)} aria-label="Menu">{o?<X/>:<Menu/>}</button></div>{o&&<nav className="md:hidden px-4 pb-3 space-y-1">{NAV.map(([t,I,l])=>link(t,I,l))}</nav>}</header>
 <main className="max-w-7xl mx-auto p-3 md:p-6"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/records" element={<Records/>}/><Route path="/import" element={<ImportPage/>}/><Route path="/reports" element={<Reports/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes></main>
 <div className="fixed bottom-4 right-4 z-[60] space-y-2 no-print" aria-live="polite">{toasts.map(t=><div key={t.id} className={`px-4 py-2 rounded-lg shadow text-sm text-white ${t.k==='err'?'bg-red-600':t.k==='warn'?'bg-amber-600':'bg-emerald-600'}`}>{t.m}</div>)}</div></div>}
export default function App(){return <Provider><BrowserRouter><Shell/></BrowserRouter></Provider>}
