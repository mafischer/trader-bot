# Trader Bot
A nodejs script using tensor flow for automating trades on the robinhood broker api

## Getting Started

### Pre Requisite
- create a twitter developer account
- add `export PATH=~/.npm/bin:$PATH` to your `~/.bash_profile`
  - windows: run `npm bin` in your home directory, add the output directory to your path.
- install sqlite on your dev machine
  - macos: `brew install sqlite`
  - windows: `choco install sqlite`

### Setting Up Trader Bot
- `npm ci`
- run `npm link` for cli functionality (`trader_login`)
- run `trader_login` or `node login.js` to generate a token. It will prompt you for your robinhood username and password and sms passcode.
- copy your twitter dev credentials into the `credentials.json` file:
```json
{
  "robinhood": {
    "token": "******"
  },
  "twitter": {
    "bearer_token": "******",
    "consumer_key": "******",
    "consumer_secret": "******"
  }
}
```
- run the traderbot `node index.js`