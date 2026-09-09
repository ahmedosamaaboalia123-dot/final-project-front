import { NavLink } from "react-router-dom";


import {
    Package,
    ShoppingCart,
    LayoutDashboard,
    AlertTriangle,
    Settings,
    Warehouse,
    FileText,
    BarChart3,
    User,
    Truck,
    RotateCcw,
    Wallet,
    ClipboardList,
    Monitor,
    LayoutGrid,
    History,
    ChefHat,
    UserPlus,
    Bell
} from "lucide-react";

const iconMap = {
    dashboard: LayoutDashboard,
    sales: ShoppingCart,
    products: Package,
    inventory: Warehouse,
    invoices: FileText,
    reports: BarChart3,
    employees: User,
    suppliers: Truck,
    delegates: Truck,
    settings: Settings,
    warnings: AlertTriangle,
    returns: RotateCcw,
    drawer: Wallet,
    orders: ClipboardList,
    orders_online: Monitor,
    orders_tables: LayoutGrid,
    orders_history: History,
    orders_preparation: ChefHat,
    orders_table_services: Bell,
    customers: UserPlus
    ,financial_reports: BarChart3
};





function SidebarItem({item}){


    const Icon =

    iconMap[item.page_key]
    ||
    Package;




    return (


        <NavLink


            to={

                item.path.startsWith("/admin")

                ?

                item.path

                :

                "/admin" + item.path

            }


            className={({isActive}) =>


                isActive

                ?

                "sidebar-item active"

                :

                "sidebar-item"


            }



        >


            <Icon

                className="sidebar-item__icon"

            />



            <span className="sidebar-item__text">


                {item.page_name}


            </span>



        </NavLink>


    );


}


export default SidebarItem;
