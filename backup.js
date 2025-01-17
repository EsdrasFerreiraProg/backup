const fs = require('fs/promises'); 


//*Developed by @Esdras Ferreira
//*The main function is the most important one
//testRigor Inc.

function getJsonFileForBackupSuite(url, token){
    const https = require('https'); 
    const fs = require('fs'); 

    const options = {
        method: 'GET',
        headers: {
            'auth-token': token
        }
    };

    https.get(url, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {

            fs.writeFile('response.json', data, (err) => {
                if (err) {
                    return {'Error saving file:': err};
                } else {
                    return 'Response saved to response.json';
                }
            });
        });

    }).on('error', (error) => {
        return {'Request error:': error};

    });

    return "\x1b[1;32mResponse saved to response.json\x1b[0m";
    
}

async function readJson() {
    const filePath = './response.json';

    try {

        const data = await fs.readFile(filePath, 'utf-8');
        let newData = data.replace(/uuid/g, "testCaseUuid");

        const content = JSON.parse(newData).data.content; 
        content.forEach(item=>{
            delete item.createdAt;
            delete item.createdBy;
            delete item.modifiedBy;
            delete item.modifiedAt;
            delete item.disabled;

        })

        return content;
        
    } catch (error) {
        console.error('Error reading JSON file:', error.message);
        throw error; 
    }
}

async function rollbackSuiteTests(url, token, tests){
    const https = require('https');

    const data = JSON.stringify({

        forceCancelPreviousTesting: true,
        baselineMutations: tests

    });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'auth-token': token,

        }
    };

    const req = https.request(url, options, (response) => {
        let responseData = '';

        response.on('data', (chunk) => {
            responseData += chunk;
        });

        response.on('end', () => {
            console.log('Response:', responseData); 
        });
    });

    req.on('error', (error) => {
        console.error('Request error:', error);
    });

    req.write(data);
    req.end();

    return tests;

}

function showOptions(prompt){
    const options = ['1','2','3'];

    console.log("\x1b[1;32m===============%-Hello, welcome to the backup assistant-%===============\x1b[0m");
    console.log("Please choose one of the options below:");
    console.log("1 - Backup a test suite");
    console.log("2 - Restore a test suite");
    console.log("3 - Exit")

    const option = prompt("Option: ");
    if (!options.includes(option)){
        console.log("Invalid option");
        showOptions(prompt);
    }else{
        return option;
    }
}

function validateTokenAndURL(url, token){
    const regex = /^https:\/\/api2\.testrigor\.com\/api\/v1\/apps\/\w*\/test_cases$|^https:\/\/api\.testrigor\.com\/api\/v1\/apps\/\w*\/retest$/;
    const regexToken = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/

    if (!regex.test(url)) {
        console.log("Invalid URL, please try again");
        main();
        
    }
    if (!regexToken.test(token)) {
        console.log("Invalid Token, please try again");
        main();
        
    }
}
function main(){
    const prompt = require("prompt-sync")();

    const option = showOptions(prompt);

    if (option == '1'){
        const url = prompt("Type the from suite URL: ");
        const token = prompt("Type your token: ");
        validateTokenAndURL(url,token);

        console.log(getJsonFileForBackupSuite(url, token));
        return;
    }

    if (option == '2'){
        
        console.log("\x1b[31m*************=Please be very careful while rolling back the suite=*************\x1b[0m");
        const url = prompt("Type the to (target) suite URL: ");
        const token = prompt("Type your token: ");

        validateTokenAndURL(url, token);

        readJson().then(content=>{
            rollbackSuiteTests(url, token, content)
        }).catch(error => {
            console.log(error)
        }).finally(() => {
            console.log(`The test suite with token ${token} was successfully rolled back`);
            console.log("\x1b[31mWait..........................->->\x1b[0m");
            
        });
    }

    if (option == '3'){
        console.log("Goodbye!");
        process.exit(0);
    }
    
}

main();