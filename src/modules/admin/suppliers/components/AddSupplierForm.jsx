import { useState } from "react";
import { Briefcase, PlusCircle, XCircle } from "lucide-react";
import useCreateSupplier from "../hooks/useCreateSupplier";
import "./AddSupplierForm.css";

const emptyForm={name:"",contactPerson:"",phone:"",supplierType:"",city:""};

function AddSupplierForm(){
 const [form,setForm]=useState(emptyForm);
 const mutation=useCreateSupplier({onSuccess:()=>setForm(emptyForm)});
 const change=e=>setForm(prev=>({...prev,[e.target.name]:e.target.value}));
 const submit=e=>{e.preventDefault();mutation.mutate({name:form.name.trim(),contactPerson:form.contactPerson.trim(),phone:form.phone.trim(),supplierType:form.supplierType.trim(),city:form.city.trim(),supplierCategory:"عام",creditLimit:0,openingBalance:0})};
 const fields=[
  ["name","اسم المورد","text",true],["contactPerson","اسم المسؤول","text",true],["phone","رقم الهاتف","tel",true],
  ["supplierType","نوع المورد","text",true],["city","المدينة","text",true]
 ];
 return <div className="add-supplier-card"><div className="form-card-header"><div className="form-header-title"><div className="header-plus-icon"><PlusCircle size={18}/></div><span>إضافة مورد جديد</span></div></div>
 <form onSubmit={submit} className="supplier-form"><div className="form-grid">{fields.map(([name,label,type,required])=><div className="form-group" key={name}><label className="form-label">{label}{required&&<span className="required-star"> *</span>}</label><input className="form-input" name={name} type={type} value={form[name]} onChange={change} required={required} min={type==="number"?0:undefined}/></div>)}</div>
 {mutation.isError&&<p className="form-api-error">{mutation.error?.response?.data?.message||"تعذر حفظ المورد. راجع البيانات وحاول مرة أخرى."}</p>}
 <div className="form-actions-bar"><button type="submit" className="save-supplier-btn" disabled={mutation.isPending}><Briefcase size={18}/><span>{mutation.isPending?"جاري الحفظ...":"حفظ المورد"}</span></button><button type="button" className="cancel-supplier-btn" onClick={()=>setForm(emptyForm)}><XCircle size={18}/><span>إلغاء</span></button></div></form></div>
}
export default AddSupplierForm;
