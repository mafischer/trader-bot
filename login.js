#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

let username, password, token;

rl.question(`Please enter your userid: `, uid => {
    username = uid;
    rl.question(`${username}, please enter your password: `, pw => {
        password = pw;
        console.log(`${username}:${password}`);
        const Robinhood = require('robinhood')({username,password}, data => {
            console.log(JSON.stringify(data));
            rl.question(`Please enter your multi-factor authentication passcode: `, mfaCode => {
                if (data && data.mfa_required) {
                    Robinhood.set_mfa_code(mfaCode, () => {
                        token = Robinhood.auth_token();
                        rl.close();
                        console.log(token);
                        fs.writeFileSync('credentials.json', JSON.stringify({token}));
                    });
                }
                else {
                    console.log('multi-factor auth is not required');
                    token = Robinhood.auth_token();
                    rl.close();
                    console.log(token);
                    fs.writeFileSync('credentials.json', JSON.stringify({token}));
                }
            });
        });
    });
});
