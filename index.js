'use strict'

const {getClient}  = require('./client');
const {OrderServer} = require('./server');

for (_ in [...Array(5).keys()]) {
  const serverID = Math.floor(Math.random() * 1000);

client = getClient(serverID);
new OrderServer(serverID);

}
