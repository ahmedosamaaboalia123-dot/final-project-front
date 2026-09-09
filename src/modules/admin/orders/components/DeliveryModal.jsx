import { useState } from "react";
import { X, Search, UserPlus, Truck, User } from "lucide-react";
import { MOCK_CUSTOMERS } from "@/modules/admin/customers/data/mockCustomers";

function DeliveryModal({ isOpen, order, orderType, onClose, onDeliver }) {
    const [deliveryType, setDeliveryType] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    if (!isOpen) return null;

    const isTable = orderType === "tables";

    const filteredCustomers = MOCK_CUSTOMERS.filter(
        (c) =>
            c.name.includes(searchQuery) ||
            c.phone.includes(searchQuery)
    );

    const handleConfirm = () => {
        onDeliver({ order, deliveryType, customer: selectedCustomer });
        onClose();
        setDeliveryType(null);
        setSelectedCustomer(null);
        setSearchQuery("");
    };

    const handleClose = () => {
        onClose();
        setDeliveryType(null);
        setSelectedCustomer(null);
        setSearchQuery("");
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>تسليم الطلب</h3>
                        <span className="modal-order-number">{order?.orderNumber}</span>
                    </div>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="delivery-type-section">
                        <label>اختر نوع التسليم:</label>
                        <div className="delivery-type-buttons">
                            {!isTable && (
                                <button
                                    className={`delivery-type-btn ${deliveryType === "rep" ? "active" : ""}`}
                                    onClick={() => setDeliveryType("rep")}
                                >
                                    <Truck size={24} />
                                    <span>لمندوب</span>
                                </button>
                            )}
                            <button
                                className={`delivery-type-btn ${deliveryType === "customer" ? "active" : ""}`}
                                onClick={() => setDeliveryType("customer")}
                            >
                                <User size={24} />
                                <span>{isTable ? "لصاحب الطربيزة" : "لعميل"}</span>
                            </button>
                        </div>
                    </div>

                    {deliveryType === "customer" && !isTable && (
                        <div className="customer-selection-section">
                            <label>اختر العميل من البيانات المسجلة:</label>
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو الرقم..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="customers-list">
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={`customer-item ${selectedCustomer?.id === customer.id ? "selected" : ""}`}
                                        onClick={() => setSelectedCustomer(customer)}
                                    >
                                        <div className="customer-radio">
                                            {selectedCustomer?.id === customer.id && <div className="radio-dot" />}
                                        </div>
                                        <div className="customer-info">
                                            <span className="customer-name">{customer.name}</span>
                                            <span className="customer-phone">{customer.phone}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-create-customer">
                                <UserPlus size={16} />
                                إنشاء عميل جديد
                            </button>
                        </div>
                    )}

                    {deliveryType === "customer" && isTable && (
                        <div className="table-delivery-info">
                            <div className="info-box">
                                <User size={20} />
                                <span>سيتم تسليم الطلب لصاحب الطربيزة مباشرة</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={handleClose}>إلغاء</button>
                    <button
                        className="btn-confirm"
                        onClick={handleConfirm}
                        disabled={!deliveryType}
                    >
                        تسليم نهائي
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeliveryModal;
