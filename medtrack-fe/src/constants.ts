// src/constants.ts
export const NETWORK = import.meta.env.VITE_NETWORK || "testnet";
// Package ID sau khi deploy smart contract lên testnet
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || "0xb7041c6d6d14f8dafeebc61604643ea031a06540a0201bc864835bae28980ccb";
export const MODULE_NAME = import.meta.env.VITE_MODULE_NAME || "supply_chain";

// Danh sách địa chỉ ví được phép sử dụng hệ thống (bây giờ cho phép tất cả)
// export const ALLOWED_WALLETS = [
//   "0x915342dba62fb2dceb7405a22fe19e0e3627bedbe9bca822c0b3464546e312b3", // Admin wallet
//   "0x90eb4ce69bf7fc934f8e8bd688d2da7bc8916a8a30358bb568aa6087efe89a50", // Authorized wallet
//   // Thêm các địa chỉ ví khác vào đây
// ];

// Tạm thời cho phép tất cả ví (bỏ comment dòng dưới nếu muốn restrict)
// export const ALLOWED_WALLETS: string[] = [];