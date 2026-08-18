import { useState } from "react";
import { updateSessionStatus } from "../../lib/sessionWorkspace";
const statuses=[["scheduled","Scheduled"],["in_progress","In Progress"],["completed","Completed"],["no_show","No-show"]];
export default function SessionStatusControls({sessionId,currentStatus,onChanged}){
 const[working,setWorking]=useState(false); const[error,setError]=useState("");
 async function changeStatus(status){ if(status===currentStatus)return; if(status==="completed"&&!window.confirm("Mark this tutoring session as completed?"))return; setWorking(true);setError(""); try{await updateSessionStatus(sessionId,status);await onChanged?.();}catch(e){setError(e.message);}finally{setWorking(false);} }
 return <section className="portal-card"><p className="portal-eyebrow">Session Status</p><div className="session-status-row">{statuses.map(([v,l])=><button type="button" key={v} disabled={working} onClick={()=>changeStatus(v)} className={`session-status-button ${currentStatus===v?"active":""}`}>{l}</button>)}</div>{error?<div className="portal-alert">{error}</div>:null}</section>;
}
