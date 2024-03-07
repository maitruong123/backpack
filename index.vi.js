"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backpack_client_1 = require("./backpack_client");

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// Lấy ngày giờ hiện tại
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var strHour = date.getHours();
    var strMinute = date.getMinutes();
    var strSecond = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + strHour + seperator2 + strMinute
        + seperator2 + strSecond;
    return currentdate;
}

let successbuy = 0;
let sellbuy = 0;

const init = async (client) => {
    try {
        console.log(`Số lần mua thành công:${successbuy}, Số lần bán thành công:${sellbuy}`);
        console.log(getNowFormatDate(), "Đợi 3 giây...");
        await delay(3000);
        console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
        let userbalance = await client.Balance();
        // Kiểm tra số dư USDC có lớn hơn 5 hay không
        if (userbalance.USDC.available > 5) {
            await buyfun(client);
        } else {
            await sellfun(client);
            return;
        }
    } catch (e) {
        init(client);
        console.log(getNowFormatDate(), "Đặt lệnh thất bại, đang thử lại...");
        await delay(1000);
    }
}

const sellfun = async (client) => {
    // Hủy tất cả các lệnh chưa hoàn thành
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Đã hủy tất cả các lệnh đặt");
    } else {
        console.log(getNowFormatDate(), "Đơn hàng tài khoản bình thường, không cần hủy lệnh");
    }
    console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
    // Lấy thông tin tài khoản
    let userbalance2 = await client.Balance();
    console.log(getNowFormatDate(), "Thông tin tài khoản:", userbalance2);
    console.log(getNowFormatDate(), "Đang lấy giá thị trường hiện tại của sol_usdc...");
    // Lấy giá hiện tại
    let { lastPrice: lastPriceask } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá hiện tại của sol_usdc:", lastPriceask);
    let quantitys = ((userbalance2.SOL.available / 2) - 0.02).toFixed(2).toString();
    console.log(getNowFormatDate(), `Đang bán... Bán ${quantitys} Số lượng SOL`);
    let orderResultAsk = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPriceask.toString(),
        quantity: quantitys,
        side: "Ask", // Bán
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })

    if (orderResultAsk?.status == "Filled" && orderResultAsk?.side == "Ask") {
        console.log(getNowFormatDate(), "Bán thành công");
        sellbuy += 1;
        console.log(getNowFormatDate(), "Chi tiết đơn hàng:", `Giá bán:${orderResultAsk.price}, Số lượng bán:${orderResultAsk.quantity}, Mã đơn hàng:${orderResultAsk.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Bán thất bại");
        throw new Error("Bán thất bại");
    }
}

const buyfun = async (client) => {
    // Hủy tất cả các lệnh chưa hoàn thành
    let GetOpenOrders = await client.GetOpenOrders({ symbol: "SOL_USDC" });
    if (GetOpenOrders.length > 0) {
        let CancelOpenOrders = await client.CancelOpenOrders({ symbol: "SOL_USDC" });
        console.log(getNowFormatDate(), "Đã hủy tất cả các lệnh đặt");
    } else {
        console.log(getNowFormatDate(), "Đơn hàng tài khoản bình thường, không cần hủy lệnh");
    }
    console.log(getNowFormatDate(), "Đang lấy thông tin tài khoản...");
    // Lấy thông tin tài khoản
    let userbalance = await client.Balance();
    console.log(getNowFormatDate(), "Thông tin tài khoản:", userbalance);
    console.log(getNowFormatDate(), "Đang lấy giá thị trường hiện tại của sol_usdc...");
    // Lấy giá hiện tại
    let { lastPrice } = await client.Ticker({ symbol: "SOL_USDC" });
    console.log(getNowFormatDate(), "Giá hiện tại của sol_usdc:", lastPrice);
    console.log(getNowFormatDate(), `Đang mua... Sử dụng ${(userbalance.USDC.available - 2).toFixed(2).toString()} USDC để mua SOL`);
    let quantitys = ((userbalance.USDC.available - 2) / lastPrice).toFixed(2).toString();
    console.log("1024", quantitys);
    let orderResultBid = await client.ExecuteOrder({
        orderType: "Limit",
        price: lastPrice.toString(),
        quantity: quantitys,
        side: "Bid", // Mua
        symbol: "SOL_USDC",
        timeInForce: "IOC"
    })
    if (orderResultBid?.status == "Filled" && orderResultBid?.side == "Bid") {
        console.log(getNowFormatDate(), "Đặt lệnh mua thành công");
        successbuy += 1;
        console.log(getNowFormatDate(), "Chi tiết đơn hàng:", `Giá mua:${orderResultBid.price}, Số lượng mua:${orderResultBid.quantity}, Mã đơn hàng:${orderResultBid.id}`);
        init(client);
    } else {
        console.log(getNowFormatDate(), "Đặt lệnh mua thất bại");
        throw new Error("Mua thất bại");
    }
}

(async () => {
    const apikey = "1ugYgMYZsxdd0cGWqD05zbDudTrdcjU3auGBXCO+Rm8=";
    const apisecret= "8v8mmSfU5iYCVGY98Gy5vP2thNVHeEgZExHM7V8D1yQ=";
    const client = new backpack_client_1.BackpackClient(apisecret, apikey);
    init(client);
})();
