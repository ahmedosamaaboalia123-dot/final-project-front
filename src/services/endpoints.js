export const endpoints={

auth:{
login:"/auth/login",
refresh:"/auth/refresh",
me:"/auth/me",
logout:"/auth/logout",
logoutAll:"/auth/logout-all"
},

employees:{
list:"/users",
create:"/users",
byId:(employeeId)=>`/users/${employeeId}`,
pageAccess:(employeeId)=>`/users/${employeeId}/page-access`,
devices:(employeeId)=>`/employees/${employeeId}/devices`,
approveDevice:(employeeId,deviceId)=>`/employees/${employeeId}/devices/${deviceId}/approve`,
rejectDevice:(employeeId,deviceId)=>`/employees/${employeeId}/devices/${deviceId}/reject`,
blockDevice:(employeeId,deviceId)=>`/employees/${employeeId}/devices/${deviceId}/block`
},

attendance:{
checkOut:"/attendance/check-out"
},

cashDrawer:{
list:"/cash-drawer-shifts",
current:"/cash-drawer-shifts/current",
open:"/cash-drawer-shifts",
byId:(shiftId)=>`/cash-drawer-shifts/${shiftId}`,
cashIn:(shiftId)=>`/cash-drawer-shifts/${shiftId}/cash-in`,
cashOut:(shiftId)=>`/cash-drawer-shifts/${shiftId}/cash-out`,
close:(shiftId)=>`/cash-drawer-shifts/${shiftId}/close`
},

dashboard:"/dashboard",

publicProducts:{
list:"/products/public",
categories:"/products/public/categories",
top:"/products/public/top"
},

products:{
list:"/products",
categories:"/products/categories",
configuration:"/products/configuration",
configurationById:(id)=>`/products/${id}/configuration`,
byId:(id)=>`/products/${id}`
},

publicOrders:{
create:"/orders/public",
track:(code)=>`/orders/public/${code}/tracking`,
lookup:"/orders/public/lookup",
byPhone:"/orders/public/by-phone"
},

chat:{
send:"/chat"
},

tableSessions:{
open:"/table-sessions",
byTable:(tableNumber)=>`/table-sessions/${tableNumber}`,
activeOrder:(tableNumber)=>`/table-sessions/${tableNumber}/active-order`,
orders:(tableNumber)=>`/table-sessions/${tableNumber}/orders`,
serviceRequests:(tableNumber)=>`/table-sessions/${tableNumber}/service-requests`,
allServiceRequests:"/table-sessions/service-requests/all",
serviceRequestById:(requestId)=>`/table-sessions/service-requests/${requestId}`
},

adminOrders:{
list:"/orders",
byId:(id)=>`/orders/${id}`,
status:(id)=>`/orders/${id}/status`,
itemStatus:(orderId,itemId)=>`/orders/${orderId}/items/${itemId}/status`,
prep:"/orders/prep",
tableSummaries:"/orders/tables/summary",
closeTable:(tableNumber)=>`/orders/tables/${encodeURIComponent(tableNumber)}/close`,
payments:(orderId)=>`/orders/${orderId}/payments`,
handOverDelegate:(orderId)=>`/orders/${orderId}/hand-over-delegate`,
availableDelegates:"/delegates/available-options"
},

customers:{
list:"/customers",
byId:(id)=>`/customers/${id}`,
orders:(id)=>`/customers/${id}/orders`
},

inventory:{
list:"/raw-materials",
options:"/raw-materials/options",
returnOptions:"/raw-materials/return-options",
createMaterial:"/raw-materials",
byId:(id)=>`/raw-materials/${id}`,
batches:(id)=>`/raw-materials/${id}/batches`
,
batchPriority:(id)=>`/raw-materials/${id}/batches-priority`,
batch:(id,batchId)=>`/raw-materials/${id}/batches/${batchId}`,
withdrawals:"/raw-materials/withdrawals",
withdraw:(id)=>`/raw-materials/${id}/withdrawals`,
purchaseContext:(id)=>`/raw-materials/${id}/purchase-context`,
movements:"/inventory/movements"
},

warnings:"/warnings",

suppliers:{
list:"/suppliers",
options:"/suppliers/options",
byId:(id)=>`/suppliers/${id}`
,
transactions:(id)=>`/suppliers/${id}/transactions`,
createTransaction:(id)=>`/suppliers/${id}/transactions`
},

purchases:{
list:"/purchases",
groups:"/purchases/groups",
groupById:(id)=>`/purchases/groups/${id}`,
createGrouped:"/purchases/grouped",
byId:(id)=>`/purchases/${id}`,
create:"/purchases",
update:(id)=>`/purchases/${id}`,
preview:(id)=>`/purchases/${id}/preview`,
approve:(id)=>`/purchases/${id}/approve`,
receiveItem:(id,itemId)=>`/purchases/${id}/items/${itemId}/receive`,
cancel:(id)=>`/purchases/${id}/cancel`,
remove:(id)=>`/purchases/${id}`,
returnContext:(id)=>`/purchases/${id}/return-context`,
returns:(id)=>`/purchases/${id}/returns`,
createReturn:(id)=>`/purchases/${id}/returns`
},

rawMaterialReturns:{
list:"/returns",
byId:(id)=>`/returns/${id}`,
create:"/returns"
}


};
