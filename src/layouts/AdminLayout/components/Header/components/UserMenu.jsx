import {useAuthStore} from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { appConfig } from "@/app/config";
import { authService } from "@/modules/auth/services/authService";
import { disconnectAdminSocket } from "@/services/realtime";
import { useCheckOut } from "@/modules/auth/hooks/useCheckOut";


import {
Clock3,
LogOut
} from "lucide-react";


function UserMenu(){

const navigate = useNavigate();
const clearAuth = useAuthStore(state => state.clearAuth);
const checkOut = useCheckOut();
const checkOutTime = checkOut.data?.checkOutAt
    ? new Date(checkOut.data.checkOutAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
    })
    : null;

const registerCheckOut = () => {
    if (checkOut.isPending) return;
    if (!window.confirm("هل تريد تسجيل الانصراف الآن؟")) return;
    checkOut.mutate();
};

const logout = async () => {
    const refreshToken = localStorage.getItem(appConfig.refreshTokenKey);
    try { if (refreshToken) await authService.logout(refreshToken); } catch { /* Local logout must always finish. */ }
    localStorage.removeItem(appConfig.tokenKey);
    localStorage.removeItem(appConfig.refreshTokenKey);
    localStorage.removeItem("auth_session");
    clearAuth();
    disconnectAdminSocket();
    navigate("/login", { replace: true });
};


const employee = useAuthStore(
    state => state.employee
);


const role = useAuthStore(
    state => state.role
);


return (

<div className="user-menu">


<div>


<h4>
{employee?.name}
</h4>


<span>
{role?.display_name}
</span>


</div>



<div className="user-menu__actions">
    <button type="button" className="user-menu__checkout" onClick={registerCheckOut} disabled={checkOut.isPending} aria-label="تسجيل الانصراف" title="تسجيل الانصراف">
        <Clock3 size={15}/>
        <span>{checkOut.isPending ? "جاري التسجيل..." : "تسجيل الانصراف"}</span>
    </button>
    <button type="button" className="user-menu__logout" onClick={logout} aria-label="تسجيل الخروج" title="تسجيل الخروج">
        <LogOut size={15}/>
        <span>تسجيل الخروج</span>
    </button>
</div>
{checkOut.isSuccess && <span className="user-menu__attendance-message" role="status">تم تسجيل الانصراف{checkOutTime ? ` الساعة ${checkOutTime}` : ""}</span>}
{checkOut.isError && <span className="user-menu__attendance-message is-error" role="alert">{checkOut.error?.response?.data?.message || "تعذر تسجيل الانصراف"}</span>}


</div>

)


}


export default UserMenu;
