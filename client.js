'use strict'
const { PeerRPCClient } = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')
const { NEW_CLIENT_ORDER, SERVICE_NAME } = require('./types');


export function getClient(serverID) {
  const link = new Link({
    grape: 'http://127.0.0.1:30001',
    requestTimeout: 10000
  });
  link.start()

  const peer = new PeerRPCClient(link, {})
  peer.init()

  const payload  = {
    Requester: `user - {ID}`,
    reqType: NEW_CLIENT_ORDER,
    recipient: serverID,
    orderID: Math.floor(Math.random() * 1000),
    fromCoin: 'ETH',
    fromAmount: Math.floor(Math.random() * 100),
    toCoin: 'BTC',
    toAmount: Math.floor(Math.random() * 100),
  }

  peer.request(SERVICE_NAME, payload, { timeout: 1000}, (err, result) => {
    if (err) throw err
    console.log('got result', result)
  })
}

