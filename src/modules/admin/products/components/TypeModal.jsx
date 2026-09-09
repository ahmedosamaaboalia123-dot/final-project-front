import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Check, Package } from "lucide-react";

export const MASTER_RAW_MATERIALS = [
    { id: 1, name: "إسبريسو / بن كولومبي", unit: "مل" },
    { id: 2, name: "حليب كامل الدسم مراعي", unit: "مل" },
    { id: 3, name: "حليب الشوفان", unit: "مل" },
    { id: 4, name: "سكر أبيض ناعم", unit: "جرام" },
    { id: 5, name: "سكر بني", unit: "جرام" },
    { id: 6, name: "ثلج مكسر", unit: "جرام" },
    { id: 7, name: "سيروب فانيليا مونين", unit: "مل" },
    { id: 8, name: "سيروب كراميل مونين", unit: "مل" },
    { id: 9, name: "سيروب بندق", unit: "مل" },
    { id: 10, name: "رغوة حليب سخنة", unit: "مل" },
    { id: 11, name: "بودرة ماتشا يابانية", unit: "جرام" },
    { id: 12, name: "صوص شيكولاتة داكنة", unit: "مل" },
    { id: 13, name: "أكواب ورقية (سخنة)", unit: "قطعة" },
    { id: 14, name: "أكواب بلاستيكية (باردة)", unit: "قطعة" },
    { id: 15, name: "أغطية أكواب", unit: "قطعة" },
    { id: 16, name: "شالييمو ورقي", unit: "قطعة" }
];

export default function TypeModal({ isOpen, onClose, onSave, editingType }) {
    const [typeName, setTypeName] = useState("");
    const [rawMaterials, setRawMaterials] = useState([]);

    const [selectedMasterId, setSelectedMasterId] = useState("");
    const [customMaterialName, setCustomMaterialName] = useState("");
    const [customUnit, setCustomUnit] = useState("جرام");

    useEffect(() => {
        if (editingType) {
            setTypeName(editingType.name || "");
            setRawMaterials(editingType.rawMaterials || []);
        } else {
            setTypeName("");
            setRawMaterials([
                { id: 1, name: "إسبريسو / بن كولومبي", unit: "مل" },
                { id: 2, name: "حليب كامل الدسم مراعي", unit: "مل" }
            ]);
        }
        setSelectedMasterId("");
        setCustomMaterialName("");
    }, [editingType, isOpen]);

    if (!isOpen) return null;

    const handleAddMaterial = () => {
        if (selectedMasterId) {
            const found = MASTER_RAW_MATERIALS.find(m => m.id === Number(selectedMasterId));
            if (found && !rawMaterials.some(m => m.name === found.name)) {
                setRawMaterials([...rawMaterials, { id: Date.now(), name: found.name, unit: found.unit }]);
            }
            setSelectedMasterId("");
        } else if (customMaterialName.trim()) {
            if (!rawMaterials.some(m => m.name === customMaterialName.trim())) {
                setRawMaterials([...rawMaterials, { id: Date.now(), name: customMaterialName.trim(), unit: customUnit || "جرام" }]);
            }
            setCustomMaterialName("");
        }
    };

    const handleRemoveMaterial = (id) => {
        setRawMaterials(rawMaterials.filter(m => m.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!typeName.trim()) {
            alert("يرجى إدخال اسم النوع");
            return;
        }
        if (rawMaterials.length === 0) {
            alert("يرجى إضافة مادة خام واحدة على الأقل لهذا النوع");
            return;
        }
        onSave({
            id: editingType ? editingType.id : Date.now(),
            name: typeName.trim(),
            rawMaterials
        });
        onClose();
    };

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-content">
                <div className="product-modal-header">
                    <div className="modal-title-group">
                        <Package className="modal-header-icon" size={22} />
                        <h4>{editingType ? "تعديل نوع المنتج" : "إضافة نوع جديد للمنتج"}</h4>
                    </div>
                    <button type="button" className="close-modal-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="product-modal-body">
                    {/* اسم النوع */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            اسم النوع <span className="required-star">*</span>
                        </label>
                        <input
                            type="text"
                            className="modal-input-text"
                            placeholder="مثال: ساخن، بارد، ساندوتشات، حلويات..."
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                            required
                        />
                    </div>

                    {/* إضافة مواد خام للنوع */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            المواد الخام المكونة لهذا النوع <span className="required-star">*</span>
                        </label>
                        <p className="modal-field-hint">
                            اختر المواد الخام التي تدخل في تركيبة هذا النوع (يمكنك إدخال أكثر من مادة):
                        </p>

                        {/* اختيار مادة من القائمة المتاحة */}
                        <div className="add-material-inputs-row">
                            <select
                                className="modal-select-box"
                                value={selectedMasterId}
                                onChange={(e) => setSelectedMasterId(e.target.value)}
                            >
                                <option value="">-- اختر مادة خام من القائمة المتاحة --</option>
                                {MASTER_RAW_MATERIALS.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.unit})
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="btn-add-material-to-type"
                                onClick={handleAddMaterial}
                            >
                                <Plus size={16} />
                                <span>إضافة مادة</span>
                            </button>
                        </div>

                        {/* أو إضافة مادة جديدة */}
                        <div className="custom-material-row">
                            <span className="or-divider">أو إضافة مادة مخصصة جديدة:</span>
                            <div className="custom-mat-fields">
                                <input
                                    type="text"
                                    className="modal-input-text inline-input"
                                    placeholder="اسم المادة الخام..."
                                    value={customMaterialName}
                                    onChange={(e) => setCustomMaterialName(e.target.value)}
                                />
                                <select
                                    className="modal-select-box inline-select"
                                    value={customUnit}
                                    onChange={(e) => setCustomUnit(e.target.value)}
                                >
                                    <option value="جرام">جرام</option>
                                    <option value="مل">مل</option>
                                    <option value="قطعة">قطعة</option>
                                    <option value="كيس">كيس</option>
                                    <option value="لتر">لتر</option>
                                </select>
                                <button
                                    type="button"
                                    className="btn-add-custom-mat"
                                    onClick={handleAddMaterial}
                                >
                                    + إضافة
                                </button>
                            </div>
                        </div>

                        {/* قائمة المواد المحددة */}
                        <div className="selected-materials-box">
                            <span className="tags-box-title">المواد الخام المحددة لهذا النوع ({rawMaterials.length}):</span>
                            {rawMaterials.length === 0 ? (
                                <div className="empty-materials-msg">لم يتم اختيار مواد خام حتى الآن.</div>
                            ) : (
                                <div className="materials-table-preview">
                                    <table className="modal-inner-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "40px" }}>م</th>
                                                <th className="text-right">اسم المادة الخام</th>
                                                <th>الوحدة</th>
                                                <th>إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawMaterials.map((m, idx) => (
                                                <tr key={m.id || idx}>
                                                    <td>{idx + 1}</td>
                                                    <td className="text-right" style={{ fontWeight: 700 }}>{m.name}</td>
                                                    <td><span className="unit-badge">{m.unit}</span></td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn-remove-tag"
                                                            onClick={() => handleRemoveMaterial(m.id)}
                                                            title="حذف المادة"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer-actions">
                        <button type="submit" className="btn-save-modal">
                            <Check size={18} />
                            <span>حفظ النوع</span>
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
