import {
Bell
} from "lucide-react";



function NotificationMenu({notifications}){


const count =
notifications?.filter(
item=>!item.is_read
).length;



return (

<div className="notification-menu">


<Bell/>


{
count > 0 &&
<span>

{count}

</span>

}


</div>

)


}


export default NotificationMenu;
