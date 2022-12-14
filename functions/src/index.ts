import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();//admin.initializeApp(functions.config().firebase);

//for initializing values for price details and adding permission
export const onUserCreated = functions.database
.ref('/Users/{uId}')
.onCreate( (snapshot,context) => {
    const uId = context.params.uId
    const zeroVal = {
        "amountDiscounted" :0,
        "amountOriginal": 0,
        "count": 0
    }
    return snapshot.ref.parent.parent.child('PriceDetails').child(uId).set(zeroVal).then(()=>{
        return snapshot.ref.parent.parent.child('Permissions').child(uId).set(true);
    })

    
})


//for discounted price create
export const onCartAdd = functions.database
.ref('/Cart/{uId}/{bId}')
.onCreate( (snapshot,context) => {
    const uId = context.params.uId

    const amtRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountDiscounted')

    return amtRef.transaction(currentTotal=>{


        const totalDiscountPrice = snapshot.child('discountedPrice').val() * snapshot.child('quantity').val()

        return currentTotal + totalDiscountPrice

    }).then(()=>{
        
    const originalRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountOriginal')
    return originalRef.transaction(OriginalTotal=>{

        const totalOriginalPrice = snapshot.child('originalPrice').val() * snapshot.child('quantity').val()

        return OriginalTotal + totalOriginalPrice
    })
    }).then(()=>{

        const countRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('count')
    
        return countRef.transaction(currentTotal=>{
       
        return currentTotal + (1 * snapshot.child('quantity').val() )
    })
    }).then(()=>{

        return admin.database().ref("CartIndex").child(snapshot.child("type").val())
        .child(context.params.bId).child(context.params.uId).child("present").set(true)

    })
})



//for discounted price delete
export const onCartRemove = functions.database
.ref('/Cart/{uId}/{bId}')
.onDelete( (snapshot,context) => {
    const uId = context.params.uId
   
    const amtRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountDiscounted')
    return amtRef.transaction(currentTotal=>{

        const totalDiscountPrice = snapshot.child('discountedPrice').val()* snapshot.child('quantity').val()

        return currentTotal - totalDiscountPrice

    }).then(()=>{

        const originalRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountOriginal')
        return originalRef.transaction(OriginalTotal=>{
    
            const totalOriginalPrice = snapshot.child('originalPrice').val() * snapshot.child('quantity').val()
    
            return OriginalTotal - totalOriginalPrice
        })
    }).then(()=>{

        const countRef = snapshot.ref.parent.parent.parent.child('PriceDetails').child(uId).child('count')
        return countRef.transaction(currentTotal=>{
    
            return currentTotal - (1 * snapshot.child('quantity').val() )
        })
    }).then(()=>{

        return admin.database().ref("CartIndex").child(snapshot.child('type').val())
        .child(context.params.bId).child(context.params.uId).remove()

    })

})



//for discounted price update
export const onCartUpdateForDiscountedAmount = functions.database
.ref('/Cart/{uId}/{bId}')
.onUpdate( (change,context) => {
    const uId = context.params.uId

        if(  change.after.child('discountedPrice').val() !== change.before.child('discountedPrice').val() ){

            const amtRef = change.before.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountDiscounted')
        return amtRef.transaction(currentTotal=>{

            //calculation of new entered total for a book
            const newItemDiscountedPrice = change.after.child('discountedPrice').val()

            //calculation of old entered total for a book
            const oldItemDiscountedPrice = change.before.child('discountedPrice').val()

            //calculation for change to make
            const totalChangeInPrice = (newItemDiscountedPrice - oldItemDiscountedPrice) * change.before.child('quantity').val()

            return currentTotal + totalChangeInPrice
        })
        }

        return null

})

