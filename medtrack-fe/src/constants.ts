// src/constants.ts
export const NETWORK = "testnet";
// Package ID sau khi deploy smart contract lên testnet
export const PACKAGE_ID = "0xe0152c8b3cae3b7f28e5d93235d9cb658dec3f694d89851894c87abe09e38124";
export const MODULE_NAME = "supply_chain";

// Danh sách địa chỉ ví được phép sử dụng hệ thống
export const ALLOWED_WALLETS = [
  "0x915342dba62fb2dceb7405a22fe19e0e3627bedbe9bca822c0b3464546e312b3", // Admin wallet
  "0x90eb4ce69bf7fc934f8e8bd688d2da7bc8916a8a30358bb568aa6087efe89a50", // Authorized wallet
  // Thêm các địa chỉ ví khác vào đây
];