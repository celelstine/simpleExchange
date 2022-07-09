'use strict'

const {getClient}  = require('./client');
const {OrderServer} = require('./server');

for (let i in [...Array(5).keys()]) {
  const serverID = 1024 + Math.floor(Math.random() * 1000);
  console.log('serverID', serverID);

  new OrderServer(serverID);
  getClient(serverID);
}
