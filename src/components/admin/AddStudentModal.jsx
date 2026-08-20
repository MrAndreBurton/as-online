import { useState } from "react";
import { createStudentRecord } from "../../lib/studentOperations";

const emptyForm={firstName:"",lastName:"",email:"",phone:"",dateOfBirth:"",school:"",notes:""};

export default function AddStudentModal({open,onClose,onCreated}) {
  const [form,setForm]=useState(emptyForm);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  if(!open) return null;

  function change(key,value){setForm(c=>({...c,[key]:value}));}

  async function submit(e){
    e.preventDefault(); setSaving(true); setError("");
    try{
      const studentId=await createStudentRecord(form);
      setForm(emptyForm);
      await onCreated?.(studentId);
      onClose();
    }catch(err){setError(err.message);}
    finally{setSaving(false);}
  }

  return <div className="aeos-modal-backdrop">
    <div className="aeos-modal student-record-modal">
      <div className="aeos-modal-header">
        <div>
          <p className="portal-eyebrow">Student Record</p>
          <h2>Add Student</h2>
          <p>No login or schedule required.</p>
        </div>
        <button type="button" className="aeos-icon-button" onClick={onClose}>×</button>
      </div>

      <form className="student-record-form" onSubmit={submit}>
        <div className="student-record-grid">
          <label>First name<input value={form.firstName} onChange={e=>change("firstName",e.target.value)} required/></label>
          <label>Last name<input value={form.lastName} onChange={e=>change("lastName",e.target.value)}/></label>
          <label>Email<input type="email" value={form.email} onChange={e=>change("email",e.target.value)}/></label>
          <label>Phone<input value={form.phone} onChange={e=>change("phone",e.target.value)}/></label>
          <label>Date of birth<input type="date" value={form.dateOfBirth} onChange={e=>change("dateOfBirth",e.target.value)}/></label>
          <label>School<input value={form.school} onChange={e=>change("school",e.target.value)}/></label>
        </div>

        <label>Internal notes<textarea rows={3} value={form.notes} onChange={e=>change("notes",e.target.value)}/></label>

        {error?<div className="portal-alert">{error}</div>:null}

        <div className="student-record-actions">
          <button type="button" className="aeos-button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="aeos-button-primary" disabled={saving}>
            {saving?"Creating…":"Add Student"}
          </button>
        </div>
      </form>
    </div>
  </div>;
}
