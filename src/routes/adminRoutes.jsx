import { lazy } from "react";
import { Navigate } from "react-router-dom";




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





const adminRoutes = {


    path:"/admin",


    element:<LayoutAdmin/>,


    children:[


        {

            index:true,

            element:<Navigate to="/admin/dashboard" replace/>

        },
        {

            path:"dashboard",

            element:<DashboardPage/>

        },



        {

            path:"products",

            element:<ProductsPage/>

        },


        {

            path:"inventory",

            element:<InventoryPage/>

        },


        {

            path:"inventory/:id",

            element:<MaterialDetailsPage/>

        },


        {

            path:"warnings",

            element:<WarningsPage/>

        },


        {

            path:"invoices",

            element:<PurchasesPage/>

        },


        {

            path:"purchases",

            element:<PurchasesPage/>

        },


        {

            path:"employees",

            element:<EmployeesPage/>

        },


        {

            path:"employees/:id",

            element:<EmployeeDetailsPage/>

        },


        {

            path:"suppliers",

            element:<SuppliersPage/>

        },


        {

            path:"suppliers/:id",

            element:<SupplierDetailsPage/>

        },


        {

            path:"returns",

            element:<ReturnsPage/>

        },


        {

            path:"drawer",

            element:<DrawerPage/>

        },
        { path:"financial-reports", element:<FinancialReportsPage/> },
        {
            path:"delegates",
            children: [
                { index: true, element: <DelegatesPage/> },
                { path: ":id", element: <DelegateDetailsPage/> },
            ]
        },


        {

            path:"orders",

            children: [

                { index: true, element: <OrdersHomePage /> },

                { path: "online", element: <OnlineScreen /> },

                { path: "incoming", element: <IncomingOnlineOrdersPage /> },

                { path: "takeaway", element: <TakeawayScreen /> },

                { path: "tables", element: <TablesScreen /> },

                { path: "tables/:tableNumber", element: <TableSummaryPage /> },

                { path: "tables/:tableNumber/order/:orderId/track", element: <TableOrderTrackPage /> },

                { path: "sales/:type/:id", element: <OrderSalesPage /> },

                { path: "busy/:type/:id", element: <BusyCardPage /> },

                { path: "preparation", element: <PreparationPage /> },

                { path: "preparation/:orderId", element: <OrderDetailsPage /> },

                { path: "history", element: <OrderHistoryPage /> },

                { path: "table-services", element: <TableServicesPage /> },

            ]

        },


        {

            path:"customers",

            children: [

                { index: true, element: <CustomersPage /> },

                { path: ":id", element: <CustomerDetailsPage /> },

            ]

        }


    ]


};


export default adminRoutes;


