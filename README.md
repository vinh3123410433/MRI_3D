# MRI 3D Visualization Application | Ứng dụng Hiển thị MRI 3D

A web application for visualizing 3D MRI scans using NIFTI files (.nii/.nii.gz).
Ứng dụng web để hiển thị hình ảnh MRI 3D sử dụng tệp NIFTI (.nii/.nii.gz).

## Tính năng chi tiết

### 1. Quản lý bệnh nhân
- Xem danh sách bệnh nhân với thông tin cơ bản
- Tìm kiếm bệnh nhân theo tên hoặc số điện thoại
- Xem thông tin chi tiết của từng bệnh nhân:
  - Họ tên
  - Ngày sinh
  - Giới tính
  - Tình trạng bệnh
  - Lịch hẹn khám tiếp theo
  - Lịch sử khám bệnh
  - Hình ảnh MRI đã chụp

### 2. Xem và xử lý mô hình 3D
- Tải lên file MRI định dạng NIFTI (.nii hoặc .nii.gz)
- Điều chỉnh ngưỡng hiển thị của mô hình 3D
- Tương tác với mô hình 3D:
  - Xoay: Click chuột trái và kéo
  - Thu phóng: Lăn chuột
  - Di chuyển: Click chuột phải và kéo
- Hiển thị trạng thái tải và xử lý file
- Hỗ trợ xử lý các file MRI dung lượng lớn

### 3. Tính năng tài khoản
- Đăng ký tài khoản mới với:
  - Họ và tên
  - Email
  - Mật khẩu
- Đăng nhập vào hệ thống
- Lưu trữ thông tin và lịch sử làm việc

## Features | Tính năng

- 3D visualization of MRI scans | Hiển thị 3D của hình ảnh MRI
- Support for NIFTI file formats (.nii, .nii.gz) | Hỗ trợ định dạng tệp NIFTI (.nii, .nii.gz)
- Interactive 3D model manipulation | Tương tác với mô hình 3D
- Real-time loading indicators | Chỉ báo tải theo thời gian thực
- Error handling for file processing | Xử lý lỗi khi xử lý tệp
- Responsive design | Thiết kế tương thích

## Installation | Cài đặt

1. Clone the repository | Clone kho lưu trữ:
```bash
git clone [repository-url]
cd do_an_MRI_thanh_3D
```

2. Install dependencies | Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Start development server | Khởi chạy máy chủ phát triển:
```bash
npm run dev
```

4. Build for production | Xây dựng cho production:
```bash
npm run build
```

5. Preview production build | Xem trước bản production:
```bash
npm run preview
```

## Usage | Hướng dẫn sử dụng

1. Access the application | Truy cập ứng dụng:
   - Development: Open `http://localhost:5173/` in your browser | Mở `http://localhost:5173/` trong trình duyệt
   - Production: Open `http://localhost:4173/` in your browser | Mở `http://localhost:4173/` trong trình duyệt

2. Navigate to 3D Visualization | Điều hướng đến phần Hiển thị 3D:
   - Click on "Mô hình 3D" in the navigation bar | Nhấp vào "Mô hình 3D" trong thanh điều hướng

3. Upload MRI File | Tải lên tệp MRI:
   - Click the upload button or drag and drop a NIFTI file (.nii or .nii.gz) | Nhấp vào nút tải lên hoặc kéo và thả tệp NIFTI
   - Wait for the file to process and the 3D model to load | Đợi tệp được xử lý và mô hình 3D được tải

4. Interact with the 3D Model | Tương tác với Mô hình 3D:
   - Rotate: Click and drag | Xoay: Nhấp và kéo
   - Zoom: Use mouse wheel | Thu phóng: Sử dụng con lăn chuột
   - Pan: Right-click and drag | Di chuyển: Nhấp chuột phải và kéo

## Hướng dẫn sử dụng chi tiết

### Cài đặt và chạy ứng dụng

1. Clone the repository | Clone kho lưu trữ:
```bash
git clone [repository-url]
cd do_an_MRI_thanh_3D
```

2. Install dependencies | Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Start development server | Khởi chạy máy chủ phát triển:
```bash
npm run dev
```

4. Build for production | Xây dựng cho production:
```bash
npm run build
```

5. Preview production build | Xem trước bản production:
```bash
npm run preview
```

### Sử dụng ứng dụng

1. Đăng nhập và quản lý tài khoản:
   - Nhấp vào nút "Đăng nhập" ở góc phải trên cùng
   - Nhập thông tin đăng nhập hoặc tạo tài khoản mới
   - Sau khi đăng nhập, bạn có thể truy cập đầy đủ các tính năng

2. Quản lý bệnh nhân:
   - Chọn "Quản lý bệnh nhân" trên thanh điều hướng
   - Sử dụng thanh tìm kiếm để tìm bệnh nhân theo tên hoặc số điện thoại
   - Nhấp vào một bệnh nhân để xem thông tin chi tiết
   - Xem lịch sử khám và hình ảnh MRI của bệnh nhân

3. Xử lý và xem mô hình 3D:
   - Chọn "Mô hình 3D" trên thanh điều hướng
   - Tải lên file MRI bằng cách:
     + Nhấp vào nút tải lên
     + Hoặc kéo và thả file trực tiếp
   - Điều chỉnh thanh trượt ngưỡng để tối ưu hiển thị
   - Tương tác với mô hình:
     + Xoay: Click và kéo chuột
     + Thu phóng: Lăn chuột
     + Di chuyển: Click chuột phải và kéo

## Notes | Lưu ý

- The application supports modern browsers with WebGL capabilities | Ứng dụng hỗ trợ các trình duyệt hiện đại có khả năng WebGL
- Large NIFTI files may take longer to process | Các tệp NIFTI lớn có thể mất nhiều thời gian để xử lý
- Ensure you have a stable internet connection | Đảm bảo kết nối internet ổn định
- For optimal performance, use Chrome or Firefox | Để có hiệu suất tốt nhất, hãy sử dụng Chrome hoặc Firefox

## Technical Improvements | Cải tiến Kỹ thuật

Recent updates include:
- Enhanced error handling for file processing
- Optimized 3D geometry creation
- Improved scene initialization
- Added loading indicators for better user experience
- Fixed "Cannot read properties of undefined (reading 'S')" error

Các cập nhật gần đây bao gồm:
- Tăng cường xử lý lỗi khi xử lý tệp
- Tối ưu hóa việc tạo hình học 3D
- Cải thiện khởi tạo scene
- Thêm chỉ báo tải để trải nghiệm người dùng tốt hơn
- Đã sửa lỗi "Cannot read properties of undefined (reading 'S')"

## Xử lý sự cố thường gặp

1. File MRI không tải được:
   - Kiểm tra định dạng file (.nii hoặc .nii.gz)
   - Đảm bảo dung lượng file không quá lớn
   - Kiểm tra kết nối internet

2. Mô hình 3D hiển thị không đúng:
   - Điều chỉnh thanh trượt ngưỡng
   - Làm mới trang và tải lại file
   - Kiểm tra xem trình duyệt có hỗ trợ WebGL không

3. Ứng dụng chậm hoặc không phản hồi:
   - Đóng các tab và ứng dụng không cần thiết
   - Sử dụng trình duyệt Chrome hoặc Firefox phiên bản mới nhất
   - Đảm bảo máy tính có đủ RAM và CPU