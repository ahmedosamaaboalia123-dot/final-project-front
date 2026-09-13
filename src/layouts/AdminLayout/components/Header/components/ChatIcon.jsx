import {
    MessageCircle
} from "lucide-react";



function ChatIcon({notifications}){


    const items = Array.isArray(notifications?.items) ? notifications.items : [];
    const count = items.filter((item) => (item.type === "CHAT" || item.category === "CHAT") && !item.isRead && !item.is_read).length;



    return (

    <div className="notification-menu chat-icon">


        <MessageCircle/>


        {
        count > 0 &&
        <span>

        {count}

        </span>
        }


    </div>

    )


}


export default ChatIcon;
