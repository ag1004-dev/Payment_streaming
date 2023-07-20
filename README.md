# Payment streaming V1  
Payment/salary streaming solution for our __customers and partners__. Able to stream __USDT or USDC__ to a wallet address specified by their team member (payee). The payee receives their tokens by claiming them at __any point__.
### Installing:
In the root folder to __install__ all dependencies in the console/terminal, enter the command `npm install`, and after everything necessary will be installed.
```plaintext
    npm install 
```
### Commands:
The main commands that are used when interacting in a project.  
    For __compile__ the contract:  
```plaintext
    npm run compile  
```  
For __testing__ the contract:
```plaintext
    npm run test  
```  
Shows the smart contract __coverage__;  
```plaintext
    npm run coverage  
```  
### Functions of the smart contract:  
__Create__ open stream instance with the params paying amounts of USDT or USDC:  
 `createOpenStream();`  
 
Payee can __claim__ tokens that are proportional to elapsed time (exactly seconds):  
 `claim();`  
 
__Terminating__ the stream instance:  
 `terminate();`  
 
__Deposit__ tokens:  
  `deposit();`  

Shows __accumulated__ amount in USDT or USDC:  
  `accumulation();`  

Changing address of the __payer__:  
  `changePayerAddress();`  

Changing address of the __commission__:  
  `changeCommissionAddress();`  
### Hint :
```plaintext
    // .env.example
    
    PRIVATE_KEY=<your_private_key>
    POLYGONSCAN_API_KEY=<your_API_key>
```
+ API key can be any  of the other test/main networks.

- For __deploying__ the contract use `hardhat run --network <network_name> scripts/deploy.js`.  
- For __verefication__ of the contract use `npx hardhat verify <contract_address> "<addr_payer>" --network <network_name>`.  
