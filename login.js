#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');

main();

async function main() {
    const credentialsPath = './credentials.json';

    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
    });

    let credentialsJson;

    if (fs.existsSync(credentialsPath)) {
        credentialsJson = require(credentialsPath);
    } else {
        credentialsJson = {};
    }

    credentialsJson = await chooseService(rl, fs, credentialsJson);
    fs.writeFileSync('credentials.json', JSON.stringify(credentialsJson, null, 2));
    process.exit(0);
}

function chooseService(rl, fs, creds) {
    let credentials = creds;

    const services = '\n0.  exit\n1.  robinhood\n2.  twitter\n';

    return new Promise(async resolve => {
        console.log("From the list presented below, please chose which service you would like to authenticate:");
        rl.question(services, async service => {
            switch(service) {
                case "0":
                    rl.close();
                    console.log("All done, goodbye!");
                    resolve(creds);
                    break;
                case "1":
                    resolve(await chooseService(rl, fs, {
                        ...creds,
                        robinhood: await robinhood(rl)
                    }));
                    break;
                case "2":
                    console.log("twitter is not yet supported");
                    resolve(await chooseService(rl, fs, creds));
                    break;
                default:
                    console.log(`{service} is not a valid option`);
                    resolve(await chooseService(rl, fs, creds));
                    break;
            }
        });
    });
};

function robinhood(rl) {

    let username, password, token;

    return new Promise(resolve => {
        rl.question(`Please enter your robinhood userid: `, uid => {
            username = uid;
            rl.question(`${username}, please enter your password: `, pw => {
                password = pw;
                const Robinhood = require('robinhood')({username,password}, data => {
                    rl.question(`Please enter your multi-factor authentication passcode: `, mfaCode => {
                        if (data && data.mfa_required) {
                            Robinhood.set_mfa_code(mfaCode, () => {
                                token = Robinhood.auth_token();
                                resolve({token});
                            });
                        }
                        else {
                            console.log('multi-factor auth is not required');
                            token = Robinhood.auth_token();
                            resolve({token});
                        }
                    });
                });
            });
        });
    });
};
