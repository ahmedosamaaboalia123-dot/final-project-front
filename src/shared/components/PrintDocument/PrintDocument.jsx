import { useState } from "react";
import { Printer } from "lucide-react";
import "./PrintDocument.css";

export function openPrintWindow() { window.print(); }

export default function PrintDocument({ printData: suppliedData, loadPrintData, recordPrintEvent, title = "فاتورة", render, disabled = false, buttonLabel = "طباعة" }) {
  const [loadedData, setLoadedData] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const printData = suppliedData ?? loadedData;
  const print = async () => {
    if (pending) return;
    setPending(true); setError(null);
    try {
      const data = suppliedData ?? await loadPrintData?.();
      if (!data) throw new Error("بيانات الطباعة غير متاحة");
      setLoadedData(data);
      await new Promise((resolve) => (globalThis.requestAnimationFrame || ((callback) => setTimeout(callback, 0)))(resolve));
      openPrintWindow();
      await recordPrintEvent?.(data);
    } catch (cause) { setError(cause); }
    finally { setPending(false); }
  };
  return <section className="print-document">
    <button type="button" className="print-document__button" onClick={print} disabled={disabled || pending || (!suppliedData && !loadPrintData)}><Printer size={18}/>{pending ? "جاري تجهيز الطباعة..." : buttonLabel}</button>
    {error && <p role="alert">{error.message || "تعذر تجهيز الطباعة"}</p>}
    {printData && <article className="print-document__sheet" aria-label={title}>
      {typeof render === "function" ? render(printData) : <pre>{JSON.stringify(printData, null, 2)}</pre>}
    </article>}
  </section>;
}
