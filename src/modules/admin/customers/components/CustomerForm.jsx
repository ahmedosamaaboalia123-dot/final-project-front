import { useState } from "react";
import { UserPlus, Save, XCircle } from "lucide-react";
import "../styles/CustomerForm.css";

function CustomerForm({ onSubmit, initial = null, submitLabel = "إنشاء عميل", onCancel = null }) {
    const isEdit = !!initial;
    const [name, setName] = useState(initial?.name || "");
    const [phone, setPhone] = useState(initial?.phone || "");
    const [email, setEmail] = useState(initial?.email || "");
    const [address, setAddress] = useState(initial?.address || "");
    const [orderType, setOrderType] = useState(initial?.orderType || "أونلاين");
    const [notes, setNotes] = useState(initial?.notes || "");
    const [facebook, setFacebook] = useState(initial?.social?.facebook || "");
    const [whatsapp, setWhatsapp] = useState(initial?.social?.whatsapp || "");
    const [tiktok, setTiktok] = useState(initial?.social?.tiktok || "");
    const [instagram, setInstagram] = useState(initial?.social?.instagram || "");

    const reset = () => {
        setName("");
        setPhone("");
        setEmail("");
        setAddress("");
        setOrderType("أونلاين");
        setNotes("");
        setFacebook("");
        setWhatsapp("");
        setTiktok("");
        setInstagram("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && phone) {
            onSubmit({
                name,
                phone,
                email: email || null,
                address: address || null,
                orderType,
                notes: notes || null,
                social: {
                    facebook: facebook || null,
                    whatsapp: whatsapp || null,
                    tiktok: tiktok || null,
                    instagram: instagram || null,
                },
            });
            if (!isEdit) reset();
        }
    };

    return (
        <form className="customer-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>الاسم</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسم العميل"
                    required
                />
            </div>
            <div className="form-group">
                <label>الرقم</label>
                <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    required
                />
            </div>
            <div className="form-group">
                <label>الإيميل (اختياري)</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                />
            </div>
            <div className="form-group">
                <label>نوع الطلب</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option value="أونلاين">أونلاين</option>
                    <option value="طربيزات">طربيزات</option>
                </select>
            </div>
            <div className="form-group">
                <label>العنوان (اختياري)</label>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="العنوان"
                />
            </div>
            <div className="form-group">
                <label>ملاحظات (اختياري)</label>
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات عن العميل"
                />
            </div>
            <div className="form-social-section">
                <label>روابط السوشيال ميديا (اختياري)</label>
                <div className="form-social-grid">
                    <input
                        type="url"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="رابط الفيسبوك"
                    />
                    <input
                        type="url"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="رابط الواتساب"
                    />
                    <input
                        type="url"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="رابط التيك توك"
                    />
                    <input
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="رابط الانستجرام"
                    />
                </div>
            </div>
            <div className="form-actions-row">
                <button type="submit" className="btn-submit">
                    {isEdit ? <Save size={18} /> : <UserPlus size={18} />}
                    {submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        <XCircle size={18} />
                        إلغاء
                    </button>
                )}
            </div>
        </form>
    );
}

export default CustomerForm;