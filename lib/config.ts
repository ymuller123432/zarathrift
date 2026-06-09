import { BusinessConfig } from './types';

export const businessConfig: BusinessConfig = {
  accountName: "Zara Thrift Ventures",
  accountNumber: "0123456789", // ← CHANGE THIS to your real Moniepoint account number
  bankName: "Moniepoint Microfinance Bank",
  whatsappNumber: "2348012345678", // ← CHANGE THIS to your WhatsApp number (international format, no +)
  // Default Lagos delivery rules (admin can edit in Settings)
  lagosDeliveryFee: 2500,
  lagosFreeThreshold: 35000,
  lagosIslandSurcharge: 1500, // extra for Island / Lekki / Ajah
  lagosMainlandFee: 2000,
};
