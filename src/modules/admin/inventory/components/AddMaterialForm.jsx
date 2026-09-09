import { useEffect,useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageCheck,PlusCircle,XCircle } from "lucide-react";
import Input from "@/shared/components/Input/Input";
import Select from "@/shared/components/Select/Select";
import DateInput from "@/shared/components/DateInput/DateInput";
import Button from "@/shared/components/Button/Button";
import { getSupplierOptions } from "@/modules/admin/suppliers/services/suppliersService";
import { MATERIAL_UNITS } from "../constants/inventoryConstants";
import { mapMaterialPayload } from "../utils/inventoryMapper";
import useCreateMaterial from "../hooks/useCreateMaterial";
import "./AddMaterialForm.css";

const emptyForm={name:"",unit:"",quantity:"",price:"",supplierId:"",minAlert:"",expiryDate:"",addedAt:new Date().toISOString().slice(0,10),expiryAlertDays:""};
function AddMaterialForm(){
 const [form,setForm]=useState(emptyForm);const mutation=useCreateMaterial();
 const suppliersQuery=useQuery({queryKey:["suppliers","options"],queryFn:getSupplierOptions,staleTime:5*60*1000});
 const supplierOptions=(suppliersQuery.data?.data||[]).map(s=>({value:String(s.id),label:s.name}));
 useEffect(()=>{if(mutation.isSuccess)setForm(emptyForm)},[mutation.isSuccess]);
 const change=e=>setForm(p=>({...p,[e.target.name]:e.target.value}));
 const submit=e=>{e.preventDefault();mutation.mutate(mapMaterialPayload({...form,consumptionDate:form.addedAt,expiryAlertLimit:form.expiryAlertDays}))};
 return <form className="material-form" onSubmit={submit}><div className="form-card-title"><PlusCircle size={20} className="title-icon"/><span>إضافة مادة خام</span></div>
  <div className="form-row form-row--4"><Input label="اسم المادة" name="name" value={form.name} onChange={change} required/><Select label="وحدة القياس" name="unit" value={form.unit} onChange={change} options={MATERIAL_UNITS} placeholder="اختر الوحدة" required/><Input label="الكمية الافتتاحية" name="quantity" type="number" min="0.01" value={form.quantity} onChange={change} required/><Input label="سعر الوحدة" name="price" type="number" min="0" value={form.price} onChange={change} required/></div>
  <div className="form-row form-row--4"><Select label="المورد" name="supplierId" value={form.supplierId} onChange={change} options={supplierOptions} placeholder={suppliersQuery.isLoading?"جاري تحميل الموردين":"اختر المورد"} required/><DateInput label="تاريخ الإضافة" name="addedAt" value={form.addedAt} onChange={change} required/><DateInput label="تاريخ الصلاحية" name="expiryDate" value={form.expiryDate} onChange={change}/><Input label="الحد الأدنى للمخزون" name="minAlert" type="number" min="0" value={form.minAlert} onChange={change} required/></div>
  <div className="form-row form-row--4"><Input label="التنبيه قبل الصلاحية (أيام)" name="expiryAlertDays" type="number" min="0" value={form.expiryAlertDays} onChange={change}/></div>
  {supplierOptions.length===0&&!suppliersQuery.isLoading&&<p className="form-api-error">أضف موردًا أولًا قبل إضافة مادة خام.</p>}{mutation.isError&&<p className="form-api-error">{mutation.error?.response?.data?.message||"تعذر حفظ المادة"}</p>}{mutation.isSuccess&&<p className="form-api-success">تم حفظ المادة بنجاح.</p>}
  <div className="form-actions"><Button type="submit" icon={PackageCheck} loading={mutation.isPending} disabled={!supplierOptions.length}>حفظ المادة</Button><Button type="button" variant="secondary" icon={XCircle} onClick={()=>setForm(emptyForm)}>إلغاء</Button></div></form>
}
export default AddMaterialForm;
