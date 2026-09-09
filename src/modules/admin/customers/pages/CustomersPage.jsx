import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Search, UserPlus, RefreshCw, Users, Loader2 } from "lucide-react";
import CustomerForm from "../components/CustomerForm";
import { createCustomer, deleteCustomer, CUSTOMERS_KEY, customersErrorMessage } from "../services/customersService";
import { useCustomers } from "../hooks/useCustomers";
import PageHeader from "@/shared/components/PageHeader/PageHeader";
import "../styles/CustomersPage.css";

function CustomersPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [notice, setNotice] = useState("");

    const { data, isLoading, isError, error, refetch } = useCustomers(search);
    const customers = data || [];

    const invalidate = () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });

    const create = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            invalidate();
            setNotice("تم تسجيل العميل بنجاح");
            setTimeout(() => setNotice(""), 3000);
        },
    });

    const remove = useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            invalidate();
            setNotice("تم حذف العميل");
            setTimeout(() => setNotice(""), 3000);
        },
    });

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
            remove.mutate(id);
        }
    };

    const handleEdit = (e, customer) => {
        e.stopPropagation();
        navigate(`/admin/customers/${customer.id}`);
    };

    return (
        <div className="customers-page">
            <PageHeader
                title="إدارة العملاء"
                breadcrumbs={["الرئيسية", "العملاء"]}
            />

            <div className="customers-form-section">
                <h3>تسجيل عميل جديد</h3>
                <CustomerForm onSubmit={(payload) => create.mutate(payload)} />
                {create.isError && (
                    <p className="form-api-error grid-message">{customersErrorMessage(create.error, "تعذر تسجيل العميل")}</p>
                )}
                {notice && <p className="customers-notice">{notice}</p>}
            </div>

            <div className="customers-list-section">
                <div className="customers-list-head">
                    <h3>قائمة العملاء ({isLoading ? "..." : customers.length})</h3>
                    <div className="customers-search">
                        <Search size={16} className="customers-search-icon" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="بحث بالاسم أو الرقم"
                        />
                        {search && (
                            <button className="customers-clear" onClick={() => setSearch("")}>×</button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="customers-state"><Loader2 className="spin" size={26} /> جارٍ تحميل العملاء...</div>
                ) : isError ? (
                    <div className="customers-state">
                        <p>{customersErrorMessage(error, "تعذر تحميل العملاء")}</p>
                        <button className="customers-retry" onClick={() => refetch()}><RefreshCw size={15} /> إعادة المحاولة</button>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="customers-state"><Users size={26} /> لا يوجد عملاء بعد</div>
                ) : (
                    <div className="customers-table-wrap">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم العميل</th>
                                    <th>رقم الهاتف</th>
                                    <th>العنوان</th>
                                    <th>نوع الطلب</th>
                                    <th>السوشيال ميديا</th>
                                    <th>عدد الطلبات</th>
                                    <th>إجمالي المشتريات</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer, idx) => {
                                    const socialLinks = customer.social || {};
                                    return (
                                        <tr
                                            key={customer.id}
                                            className="customers-row"
                                            onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                        >
                                            <td className="ct-id">{idx + 1}</td>
                                            <td className="ct-name">{customer.name}</td>
                                            <td className="ct-phone">{customer.phone}</td>
                                            <td className="ct-address">{customer.address || "—"}</td>
                                            <td className="ct-type">
                                                <span className={`ct-type-badge ${customer.orderType === "أونلاين" ? "online" : "tables"}`}>
                                                    {customer.orderType || "—"}
                                                </span>
                                            </td>
                                            <td className="ct-social">
                                                {socialLinks.facebook && (
                                                    <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="social-icon facebook" onClick={e => e.stopPropagation()}>f</a>
                                                )}
                                                {socialLinks.whatsapp && (
                                                    <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="social-icon whatsapp" onClick={e => e.stopPropagation()}>w</a>
                                                )}
                                                {socialLinks.tiktok && (
                                                    <a href={socialLinks.tiktok} target="_blank" rel="noreferrer" className="social-icon tiktok" onClick={e => e.stopPropagation()}>t</a>
                                                )}
                                                {socialLinks.instagram && (
                                                    <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="social-icon instagram" onClick={e => e.stopPropagation()}>i</a>
                                                )}
                                            </td>
                                            <td className="ct-orders">{customer.orderCount ?? 0}</td>
                                            <td className="ct-total">{Number(customer.totalSpent || 0).toLocaleString("ar-EG")} ج.م</td>
                                            <td className="ct-actions">
                                                <button className="ct-btn-edit" onClick={(e) => handleEdit(e, customer)}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="ct-btn-delete" onClick={(e) => handleDelete(e, customer.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CustomersPage;