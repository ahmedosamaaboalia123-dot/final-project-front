import { useState } from "react";
import { Wallet } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import CloseDrawerForm from "../components/CloseDrawerForm";
import DrawerHistoryTable from "../components/DrawerHistoryTable";
import DrawerMovementForms from "../components/DrawerMovementForms";
import DrawerOverview from "../components/DrawerOverview";
import DrawerTransactionsTable from "../components/DrawerTransactionsTable";
import OpenDrawerForm from "../components/OpenDrawerForm";
import { drawerTotals } from "../components/drawerUtils";
import { useDrawer } from "../hooks/useDrawer";
import "./DrawerPage.css";

export default function DrawerPage() {
  const drawer = useDrawer();
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const mutations = [drawer.openShift, drawer.addCashIn, drawer.addCashOut, drawer.closeShift];
  const mutationError = mutations.find((item) => item.isError)?.error;
  const error = drawer.error || mutationError;
  const showMessage = (value) => { setMessage(value); setClosing(false); window.setTimeout(() => setMessage(""), 3500); };
  const summary = drawerTotals(drawer.shift);

  return <div className="drawer-page" dir="rtl"><PageHeader title="الدرج" breadcrumbs={["الرئيسية", "الدرج"]} icon={Wallet}/><div className="drawer-shell">
    {error && <p className="drawer-alert error" role="alert">{error?.response?.data?.message || error.message || "تعذر تنفيذ العملية"}</p>}
    {message && <p className="drawer-alert success">{message}</p>}
    {!drawer.shift && !drawer.isLoading && <OpenDrawerForm mutation={drawer.openShift} onMessage={showMessage}/>} 
    {drawer.shift && !closing && <>
      <DrawerOverview shift={drawer.shift} refreshing={drawer.isFetching} onRefresh={drawer.refetch} onClose={() => setClosing(true)}/>
      <DrawerMovementForms shiftId={drawer.shift.id} cashIn={drawer.addCashIn} cashOut={drawer.addCashOut} onMessage={showMessage}/>
      <DrawerTransactionsTable transactions={drawer.shift.transactions}/>
    </>}
    {drawer.shift && closing && <CloseDrawerForm shiftId={drawer.shift.id} expectedBalance={summary.balance} mutation={drawer.closeShift} onCancel={() => setClosing(false)} onMessage={showMessage}/>} 
    <DrawerHistoryTable history={drawer.history}/>
  </div></div>;
}
