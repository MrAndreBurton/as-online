import { useEffect,useMemo,useState } from "react";
import { Link } from "react-router-dom";
import { fetchCalendarSessions } from "../../../lib/studentOperations";
import "../../../styles/studentOperations.css";

const studentName=s=>s?.display_name||[s?.first_name,s?.last_name].filter(Boolean).join(" ")||"Student";

function startOfWeek(date){
  const d=new Date(date); const day=d.getDay(); const diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d;
}

export default function CalendarPage(){
  const [anchor,setAnchor]=useState(()=>new Date());
  const [sessions,setSessions]=useState([]);
  const [error,setError]=useState("");

  const range=useMemo(()=>{
    const start=startOfWeek(anchor); const end=new Date(start); end.setDate(end.getDate()+7);
    return {start,end};
  },[anchor]);

  useEffect(()=>{
    setError("");
    fetchCalendarSessions(range.start.toISOString(),range.end.toISOString())
      .then(setSessions).catch(err=>setError(err.message));
  },[range]);

  function moveWeek(n){setAnchor(c=>{const d=new Date(c);d.setDate(d.getDate()+n*7);return d;});}

  return <>
    <section className="aeos-page-heading">
      <div>
        <p className="portal-eyebrow">Operations</p>
        <h2>Calendar</h2>
        <p>Schedule future teaching here. Historical Sessions do not need a recurring schedule or Google Calendar event.</p>
      </div>
      <div className="calendar-heading-actions">
        <button type="button" className="aeos-button-secondary" onClick={()=>moveWeek(-1)}>Previous Week</button>
        <button type="button" className="aeos-button-secondary" onClick={()=>setAnchor(new Date())}>This Week</button>
        <button type="button" className="aeos-button-secondary" onClick={()=>moveWeek(1)}>Next Week</button>
      </div>
    </section>

    {error?<div className="portal-alert">{error}</div>:null}

    <section className="portal-card">
      <div className="aeos-section-heading">
        <div>
          <p className="portal-eyebrow">Week</p>
          <h3>{range.start.toLocaleDateString()} – {new Date(range.end.getTime()-1).toLocaleDateString()}</h3>
        </div>
        <span>{sessions.length} sessions</span>
      </div>

      {sessions.length ? <div className="calendar-session-list">
        {sessions.map(session=>
          <Link key={session.session_id} to={`/portal/admin/sessions/${session.session_id}`} className="calendar-session-row">
            <div><strong>{studentName(session.student)}</strong><p>{session.offering?.offering_name}</p></div>
            <div>
              <strong>{new Date(session.scheduled_start_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</strong>
              <p>{new Date(session.scheduled_start_at).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"})}</p>
            </div>
            <div><span className="status-pill">{session.session_status}</span><p>{session.session_origin}</p></div>
          </Link>)}
      </div> : <div className="aeos-empty-state"><h3>No sessions this week</h3><p>The calendar is clear.</p></div>}
    </section>
  </>;
}