//for  price quantity update
export const onCartUpdateForQuantity = functions.database
.ref('/Cart/{uId}/{bId}')
.onUpdate( (change,context) => {
    const uId = context.params.uId

        if(  change.after.child('quantity').val() !== change.before.child('quantity').val() ){

            const amtRef = change.before.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountDiscounted')
        return amtRef.transaction(currentTotal=>{

            const itemDiscountedPrice = change.before.child('discountedPrice').val()

            //calculation for change to make
            const totalChangeInPrice = ( itemDiscountedPrice*change.after.child('quantity').val() )

                            - (itemDiscountedPrice * change.before.child('quantity').val() )

            return currentTotal + totalChangeInPrice
        }).then(()=>{

            const amtRef2 = change.before.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountOriginal')
        return amtRef2.transaction(currentTotal=>{

            const itemOriginalPrice = change.before.child('originalPrice').val()

            //calculation for change to make
            const totalChangeInPrice = ( itemOriginalPrice*change.after.child('quantity').val() )

                            - (itemOriginalPrice * change.before.child('quantity').val() )

            return currentTotal + totalChangeInPrice
        })
        }).then(()=>{

            const amtRef3 = change.before.ref.parent.parent.parent.child('PriceDetails').child(uId).child('count')
        return amtRef3.transaction(currentTotal=>{

            //calculation for change to make
            const totalChangeInCount = change.after.child('quantity').val() - change.before.child('quantity').val()

            return currentTotal + totalChangeInCount
        })
        })
        }

        return null

})

export const onCartReqUpdateForQuantity = functions.database
.ref('/CartReq/{uId}/{bId}')
.onUpdate( (change,context) => {
    const uId = context.params.uId
    const bId = context.params.bId

        console.log('before if 4')

        if(  change.after.child('quantity').val() !== change.before.child('quantity').val() ){

            console.log('after if 2')

            return change.after.ref.parent.parent.parent
            .child("Cart").child(uId).child(bId).update({"quantity": change.after.child('quantity').val()})

        }

        return null

})

    //on original price update
    export const onCartUpdateForOriginalAmount= functions.database
.ref('/Cart/{uId}/{bId}')
.onUpdate( (change,context) => {
    const uId = context.params.uId

        if( change.after.child('originalPrice').val() === change.before.child('originalPrice').val() ){

            console.log('OriginalPrice in cart is not changed for user -'+uId)
            return null
        }
        
        const amtRef = change.before.ref.parent.parent.parent.child('PriceDetails').child(uId).child('amountOriginal')
        return amtRef.transaction(currentTotal=>{

            //calculation of new 
            const newOriginalPrice = change.after.child('originalPrice').val()

            //calculation of old 
            const oldOriginalPrice = change.before.child('originalPrice').val()
                
            //calculation for change to make
            const totalChangeInPrice = (newOriginalPrice - oldOriginalPrice) * change.before.child('quantity').val()

            return currentTotal + totalChangeInPrice
        })

})

//for cart request
export const onCartRequestAdd = functions.database
.ref('/CartReq/{uId}/{bId}')
.onCreate( (snapshot,context) => {
    const uId = context.params.uId

    // if(String(type)==="books"){
    //     console.log('type found books')
    // }

    // if(String(type)!=="books"){
    //     console.log('type is not books')
    // }

    const itemLocation = snapshot.child('itemLocation').val()
    const itemId = snapshot.child('itemId').val()
    const type = snapshot.child('type').val()
   // const userTimeAdded = snapshot.child('timeAdded').val()

    const getLocationPromise = admin.database().ref(itemLocation).child(itemId).once('value');

    return getLocationPromise.then(results => {

        //check for null result to prevent fake call and inconsistancy of the pricedetails
        let itemData
        if(String(type)==="books"){
                 itemData = {
                     "img" : results.child("img").val(),
                    "name" : results.child("name").val(),
                    "publication" : results.child("publication").val(),
                   "discount" : results.child('discount').val(),
                    "discountedPrice" : results.child('discountedPrice').val(),
                    "quantity" : 1,
                    "itemId" : itemId,
                    "originalPrice" : results.child('originalPrice').val(),
                    "itemLocation" : itemLocation,
                    "timeAdded" : admin.database.ServerValue.TIMESTAMP,
                    "type" : "books",
                  //  "userTimeAdded" : userTimeAdded
                }
        }
        else if(String(type)==="stationary"){
            itemData = {
                "img" : results.child("img").val(),
                "name" : results.child("name").val(),
                "atr1" : results.child("atr1").val(),
                "atr2" : results.child("atr2").val(),
                "atr3" : results.child("atr3").val(),
                "quantity" : snapshot.child("quantity").val(),
                "atr4" : results.child("atr4").val(),
               "discount" : results.child('discount').val(),
                "discountedPrice" : results.child('discountedPrice').val(),
                "itemId" : itemId,
                "originalPrice" : results.child('originalPrice').val(),
                "itemLocation" : itemLocation,
                "timeAdded" : admin.database.ServerValue.TIMESTAMP,
                "type" : "stationary",
               // "userTimeAdded" : userTimeAdded
            }
        }
            
        return  snapshot.ref.parent.parent.parent.child('Cart').child(uId).child(itemId).set(itemData)

    }).then(()=>{
        return admin.database().ref("CartIndex").child(type).child(itemId).child(uId).child("present").set(true);
           })

   
})

