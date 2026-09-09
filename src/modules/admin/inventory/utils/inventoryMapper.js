export function mapMaterialPayload(form){


    const payload={


        name:form.name.trim(),


        quantity:Number(form.quantity),


        pricePerUnit:Number(form.price),


        unit:form.unit,


        minStockAlert:Number(form.minAlert),


        supplierId:Number(form.supplierId),


        expiryAlertDays:Number(form.expiryAlertLimit) || null,


        expiryDate:form.expiryDate || null,


        addedAt:form.consumptionDate || new Date().toISOString()


    };


    if(form.expiryType==="date" && form.expiryDate){


        payload.expiryDate = form.expiryDate;


    }


    if(form.expiryType==="duration" && form.expiryDuration){


        payload.expiryAlertDays = Number(form.expiryDuration);


    }


    return payload;


}
