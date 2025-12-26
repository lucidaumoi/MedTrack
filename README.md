# MedTrack - Pharmaceutical Supply Chain Management System on Blockchain

<div align="center">
  <img src="https://img.shields.io/badge/Sui-Blockchain-blue?style=for-the-badge&logo=sui" alt="Sui Blockchain"/>
  <img src="https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-blue?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Move-Language-orange?style=for-the-badge" alt="Move Language"/>
</div>

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Installation & Setup](#-installation--setup)
- [📖 User Guide](#-user-guide)
- [🔧 Development](#-development)
- [🔐 Security](#-security)
- [🧪 Testing](#-testing)
- [📚 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Overview

**MedTrack** is an advanced pharmaceutical supply chain management system using Sui blockchain technology, ensuring 100% transparency, security, and traceability from manufacturer to consumer.

### 🎯 Objectives
- ✅ **Absolute Transparency**: All transactions recorded on blockchain
- 🔒 **High Security**: Sensitive information encrypted with TweetNaCl
- 🔍 **Instant Traceability**: Track medicine journey with just 1 click
- 📱 **Optimal Experience**: User-friendly, responsive interface
- ⚡ **Superior Performance**: Uses Sui - the fastest blockchain

### 🎯 Workflow

```
🏭 Producer → 🚚 Carrier → 🏥 Pharmacy → 👥 Consumer
     ↓         ↓         ↓         ↓
  Create     Update     Receive    Track
  Order    Shipping   Completed   Journey
```

---

## ✨ Key Features

### 🏭 Manufacturer (Producer)
- **Create orders** with sensitive information encryption
- **Standard medicine codes**: `PTS-2025-12` (Paracetamol-2025-month 12)
- **Maximum security**: Address & phone encrypted
- **Real-time tracking**: Monitor order status

### 🚚 Carrier
- **Key pair generation**: Auto-generate public/private key pairs
- **Decrypt information**: Secure access to delivery addresses
- **Location tracking**: Real-time shipping location updates
- **Status updates**: Notify all parties of status changes

### 🏥 Pharmacy
- **Instant receipt**: Confirm delivery with 1 click
- **Complete information**: Store pharmacy name & contact details
- **Delivery confirmation**: Complete supply chain
- **Inventory management**: Integrated inventory management

### 🔍 Tracking
- **Batch ID lookup**: Quick search by medicine batch ID
- **Visual timeline**: Display journey with intuitive interface
- **Contact information**: Contact details at each step
- **QR Code support**: Scan codes for quick lookup

---

## 🏗️ System Architecture

### 📁 Project Structure

```
MedTrack/
├── medtrack/                    # 🏗️ Smart Contract (Move)
│   ├── sources/
│   │   └── supply_chain.move    # Main system logic
│   ├── tests/                   # 🧪 Unit tests
│   ├── Move.toml               # ⚙️ Dependencies & config
│   └── Move.lock               # 🔒 Lock file
│
├── medtrack-fe/                 # 🎨 Frontend (React + TypeScript)
│   ├── public/                  # 📁 Static assets
│   ├── src/
│   │   ├── components/          # 🧩 Reusable components
│   │   ├── pages/               # 📄 Main pages
│   │   │   ├── ProducerPage.tsx # 🏭 Manufacturer page
│   │   │   ├── CarrierPage.tsx  # 🚚 Carrier page
│   │   │   ├── PharmacyPage.tsx # 🏥 Pharmacy page
│   │   │   └── TrackingPage.tsx # 🔍 Tracking page
│   │   ├── utils/               # 🛠️ Utilities
│   │   ├── constants.ts         # ⚙️ App configuration
│   │   ├── App.tsx             # 🎯 Main app component
│   │   └── main.tsx            # 🚀 Entry point
│   ├── package.json            # 📦 Dependencies
│   ├── tailwind.config.ts      # 🎨 Styling config
│   ├── vite.config.ts          # ⚡ Build config
│   └── tsconfig.json           # 📝 TypeScript config
│
├── .git/                       # 📚 Version control
├── README.md                   # 📖 This file
├── USER_FLOW.md                # 👥 User flow documentation
└── README_COMPLETE.md          # 📚 Detailed documentation
```

### 🔄 Luồng Dữ Liệu

```mermaid
graph TB
    A[🏭 Producer] --> B[🔐 Encrypt Data]
    B --> C[📦 Create Batch]
    C --> D[⛓️ Store on Sui]

    E[🚚 Carrier] --> F[🔓 Decrypt Data]
    F --> G[🚛 Update Shipping]
    G --> D

    H[🏥 Pharmacy] --> I[✅ Confirm Delivery]
    I --> D

    J[👥 Consumer] --> K[🔍 Query Batch]
    K --> L[📊 Display Timeline]
    D --> L
```

### 💻 Công Nghệ Sử Dụng

#### 🎨 Frontend Stack
- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Sui dApp Kit** - Official Sui blockchain integration
- **Vite** - Lightning-fast build tool & dev server
- **React Router** - Client-side routing

#### ⛓️ Blockchain Stack
- **Sui Network** - High-performance Layer 1 blockchain
- **Move Language** - Resource-oriented programming language
- **Sui CLI** - Development & deployment tools
- **TweetNaCl** - Cryptographic operations

#### 🔐 Security & Validation
- **Wallet Authorization** - Whitelist-based access control
- **Input Sanitization** - Comprehensive validation
- **Cryptographic Security** - End-to-end encryption
- **Audit Trail** - Complete transaction history

---

## 🚀 Installation & Setup

### 📋 System Requirements

- **Node.js**: 18.0.0 or higher
- **Sui CLI**: Latest version
- **Git**: For version control
- **Browser**: Chrome/Firefox with Sui Wallet extension

### ⚡ Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd MedTrack

# 2. Install frontend dependencies
cd medtrack-fe
npm install

# 3. Run development server
npm run dev

# 4. Mở browser và truy cập
# http://localhost:5173/
```

### 🏗️ Setup Chi Tiết

#### Backend (Smart Contract)
```bash
# 1. Build smart contract
cd medtrack
sui move build

# 2. Deploy to testnet
sui client publish --gas-budget 200000000

# 3. Update PACKAGE_ID in constants.ts
```

#### Frontend
```bash
# 1. Install dependencies
cd medtrack-fe
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

### 🔧 Environment Configuration

Create `.env.local` file in the `medtrack-fe/` directory:

```env
# Network configuration
VITE_NETWORK=testnet

# Smart contract addresses
VITE_PACKAGE_ID=0xb7041c6d6d14f8dafeebc61604643ea031a06540a0201bc864835bae28980ccb
VITE_MODULE_NAME=supply_chain

# Feature flags
VITE_ENABLE_DEBUG=true
```

---

## 📖 User Guide

### 🔑 Initial Setup

1. **Install Sui Wallet**
   - Download Sui Wallet extension
   - Create or import wallet
   - Ensure sufficient SUI testnet balance

2. **Connect Application**
   - Visit http://localhost:5173/
   - Click "Connect Wallet"
   - Select wallet and approve

3. **Check Authorization**
   - Wallet address must be in allowed list
   - Contact admin if not authorized

### 🏭 Order Creation Process

#### Step 1: Access Producer Page
```
URL: http://localhost:5173/#/producer
```

#### Step 2: Receive Public Key from Carrier
- Carrier generates key pair and sends Public Key
- Producer pastes Public Key into form

#### Step 3: Fill Information
- **Medicine Code**: `PTS-2025-12`
- **Company Name**: `ABC Pharmaceutical Company`
- **Phone**: `0896739545`
- **Receiver Company**: `XYZ Pharmacy`
- **Delivery Address**: `123 ABC Street, DEF Ward...`
- **Receiver Phone**: `0987654321`

#### Step 4: Create Order
- Click "🔒 Encrypt & Send to Blockchain"
- Approve transaction in wallet
- Receive Batch ID

### 🚚 Shipping Process

#### Step 1: Generate Key Pair
```
URL: http://localhost:5173/#/carrier
```
- Click "🆕 Generate New Key"
- **Important**: Save Private Key in a secure location
- Copy Public Key and send to Producer

#### Step 2: Receive Order
- Receive Batch ID from Producer
- Paste into form and decrypt

#### Step 3: Update Shipping
- Fill shipping information
- Click "📦 Confirm In Transit"

### 🏥 Delivery Process

#### Step 1: Access Pharmacy Page
```
URL: http://localhost:5173/#/pharmacy
```

#### Step 2: Confirm Delivery
- **Batch ID**: From Producer/Carrier
- **Pharmacy Name**: `ABC Pharmacy`
- **Phone**: `0987654321`

#### Step 3: Complete
- Click "✅ Confirm Order Received"

### 🔍 Tracking Journey

#### Step 1: Access Tracking Page
```
URL: http://localhost:5173/#/tracking
```

#### Step 2: Search
- Paste Batch ID
- Click "🔍 Search"

#### Step 3: View Results
- Complete medicine batch timeline
- Contact information at each step
- Current status

---

## 🔧 Development

### 🏗️ Development Workflow

```bash
# 1. Setup development environment
npm install

# 2. Start development server with hot reload
npm run dev

# 3. Run linting
npm run lint

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### 📝 Available Scripts

```json
{
  "scripts": {
    "dev": "vite",                    // Development server
    "build": "tsc && vite build",     // Production build
    "lint": "eslint . --ext ts,tsx",  // Code linting
    "preview": "vite preview",        // Preview production build
    "type-check": "tsc --noEmit"      // Type checking
  }
}
```

### 🔄 Smart Contract Development

```bash
# Build contract
cd medtrack
sui move build

# Run tests
sui move test

# Publish to testnet
sui client publish --gas-budget 200000000

# Verify deployment
sui client object <PACKAGE_ID>
```

### 🧩 Component Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── utils/              # Helper functions
├── constants.ts        # Configuration
├── App.tsx            # Main app
└── main.tsx           # Entry point
```

---

## 🔐 Security

### 👛 Wallet Authorization

Chỉ các ví được liệt kê mới được phép sử dụng:

```typescript
export const ALLOWED_WALLETS = [
  "0x915342dba62fb2dceb7405a22fe19e0e3627bedbe9bca822c0b3464546e312b3", // Admin
  "0x90eb4ce69bf7fc934f8e8bd688d2da7bc8916a8a30358bb568aa6087efe89a50", // Authorized
];
```

### 🔒 Mã Hóa Dữ Liệu

- **Thuật toán**: TweetNaCl (X25519 key exchange)
- **Thông tin nhạy cảm**: Địa chỉ giao hàng, số điện thoại
- **Truy cập**: Chỉ Carrier với Private Key mới giải mã

### ✅ Validation Rules

- **Mã thuốc**: Regex `^[A-Za-z]{2,4}-\d{4}-\d{2}$`
- **Số điện thoại**: Format Việt Nam `0xxxxxxxxx` hoặc `+84xxxxxxxxx`
- **Batch ID**: Hex format `0x[64 ký tự hex]`
- **Địa chỉ**: Ít nhất 10 ký tự, đầy đủ thông tin

---

## 🧪 Testing

### 🏃‍♂️ Chạy Tests

```bash
# Frontend tests
cd medtrack-fe
npm test

# Smart contract tests
cd medtrack
sui move test
```

### 🧪 Test Coverage

- **Unit Tests**: Component logic
- **Integration Tests**: Blockchain interactions
- **E2E Tests**: Complete user workflows
- **Security Tests**: Authorization & encryption

---

## 📚 API Documentation

### 🎯 Smart Contract Functions

#### `create_record`
```move
entry fun create_record(
    medicine_code: String,
    manufacturer: String,
    producer_phone: String,
    receiver_company: String,
    info: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### `update_record_shipping`
```move
entry fun update_record_shipping(
    batch: &mut MedicineBatch,
    carrier_name: String,
    carrier_phone: String,
    delivery_location: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

#### `complete_record_delivery`
```move
entry fun complete_record_delivery(
    batch: &mut MedicineBatch,
    pharmacy_name: String,
    pharmacy_phone: String,
    pharmacy_location: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### 📊 Data Structures

#### `MedicineBatch`
```move
public struct MedicineBatch has key {
    id: UID,
    medicine_code: String,
    current_status: u8,
    history: vector<ID>,
}
```

#### `StatusRecord`
```move
public struct StatusRecord has key {
    id: UID,
    batch_id: ID,
    status: u8,
    actor: address,
    location_info: String,
    phone: String,
    timestamp: u64,
    note: String
}
```

---

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết.

### 📋 Development Process

1. **Fork** repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to branch (`git push origin feature/AmazingFeature`)
5. **Open** Pull Request

### 🐛 Bug Reports & Feature Requests

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: contact@medtrack.dev

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sui Foundation** - For the amazing blockchain infrastructure
- **Move Language** - For the secure smart contract language
- **React Community** - For the excellent frontend framework
- **Open Source Community** - For the countless tools and libraries

---

<div align="center">

**🎉 MedTrack - Elevating Medicine Safety for the Future!**

*Built with ❤️ for a safer pharmaceutical supply chain*

---

*Last updated: December 2025*  
*Version: 1.0.0*

</div>
