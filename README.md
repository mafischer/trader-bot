# Trader Bot
A nodejs script using tensor flow for automating trades on the robinhood broker api

## Getting Started

### Pre Requisite
- checkout my fork of [robinhood-node](https://github.com/mafischer/robinhood-node.git) onto local computer `git clone git@github.com:mafischer/robinhood-node.git`
- install robinhood-node dependencies `cd robinhood-node && npm ci`
- link robinhood-node `npm link`

### Setting Up Trader Bot
- `npm ci`
- run `trader_login` or `node login.js` to generate a token. It will prompt you for your robinhood username and password and sms passcode.
- run the traderbot `node index.js`