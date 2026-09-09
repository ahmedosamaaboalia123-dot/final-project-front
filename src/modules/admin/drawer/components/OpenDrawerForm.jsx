import { useState } from "react";
import { Lock, Wallet } from "lucide-react";

export default function OpenDrawerForm({ mutation, onMessage }) {
  const [openingBalance, setOpeningBalance] = useState("");
  return <section className="drawer-open-card"><Wallet size={34}/><h2>الدرج مغلق</h2><p>افتح الدرج وأدخل النقد الموجود فعليًا لبدء الوردية.</p><form onSubmit={(event) => {
    event.preventDefault();
    mutation.mutate(Number(openingBalance), { onSuccess: () => { setOpeningBalance(""); onMessage("تم فتح الدرج"); } });
  }}><label><span>الرصيد الافتتاحي</span><input required min="0" step="0.01" type="number" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)}/></label><button disabled={mutation.isPending}><Lock size={16}/>{mutation.isPending ? "جاري الفتح..." : "فتح وحفظ"}</button></form></section>;
}
