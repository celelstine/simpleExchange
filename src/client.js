
import { PeerRPCClient } from "grenache-nodejs-ws";
import Link from "grenache-nodejs-link";
import {
  NEW_CLIENT_ORDER, SERVICE_NAME, COINS
} from './constants';


export function getClient(serverID) {
  const link = new Link({
    grape: 'http://127.0.0.1:30001',
    // requestTimeout: 10000
  });
  link.start()

  const peer = new PeerRPCClient(link, {})
  peer.init()

  const payload  = createOrder(serverID);

  setTimeout(() => {
    peer.request(SERVICE_NAME, payload, { timeout: 1000}, (err, result) => {
      if (err) throw err
      console.log('got result', result)
    })
  }, 2000);

}

function createOrder(serverID) {
  const fromCoin = COINS[Math.floor(Math.random()*COINS.length)];
  const remainCoin = COINS.filter(e => e != fromCoin);
  const toCoin = remainCoin[Math.floor(Math.random()*remainCoin.length)];

  return {
    requester: `user - ${serverID}`,
    reqType: NEW_CLIENT_ORDER,
    recipient: serverID,
    orderID: Math.floor(Math.random() * 1000),
    fromCoin: fromCoin,
    fromAmount: Math.floor(Math.random() * 100),
    toCoin: toCoin,
    toAmount: Math.floor(Math.random() * 100),
  }
}

