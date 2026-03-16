import { NextRequest, NextResponse } from 'next/server';
import Web3 from "web3";
import { rpcUrl, bscChainIdinNumer } from "../../../components/constent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to } = body;
    if (!to) {
      console.error("Missing 'to' address in request body");
      return NextResponse.json({ error: "Missing 'to' address" }, { status: 400 });
    }

    const rawKey = process.env.NEXT_PRIVATE_KEY || "";
    if (!rawKey) {
      console.error("Private key not set in environment variables");
      return NextResponse.json({ error: "Private key not set in environment variables" }, { status: 500 });
    }
    const privateKey = rawKey.startsWith("0x") ? rawKey : "0x" + rawKey;

    const web3 = new Web3(rpcUrl);
    const accountObj = web3.eth.accounts.privateKeyToAccount(privateKey);
    const account = accountObj.address;

    // Check sender balance first
    const senderBalanceWei = await web3.eth.getBalance(account);
    console.log(`Sender balance: ${web3.utils.fromWei(senderBalanceWei, 'ether')} BNB`);

    const minGasBNB = 0.0000258075;
    const topUpBNB = 0.0000258075;

    const toBalanceWei = await web3.eth.getBalance(to);
    const minGasWei = web3.utils.toWei(minGasBNB.toString(), "ether");

    if (BigInt(toBalanceWei) < BigInt(minGasWei)) {
      const topUpWei = web3.utils.toWei(topUpBNB.toString(), "ether");

      // Get current gas price
      const gasPrice = await web3.eth.getGasPrice();

      const gasLimit = BigInt(21000);
      const nonce = await web3.eth.getTransactionCount(account, "pending");
      
      const txObject = {
        nonce: web3.utils.toHex(nonce),
        to: to,
        value: "95807500000000", // 0.0000258075 BNB in wei
        gas: gasLimit.toString(), // 21000
        gasPrice: "1000000000", // 1 Gwei
        chainId: bscChainIdinNumer,
      };

      console.log("Transaction object:", txObject);

      const signed = await web3.eth.accounts.signTransaction(txObject, privateKey);
      if (!signed.rawTransaction) {
        console.error("Failed to sign top-up transaction");
        throw new Error("Failed to sign top-up transaction");
      }

      const topUpReceipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);

      return NextResponse.json({
        isNeededGas: true,
        status: topUpReceipt.status && Number(topUpReceipt.status) === 1 ? true : false,
        txhash: topUpReceipt.transactionHash,
        error: null
      });
    }

    return NextResponse.json({
      isNeededGas: false,
      status: true,
      txhash: null,
      error: null,
    });
  } catch (err) {
    console.error("Error in top-up POST handler:", err);
    return NextResponse.json({
      isNeededGas: false,
      status: false,
      txhash: null,
      error: (err as Error).message || "Internal server error",
    }, { status: 500 });
  }
}