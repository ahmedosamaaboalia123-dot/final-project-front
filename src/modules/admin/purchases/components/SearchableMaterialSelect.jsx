import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

function SearchableMaterialSelect({ materials, selectedMaterialId, onSelectMaterial }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedMaterial = materials.find((m) => m.id === Number(selectedMaterialId));

    // Keep input text in sync with selected material when ID changes
    useEffect(() => {
        if (selectedMaterialId) {
            const found = materials.find((m) => m.id === Number(selectedMaterialId));
            if (found) {
                setSearchTerm(found.name);
            }
        } else {
            setSearchTerm("");
        }
    }, [selectedMaterialId, materials]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset search term back to selected material name on close
                if (selectedMaterial) {
                    setSearchTerm(selectedMaterial.name);
                } else {
                    setSearchTerm("");
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedMaterial]);

    // If searchTerm matches the name of the currently selected item,
    // show ALL materials when dropdown opens so user can switch items easily.
    const isShowingSelectedName = selectedMaterial && searchTerm === selectedMaterial.name;
    const filterQuery = isShowingSelectedName ? "" : searchTerm.trim();

    const filteredMaterials = materials.filter((mat) =>
        mat.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const handleSelect = (mat) => {
        onSelectMaterial(mat.id);
        setSearchTerm(mat.name);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelectMaterial("");
        setSearchTerm("");
        setIsOpen(true);
    };

    return (
        <div className="searchable-material-container" ref={dropdownRef}>
            <div className="searchable-input-wrapper">
                <Search size={18} className="search-icon-inside" />
                <input
                    type="text"
                    className="purchases-input searchable-input"
                    placeholder="ابحث بالاسم عن مادة خام..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        if (!e.target.value) {
                            onSelectMaterial("");
                        }
                    }}
                    onFocus={(e) => {
                        setIsOpen(true);
                        e.target.select();
                    }}
                    onClick={() => setIsOpen(true)}
                />
                {searchTerm ? (
                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={handleClear}
                        title="مسح البحث"
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="toggle-dropdown-btn"
                        onClick={() => setIsOpen(!isOpen)}
                        title="عرض المواد"
                    >
                        <ChevronDown size={18} className="chevron-icon-inside" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="searchable-dropdown-menu">
                    {filteredMaterials.length === 0 ? (
                        <div className="dropdown-no-results">لا توجد مادة خام متطابقة</div>
                    ) : (
                        filteredMaterials.map((mat) => {
                            const isSelected = Number(selectedMaterialId) === mat.id;
                            return (
                                <div
                                    key={mat.id}
                                    className={`dropdown-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelect(mat)}
                                >
                                    <div className="item-info">
                                        <span className="item-name">{mat.name}</span>
                                        <span className="item-price">{mat.unitPrice} ج.م / {mat.unit}</span>
                                    </div>
                                    {isSelected && <Check size={16} className="item-check" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchableMaterialSelect;
