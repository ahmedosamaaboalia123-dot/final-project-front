import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Truck } from "lucide-react";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import apiClient from "@/services/apiClient";
import { getAdminSocket } from "@/services/realtime";
import "./DelegatesPage.css";

const statusText = { AVAILABLE: "متاح", UNAVAILABLE: "غير متاح" };

export default function DelegatesPage() {
  const navigate = useNavigate();
  const [delegates, setDelegates] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/delegates", { params: { page: 1, pageSize: 30 } });
      setDelegates(res?.data || []);
      setError("");
    } catch (e) { setError(e.response?.data?.message || e.message); }
  }, []);

  useEffect(() => {
    load();
    const socket = getAdminSocket();
    const onOrderUpdated = (payload) => { if (payload?.order?.delegateId) load(); };
    socket.on("order:updated", onOrderUpdated);
    return () => socket.off("order:updated", onOrderUpdated);
  }, [load]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiClient.post("/delegates", form);
      setForm({ name: "", phone: "", whatsapp: "" });
      await load();
    } catch (e) { setError(e.response?.data?.message || e.message); } finally { setSaving(false); }
  };

  const openDelegate = (id) => navigate(`/admin/delegates/${id}`);

  return (
    <div className="delegates-page">
      <PageHeader title="المناديب" breadcrumbs={["الإدارة", "المناديب"]} icon={Truck} />
      <div className="delegates-content">
        <form className="delegate-form" onSubmit={create}>
          <h2><Plus size={20} /> إضافة مندوب</h2>
          <input required placeholder="اسم المندوب" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input required placeholder="رقم واتساب" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <button disabled={saving}>{saving ? "جاري الحفظ..." : "إضافة المندوب"}</button>
        </form>

        {error && <p className="delegates-error" role="alert">{error}</p>}

        <section className="delegates-list">
          <div className="delegates-list__header">
            <h2>قائمة المناديب</h2>
            <span>{Array.isArray(delegates) ? delegates.length : 0} مندوب</span>
          </div>
          <div className="delegates-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th>الهاتف</th>
                  <th>واتساب</th>
                  <th>الطلبات</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(delegates) && delegates.map((delegate) => (
                  <tr key={delegate.id} className="delegates-row" onClick={() => openDelegate(delegate.id)}>
                    <td>{delegate.name}</td>
                    <td>{delegate.phone}</td>
                    <td>{delegate.whatsapp}</td>
                    <td>{delegate._count?.orders || 0}</td>
                    <td>
                      <span className={`delegate-status delegate-status--${(delegate.status || "").toLowerCase()}`}>
                        {statusText[delegate.status] || delegate.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
