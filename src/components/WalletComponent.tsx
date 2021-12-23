import { stringify } from 'querystring';
import '../App.css';
import { useEffect, useState } from 'react';
import { json } from 'stream/consumers';
import { getWallet } from '../remote/get-wallet-service';
import { WalletRequest } from '../models/WalletRequest';
import { Principal } from '../models/Principal';
import { TransactionComponent } from './TransactionComponent';
import CoinWallet from '../models/CoinWallet'

interface IWalletProps{
    currWallet: WalletRequest | undefined,
    currUser: Principal | undefined
    // setCurrWallet: (nextWallet: WalletRequest | undefined) => void
}

export default function WalletContents(props:IWalletProps) {
    let [currWallet, updateCurrWallet] = useState({});
    let [coinList, updateCoinList] = useState([]);
    let [walletCoinList, updateWalletCoinList] = useState([] as CoinWallet[])

    let pairs:string[] = [];//['BTC-USD', 'ETH-USD']; 
    let amounts:number[] = [];//[0.001, 2];
    let numIterations:number = 1000;
    let totalNumIterations = numIterations;
    let count = numIterations - 5;
    let tempWalletCoinList: CoinWallet[];

    //var userWallet;

    useEffect( () => {
            // let currWallet = new WalletRequest(username, leagueName);
        //reqParamQuery('leaderboard/league=', "d").then((players) => {
            console.log(props.currWallet);

        if (props.currWallet){
            getWallet(props.currWallet as WalletRequest).then((wallet)=> {
            if(coinList.length == 0){

                currWallet = wallet;
                coinList = wallet['coins'];
                updateCurrWallet(currWallet); // doesn't update currwallet
                updateCoinList(coinList);
                
            }
            
            pairs = coinList.map( coin => coin['currPair']);
            amounts = coinList.map( coin => coin['amount']);
            console.log(pairs);
            console.log(amounts);
            sock();
        })

           
        }
       
    }, []);

    // for(let i in walletList){
    //     pairs.push(i);
    //     amounts.push(i);
    // }

    function sock() {
        let socket = new WebSocket("wss://ws-feed.exchange.coinbase.com/");


        let request: {type: string, 
                    product_ids: string[],
                    channels: (string|{
                        name: string,
                        product_ids: string[]
                    })[]} = {
            "type": "subscribe",
            "product_ids": [
                //currency pairs are inserted here
            ],
            "channels": [
                "level2",
                "heartbeat"
            ]
        };

        let response: {pair: string, price: number}[] = [];

        let heartbeat: {name:string, product_ids:string[]} = {
            "name": "ticker",
            "product_ids": [
                //"ETH-USD"
            ]
        }

        heartbeat.product_ids = pairs; 
        request.product_ids = pairs; 
        request.channels.push(heartbeat);
        let prices:number[] = []; 
        let averages:number[] = [];
        let sums:number[] = [];
        let counts:number[] = [];
        let firsts:boolean[] = [];


        for(let i = 0; i < pairs.length; i++){
            averages[i] = 0;
            counts[i] = 0;
            sums[i] = 0;
            firsts[i] = true;
        }

        socket.onopen = function(e) {
            console.log("[open] Connection established");
            console.log("Sending to server");
            socket.send(JSON.stringify(request));


        };

        socket.onmessage = function(event) {
            let jsonObj = JSON.parse(event.data);
            storeAvgPrices(jsonObj);
            if (count > totalNumIterations) {
                count = 0;
                for (let i = 0; i < averages.length; i++) {
                    tempWalletCoinList[i] = new CoinWallet(pairs[i], amounts[i], averages[i]);
                    console.log(tempWalletCoinList[i]);
                }
                updateWalletCoinList(tempWalletCoinList);
                console.log(tempWalletCoinList)
                console.log('Should update table if Im here')
            }
            count++;

        };

        socket.onclose = function(event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.log('[close] Connection died');
        }
        };
        socket.onerror = function(error) {
            console.log(`[error] ${error}`);
        };

        function storeAvgPrices (jsonObj: any) {
            tempWalletCoinList = [];
            if(jsonObj["type"] === "l2update"){
                for(let i = 0; i < pairs.length; i++){
                    if(jsonObj["product_id"]===pairs[i]){
                        prices[i] = parseFloat(jsonObj["changes"][0][1]);
                    }
                    else if(counts[i]>numIterations || firsts[i]){

                        if(firsts[i]){
                            sums[i] = prices[i];
                            counts[i] = 1;
                        }
                        averages[i] = sums[i]/counts[i];
                        if(!isNaN(averages[i])){
                            firsts[i] = false;
                            let num = averages[i] * amounts[i];//calculate how much league user has
                            averages[i] = Math.round((num+Number.EPSILON)*100)/100;//round to hundrendth decimal place
                            //response.push({pair:pairs[i], price: averages[i]})
                            // document.getElementById("display")!.innerHTML = pairs[0] + ": $"+averages[0].toString();//response[2].price.toString();
                            // for(let k = 1; k < pairs.length; k++){
                            //     const para = document.createElement("p");//!.innerHTML = averages[1].toString();
                            //     const node = document.createTextNode(pairs[k]+": $"+averages[k].toString());
                            //     para.append(node);
                            //     const element = document.getElementById("display");
                            //     element?.appendChild(para);
                            // }
                            
                            
                            
                            
                        }
                        counts[i] = 0;
                        sums[i] = 0;
                        //averages[i] = 0;
                    }
                    else {
                        sums[i] += prices[i]; 
                        counts[i]++;        
                    }
                }
                
                
            }

            return response;
    }

    }

    return (
        <>
        {(props.currUser?.username == props.currWallet?.username) && <TransactionComponent/>}
        <h1><u>COINS IN WALLET:</u></h1>
    
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Currency Pair</th>
                    <th>Amount</th>
                    <th>Current Value</th>
                 </tr>
            </thead>
            <tbody>
                {walletCoinList && walletCoinList.map(coin =>
                    <tr key={coin["currPair"]}>
                        <td>{coin["currPair"]}</td>
                        <td>{coin["amount"]}</td>
                        <td>${coin["usdValue"]}</td>
                    </tr>,
                    
                    )}
            </tbody>
        </table>
        
        
        </>
        );
        // <div>
        //     {/* {socket.onmessage} */}
        //     <h3>Coins in Wallet:</h3>
        //     <div id="display"></div>
        // </div>
}    
    
