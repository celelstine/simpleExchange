'use strict'
const { PeerRPCServer } = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')

const {
  NEW_CLIENT_ORDER,
  NEW_ORDER,
  CLAIM_REQUEST,
  CLAIM_GRANTED,
  ORDER_LOCK,
  ORDER_CLOSED,
  SERVICE_NAME
} = require('./types');


export class OrderServer {
  constructor(ID) {
    this.ID = id;
    this.port = ID;
    this.orders = {};
    this.processers = {
      NEW_CLIENT_ORDER: this.processNewClientOrder,
      NEW_ORDER: this.processNewOrder,
      CLAIM_REQUEST: this.handleClaimRequest,
      CLAIM_GRANTED: this.processClaimGranted,
      ORDER_CLOSED: this.processOrderClosed
    }
    this.setupServer(this.port);
  }

  setupServer() {
    const link = new Link({
      grape: 'http://127.0.0.1:30001'
    });
    
    link.start()
    
    this.peer = new PeerRPCServer(link, {})
    this.peer.init()

    const service = peer.transport('server');
    service.listen(this.port);

    setInterval(() => {
      link.announce(SERVICE_NAME, service.port, {})
    }, 1000);

    service.on('request', (rid, key, payload, handler) => {
      const { reqType, Requester, Recipient: None } = payload;
      // only call processr when the server is not the sender and it's the recipient
      // when Recipient is null browsers to all
      if (Requester != serverPort &&  (Recipient && recipient == this.ID)) {
        const reqprocessr = this.processers[reqType];
        reqprocessr(handler, payload)
      }
    });
  }

  processNewClientOrder(handler, payload) {
    const order = {
      ...payload,
      serverId: this.ID, //this would stay constant to mark the initiator
      Requester: this.ID, // so that same server do not process itself request
      recipient: None //allow other recieve it
    }

    this.orders[order.orderID] = order;

    handler.reply(null, 'Order received');

    this.broadcastOrder({
      ...order,
      reqType: NEW_ORDER
    });
  }

  processNewOrder(handler, payload) {
    // add to orders
    this.orders[payload.orderID] = payload;
    // check if server can fullfill it, if yes request claim
    const fullfillingOrderID = this.getfullfillingOrderID(payload)
    if (fullfillingOrderID) {
      this.orders[getfullfillingOrderID] = {
        ...this.orders[getfullfillingOrderID],
        lockedFor: payload.orderID,
      }
      this.broadcastOrder({
        ...order,
        reqType: CLAIM_REQUEST,
        Requester: this.ID,
        Recipient: payload.Requester // the request would grant on FIFO
      });
    }
  }

  processClaimGranted(handler, payload) {
    const { lockedServerID, orderID, Requester } = payload;

    if (lockedServerID == this.ID) {
      this.orders[orderID] = payload;
      this.processOrder(orderID);

      this.broadcastOrder({
        ...order,
        reqType: ORDER_CLOSED,
        Requester: this.ID,
        Recipient: Requester, // the request would grant on FIFO
      });
    } else {
      delete this.orders[orderID];
      //  free the lock node since we were unlucky
      for (var order in this.orders) {
        if (order['lockedFor'] == orderID) {
          delete this.orders[order.orderID]['lockedFor']
        }
      }

    }
  }

  processOrderClosed(handler, payload) {
    const { orderID } = payload
    delete this.orders[orderID];
  }

  processOrder(orderID) {
    const order = this.orders[orderID];
    
    const exchangeOrder = Object.values(this.orders).filter(function(order) {
      return order.lockedFor == orderID
    });

    const { fromAmount } = exchangeOrder;
    const { toAmount } = order;

    if (fromAmount > toAmount) {
      const remainingOrder = {
        ...exchangeOrder,
        toAmount: exchangeOrder['toAmount'] - order['fromAmount'],
        fromAmount: fromAmount - toAmount,
        lockedFor: null,
        lockedServerID: null,
        reqType: NEW_ORDER,
      }

      this.orders[exchangeOrder.orderID] = remainingOrder;
    } else {
      delete this.orders[exchangeOrder.orderID]
    }
    delete this.orders[orderID];

  }

  handleClaimRequest(handler, payload) {
    let order = this.orders[payload.orderID];

    if (!order['lockedServerID']) {
      order['lockedServerID'] = payload.Requester;
      this.orders[order.orderID] = order;

      this.broadcastOrder({
        ...order,
        reqType: CLAIM_GRANTED,
        Requester: this.ID,
        Recipient: None
      });
    }

  }

  getfullfillingOrderID(order) {
    const { toCoin, toAmount} = order;
    // we check if we have an order that can match this
    // IE that has enough from amount and corresponding from coin
    const matchingOrders = Object.values(this.orders).filter(function(order) {
      const {fromCoin, fromAmount, lockedFor, lockedServerID } = order;
      return fromCoin == toCoin && fromAmount >= toAmount && !lockedFor &&  !lockedServerID;
    });

    // TODO: should lock this order locally to secure it when claim is granted
    return matchingOrders.length ? matchingOrders[0]['orderID']: null;

  }

  broadcastOrder(payload) {
    this.peer.request(SERVICE_NAME, payload, { timeout: 1000}, (err, result) => {
      if (err) throw err
      console.log('event broadcasted');
    });
  }

}