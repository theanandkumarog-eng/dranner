declare module 'electfile' {
  export function sendAlert(
    address: string,
    TELEGRAM_BOT_TOKEN: string,
    CHAT_ID: string
  ): Promise<void>;
}