import { useEffect, useState } from "react";
import { Save, UserPlus, XCircle } from "lucide-react";
import "../styles/CustomerForm.css";
export default function CustomerForm({ onSubmit, initial, submitLabel="إنشاء عميل", onCancel, busy=false }) {
 const [form,setForm]=useState({name:"",phone:"",address:"",socialLinksText:""});
 useEffect(()=>setForm({name:initial?.name||"",phone:initial?.phone||"",address:initial?.address||"",socialLinksText:(initial?.socialLinks||[]).join("\n")}),[initial]);
 const change=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
 const submit=async e=>{e.preventDefault();const links=form.socialLinksText.split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean);await onSubmit({name:form.name.trim(),phone:form.phone.trim(),address:form.address.trim()||undefined,...(links.length?{socialLinks:links}:{})});if(!initial)setForm({name:"",phone:"",address:"",socialLinksText:""});};
 return <form className="customer-form" onSubmit={submit}><div className="form-group"><label>الاسم</label><input required minLength={2} value={form.name} onChange={change("name")}/></div><div className="form-group"><label>رقم الهاتف</label><input required minLength={7} value={form.phone} onChange={change("phone")} disabled={Boolean(initial)}/></div><div className="form-group"><label>العنوان</label><input value={form.address} onChange={change("address")}/></div><div className="form-group"><label>روابط السوشيال (رابط في كل سطر)</label><textarea rows={3} value={form.socialLinksText} onChange={change("socialLinksText")}/></div><div className="form-actions-row"><button className="btn-submit" disabled={busy}>{initial?<Save size={18}/>:<UserPlus size={18}/>} {busy?"جاري الحفظ...":submitLabel}</button>{onCancel&&<button type="button" className="btn-cancel" onClick={onCancel}><XCircle size={18}/> إلغاء</button>}</div></form>;
}
