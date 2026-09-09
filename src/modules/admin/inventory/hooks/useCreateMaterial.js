import {useMutation,useQueryClient} from "@tanstack/react-query";


import {


    createMaterial


}
from "../services/inventoryService";


function useCreateMaterial(){

    const queryClient=useQueryClient();


    return useMutation({


        mutationFn:createMaterial,


        onSuccess(){
            queryClient.invalidateQueries({queryKey:["raw-materials"]});
        },


        onError(error){


            console.log(error);


        }


    });


}


export default useCreateMaterial;
