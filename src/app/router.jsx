import { 
    createBrowserRouter,
    Navigate
} from "react-router-dom";

import adminRoutes from "@/routes/adminRoutes";
import { customerRoutes } from "@/routes/customerRoutes";
import { tableRoutes } from "@/routes/tableRoutes";
import { authRoutes } from "@/routes/authRoutes";

const router = createBrowserRouter([
    customerRoutes,
    tableRoutes,
    authRoutes,
    adminRoutes,
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

export default router;
