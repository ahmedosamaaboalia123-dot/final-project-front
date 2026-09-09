import React, { useState, useEffect } from "react";
import { X, Check, Layers } from "lucide-react";

export default function SizeModal({ isOpen, onClose, onSave, typesList, editingSize }) {
    const [selectedTypeId, setSelectedTypeId] = useState("");
    const [sizeName, setSizeName] = useState("");
    const [materialsQtyMap, setMaterialsQtyMap] = useState({});
    const [price, setPrice] = useState("0.00");

    useEffect(() => {
        if (!isOpen) return;

        if (editingSize) {
            setSelectedTypeId(editingSize.typeId || (typesList[0] ? typesList[0].id : ""));
            setSizeName(editingSize.sizeName || "");
            setPrice(editingSize.price || "0.00");

            const qMap = {};
            if (editingSize.materialsQty) {
                editingSize.materialsQty.forEach(item => {
                    qMap[item.materialName] = item.qty;
                });
            }
            setMaterialsQtyMap(qMap);
        } else {
            const defaultType = typesList[0];
            if (defaultType) {
                setSelectedTypeId(defaultType.id);
                const defaultQMap = {};
                if (defaultType.rawMaterials) {
                    defaultType.rawMaterials.forEach(m => {
                        defaultQMap[m.name] = "10";
                    });
                }
                setMaterialsQtyMap(defaultQMap);
            } else {
                setSelectedTypeId("");
                setMaterialsQtyMap({});
            }
            setSizeName("");
            setPrice("0.00");
        }
    }, [editingSize, isOpen, typesList]);

    if (!isOpen) return null;

    const handleTypeChange = (typeIdStr) => {
        const tId = Number(typeIdStr);
        setSelectedTypeId(tId);
        const selectedTypeObj = typesList.find(t => Number(t.id) === tId);
        if (selectedTypeObj && selectedTypeObj.rawMaterials) {
            const newQMap = {};
            selectedTypeObj.rawMaterials.forEach(m => {
                newQMap[m.name] = materialsQtyMap[m.name] || "10";
            });
            setMaterialsQtyMap(newQMap);
        } else {
            setMaterialsQtyMap({});
        }
    };

    const handleQtyChange = (materialName, val) => {
        setMaterialsQtyMap(prev => ({
            ...prev,
            [materialName]: val
        }));
    };

    const currentTypeObj = typesList.find(t => Number(t.id) === Number(selectedTypeId));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTypeId) {
            alert("يرجى اختيار نوع المنتج أولاً من القائمة المنسدلة");
            return;
        }
        if (!sizeName.trim()) {
            alert("يرجى إدخال اسم الحجم (مثل: صغير، وسط، كبير)");
            return;
        }
        if (!currentTypeObj) {
            alert("النوع المحدد غير موجود");
            return;
        }

        const materialsQty = (currentTypeObj.rawMaterials || []).map(m => ({
            materialName: m.name,
            unit: m.unit || "جرام",
            qty: materialsQtyMap[m.name] !== undefined ? materialsQtyMap[m.name] : "0"
        }));

        onSave({
            id: editingSize ? editingSize.id : Date.now(),
            typeId: currentTypeObj.id,
            typeName: currentTypeObj.name,
            sizeName: sizeName.trim(),
            materialsQty,
            price: price || "0.00"
        });
        onClose();
    };

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-content">
                <div className="product-modal-header">
                    <div className="modal-title-group">
                        <Layers className="modal-header-icon" size={22} />
                        <h4>{editingSize ? "تعديل الحجم والكميات" : "إضافة حجم جديد لـ نوع"}</h4>
                    </div>
                    <button type="button" className="close-modal-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="product-modal-body">
                    {/* 1. اختيار نوع المنتج عن طريق دروب داون مينيو */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            1- اختيار نوع المنتج <span className="required-star">*</span>
                        </label>
                        <select
                            className="modal-select-box"
                            value={selectedTypeId}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            required
                        >
                            <option value="">-- اختر نوع من الأنواع المضافة سابقاً --</option>
                            {typesList.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. اسم الحجم */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            2- اسم الحجم <span className="required-star">*</span>
                        </label>
                        <input
                            type="text"
                            className="modal-input-text"
                            placeholder="مثال: صغير 8 أونص، وسط 12 أونص، كبير 16 أونص، سنجل..."
                            value={sizeName}
                            onChange={(e) => setSizeName(e.target.value)}
                            required
                        />
                    </div>

                    {/* السعر السريع */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            السعر لهذا الحجم (جنيه)
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            className="modal-input-text"
                            placeholder="ادخل السعر المبدئي (مثلاً: 35.00)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    {/* 3. جدول المواد الخام الخاصة بهذا النوع وتحديد الكميات */}
                    <div className="modal-field-group">
                        <label className="modal-field-label">
                            3- كميات المواد الخام لهذا الحجم
                        </label>
                        <p className="modal-field-hint">
                            الجدول التالي يعرض المواد الخام لـنوع ("{currentTypeObj ? currentTypeObj.name : 'غير محدد'}"). حدد الكمية المطلوبة لكل مادة خام حسب وحدتها:
                        </p>

                        {!currentTypeObj || !currentTypeObj.rawMaterials || currentTypeObj.rawMaterials.length === 0 ? (
                            <div className="empty-materials-msg">
                                يرجى اختيار نوع يحتوي على مواد خام أو إضافة مواد خام للنوع أولاً.
                            </div>
                        ) : (
                            <div className="modal-table-wrapper">
                                <table className="modal-inner-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "40px" }}>م</th>
                                            <th className="text-right">المادة الخام</th>
                                            <th>الوحدة</th>
                                            <th style={{ width: "160px" }}>الكمية المطلوبة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTypeObj.rawMaterials.map((m, idx) => (
                                            <tr key={m.id || idx}>
                                                <td>{idx + 1}</td>
                                                <td className="text-right font-bold">{m.name}</td>
                                                <td><span className="unit-badge">{m.unit || "وحدة"}</span></td>
                                                <td>
                                                    <div className="qty-input-group">
                                                        <input
                                                            type="text"
                                                            className="qty-table-input"
                                                            value={materialsQtyMap[m.name] ?? ""}
                                                            onChange={(e) => handleQtyChange(m.name, e.target.value)}
                                                            placeholder="0"
                                                        />
                                                        <span className="qty-unit-suffix">{m.unit}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer-actions">
                        <button type="submit" className="btn-save-modal">
                            <Check size={18} />
                            <span>حفظ الحجم</span>
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
