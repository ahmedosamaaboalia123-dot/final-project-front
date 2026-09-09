import {
    MessageCircle
} from "lucide-react";



function ChatIcon({notifications}){


    const count =
    notifications?.filter(
    item=>!item.is_read
    ).length;



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
