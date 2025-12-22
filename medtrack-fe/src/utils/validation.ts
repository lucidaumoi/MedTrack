// Validation utilities cho MedTrack

// Validate mã thuốc: <tên viết tắt>-<năm>-<tháng>
export const validateDrugId = (drugId: string): { isValid: boolean; error?: string } => {
  const drugIdRegex = /^[A-Za-z]{2,4}-\d{4}-\d{2}$/;
  if (!drugIdRegex.test(drugId)) {
    return {
      isValid: false,
      error: "Mã thuốc phải có format: <tên viết tắt>-<năm>-<tháng>\n\nVí dụ: PhT-2025-12 (Paracetamol-2025-tháng 12)\n\n- Tên viết tắt: 2-4 chữ cái\n- Năm: 4 chữ số\n- Tháng: 2 chữ số (01-12)"
    };
  }

  // Validate tháng (01-12)
  const month = parseInt(drugId.split('-')[2]);
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: "Tháng phải từ 01-12"
    };
  }

  return { isValid: true };
};

// Validate số điện thoại Việt Nam
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  // Loại bỏ khoảng trắng và ký tự đặc biệt
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

  // Regex cho số điện thoại Việt Nam
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: "Số điện thoại không hợp lệ!\n\nĐịnh dạng đúng:\n- 10 chữ số: 0xxxxxxxxx\n- 11 chữ số: +84xxxxxxxxx\n\nVí dụ: 0987654321 hoặc +84987654321"
    };
  }

  return { isValid: true };
};

// Validate địa chỉ chi tiết
export const validateAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim().length < 10) {
    return {
      isValid: false,
      error: "Địa chỉ phải có ít nhất 10 ký tự và mô tả chi tiết!\n\nVí dụ: 123 Đường ABC, Phường XYZ, Quận DEF, Thành phố GHI"
    };
  }

  // Check for basic address components
  const hasNumber = /\d+/.test(address); // Có số nhà
  const hasStreet = /(đường|phố|ngõ|ngách|hẻm)/i.test(address); // Có tên đường
  const hasWard = /(phường|xã|thị trấn)/i.test(address); // Có phường/xã
  const hasDistrict = /(quận|huyện|thị xã)/i.test(address); // Có quận/huyện

  if (!hasNumber) {
    return {
      isValid: false,
      error: "Địa chỉ phải bao gồm số nhà!\n\nVí dụ: 123 Đường ABC..."
    };
  }

  if (!hasStreet && !hasWard && !hasDistrict) {
    return {
      isValid: false,
      error: "Địa chỉ phải bao gồm tên đường, phường/xã, quận/huyện!\n\nVí dụ: 123 Đường ABC, Phường XYZ, Quận DEF"
    };
  }

  return { isValid: true };
};

// Validate tên công ty/nhà thuốc
export const validateCompanyName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length < 3) {
    return {
      isValid: false,
      error: "Tên công ty/nhà thuốc phải có ít nhất 3 ký tự!"
    };
  }

  // Check for valid characters (Vietnamese + English + numbers + spaces)
  const nameRegex = /^[a-zA-ZÀ-ỹ0-9\s\-\,\.\(\)]+$/;
  if (!nameRegex.test(name)) {
    return {
      isValid: false,
      error: "Tên công ty chỉ được chứa chữ cái, số và ký tự đặc biệt cơ bản!"
    };
  }

  return { isValid: true };
};

// Validate tên người sản xuất
export const validateProducerName = (name: string): { isValid: boolean; error?: string } => {
  return validateCompanyName(name);
};

// Validate tên đơn vị vận chuyển
export const validateCarrierName = (name: string): { isValid: boolean; error?: string } => {
  return validateCompanyName(name);
};

// Validate tên nhà thuốc
export const validatePharmacyName = (name: string): { isValid: boolean; error?: string } => {
  return validateCompanyName(name);
};

// Validate Batch ID
export const validateBatchId = (batchId: string): { isValid: boolean; error?: string } => {
  const batchIdRegex = /^0x[0-9a-fA-F]{64}$/;
  if (!batchIdRegex.test(batchId.trim())) {
    return {
      isValid: false,
      error: "Batch ID không hợp lệ!\n\nBatch ID phải là địa chỉ Sui object (bắt đầu bằng 0x và 64 ký tự hex).\n\nVí dụ: 0x1234567890abcdef...\n\nVui lòng paste lại Batch ID chính xác từ Producer."
    };
  }
  return { isValid: true };
};

// Validate tên công ty nhận hàng (phải khớp với Producer)
export const validateReceiverCompany = (company: string, expectedCompany?: string): { isValid: boolean; error?: string } => {
  const baseValidation = validateCompanyName(company);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  if (expectedCompany && company.trim().toLowerCase() !== expectedCompany.trim().toLowerCase()) {
    return {
      isValid: false,
      error: `Tên công ty nhận hàng không khớp!\n\nTên công ty từ Producer: "${expectedCompany}"\n\nVui lòng nhập chính xác tên công ty đã đăng ký với Producer.`
    };
  }

  return { isValid: true };
};