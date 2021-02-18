# Trader Bot
A stock trading bot that can automate trades based on elected trade strategies. Trade strategies are plugins that are provided out of the box, created by the end user, or provided by the community.

## TL;DR
Install from [here](#Installation) and enjoy!

## Acknowledgements
- This bot and the reverse-spit strategy were initially inspired by the work of [@ReverseSplitArb](https://twitter.com/ReverseSplitArb), send some appreciation that way.
- This project has been built on top of the work of other open source initiatives; for more information, please see the dependencies listed in the [package.json](package.json).

## Warnings
- This software should be considered experimental!
- You are giving this experimental software access to your stock broker(s). **THERE IS POTENTIAL FOR FINANCIAL LOSS!!**
- All data is stored on your local file system in SQLite databases.
- Your credentials will be encrypted and stored in SQLite.
- Anonymous usage statistics may be sent over the network if you chose to allow it.

## License
This software is licensed under the ISC license. See [LICENSE](LICENSE) for full details.

## Usage

### Installation
- Download the installer from [TO DO](#)

### Setup

#### Pre Requisites
- For access to twitter data, [apply](https://developer.twitter.com/en/apply-for-access) for a twitter developer account
- create an account with a supported broker (support further development by using below links to open an account):
  - **robinhood**: https://join.robinhood.com/michaef30
    - Please review Robinhood's [TOS](https://cdn.robinhood.com/assets/robinhood/legal/Customer%20Agreement.pdf) before using this software.
  - **webull**: *coming next, soon..*
  - **more to come**

#### First Run
- Start the application.
- You will be prompted for your broker and twitter developer credentials.
- You will be prompted for a password to encrypt and decrypt your credentials.
- Elect one or more trading strategies.
- The bot will now make trades according to your elected strategitesl

#### Subsequent Runs
- Start the application.
- You will be prompted for a password to encrypt and decrypt your credentials.
- All of your settings are persited in a local database. The application will run as previously configured.
- Leave running, Trader Bot must be running in order to make trades.

## Development

### Tech Stack & Docs
- [NodeJS](https://nodejs.org/en/docs/)
- [Electron](https://www.electronjs.org/)
- [Vue](https://vuejs.org/)
- [Vue CLI](https://cli.vuejs.org/)
- [vue-cli-plugin-electron-builder](https://nklayman.github.io/vue-cli-plugin-electron-builder/)
- [electron-builder](https://www.electron.build/)

### Environment Setup
#### Windows
For easy setup, you may use chocolatey as outlined below. Otherwise, if you know what you are doing, feel free to install the below dependencies however you see fit.
``` powershell
# run powershell as Administrator
# install chocloatey - https://chocolatey.org/install
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
# install NodeJS - https://nodejs.org/
choco install nodejs-lts
# install SQLite
choco install sqlite
# install git
choco install git
# install windows build tools - needed for node-gyp
choco install microsoft-build-tools
# install python 3 - needed for node-gyp
choco install python
# install python 2 - needed for node-sass
choco install python2
# install node-gyp
npm i -g node-gyp
```
#### Mac
For easy setup, you may use brew as outlined below. Otherwise, if you know what you are doing, feel free to install the below dependencies however you see fit.
``` bash
# install brew - https://brew.sh/
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# install NodeJS -https://nodejs.org/
brew install node
# install SQLite https://www.sqlite.org/index.html
brew install sqlite
```
#### Other
It is presumed that you know what you are doing.
- Install node and sqlite
#### All
``` bash
# clone project
git clone https://github.com/mafischer/trader-bot.git
# change directory into project
cd trader-bot
# install dependencies
npm ci
# serve application
npm run electron:serve
```

## Further Development

### Long term vision
- This project aims to provide a consistent broker api to simplify building a trading strategy. In order for a new broker to be added, a wrapper api must be developed to normalize the broker api with what is currently available
- Tensorflow will be added to support strategies that want to use Machine Learning.
- A repository of plugins will allow the community to share strategies.

### Contributing
- Have a look at the [issues](https://github.com/mafischer/trader-bot/issues) and feel free to submit a PR
- Submit an issue if you find a bug or have an idea to make the project better.
- Throw me some spare change if you found this software useful.

#### Donations
Become a patron by clicking below:

[![](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/trader_bot)

Send a one-time donation via paypal:

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif)](https://www.paypal.me/michaelmab88/5)
