import { useState } from "react";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Boxes,ChevronLeft,ChevronRight,Eye,RefreshCw,Trash2 } from "lucide-react";
import { deleteMaterial,getMaterials } from "../services/inventoryService";
import "./MaterialsTable.css";

const totalQuantity=(batches=[])=>batches.reduce((sum,b)=>sum+Number(b.quantity||0),0);
const latestPrice=(batches=[])=>Number([...batches].sort((a,b)=>new Date(b.addedAt)-new Date(a.addedAt))[0]?.pricePerUnit||0);
const nearestExpiry=(batches=[])=>[...batches].filter(b=>b.expiryDate).sort((a,b)=>new Date(a.expiryDate)-new Date(b.expiryDate))[0]?.expiryDate;
const formatDate=value=>value?new Intl.DateTimeFormat("ar-EG").format(new Date(value)):"—";
function MaterialsTable(){
 const navigate=useNavigate(),client=useQueryClient();const [page,setPage]=useState(1),[pageSize,setPageSize]=useState(10),[search,setSearch]=useState("");
 const query=useQuery({queryKey:["raw-materials",page,pageSize,search],queryFn:()=>getMaterials({page,pageSize,search})});
 const remove=useMutation({mutationFn:deleteMaterial,onSuccess:()=>client.invalidateQueries({queryKey:["raw-materials"]})});
 const rows=query.data?.data||[],pagination=query.data?.pagination||{total:0,totalPages:1};
 return <div className="materials-table-card"><div className="table-card-header"><div className="table-card-title"><Boxes size={22}/><span>المواد الخام</span></div><div className="table-header-actions"><input className="table-search-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="ابحث بالمادة أو المورد"/><button className="refresh-icon-btn" onClick={()=>query.refetch()}><RefreshCw size={17} className={query.isFetching?"is-spinning":""}/></button></div></div>
 {query.isError&&<div className="data-state data-state--error">تعذر تحميل المخزون.</div>}{remove.isError&&<div className="data-state data-state--error">{remove.error?.response?.data?.message||"تعذر حذف المادة"}</div>}
 <div className="table-responsive"><table className="custom-materials-table"><thead><tr><th>م</th><th>الاسم</th><th>الوحدة</th><th>الكمية</th><th>آخر سعر</th><th>المورد</th><th>أقرب صلاحية</th><th>حد التنبيه</th><th>تنبيه الصلاحية</th><th>الإجراءات</th></tr></thead><tbody>{query.isLoading?<tr><td colSpan="10">جاري التحميل...</td></tr>:rows.length===0?<tr><td colSpan="10">لا توجد مواد.</td></tr>:rows.map((row,index)=><tr key={row.id}><td>{(page-1)*pageSize+index+1}</td><td>{row.name}</td><td>{row.unit}</td><td>{totalQuantity(row.batches)}</td><td>{latestPrice(row.batches).toFixed(2)}</td><td>{row.supplier?.name||"—"}</td><td>{formatDate(nearestExpiry(row.batches))}</td><td>{Number(row.minStockAlert)}</td><td>{row.expiryAlertDays==null?"—":`${row.expiryAlertDays} يوم`}</td><td><div className="action-buttons-group"><button className="action-btn action-btn--gray" onClick={()=>navigate(`/admin/inventory/${row.id}`)}><Eye size={16}/></button><button className="action-btn action-btn--red" onClick={()=>window.confirm(`حذف مادة «${row.name}»؟`)&&remove.mutate(row.id)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
 <div className="table-pagination"><div className="pagination-info"><select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}}><option>10</option><option>25</option><option>50</option></select><span>إجمالي {pagination.total}</span></div><div className="pagination-controls"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronRight/></button><b>{page}</b><button disabled={page>=pagination.totalPages} onClick={()=>setPage(p=>p+1)}><ChevronLeft/></button></div></div></div>
}
export default MaterialsTable;
