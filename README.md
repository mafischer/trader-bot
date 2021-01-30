# Trader Bot
A stock trading bot that can automate trades based on elected trade strategies. Trade strategies can be plugins that are provided out of the box, created by the end user, or provided by the community.

## Acknowledgements
- This bot and the reverse-spit strategy were initially inspired by the work of [@ReverseSplitArb](https://twitter.com/ReverseSplitArb), send some appreciation that way.
- This project has been built on top of the work of other open source initiatives; for more information, please see the dependencies listed in the [package.json](package.json).

## Warnings
- This software should be considered experimental!
- You are giving this experimental software access to your stock broker(s). **THERE IS POTENTIAL FOR FINANCIAL LOSS!!**
- Your credentials will be encrypted and stored on your local file system. At no point will this software store your credentials anywhere accept in the machine where you run it.
- Other than your credentials, all data is stored unencrypted in a SQLite db on your machine.

## License
This software is licensed under the ISC license. See [LICENSE](LICENSE) for full details.

## Getting Started

### Pre Requisites
- For access to twitter data, [apply](https://developer.twitter.com/en/apply-for-access) for a twitter developer account
- create an account with a supported broker (support further development by using below links to open an account):
  - **robinhood**: https://join.robinhood.com/michaef30
    - Please review Robinhood's [TOS](https://cdn.robinhood.com/assets/robinhood/legal/Customer%20Agreement.pdf) before using this software.
  - **webull**: *coming next, soon..*
  - **more to come**

### Dev Environment Setup
#### Windows
For easy setup, you may use chocolatey as outlined below. Otherwise, if you know what you are doing, feel free to install the below dependencies however you see fit.
- install [chocloatey](https://chocolatey.org/install)
``` powershell
# install chocloatey - https://chocolatey.org/install
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
# install NodeJS - https://nodejs.org/
choco install nodejs-lts
# install SQLite
choco install sqlite
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
# install dependencies
npm ci
# server application
npm run electron:serve
```

### Setting Up Trader Bot
- download [trader-bot](https://github.com/mafischer/trader-bot) source code
- open terminal/cmd window in directory of source code
- Install the application by running `npm ci`.
- Start the application by running `npm run start`.
- You will be prompted for your broker and twitter developer credentials.
- You will be prompted for a password to encrypt and decrypt your credentials.
- The bot will now make trades according to your elected strategites

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
