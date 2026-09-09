import apiClient

from "@/services/apiClient";


import {

endpoints

}

from "@/services/endpoints";





export function createMaterial(data){



return apiClient.post(


endpoints.inventory.createMaterial,


data


);



}

export function getMaterials({page=1,pageSize=10,search=""}={}){
return apiClient.get(endpoints.inventory.list,{params:{page,pageSize,search}});
}
export function getMaterialOptions(){
return apiClient.get(endpoints.inventory.options);
}
export function getReturnableMaterialOptions(){
return apiClient.get(endpoints.inventory.returnOptions);
}
export const getMaterial=(id)=>apiClient.get(endpoints.inventory.byId(id));

export function updateMaterial(id,data){
return apiClient.put(endpoints.inventory.byId(id),data);
}

export function deleteMaterial(id){
return apiClient.delete(endpoints.inventory.byId(id));
}

export function getMaterialBatches(id){
return apiClient.get(endpoints.inventory.batches(id));
}

export function addMaterialBatch(id,data){
return apiClient.post(endpoints.inventory.batches(id),data);
}

export const updateMaterialBatch=(id,batchId,data)=>apiClient.put(endpoints.inventory.batch(id,batchId),data);
export const deleteMaterialBatch=(id,batchId)=>apiClient.delete(endpoints.inventory.batch(id,batchId));
export const reorderMaterialBatches=(id,batches)=>apiClient.put(endpoints.inventory.batchPriority(id),{batches});
export const withdrawMaterial=(id,data)=>apiClient.post(endpoints.inventory.withdraw(id),data);
export const getWithdrawals=({page=1,pageSize=10}={})=>apiClient.get(endpoints.inventory.withdrawals,{params:{page,pageSize}});
