var fs = require('fs'),
    path = require('path');
/*
 * key values hash where key will be converted to a regex to match against paths and the value is the name of the file to be
 * served when that regex matchs.
 *
 * Behavior is undefined in the case of paths that match multiple keys. The first key seen (as returned by the javascript engine's iterator)
 * is the winner.
 */

module.exports = exports = {
    "/m/j\\?service=Taxonomy&method=getAllDepartments.*": "getAllDepartments.json",
    "/m/j\\?service=Taxonomy&method=getRollBacks.*": "getRollbacks.json",
    "/m/j\\?service=Browse&method=browseByToken.*": "browseByToken.json",
    "/m/j\\?service=Browse&method=extendedBrowseByToken.*": "Browse/extendedBrowseByToken.json",
    "/m/j\\?service=Browse&method=extendedSearch.*": "Browse/extendedSearch.json",
    "/m/j\\?service=Browse&method=search.*": "search.json",
    "/m/j\\?service=Browse&method=searchByDepartment.*": "searchByDepartment.json",
    "/m/j\\?service=Suggestions&method=getSuggestions.*": "getSuggestions.json",
    "/m/j\\?service=Reviews&method=getReviews&p1=.*": "getReviews.json",
    "/m/j\\?service=Vod&method=getVod.*": "getVod.json",
    "/m/j\\?service=OrderHistory&method=getOrders.*": "getOrders.json",
    "/m/j\\?service=OrderHistory&method=getOrder.*": "getOrder.json",

    "/m/j\\?service=Item&method=get&p1=(.*)": "item.json",
    "/m/j\\?service=ItemInventory&method=get&p1=.*": "items/getItemInventory.json",

    "/m/j\\?service=AppVersion&method=getVersionRequired.*": "AppVersion/getVersionRequired.json",

    "/m/j\\?service=Authentication&method=login.*": "verify.json",
    "/m/j\\?service=Authentication&method=verify.*": "verify.json",

    "/m/j\\?service=Authentication&method=logout.*": "Authentication/logout.json",

    "/m/j\\?service=StoreLocator&method=locate.*": "locate.json",

    "/m/j\\?service=Cart&method=add.*": "Cart/add.json",

    "/m/j\\?service=Cart&method=getThresholdItemSummary(&version=[\\d])?": "checkout/getThresholdItemSummary.json",
    "/m/j\\?service=Cart&method=get(&version=[\\d])?": "checkout/getCart.json",

    "/m/j\\?service=Cart&method=remove.*": "Cart/remove.json",

    "/m/j\\?service=Checkout&method=getMessageKeys(&version=[\\d])?": "checkout/getMessageKeys.json",
    "/m/j\\?service=Checkout&method=getProtoOrder(&version=[\\d])?": "checkout/getProtoOrder.json",
    "/m/j\\?service=Checkout&method=getAvailableShip2HomeAddresses(&version=[\\d])?": "checkout/getAvailableShip2HomeAddresses.json",
    "/m/j\\?service=Checkout&method=getAvailableCreditCards(&version=[\\d])?": "checkout/getAvailableCreditCards.json",
    "/m/j\\?service=Checkout&method=getItems(&version=[\\d])?": "checkout/getItems.json",
    "/m/j\\?service=Checkout&method=isCidRequired(&version=[\\d])?": "checkout/isCidRequired.json",
    "/m/j\\?service=Checkout&method=verifyOrder(&version=[\\d])?": "checkout/verifyOrder.json",
    "/m/j\\?service=Checkout&method=placeOrder.*": "checkout/placeOrder.json",
    "/m/j\\?service=Checkout&method=getSelectedCreditCard.*": "checkout/getSelectedCreditCard.json",
    "/m/j\\?service=Checkout&method=getCreditCard.*": "checkout/getSelectedCreditCard.json",
    "/m/j\\?service=Checkout&method=updateCreditCard.*": "checkout/getSelectedCreditCard.json",
    "/m/j\\?service=Checkout&method=createCreditCard.*": "checkout/getSelectedCreditCard.json",
    "/m/j\\?service=Checkout&method=setSelectedCreditCard.*": "checkout/setSelectedCreditCard.json",
    "/m/j\\?service=Checkout&method=updateBillingAddress.*": "checkout/updateBillingAddress.json",
    "/m/j\\?service=Checkout&method=getShip2HomeAddress.*": "checkout/getSelectedShip2HomeAddress.json",
    "/m/j\\?service=Checkout&method=getSelectedShip2HomeAddress.*": "checkout/getSelectedShip2HomeAddress.json",
    "/m/j\\?service=Checkout&method=updateShip2HomeAddress.*": "checkout/getSelectedShip2HomeAddress.json",
    "/m/j\\?service=Checkout&method=createShip2HomeAddress.*": "checkout/getSelectedShip2HomeAddress.json",
    "/m/j\\?service=Checkout&method=getAddressBestMatch.*": "checkout/getAvailableShip2HomeAddresses.json",
    "/m/j\\?service=Checkout&method=setSelectedShip2HomeAddress.*": "/checkout/setSelectedShip2HomeAddress.json",
    "/m/j\\?service=Checkout&method=getSelectedShip2StoreAddress.*": "checkout/getSelectedShip2StoreAddress.json",
    "/m/j\\?service=Checkout&method=setSelectedShip2StoreAddress.*": "/checkout/setSelectedShip2StoreAddress.json",
    "/m/j\\?service=Checkout&method=isAssociateLoginRequired(&version=[\\d])?":"/isAssociateLoginRequired.json",
    "/m/j\\?service=Checkout&method=applyAssociateDiscount(&version=[\\d])?":"/checkout/applyAssociateDiscount.json",
    "/m/j\\?service=Checkout&method=setAssociateDeclined(&version=[\\d])?":"/checkout/setAssociateDeclined.json",
    "/m/j\\?service=Authentication&method=createAccount(&version=[\\d])?":"/createAccount.json",

    "/m/j\\?service=ExtendedItem&method=get(&version=[\\d])?&p1=(.*)": function(version, id) {
        var file = path.join(__dirname, 'items', id.replace(/\&.*/, '') + '.json');
        if (!path.existsSync(file)) {
            file = path.join(__dirname, 'items', '15750054.json')
        }
        return fs.readFileSync(file);        
    }
};
