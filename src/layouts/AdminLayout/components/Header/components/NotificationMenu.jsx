import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { can } from "@/modules/auth/permissions/permission";
import DateTime from "@/shared/components/DateTime/DateTime";
import {
  useNotifications,
  useUnreadCount,
} from "@/modules/admin/notifications/hooks/notification.queries";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/modules/admin/notifications/hooks/notification.mutations";

const panelStyle = {
  position: "absolute",
  top: "40px",
  right: "0",
  width: "min(340px, calc(100vw - 24px))",
  maxHeight: "70vh",
  overflow: "auto",
  background: "#fff",
  border: "1px solid #eadfd3",
  borderRadius: "12px",
  boxShadow: "0 12px 32px rgba(53, 39, 31, 0.18)",
  zIndex: 60,
  direction: "rtl",
  textAlign: "right",
  padding: "8px",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "6px 8px 10px",
};

const markAllStyle = {
  minHeight: "44px",
  padding: "6px 12px",
  border: "1px solid #dfd1c4",
  borderRadius: "9px",
  background: "#f8f3ed",
  color: "#6b3f1d",
  cursor: "pointer",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 700,
};

const itemStyle = (unread) => ({
  display: "grid",
  gap: "4px",
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  paddingInlineStart: "26px",
  border: "1px solid #eee4db",
  borderRadius: "10px",
  background: unread ? "#fdf6ee" : "#fff",
  cursor: "pointer",
  font: "inherit",
  textAlign: "right",
  position: "relative",
});

const dotStyle = {
  position: "absolute",
  insetInlineStart: "10px",
  top: "16px",
  width: "9px",
  height: "9px",
  borderRadius: "50%",
  background: "#b42318",
};

function LiveNotificationMenu({ fallback }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const list = useNotifications({ page: 1, limit: 10 });
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  const count = unread.data?.unreadCount ?? Number(fallback?.unreadCount ?? 0);
  const items = list.data?.items ?? (Array.isArray(fallback?.items) ? fallback.items : []);

  const openItem = (item) => {
    if (item.unread) markRead.mutate(String(item.id));
    setOpen(false);
    if (typeof item.link === "string" && item.link.startsWith("/")) navigate(item.link);
  };

  return (
    <div className="notification-menu" ref={rootRef}>
      <button
        type="button"
        className="notification-menu__toggle"
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      >
        <Bell />
        {count > 0 && <span>{count}</span>}
      </button>

      {open && (
        <div className="notification-menu__panel" style={panelStyle} role="menu" aria-label="الإشعارات">
          <div style={panelHeaderStyle}>
            <strong style={{ fontSize: "14px" }}>الإشعارات</strong>
            <button
              type="button"
              style={markAllStyle}
              disabled={markAll.isPending || count === 0}
              onClick={() => markAll.mutate({})}
            >
              {markAll.isPending ? "جاري التنفيذ..." : "تحديد الكل كمقروء"}
            </button>
          </div>

          {list.isLoading && <p style={{ padding: "12px", fontSize: "13px" }}>جاري تحميل الإشعارات...</p>}
          {list.isError && (
            <div style={{ padding: "12px", display: "grid", gap: "8px" }}>
              <p role="alert" style={{ fontSize: "13px", color: "#b42318" }}>{list.error?.message || "تعذر تحميل الإشعارات"}</p>
              <button type="button" style={markAllStyle} onClick={() => list.refetch()}>إعادة المحاولة</button>
            </div>
          )}
          {!list.isLoading && !list.isError && items.length === 0 && (
            <p style={{ padding: "12px", fontSize: "13px" }}>لا توجد إشعارات.</p>
          )}
          {!list.isLoading && !list.isError && items.length > 0 && (
            <div style={{ display: "grid", gap: "6px" }}>
              {items.map((item) => (
                <button key={item.id} type="button" role="menuitem" style={itemStyle(item.unread)} onClick={() => openItem(item)}>
                  {item.unread && <i aria-hidden="true" style={dotStyle} />}
                  <strong style={{ fontSize: "13px" }}>{item.title || "إشعار"}</strong>
                  {item.message && <span style={{ fontSize: "12px", color: "#79695d", position: "static", width: "auto", height: "auto", background: "none", display: "block" }}>{item.message}</span>}
                  <DateTime value={item.createdAt} />
                </button>
              ))}
            </div>
          )}
          {(markRead.isError || markAll.isError) && (
            <p role="alert" style={{ fontSize: "12px", color: "#b42318", padding: "8px" }}>
              {(markRead.error || markAll.error)?.message || "تعذر تحديث حالة القراءة"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationMenu({ notifications }) {
  const permissions = useAuthStore((state) => state.permissions);

  if (!can(permissions, "notifications.read")) {
    const count = Number(notifications?.unreadCount ?? 0);
    return (
      <div className="notification-menu">
        <Bell />
        {count > 0 && <span>{count}</span>}
      </div>
    );
  }

  return <LiveNotificationMenu fallback={notifications} />;
}

export default NotificationMenu;