export const onCartRequestRemove = functions.database
.ref('/CartReq/{uId}/{bId}')
.onDelete( (snapshot,context) => {
    const uId = context.params.uId
    const type = snapshot.child('type').val()

    const bookId = snapshot.child('itemId').val()
            
        return  snapshot.ref.parent.parent.parent.child('Cart').child(uId).child(bookId).remove()

        .then(()=>{
            return admin.database().ref("CartIndex").child(type).child(context.params.bId).child(uId).remove();
               })
})


// export const onOrderRequestCreate = functions.database
// .ref('/OrderReq/{uId}/{oId}')
// .onCreate( (snapshot,context) => {

//     const uId = context.params.uId
//     const key = admin.database().ref('Orders').child(uId).push().key;
//     return admin.database().ref('Copy1').child(key).set('abc1').then(()=>{
//         return admin.database().ref('Copy2').child(key).set('abc2')
//     })
// })

export const onOrderRequestCreate = functions.database
.ref('/OrderReq/{uId}/{oId}')
.onCreate( (snapshot,context) => {



    console.log('let is activated 2')


    let address;
    let orderData;
    let priceDetails;
    let paymentStatus;
    let deliveryCharges;
    let key;
    let daysForDelivery;
    let failed;
    const decrementList=[];


    const uId = context.params.uId

    const method =  snapshot.child('method').val();

    const userTimeAdded = snapshot.child('userTimeAdded').val()

    const addressId = snapshot.child('addressId').val()

    const pin = snapshot.child('pin').val()



    const getOrderPromise = admin.database().ref('Cart').child(uId).once('value');

    return getOrderPromise.then(results => {

        orderData = results.val();
        return orderData;

    }).then(()=>{
    //////check availability 
    failed = false

    const promises = [];

    for(const k in orderData){
        
        if(!orderData.hasOwnProperty(k)) continue;
        
        const tObj = orderData[k]
        const tLocation = tObj.itemLocation
        console.log("location1: ",tLocation)

        const tId = tObj.itemId
        console.log("itemId: ",tObj['itemId'])

        const tQuantity = tObj.quantity
        console.log("quantity: ",tObj['quantity'])



        const tBookCountRef = snapshot.ref.parent.parent.parent.child(tLocation).child(tId).child('count')

         const p = tBookCountRef.transaction(currentCount=>{

            if(currentCount!=null){
                console.log("curentcount",currentCount)
            
                if(currentCount-tQuantity>=0){
                    const dObj = {
                        'location':tLocation,
                        'id':tId,
                        'quantity':tQuantity
                    }
                    decrementList.push(dObj)
                    console.log("inside if ",currentCount-tQuantity)
                    return currentCount - tQuantity
                }
                console.log("outside if",(currentCount-tQuantity))
                failed = true
                return currentCount
            }
           return currentCount
        })

        promises.push(p)

    }

    return Promise.all(promises).catch((err)=>{
            console.log(err)
    })
    
    ////////////////////////

    }).then(()=>{
        // if one of the books is out of stock restore the count
        if(failed){

            const promises = []

        for(const decrementObj in decrementList){


            const tBookCountRef2 = snapshot.ref.parent.parent.parent
            .child(decrementList[decrementObj].location).child(decrementList[decrementObj].id).child('count')

            const p2 = tBookCountRef2.transaction(currentCount=>{

                if(currentCount!=null){     
                    console.log("restored: ",decrementList[decrementObj].id)   
                    return currentCount + decrementList[decrementObj].quantity
                }
            return currentCount
            })

            promises.push(p2)
            }

            Promise.all(promises).catch((err)=>{
                console.log(err)
            })

            return snapshot.ref.parent.parent.parent.child('UserOrderOutOfStock').child(uId).child(context.params.oId).set('outOfStock')
        }
            //all books are present count is decremented place order
        else{
   //  const key = admin.database().ref('OrderList').push().key;

   const orderIdRef = snapshot.ref.parent.parent.parent.child('Orders')
    
   return orderIdRef.transaction(currentTotal=>{
       key = currentTotal + 1
       key = key.toString()
       return currentTotal + 1

    }).then(()=>{

        const getDeliveryChargesPromise = admin.database().ref('Delivery').child('pin').child(pin).child('deliveryCharges').once('value')

        return getDeliveryChargesPromise.then(results => {
            deliveryCharges = results.val()
            return deliveryCharges
        })
    }).then(()=>{

        const getPriceDetailsPromise = admin.database().ref('PriceDetails').child(uId).once('value')

        return getPriceDetailsPromise.then(results => {
            priceDetails = results.val()
            priceDetails.method = snapshot.child('method').val()

                 priceDetails.targetUpi = ""
                 priceDetails.tsnId = ""
                 priceDetails.upiStatus= ""
                 priceDetails.deliveryCharges = deliveryCharges
            
            return priceDetails
        })
    }).then(()=>{
        const getAddressPromise = admin.database().ref('Addresses').child(uId).child(addressId).once('value')

        return getAddressPromise.then(results =>{
            address = results.val()
            return address
        })
    }).then(()=>{
        const getDaysForDeliveryPromise = admin.database().ref('Delivery')
        .child("pin").child(address.pincode).child("daysForDelivery").once('value')

        return getDaysForDeliveryPromise.then(results =>{
            daysForDelivery = results.val()
            return daysForDelivery
        })
    }).then(()=>{

        if(String(method) === "cod"){
            paymentStatus = "pendingCOD"
        }
        else{
            paymentStatus = "pendingOnline"
        }

        const userObj = 
        {
            "address": address,
            "daysForDelivery": daysForDelivery,
            "orderData" : orderData,
            "orderId": key,
            "paymentStatus": paymentStatus,
            "priceDetails": priceDetails,
            "orderStatus": "Placed",
            "statusStack": {"a":{"date":userTimeAdded,
                                "description":"Your order has been placed.",
                                "statusName":"Placed"    
                                }
                            },
            "tOid": context.params.oId,
            "timeAdded": admin.database.ServerValue.TIMESTAMP,
            "userTimeAdded":userTimeAdded,
            "userViewed": false
        }
        
        return snapshot.ref.parent.parent.parent.child('UserOrders').child(uId).child(key).set(userObj)
                            
    }).then(()=>{
        const listObj = {
            "address": address,
            "daysForDelivery": daysForDelivery,
            "orderData" : orderData,
            "orderId": key,
            "paymentStatus": paymentStatus,
            "priceDetails": priceDetails,
            "orderStatus": "Placed",
            "statusStack": {"a":{"date":userTimeAdded,
                                "description":"Your order has been placed.",
                                "statusName":"Placed"    
                                }
                            },
            "timeAdded": admin.database.ServerValue.TIMESTAMP,
            "uId" : uId,
            "userTimeAdded":userTimeAdded,
        }


    return snapshot.ref.parent.parent.parent.child('OrdersList').child('activeOrders').child(key).set(listObj)
    

    }).then(()=>{

        const activeOrdersThumb = {
            "daysForDelivery": daysForDelivery,
            "orderId": key,
            "paymentStatus": paymentStatus,
            "orderStatus": "Placed",
            "userTimeAdded":userTimeAdded,
            "totalItems":priceDetails.count,
            "userName":address.name,
            "number":address.number,
            "totalPrice":(priceDetails.amountDiscounted+deliveryCharges),
            "pincode":address.pincode,
            "uId" : uId,
        }

        return snapshot.ref.parent.parent.parent.child('OrdersListThumb').child('activeOrdersThumb').child(key).set(activeOrdersThumb)

    }).then(()=>{
        const userOrdersThumb = {
            "daysForDelivery": daysForDelivery,
            "orderId": key,
            "paymentStatus": paymentStatus,
            "orderStatus": "Placed",
            "userTimeAdded":userTimeAdded,
            "totalItems":priceDetails.count
        }
        
        return snapshot.ref.parent.parent.parent.child('UserOrdersThumb').child(uId).child(key).set(userOrdersThumb)

    }).then(()=>{
        if(String(method) ==="cod"){
            return snapshot.ref.parent.parent.parent.child('CartReq').child(uId).remove()
        }
        return null
    }).then(()=>{
        if(String(method) ==="cod"){
            return snapshot.ref.parent.parent.parent.child('Cart').child(uId).remove()
        }
        return null
    }).then(()=>{

        return snapshot.ref.remove()
    }).then(()=>{
        if(String(method) ==="cod"){
            return snapshot.ref.parent.parent.parent.child('CountData').child(uId).remove()
        }
        return null
    }).then(()=>{
        return snapshot.ref.parent.parent.parent.child('OrderMapping').child(key).child('place').set('activeOrders')
    })
        }
        
    })

})

 export const onUpiConfirmationCreate= functions.database
