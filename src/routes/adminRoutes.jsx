import { lazy } from "react";
import { Navigate } from "react-router-dom";


import ProtectedRoute from "@/routes/ProtectedRoute";

const LayoutAdmin = lazy(() => import("@/layouts/AdminLayout/LayoutAdmin"));


const DashboardPage = lazy(() => import("@/modules/admin/dashboard/pages/DashboardPage"));
const ProductsPage = lazy(() => import("@/modules/admin/products/pages/ProductsPage"));
const InventoryPage = lazy(() => import("@/modules/admin/inventory/pages/InventoryPage"));
const MaterialDetailsPage = lazy(() => import("@/modules/admin/inventory/pages/MaterialDetailsPage"));
const PurchasesPage = lazy(() => import("@/modules/admin/purchases/pages/PurchasesPage"));
const EmployeesPage = lazy(() => import("@/modules/admin/employees/pages/EmployeesPage"));
const EmployeeDetailsPage = lazy(() => import("@/modules/admin/employees/pages/EmployeeDetailsPage"));
const SuppliersPage = lazy(() => import("@/modules/admin/suppliers/pages/SuppliersPage"));
const SupplierDetailsPage = lazy(() => import("@/modules/admin/suppliers/pages/SupplierDetailsPage"));
const WarningsPage = lazy(() => import("@/modules/admin/warnings/pages/WarningsPage"));
const ReturnsPage = lazy(() => import("@/modules/admin/returns/pages/ReturnsPage"));
const DrawerPage = lazy(() => import("@/modules/admin/drawer/pages/DrawerPage"));
const FinancialReportsPage = lazy(() => import("@/modules/admin/financial-reports/pages/FinancialReportsPage"));
const OrdersHomePage = lazy(() => import("@/modules/admin/orders/pages/OrdersHomePage"));
const OnlineScreen = lazy(() => import("@/modules/admin/orders/pages/OnlineScreen"));
const IncomingOnlineOrdersPage = lazy(() => import("@/modules/admin/orders/pages/IncomingOnlineOrdersPage"));
const TakeawayScreen = lazy(() => import("@/modules/admin/orders/pages/TakeawayScreen"));
const TablesScreen = lazy(() => import("@/modules/admin/orders/pages/TablesScreen"));
const OrderSalesPage = lazy(() => import("@/modules/admin/orders/pages/SalesPage"));
const BusyCardPage = lazy(() => import("@/modules/admin/orders/pages/BusyCardPage"));
const PreparationPage = lazy(() => import("@/modules/admin/orders/pages/PreparationPage"));
const OrderDetailsPage = lazy(() => import("@/modules/admin/orders/pages/OrderDetailsPage"));
const OrderHistoryPage = lazy(() => import("@/modules/admin/orders/pages/OrderHistoryPage"));
const TableServicesPage = lazy(() => import("@/modules/admin/orders/pages/TableServicesPage"));
const TableSummaryPage = lazy(() => import("@/modules/admin/orders/pages/TableSummaryPage"));
const TableOrderTrackPage = lazy(() => import("@/modules/admin/orders/pages/TableOrderTrackPage"));
const CustomersPage = lazy(() => import("@/modules/admin/customers/pages/CustomersPage"));
const CustomerDetailsPage = lazy(() => import("@/modules/admin/customers/pages/CustomerDetailsPage"));
const DelegatesPage = lazy(() => import("@/modules/admin/delegates/pages/DelegatesPage"));
const DelegateDetailsPage = lazy(() => import("@/modules/admin/delegates/pages/DelegateDetailsPage"));

const permitted = (pageKey, element) => <ProtectedRoute pageKey={pageKey}>{element}</ProtectedRoute>;



const adminRoutes = {


    path:"/admin",


    element:<ProtectedRoute><LayoutAdmin/></ProtectedRoute>,


    children:[


        {

            index:true,

            element:<Navigate to="/admin/dashboard" replace/>

        },
        {

            path:"dashboard",

            element:permitted("dashboard", <DashboardPage/> )

        },



        {

            path:"products",

            element:permitted("products", <ProductsPage/> )

        },


        {

            path:"inventory",

            element:permitted("inventory", <InventoryPage/> )

        },


        {

            path:"inventory/:id",

            element:permitted("inventory", <MaterialDetailsPage/> )

        },


        {

            path:"warnings",

            element:permitted("warnings", <WarningsPage/> )

        },


        {

            path:"invoices",

            element:permitted("purchases", <PurchasesPage/> )

        },


        {

            path:"purchases",

            element:permitted("purchases", <PurchasesPage/> )

        },


        {

            path:"employees",

            element:permitted("employees", <EmployeesPage/> )

        },


        {

            path:"employees/:id",

            element:permitted("employees", <EmployeeDetailsPage/> )

        },


        {

            path:"suppliers",

            element:permitted("suppliers", <SuppliersPage/> )

        },


        {

            path:"suppliers/:id",

            element:permitted("suppliers", <SupplierDetailsPage/> )

        },


        {

            path:"returns",

            element:permitted("returns", <ReturnsPage/> )

        },


        {

            path:"drawer",

            element:permitted("drawer", <DrawerPage/> )

        },
        { path:"financial-reports", element:permitted("financial_reports", <FinancialReportsPage/> ) },
        {
            path:"delegates",
            children: [
                { index: true, element: permitted("delegates", <DelegatesPage/>) },
                { path: ":id", element: permitted("delegates", <DelegateDetailsPage/>) },
            ]
        },


        {

            path:"orders",

            children: [

                { index: true, element: <OrdersHomePage /> },

                { path: "online", element: permitted("orders_online", <OnlineScreen />) },

                { path: "incoming", element: permitted("orders_online", <IncomingOnlineOrdersPage />) },

                { path: "takeaway", element: permitted("orders_online", <TakeawayScreen />) },

                { path: "tables", element: permitted("orders_tables", <TablesScreen />) },

                { path: "tables/:tableNumber", element: permitted("orders_tables", <TableSummaryPage />) },

                { path: "tables/:tableNumber/order/:orderId/track", element: permitted("orders_tables", <TableOrderTrackPage />) },

                { path: "sales/:type/:id", element: <OrderSalesPage /> },

                { path: "busy/:type/:id", element: <BusyCardPage /> },

                { path: "preparation", element: permitted("orders_preparation", <PreparationPage />) },

                { path: "preparation/:orderId", element: permitted("orders_preparation", <OrderDetailsPage />) },

                { path: "history", element: permitted("orders_history", <OrderHistoryPage />) },

                { path: "table-services", element: permitted("orders_table_services", <TableServicesPage />) },

            ]

        },


        {

            path:"customers",

            children: [

                { index: true, element: permitted("customers", <CustomersPage />) },

                { path: ":id", element: permitted("customers", <CustomerDetailsPage />) },

            ]

        }


    ]


};


export default adminRoutes;
