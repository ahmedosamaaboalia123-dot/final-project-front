import {create} from "zustand";


export const useAuthStore=create((set)=>({


    employee:null,


    role:null,


    permissions:[],


    notifications:[],


    shift:null,

    isAuthChecking:Boolean(localStorage.getItem("access_token")),


    setAuth:(data)=>set({


        employee:data.employee,


        role:data.role,


        permissions:data.permissions,


        notifications:data.notifications,


        shift:data.shift ?? data.employee?.shift ?? null


    }),
    setAuthChecking:(value)=>set({isAuthChecking:value})
    ,
    clearAuth:()=>set({
        employee:null,
        role:null,
        permissions:[],
        notifications:[],
        shift:null
    })


}));
