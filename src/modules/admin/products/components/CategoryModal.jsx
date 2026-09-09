import { useState, useEffect } from "react";
import { X, Tag } from "lucide-react";

export default function CategoryModal({ isOpen, onClose, onSave, editingCategory }) {
    const [name, setName] = useState("");

    useEffect(() => {
        if (editingCategory) {
            setName(editingCategory.name || "");
        } else {
            setName("");
        }
    }, [editingCategory, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim() });
        setName("");
    };

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal-content" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                <div className="product-modal-header">
                    <div className="modal-title-group">
                        <Tag size={18} className="modal-header-icon" />
                        <span>{editingCategory ? "تعديل القسم" : "إضافة قسم جديد"}</span>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className="product-modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 700, color: "#2B211B" }}>اسم القسم</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="مثال: مشروبات، أكلات، حلويات..."
                            style={{
                                height: "44px",
                                padding: "0 14px",
                                borderRadius: "10px",
                                border: "1px solid #EDE3DA",
                                backgroundColor: "#FAFAFA",
                                fontSize: "13.5px",
                                fontFamily: "var(--font-family)",
                                color: "#2B211B",
                                outline: "none",
                                direction: "rtl",
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                    </div>
                </div>
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #EDE3DA",
                    display: "flex",
                    justifyContent: "flex-start",
                    gap: "10px",
                }}>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: "0 28px",
                            height: "42px",
                            borderRadius: "10px",
                            backgroundColor: "#3C2814",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--font-family)",
                        }}
                    >
                        {editingCategory ? "حفظ التعديلات" : "إضافة القسم"}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "0 28px",
                            height: "42px",
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            color: "#6F6258",
                            border: "1px solid #EDE3DA",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--font-family)",
                        }}
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
}