.ref('/UpiConfirmation/{uId}/{oId}')
.onCreate( (snapshot,context) => {

    const uId = context.params.uId
    const oId = context.params.oId

    let priceDetails

    const targetUpi = snapshot.child('targetUpi').val()
    const tsnId = snapshot.child('tsnId').val()
    const upiStatus = snapshot.child('upiStatus').val()
    const userTimeAdded = snapshot.child('userTimeAdded').val()

    if(String(upiStatus)==="failed"){

        const promises = []

        const getActiveOrdersPromise = admin.database().ref('OrdersList').child('activeOrders').child(oId).once('value')

        return getActiveOrdersPromise.then(results => {

            const resultObj = results.val()
            resultObj.orderStatus = "CancelledDefault"

            const orderData = resultObj.orderData

            for(const k in orderData){

                if(!orderData.hasOwnProperty(k)) continue

                const tObj = orderData[k]
                const tLocation = tObj.itemLocation
                const tId = tObj.itemId
                const tQuantity = tObj.quantity


                const tBookCountRef = snapshot.ref.parent.parent.parent
            .child(tLocation).child(tId).child('count')

            const p = tBookCountRef.transaction(currentCount=>{

                if(currentCount!=null){     
                    return currentCount + tQuantity
                }
            return currentCount
            })

            promises.push(p)
                
            }

            return Promise.all(promises).then(()=>{
                return admin.database().ref('OrdersList').child('cancelledOrders').child(oId).set(resultObj)
            })
        }).then(()=>{

            return admin.database().ref('OrdersList').child('activeOrders').child(oId).remove()

        }).then(()=>{

            const getActiveOrdersThumbPromise = admin.database().ref('OrdersListThumb').child('activeOrdersThumb').child(oId).once('value')

            return getActiveOrdersThumbPromise.then(results => {

                const obj = results.val()
            obj.orderStatus = "CancelledDefault"
            
            return admin.database().ref('OrdersListThumb').child('cancelledOrdersThumb').child(oId).set(obj)

            }).then(()=>{

                return admin.database().ref('OrdersListThumb').child('activeOrdersThumb').child(oId).remove()
                
            })
            .then(()=>{
                return admin.database().ref('UserOrders').child(uId).child(oId).remove()
            }).then(()=>{
                return admin.database().ref('UserOrdersThumb').child(uId).child(oId).remove()
            }).then(()=>{
                return snapshot.ref.parent.parent.parent.child('OrderMapping').child(oId).child('place').set('cancelledOrders')
            })
            .then(()=>{
                const getAdminStatusStackPromise2 = admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').once('value')
        
                return getAdminStatusStackPromise2.then(results => {
        
                    const statusStack = results.val()

                    const status2 = {
                        "date" : 20201106205413816,
                        "description" : "Failed transaction has cancelled this order",
                        "statusName" : "Cancelled"
                    }
        
                    if(!statusStack.hasOwnProperty('a')){
                        return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('a').set(status2)
                    }
                    else if(!statusStack.hasOwnProperty('b')){
                        return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('b').set(status2)
                    }
                    else if(!statusStack.hasOwnProperty('c')){
                        return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('c').set(status2)
                    }
                    else if(!statusStack.hasOwnProperty('d')){
                        return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('d').set(status2)
                    }
                    else{
                        return null
                    }
                })
        
            })

        })

    }
    else{
    

    const getOrderListPriceDetails = admin.database().ref('OrdersList').child('activeOrders').child(oId).child('priceDetails').once('value')

    return getOrderListPriceDetails.then(results => {

    
            priceDetails = results.val()
            priceDetails.targetUpi = targetUpi            
            priceDetails.tsnId = tsnId
            priceDetails.upiStatus = upiStatus

        return admin.database().ref('OrdersList').child('activeOrders').child(oId).child('priceDetails').set(priceDetails)
        
    }).then(()=>{
        const getUserOrdersPriceDetails = admin.database().ref('UserOrders').child(uId).child(oId).child('priceDetails').once('value')

        return getUserOrdersPriceDetails.then(results => {
            
                priceDetails = results.val()
                priceDetails.targetUpi = targetUpi            
                priceDetails.tsnId = tsnId
                priceDetails.upiStatus = upiStatus 
                
            return admin.database().ref('UserOrders').child(uId).child(oId).child('priceDetails').set(priceDetails)
        })
    }).then(()=>{
        if(String(upiStatus)==="success"){

            return admin.database().ref('UserOrders').child(uId).child(oId).child('paymentStatus').set("successOnline")

        }
        else if(String(upiStatus)!="failed"){
            return admin.database().ref('UserOrders').child(uId).child(oId).child('paymentStatus').set("pendingOnline")
        }
        return null 
    }).then(()=>{

                if(String(tsnId)===""){
                    return null
                }

                const tsnData = {
                    "uId" : uId,
                    "orderId":oId,
                    "amount": priceDetails.amountDiscounted+priceDetails.deliveryCharges,
                    "tsnId": tsnId,
                    "checked":false,
                    "userTimeAdded":userTimeAdded,
                    "targetUpi":targetUpi,
                    "upiStatus":upiStatus
                }
                //check if tsnId already exists. for repeated tsnId by attacker
                return snapshot.ref.parent.parent.parent.child('OnlineTransactions').child('UPI').child(tsnId).set(tsnData)
                
                    
        }).then(()=>{
            return snapshot.ref.parent.parent.parent.child('CartReq').child(uId).remove()
        }).then(()=>{
            return snapshot.ref.parent.parent.parent.child('Cart').child(uId).remove()
        }).then(()=>{
            return snapshot.ref.parent.parent.parent.child('CountData').child(uId).remove()
        })
}

})



