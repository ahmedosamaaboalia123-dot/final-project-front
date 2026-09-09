import { useAuthStore } from "@/store/authStore";
import { PanelRightClose, PanelRightOpen } from "lucide-react";


import UserMenu from "./components/UserMenu";
import NotificationMenu from "./components/NotificationMenu";
import ChatIcon from "./components/ChatIcon";
import ShiftCard from "./components/ShiftCard";
import DateCard from "./components/DateCard";
import SearchInput from "./components/SearchInput";
import MenuButton from "./components/MenuButton";


import "./Header.css";



function Header({ onMenuToggle, isMobileSidebarOpen, onDesktopSidebarToggle, isDesktopSidebarOpen }){


    const notifications = useAuthStore(
        state => state.notifications
    );


    const shift = useAuthStore(
        state => state.shift
    );



    return (


        <header className="header">


            {/* Left Section */}

            <div className="header__left">


                <ChatIcon
                    notifications={notifications}
                />


                <NotificationMenu

                    notifications={notifications}

                />



                <UserMenu/>


            </div>





            {/* Center Section */}

            <div className="header__center">


                <ShiftCard
                    shift={shift}
                />


                <DateCard/>

            </div>





            {/* Right Section */}

            <div className="header__right">

                <MenuButton onClick={onMenuToggle} isOpen={isMobileSidebarOpen}/>

                <button
                    type="button"
                    className="desktop-sidebar-toggle"
                    onClick={onDesktopSidebarToggle}
                    aria-label={isDesktopSidebarOpen ? "تصغير القائمة الجانبية" : "توسيع القائمة الجانبية"}
                    title={isDesktopSidebarOpen ? "تصغير القائمة" : "توسيع القائمة"}
                >
                    {isDesktopSidebarOpen ? <PanelRightClose/> : <PanelRightOpen/>}
                </button>


                <SearchInput/>


            </div>



        </header>


    );


}


export default Header;
