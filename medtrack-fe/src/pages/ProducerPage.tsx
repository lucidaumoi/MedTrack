import { useState } from 'react';
import EthCrypto from 'eth-crypto'; // 1. Import thư viện mã hóa

export default function ProducerPage() {
    // --- State cho thông tin thuốc ---
    const [drugId, setDrugId] = useState('');
    const [producerName, setProducerName] = useState('');

    // --- State cho thông tin Người nhận ---
    const [receiverCompany, setReceiverCompany] = useState('');
    const [receiverAddress, setReceiverAddress] = useState(''); // Thông tin nhạy cảm
    const [receiverPhone, setReceiverPhone] = useState('');     // Thông tin nhạy cảm
    
    // --- State MỚI: Khóa công khai của Carrier ---
    const [carrierPublicKey, setCarrierPublicKey] = useState(''); 

    const handleCreateOrder = async () => {
        try {
            if (!carrierPublicKey) {
                alert("Vui lòng nhập Public Key của Carrier để mã hóa!");
                return;
            }

            // 1. Gom dữ liệu nhạy cảm cần giấu
            const secretData = {
                address: receiverAddress,
                phone: receiverPhone
            };

            // 2. Mã hóa dữ liệu bằng Public Key của Carrier
            // Hàm này trả về 1 object đã mã hóa
            const encryptedObject = await EthCrypto.encryptWithPublicKey(
                carrierPublicKey, 
                JSON.stringify(secretData)
            );

            // 3. Chuyển object mã hóa thành chuỗi String để lưu lên Blockchain
            const encryptedString = EthCrypto.cipher.stringify(encryptedObject);

            console.log("Chuỗi mã hóa sẽ lưu lên Chain:", encryptedString);
            
            // --- GỌI SMART CONTRACT (MOVE) ---
            // Gọi hàm create_record và truyền `encryptedString` vào trường info
            // Ví dụ:
            // txb.moveCall({
            //    target: `...::create_record`,
            //    arguments: [
            //        txb.pure.string(drugId),
            //        txb.pure.string(producerName),
            //        txb.pure.string(receiverCompany),
            //        txb.pure.string(encryptedString) // <--- Gửi chuỗi mã hóa này
            //    ]
            // });

            alert("Đã tạo đơn và mã hóa dữ liệu thành công!");

        } catch (error) {
            console.error("Lỗi mã hóa:", error);
            alert("Có lỗi khi mã hóa dữ liệu (Kiểm tra lại Public Key)");
        }
    };

    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">🏭 Cổng Nhà Sản Xuất (Secure Mode)</h1>
            
            <div className="grid grid-cols-2 gap-4 max-w-2xl border p-4 rounded shadow-lg bg-white">
                {/* Phần nhập liệu cơ bản (Giữ nguyên như cũ) */}
                <div className="col-span-2 font-bold border-b pb-2">📦 Thông tin Đơn hàng</div>
                <input className="border p-2 rounded" placeholder="Mã thuốc" onChange={e => setDrugId(e.target.value)} />
                <input className="border p-2 rounded" placeholder="Tên Nhà sản xuất" onChange={e => setProducerName(e.target.value)} />
                
                {/* Phần thông tin người nhận */}
                <div className="col-span-2 font-bold border-b pb-2 mt-4">🚚 Thông tin Vận chuyển (Sẽ được Mã hóa)</div>
                
                <input 
                    className="border p-2 rounded col-span-2" 
                    placeholder="Tên Công ty nhận (Public)" 
                    onChange={e => setReceiverCompany(e.target.value)} 
                />
                <input 
                    className="border p-2 rounded col-span-2 bg-yellow-50" 
                    placeholder="📍 Địa chỉ chi tiết (Sẽ được mã hóa)" 
                    onChange={e => setReceiverAddress(e.target.value)} 
                />
                <input 
                    className="border p-2 rounded bg-yellow-50" 
                    placeholder="📞 SĐT Người nhận (Sẽ được mã hóa)" 
                    onChange={e => setReceiverPhone(e.target.value)} 
                />

                {/* Phần nhập Key của Carrier */}
                <div className="col-span-2 font-bold border-b pb-2 mt-4 text-blue-600">🔑 Khóa bảo mật</div>
                <div className="col-span-2 text-sm text-gray-500 mb-1">
                    Nhập Public Key của bên vận chuyển để khóa dữ liệu này lại. Chỉ họ mới mở được.
                </div>
                <input 
                    className="border p-2 rounded col-span-2 font-mono text-sm" 
                    placeholder="Nhập Public Key của Carrier vào đây..." 
                    onChange={e => setCarrierPublicKey(e.target.value)} 
                />

                <button 
                    onClick={handleCreateOrder}
                    className="col-span-2 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-bold mt-4"
                >
                    🔒 Mã hóa & Gửi lên Blockchain
                </button>
            </div>
        </div>
    );
}