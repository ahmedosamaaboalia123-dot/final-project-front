import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
const TableLayout = lazy(() => import("@/layouts/TableLayout"));
const TableMainPage = lazy(() => import("@/modules/table/main-page/pages/TableMainPage"));
const TableMenuPage = lazy(() => import("@/modules/table/menu/pages/TableMenuPage"));
const TableOrdersPage = lazy(() => import("@/modules/table/orders/pages/TableOrdersPage"));
const TableOrderTrackingPage = lazy(() => import("@/modules/table/orders/pages/TableOrderTrackingPage"));
const TableChatbotPage = lazy(() => import("@/modules/table/chatbot/pages/TableChatbotPage"));
const ProductDetailsPage = lazy(() => import("@/modules/customer/product-details/pages/ProductDetailsPage"));
const TableFeedbackPage = lazy(() => import("@/modules/table/feedback/pages/TableFeedbackPage"));
const TableWaiterServicesPage = lazy(() => import("@/modules/table/pages/TableWaiterServicesPage"));

export const tableRoutes = {
  path: "table",
  element: <TableLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="/table/4" replace />,
    },
    {
      path: "menu",
      element: <Navigate to="/table/4/menu" replace />,
    },
    {
      path: "orders",
      element: <Navigate to="/table/4/orders" replace />,
    },
    {
      path: "chatbot",
      element: <Navigate to="/table/4/chatbot" replace />,
    },
    {
      path: ":tableId",
      children: [
        {
          index: true,
          element: <TableMainPage />,
        },
        {
          path: "menu",
          element: <TableMenuPage />,
        },
        {
          path: "menu/product/:id",
          element: <ProductDetailsPage />,
        },
        {
          path: "orders",
          children: [
            {
              index: true,
              element: <TableOrdersPage />,
            },
            {
              path: ":orderId/track",
              element: <TableOrderTrackingPage />,
            },
          ],
        },
        {
          path: "chatbot",
          element: <TableChatbotPage />,
        },
        { path: "feedback", element: <TableFeedbackPage /> },
        { path: "services", element: <TableWaiterServicesPage /> },
      ],
    },
  ],
};
