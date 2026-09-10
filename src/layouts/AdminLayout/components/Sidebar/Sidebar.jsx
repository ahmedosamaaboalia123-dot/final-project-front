import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import SidebarItem from "./SidebarItem";

const adminNavigation = [
    ["dashboard", "الرئيسية", "/dashboard"],
    ["suppliers", "الموردين", "/suppliers"],
    ["inventory", "المخزون", "/inventory"],
    ["warnings", "التنبيهات", "/warnings"],
    ["purchases", "المشتريات", "/purchases"],
    ["returns", "المرتجعات", "/returns"],
    ["products", "المنتجات", "/products"],
    ["orders_online", "الطلبات الأونلاين", "/orders/online"],
    ["orders_tables", "الطاولات", "/orders/tables"],
    ["orders_table_services", "خدمات الطاولات", "/orders/table-services"],
    ["orders_history", "سجل الطلبات", "/orders/history"],
    ["orders_preparation", "التحضير", "/orders/preparation"],
    ["customers", "العملاء", "/customers"],
    ["delegates", "المناديب", "/delegates"],
    ["drawer", "الخزنة", "/drawer"],
    ["financial_reports", "التقارير المالية", "/financial-reports"],
    ["employees", "الموظفين", "/employees"],
].map(([page_key, page_name, path]) => ({ page_key, page_name, path }));

import logo from "@/assets/images/404_logo-640.webp";

import "./Sidebar.css";


function Sidebar({ isDesktopOpen = true, isMobileOpen = false, onMobileClose }){


    const permissions = adminNavigation;

    const location = useLocation();

    const orderedPermissions = useMemo(() => {
        const flat = permissions.flatMap((entry) => entry.items || [entry]);
        const byKey = new Map(flat.map((entry) => [entry.page_key, entry]));
        const result = ["dashboard", "suppliers", "inventory", "warnings", "purchases", "returns", "products"]
            .map((key) => byKey.get(key)).filter(Boolean);
        const orderItems = ["orders_online", "orders_tables", "orders_table_services", "orders_history", "orders_preparation"]
            .map((key) => byKey.get(key)).filter(Boolean);
        if (orderItems.length) result.push({ section: "الطلبات", items: orderItems });
        result.push(...["customers", "delegates", "drawer", "financial_reports", "employees"].map((key) => byKey.get(key)).filter(Boolean));
        return result;
    }, [permissions]);

    useEffect(() => {
        onMobileClose?.();
    }, [location.pathname]);



    return (

        <aside className={`sidebar ${isDesktopOpen ? "" : "sidebar--collapsed"} ${isMobileOpen ? "sidebar--mobile-open" : ""}`} aria-label="القائمة الرئيسية">


            <div className="sidebar__logo">

                <img
                    className="sidebar__logo__img"
                    src={logo}
                    alt="404"
                />

            </div>


            <nav className="sidebar__menu">

                {
                    orderedPermissions.map((item) => {
                        if (item.section && item.items) {
                            return (
                                <div key={item.section} className="sidebar-section">
                                    <div className="sidebar-section__title">{item.section}</div>
                                    <div className="sidebar-section__items">
                                        {item.items.map((subItem) => (
                                            <SidebarItem key={subItem.page_key} item={subItem} />
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return <SidebarItem key={item.page_key} item={item} />;
                    })
                }


            </nav>


        </aside>

    );


}


export default Sidebar;