export const onOrderCancelRequestCreate = functions.database
.ref('/UserOrders/{uId}/{oId}/orderCancelRequest')
.onCreate( (snapshot,context) => { 

    const uId = context.params.uId
    const oId = context.params.oId
    const date = snapshot.val()

    const status = {
        "date" : date,
        "description" : "User has cancelled this order",
        "statusName" : "Cancelled"
    }

    const promises = []

    const getActiveOrdersPromise = admin.database().ref('OrdersList').child('activeOrders').child(oId).once('value')

    return getActiveOrdersPromise.then(results => {

        const resultObj = results.val()
        resultObj.orderStatus = "CancelledUser"

        const orderData = resultObj.orderData

        for(const k in orderData){

            if(!orderData.hasOwnProperty(k)) continue

            const tObj = orderData[k]
            const tLocation = tObj.itemLocation
            const tId = tObj.itemId
            const tQuantity = tObj.quantity


            const tBookCountRef = admin.database().ref(tLocation).child(tId).child('count')

        const p = tBookCountRef.transaction(currentCount=>{

            if(currentCount!=null){     
                return currentCount + tQuantity
            }
        return currentCount
        })

        promises.push(p)
            
        }

        return Promise.all(promises).then(()=>{
            return admin.database().ref('OrdersList').child('cancelledOrders').child(oId).set(resultObj)
        })
    }).then(()=>{

        return admin.database().ref('OrdersList').child('activeOrders').child(oId).remove()

    }).then(()=>{

        const getActiveOrdersThumbPromise = admin.database().ref('OrdersListThumb').child('activeOrdersThumb').child(oId).once('value')

        return getActiveOrdersThumbPromise.then(results => {

            const obj = results.val()
        obj.orderStatus = "CancelledUser"
        
        return admin.database().ref('OrdersListThumb').child('cancelledOrdersThumb').child(oId).set(obj)

        }).then(()=>{

            return admin.database().ref('OrdersListThumb').child('activeOrdersThumb').child(oId).remove()
            
        })
        .then(()=>{
            return admin.database().ref('OrderMapping').child(oId).child('place').set('cancelledOrders')
        })

        .then(()=>{
            return admin.database().ref('UserOrdersThumb').child(uId).child(oId).child('orderStatus').set('Cancelled')
        })
    
        .then(()=>{
            return admin.database().ref('UserOrders').child(uId).child(oId).child('orderStatus').set('Cancelled')
        })

        .then(()=>{
            const getStatusStackPromise = admin.database().ref('UserOrders').child(uId).child(oId).child('statusStack').once('value')

            return getStatusStackPromise.then(results => {

              

                const statusStack = results.val()

                if(!statusStack.hasOwnProperty('a')){
                    return admin.database().ref('UserOrders').child(uId).child(oId).child('statusStack').child('a').set(status)
                }
                else if(!statusStack.hasOwnProperty('b')){
                    return admin.database().ref('UserOrders').child(uId).child(oId).child('statusStack').child('b').set(status)
                }
                else if(!statusStack.hasOwnProperty('c')){
                    return admin.database().ref('UserOrders').child(uId).child(oId).child('statusStack').child('c').set(status)
                }
                else if(!statusStack.hasOwnProperty('d')){
                    return admin.database().ref('UserOrders').child(uId).child(oId).child('statusStack').child('d').set(status)
                }
                else{
                    return null
                }
        })

        
    
    })


    .then(()=>{
        const getAdminStatusStackPromise = admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').once('value')

        return getAdminStatusStackPromise.then(results => {

          

            const statusStack = results.val()

            if(!statusStack.hasOwnProperty('a')){
                return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('a').set(status)
            }
            else if(!statusStack.hasOwnProperty('b')){
                return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('b').set(status)
            }
            else if(!statusStack.hasOwnProperty('c')){
                return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('c').set(status)
            }
            else if(!statusStack.hasOwnProperty('d')){
                return admin.database().ref('OrdersList').child("cancelledOrders").child(oId).child('statusStack').child('d').set(status)
            }
            else{
                return null
            }
        })

    })

    .then(()=>{
        return admin.database().ref("UserOrders").child(uId).child(oId).child("orderCancelApproved").set(true)  
    })

    
})



})


// //    const id = snapshot.ref.parent.parent.parent.child('Orders').child(uId).push().set('abc')

// //     const a = admin.database().ref('Orders').child(uId).once('value')

// //     a.then(results =>{
// })

// exports.recountlikes = functions.database.ref('/RequestedBooks/{uId}/{bId}').onCreate( (snap,context) => {

//     const uId = context.params.uId;

//     const getSomethingPromise = admin.database().ref('/RequestedBooks/'+uId+'/01').once('value');

//     return getSomethingPromise.then(results => {
//        const somethingSnapshot = results[0];
//        console.log(results.child('ss').val())
//    }).then( ()=>{
//        console.log('sdk')
//    }   );

//   });