import React, { useState, useEffect } from "react";
import { X, Check, PlusCircle } from "lucide-react";

export default function AddonModal({ isOpen, onClose, onSave, editingAddon }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        if (editingAddon) {
            setName(editingAddon.name || "");
            setPrice(editingAddon.price || "");
            setDescription(editingAddon.description || editingAddon.notes || "");
        } else {
            setName("");
            setPrice("");
            setDescription("");
        }
    }, [editingAddon, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("يرجى إدخال اسم الإضافة");
            return;
        }
        if (!price || isNaN(price)) {
            alert("يرجى إدخال سعر صحيح للإضافة");
            return;
        }

        onSave({
            id: editingAddon ? editingAddon.id : Date.now(),
            name: name.trim(),
            price: parseFloat(price).toFixed(2),
            description: description.trim()
        });
        onClose();
    };

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-content">
                <div className="product-modal-header">
                    <div className="modal-title-group">
                        <PlusCircle className="modal-header-icon" size={22} />
                        <h4>{editingAddon ? "تعديل الإضافة" : "إضافة جديدة"}</h4>
                    </div>
                    <button type="button" className="close-modal-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="product-modal-body">
                    {/* 1. الاسم */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            اسم الإضافة <span className="required-star">*</span>
                        </label>
                        <input
                            type="text"
                            className="modal-input-text"
                            placeholder="مثال: شوت إسبريسو إضافي، سيروب فانيليا، كريمة مخفوقة..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* 2. السعر */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            السعر (جنيه) <span className="required-star">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            className="modal-input-text"
                            placeholder="مثال: 5.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    {/* 3. الوصف */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">الوصف / الملاحظات</label>
                        <textarea
                            className="modal-textarea"
                            placeholder="أدخل وصفاً مشروحاً للإضافة أو أية ملاحظات..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer-actions">
                        <button type="submit" className="btn-save-modal">
                            <Check size={18} />
                            <span>حفظ الإضافة</span>
                        </button>
                        <button type="button" className="btn-cancel-modal" onClick={onClose}>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
