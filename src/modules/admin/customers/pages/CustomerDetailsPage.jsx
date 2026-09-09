import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight, MapPin, Phone, User, MessageSquare, Save,
    Pencil, RefreshCw, Loader2, Mail, StickyNote, Package, Wallet,
} from "lucide-react";
import CustomerForm from "../components/CustomerForm";
import { updateCustomer, customerKey, CUSTOMERS_KEY, customersErrorMessage } from "../services/customersService";
import { useCustomer } from "../hooks/useCustomer";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import "../styles/CustomerDetailsPage.css";

const ORDER_STATUS_LABELS = {
    PENDING: "قيد التحضير",
    READY: "جاهز",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
};

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString("ar-EG") : "—");

const formatMoney = (value) => `${Number(value || 0).toLocaleString("ar-EG")} ج.م`;

function CustomerDetailsPage() {
    const { id } = useParams();
    const customerId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: customer, isLoading, isError, error, refetch } = useCustomer(customerId);

    const [editing, setEditing] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [notice, setNotice] = useState("");
    const [feedbackNotice, setFeedbackNotice] = useState("");

    useEffect(() => {
        setFeedback(customer?.feedback || "");
    }, [customer?.id, customer?.feedback]);

    const update = useMutation({
        mutationFn: (payload) => updateCustomer(customerId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKey(customerId) });
            queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
            setEditing(false);
            setNotice("تم حفظ التعديلات بنجاح");
            setTimeout(() => setNotice(""), 3000);
        },
    });

    const saveFeedback = useMutation({
        mutationFn: () => updateCustomer(customerId, { feedback }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKey(customerId) });
            queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
            setFeedbackNotice("تم حفظ الفيد باك");
            setTimeout(() => setFeedbackNotice(""), 3000);
        },
    });

    if (isLoading) {
        return (
            <div className="customer-details-page">
                <PageHeader title="تفاصيل العميل" breadcrumbs={["الرئيسية", "العملاء"]} />
                <div className="customer-state"><Loader2 className="spin" size={26} /> جارٍ تحميل بيانات العميل...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="customer-details-page">
                <PageHeader title="تفاصيل العميل" breadcrumbs={["الرئيسية", "العملاء"]} />
                <div className="customer-state">
                    <p>{customersErrorMessage(error, "تعذر تحميل بيانات العميل")}</p>
                    <button className="customers-retry" onClick={() => refetch()}><RefreshCw size={15} /> إعادة المحاولة</button>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="customer-not-found">
                <p>العميل غير موجود</p>
                <button onClick={() => navigate("/admin/customers")}>العودة للعملاء</button>
            </div>
        );
    }

    const social = customer.social || {};
    const orders = customer.orders || [];
    const orderType = customer.orderType === "أونلاين" ? "online" : "tables";

    return (
        <div className="customer-details-page">
            <PageHeader
                title={`تفاصيل العميل - ${customer.name}`}
                breadcrumbs={["الرئيسية", "العملاء", customer.name]}
            />

            <div className="customer-details-content">
                <button className="btn-back" onClick={() => navigate("/admin/customers")}>
                    <ArrowRight size={18} />
                    رجوع
                </button>

                <div className="customer-info-card">
                    <div className="customer-info-header">
                        <div className="customer-avatar">
                            <User size={32} />
                        </div>
                        <h2>{customer.name}</h2>
                        <span className={`ct-type-badge ${orderType}`}>
                            {customer.orderType || "—"}
                        </span>
                        <button className="customer-edit-btn" onClick={() => setEditing(true)}>
                            <Pencil size={14} />
                            تعديل
                        </button>
                    </div>
                    <div className="customer-info-body">
                        <div className="info-row">
                            <Phone size={16} />
                            <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                            <div className="info-row">
                                <Mail size={16} />
                                <span>{customer.email}</span>
                            </div>
                        )}
                        {customer.address && (
                            <div className="info-row">
                                <MapPin size={16} />
                                <span>{customer.address}</span>
                            </div>
                        )}
                        {customer.notes && (
                            <div className="info-row">
                                <StickyNote size={16} />
                                <span>{customer.notes}</span>
                            </div>
                        )}
                        <div className="customer-stats">
                            <div className="customer-stat">
                                <Package size={16} />
                                <span>عدد الطلبات</span>
                                <b>{customer.orderCount ?? 0}</b>
                            </div>
                            <div className="customer-stat">
                                <Wallet size={16} />
                                <span>إجمالي المشتريات</span>
                                <b>{formatMoney(customer.totalSpent)}</b>
                            </div>
                        </div>
                        <div className="customer-social-links">
                            {social.facebook && (
                                <a href={social.facebook} target="_blank" rel="noreferrer" className="social-btn facebook">Facebook</a>
                            )}
                            {social.whatsapp && (
                                <a href={social.whatsapp} target="_blank" rel="noreferrer" className="social-btn whatsapp">WhatsApp</a>
                            )}
                            {social.tiktok && (
                                <a href={social.tiktok} target="_blank" rel="noreferrer" className="social-btn tiktok">TikTok</a>
                            )}
                            {social.instagram && (
                                <a href={social.instagram} target="_blank" rel="noreferrer" className="social-btn instagram">Instagram</a>
                            )}
                        </div>
                    </div>
                </div>

                {editing && (
                    <div className="customer-edit-section">
                        <h3>تعديل بيانات العميل</h3>
                        <CustomerForm
                            initial={customer}
                            submitLabel="حفظ التعديلات"
                            onCancel={() => setEditing(false)}
                            onSubmit={(payload) => update.mutate(payload)}
                        />
                        {update.isError && (
                            <p className="form-api-error grid-message">{customersErrorMessage(update.error, "تعذر حفظ التعديلات")}</p>
                        )}
                        {notice && <p className="customers-notice">{notice}</p>}
                    </div>
                )}

                <div className="customer-orders-section">
                    <h3>طلبات العميل ({customer.orderCount ?? orders.length})</h3>
                    {orders.length === 0 ? (
                        <div className="no-orders">لا توجد طلبات لهذا العميل</div>
                    ) : (
                        <div className="customer-orders-table-wrapper">
                            <table className="customer-orders-table">
                                <thead>
                                    <tr>
                                        <th>رقم الطلب</th>
                                        <th>الحالة</th>
                                        <th>إجمالي السعر</th>
                                        <th>التاريخ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>{order.orderNumber}</td>
                                            <td>{ORDER_STATUS_LABELS[order.status] || order.status}</td>
                                            <td className="price-cell">{formatMoney(order.total)}</td>
                                            <td>{formatDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="customer-feedback-section">
                    <div className="feedback-header">
                        <MessageSquare size={18} />
                        <h3>الفيد باك</h3>
                    </div>
                    <div className="feedback-body">
                        <textarea
                            className="feedback-input"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="اكتب ملاحظات أو فيد باك العميل هنا..."
                            rows={4}
                        />
                        <button className="feedback-save" onClick={() => saveFeedback.mutate()} disabled={saveFeedback.isPending}>
                            <Save size={16} />
                            {saveFeedback.isPending ? "جارٍ الحفظ..." : "حفظ الفيد باك"}
                        </button>
                        {saveFeedback.isError && (
                            <p className="form-api-error grid-message">{customersErrorMessage(saveFeedback.error, "تعذر حفظ الفيد باك")}</p>
                        )}
                        {feedbackNotice && <p className="customers-notice">{feedbackNotice}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomerDetailsPage;