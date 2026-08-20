import {useEffect,useMemo,useState} from "react";
import {parsePastedTranscript,parseTranscriptFile,sha256Text} from "../../lib/transcriptParser";
import {fetchTranscriptImportSessions,importTranscriptToLIE} from "../../lib/learningIntake";

const studentName=s=>s?.display_name||[s?.first_name,s?.last_name].filter(Boolean).join(" ")||"Student";

function scoreSession(session,parsed){
  let score=0;
  const speakers=parsed?.metadata?.detected_speakers||[];
  const name=studentName(session.student).toLowerCase();
  if(speakers.some(s=>s.toLowerCase().includes(name))) score+=60;

  const detected=parsed?.metadata?.detected_date;
  if(detected&&session.scheduled_start_at){
    const a=new Date(detected), b=new Date(session.scheduled_start_at);
    if(!Number.isNaN(a.getTime())&&a.toDateString()===b.toDateString()) score+=35;
  }
  return score;
}

export default function TranscriptImportModal({open,onClose,onImported}){
  const [mode,setMode]=useState("file");
  const [pasteText,setPasteText]=useState("");
  const [parsed,setParsed]=useState(null);
  const [sessions,setSessions]=useState([]);
  const [sessionId,setSessionId]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);

  useEffect(()=>{
    if(!open) return;
    fetchTranscriptImportSessions().then(setSessions).catch(e=>setError(e.message));
  },[open]);

  const suggestions=useMemo(()=>{
    if(!parsed) return [];
    return sessions.map(session=>({session,score:scoreSession(session,parsed)}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  },[parsed,sessions]);

  useEffect(()=>{
    if(parsed&&suggestions[0]?.score>=60) setSessionId(suggestions[0].session.session_id);
  },[parsed,suggestions]);

  if(!open) return null;

  async function handleFile(e){
    const file=e.target.files?.[0]; if(!file) return;
    setLoading(true);setError("");setResult(null);
    try{setParsed(await parseTranscriptFile(file));}
    catch(err){setError(err.message);}
    finally{setLoading(false);}
  }

  async function parsePaste(){
    setLoading(true);setError("");setResult(null);
    try{setParsed(parsePastedTranscript(pasteText));}
    catch(err){setError(err.message);}
    finally{setLoading(false);}
  }

  async function importNow(){
    if(!parsed||!sessionId) return;
    setLoading(true);setError("");
    try{
      const imported=await importTranscriptToLIE({
        sessionId,
        sourceProvider:"Manual Transcript Import",
        sourceFormat:parsed.sourceFormat,
        sourceName:parsed.sourceName,
        rawText:parsed.rawText,
        normalizedText:parsed.normalizedText,
        contentSha256:await sha256Text(parsed.normalizedText),
        extractedMetadata:parsed.metadata,
      });
      setResult(imported);
      await onImported?.();
    }catch(err){setError(err.message);}
    finally{setLoading(false);}
  }

  return <div className="aeos-modal-backdrop">
    <div className="aeos-modal lie-import-modal" role="dialog" aria-modal="true">
      <div className="aeos-modal-header">
        <div><p className="portal-eyebrow">Learning Intake Engine</p><h2>Import Transcript</h2></div>
        <button type="button" className="aeos-icon-button" onClick={onClose}>×</button>
      </div>

      {result ? <div className="lie-import-success">
        <h3>{result.duplicate?"Transcript already imported":"Transcript imported"}</h3>
        <p>Status: <strong>{result.processing_status}</strong></p>
        {!result.duplicate?<p>The transcript is ready for Pen-E.</p>:null}
        <button type="button" className="aeos-button-primary" onClick={onClose}>Done</button>
      </div> : <>
        <div className="lie-import-mode">
          <button type="button" className={mode==="file"?"active":""} onClick={()=>setMode("file")}>Upload File</button>
          <button type="button" className={mode==="paste"?"active":""} onClick={()=>setMode("paste")}>Paste Transcript</button>
        </div>

        {mode==="file" ? <label className="lie-file-input">
          Transcript file
          <input type="file" accept=".docx,.txt" onChange={handleFile}/>
          <small>DOCX or TXT</small>
        </label> : <div className="lie-paste-box">
          <textarea rows={10} value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Paste transcript here…"/>
          <button type="button" className="aeos-button-secondary" onClick={parsePaste} disabled={loading||!pasteText.trim()}>Parse Transcript</button>
        </div>}

        {parsed ? <>
          <section className="lie-detected-card">
            <p className="portal-eyebrow">Transcript Detected</p>
            <dl>
              <div><dt>Date</dt><dd>{parsed.metadata.detected_date||"Not detected"}</dd></div>
              <div><dt>Duration</dt><dd>{parsed.metadata.detected_duration||"Not detected"}</dd></div>
              <div><dt>Speakers</dt><dd>{parsed.metadata.detected_speakers.join(", ")||"Not detected"}</dd></div>
            </dl>
          </section>

          {suggestions.length ? <section className="lie-suggestions">
            <p className="portal-eyebrow">Suggested Session</p>
            {suggestions.map(({session,score})=>
              <button type="button" key={session.session_id}
                className={sessionId===session.session_id?"lie-session-suggestion selected":"lie-session-suggestion"}
                onClick={()=>setSessionId(session.session_id)}>
                <strong>{studentName(session.student)}</strong>
                <span>{session.offering?.offering_name}</span>
                <span>{new Date(session.scheduled_start_at).toLocaleString()}</span>
                <b>{score}% match</b>
              </button>)}
          </section>:null}

          <label className="lie-session-select">Session
            <select value={sessionId} onChange={e=>setSessionId(e.target.value)}>
              <option value="">Choose Session</option>
              {sessions.map(session=>
                <option key={session.session_id} value={session.session_id}>
                  {studentName(session.student)} — {session.offering?.offering_name} — {new Date(session.scheduled_start_at).toLocaleString()}
                </option>)}
            </select>
          </label>

          <div className="lie-import-actions">
            <button type="button" className="aeos-button-primary" onClick={importNow} disabled={loading||!sessionId}>
              {loading?"Importing…":"Import & Mark Ready for AI"}
            </button>
          </div>
        </>:null}

        {error?<div className="portal-alert">{error}</div>:null}
      </>}
    </div>
  </div>;
}
