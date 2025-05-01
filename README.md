# HỆ THỐNG HIỂN THỊ VÀ QUẢN LÝ HÌNH ẢNH MRI 3D

## GIỚI THIỆU CHUNG

Hệ thống hiển thị và quản lý hình ảnh MRI 3D là một ứng dụng web hiện đại được phát triển nhằm hỗ trợ việc xem, phân tích và quản lý hình ảnh y tế dạng MRI (Magnetic Resonance Imaging) trong không gian ba chiều. Ứng dụng cung cấp giao diện trực quan và công cụ tương tác để người dùng có thể làm việc với các tệp tin NIFTI (.nii, .nii.gz) - một định dạng phổ biến trong lĩnh vực hình ảnh y tế.

Hệ thống được thiết kế với kiến trúc hiện đại, sử dụng các công nghệ tiên tiến trong phát triển web để mang lại trải nghiệm người dùng mượt mà, đáp ứng nhanh chóng và khả năng xử lý hiệu quả đối với dữ liệu hình ảnh MRI thường có kích thước lớn và yêu cầu tính toán phức tạp.

## MỤC TIÊU ĐỀ TÀI

1. **Xây dựng nền tảng hiển thị MRI 3D**: Phát triển một ứng dụng web cho phép người dùng tải lên và xem hình ảnh MRI dưới dạng mô hình 3D tương tác, kèm theo các mặt cắt 2D theo các trục x, y, z.

2. **Cung cấp công cụ tương tác**: Tạo các công cụ cho phép bác sĩ và chuyên viên y tế có thể tương tác với mô hình 3D (xoay, phóng to, thu nhỏ, di chuyển) và điều chỉnh các thông số hiển thị (như ngưỡng hiển thị) để có cái nhìn tốt nhất về dữ liệu hình ảnh.

3. **Phát triển hệ thống quản lý bệnh nhân**: Xây dựng chức năng quản lý thông tin bệnh nhân, lưu trữ và truy xuất hình ảnh MRI liên kết với hồ sơ bệnh nhân.

4. **Tối ưu hóa hiệu suất xử lý**: Đảm bảo ứng dụng có khả năng xử lý nhanh chóng các tệp NIFTI dung lượng lớn và hiển thị mô hình 3D mượt mà trên các thiết bị khác nhau.

5. **Xây dựng giao diện người dùng thân thiện**: Thiết kế một giao diện dễ sử dụng, trực quan cho cả người dùng chuyên nghiệp và không chuyên, với khả năng đáp ứng trên nhiều kích thước màn hình.

## ĐỐI TƯỢNG VÀ PHẠM VI NGHIÊN CỨU

### Đối tượng nghiên cứu
- Các định dạng file hình ảnh MRI, đặc biệt là định dạng NIFTI (.nii, .nii.gz)
- Kỹ thuật hiển thị và xử lý hình ảnh y tế 3D trên nền tảng web
- Phương pháp lưu trữ và quản lý dữ liệu bệnh nhân và hình ảnh MRI
- Phương thức tương tác với mô hình 3D trong môi trường web

### Phạm vi nghiên cứu
- Tập trung vào hiển thị và tương tác với hình ảnh MRI 3D
- Xây dựng các công cụ cơ bản để điều chỉnh và phân tích hình ảnh
- Phát triển chức năng quản lý bệnh nhân và lưu trữ hình ảnh MRI
- Tối ưu hóa hiệu suất và trải nghiệm người dùng trên nền tảng web

## SẢN PHẨM VÀ DỊCH VỤ CUNG CẤP TRÊN WEBSITE

### Sản phẩm chính
1. **Trình xem MRI 3D tương tác**:
   - Hiển thị mô hình 3D của dữ liệu MRI
   - Các công cụ tương tác: xoay, phóng to, thu nhỏ, di chuyển
   - Điều chỉnh ngưỡng hiển thị để tối ưu hóa việc quan sát

2. **Trình xem mặt cắt MRI 2D**:
   - Hiển thị mặt cắt theo 3 mặt phẳng: YZ (Coronal), XZ (Sagittal), XY (Axial)
   - Điều chỉnh vị trí cắt trên mỗi trục
   - Tích hợp với mô hình 3D để có cái nhìn toàn diện

3. **Hệ thống quản lý bệnh nhân**:
   - Tạo và quản lý hồ sơ bệnh nhân
   - Lưu trữ lịch sử khám bệnh và hình ảnh MRI
   - Tìm kiếm và lọc thông tin bệnh nhân

### Dịch vụ cung cấp
1. **Lưu trữ và truy xuất hình ảnh MRI**:
   - Lưu trữ hình ảnh MRI liên kết với hồ sơ bệnh nhân
   - Truy xuất nhanh chóng các hình ảnh đã lưu
   - Quản lý lịch sử các lần chụp MRI

2. **Quản lý lịch hẹn**:
   - Tạo và theo dõi lịch hẹn khám bệnh
   - Nhắc nhở tự động về các lịch hẹn sắp tới
   - Quản lý thời gian và lịch làm việc của bác sĩ

3. **Nhập và xuất dữ liệu**:
   - Nhập tệp NIFTI từ thiết bị người dùng
   - Xử lý và hiển thị dữ liệu MRI
   - Lưu trữ kết quả phân tích và ghi chú

## NGHIÊN CỨU THỊ TRƯỜNG VÀ NHU CẦU KHÁCH HÀNG

### Phân tích thị trường
1. **Nhu cầu về công cụ hình ảnh y tế tương tác**:
   - Hiện nay, các bệnh viện và phòng khám đang có nhu cầu cao về các công cụ hiển thị hình ảnh MRI hiện đại và dễ sử dụng.
   - Các công cụ truyền thống thường đòi hỏi phần mềm cài đặt phức tạp và máy tính chuyên dụng với cấu hình cao.
   - Giải pháp dựa trên web cung cấp tính linh hoạt và khả năng truy cập từ nhiều thiết bị khác nhau.

2. **Xu hướng số hóa trong y tế**:
   - Ngành y tế đang trong quá trình chuyển đổi số mạnh mẽ, đặc biệt là quản lý hồ sơ bệnh án và hình ảnh y tế.
   - Nhu cầu về hệ thống tích hợp quản lý bệnh nhân và hình ảnh MRI ngày càng cao.
   - Các bác sĩ cần công cụ hiện đại để phân tích và chẩn đoán chính xác hơn.

### Nhu cầu khách hàng
1. **Bệnh viện và phòng khám**:
   - Cần một hệ thống hiển thị và quản lý hình ảnh MRI dễ sử dụng
   - Yêu cầu tích hợp với các hệ thống quản lý bệnh nhân hiện có
   - Cần khả năng truy cập từ nhiều thiết bị trong mạng nội bộ

2. **Bác sĩ và chuyên viên y tế**:
   - Mong muốn công cụ tương tác trực quan với hình ảnh MRI
   - Cần khả năng xem chi tiết từng mặt cắt và điều chỉnh các thông số hiển thị
   - Yêu cầu hệ thống lưu trữ ghi chú và nhận xét về từng hình ảnh

3. **Nghiên cứu viên y khoa**:
   - Yêu cầu công cụ phân tích dữ liệu MRI chuyên sâu
   - Cần khả năng xử lý hàng loạt hình ảnh và trích xuất thông tin
   - Mong muốn tích hợp với các công cụ phân tích thống kê

## CÁC CHỨC NĂNG CHÍNH VÀ MÔ HÌNH HỆ THỐNG

### Các chức năng chính

1. **Quản lý người dùng**:
   - Đăng ký tài khoản mới với họ tên, email và mật khẩu
   - Đăng nhập vào hệ thống
   - Quản lý thông tin cá nhân và quyền truy cập

2. **Quản lý bệnh nhân**:
   - Xem danh sách bệnh nhân với thông tin cơ bản
   - Tìm kiếm bệnh nhân theo tên hoặc số điện thoại
   - Xem và cập nhật thông tin chi tiết của bệnh nhân
   - Quản lý lịch sử khám bệnh và hình ảnh MRI

3. **Xử lý và hiển thị MRI**:
   - Tải lên file MRI định dạng NIFTI
   - Xử lý và chuẩn hóa dữ liệu
   - Hiển thị mô hình 3D tương tác
   - Hiển thị các mặt cắt 2D theo ba mặt phẳng
   - Điều chỉnh ngưỡng hiển thị và các thông số khác

4. **Quản lý lịch hẹn**:
   - Xem lịch hẹn trong dạng lịch theo ngày, tuần, tháng
   - Tạo lịch hẹn mới cho bệnh nhân
   - Nhận thông báo về lịch hẹn sắp tới

5. **Lưu trữ và quản lý dữ liệu MRI**:
   - Lưu trữ dữ liệu MRI theo bệnh nhân
   - Truy xuất và so sánh các hình ảnh MRI qua thời gian
   - Xuất dữ liệu và báo cáo phân tích

### Mô hình hệ thống

1. **Kiến trúc tổng thể**:
   - Ứng dụng web client-side sử dụng React.js
   - Backend API phục vụ việc quản lý dữ liệu và xác thực người dùng
   - Cơ sở dữ liệu lưu trữ thông tin bệnh nhân và metadata của hình ảnh MRI
   - Hệ thống lưu trữ cho các tệp tin MRI

2. **Luồng xử lý dữ liệu MRI**:
   - Người dùng tải lên tệp NIFTI
   - Hệ thống xử lý và chuẩn hóa dữ liệu
   - Dữ liệu được chuyển đổi thành cấu trúc 3D
   - Hiển thị mô hình và các mặt cắt
   - Người dùng tương tác và điều chỉnh hiển thị
   - Lưu trữ dữ liệu và liên kết với bệnh nhân (nếu cần)

3. **Luồng quản lý bệnh nhân**:
   - Người dùng tạo hồ sơ bệnh nhân mới
   - Nhập thông tin cá nhân và lịch sử y tế
   - Tạo lịch hẹn khám bệnh
   - Liên kết hình ảnh MRI với hồ sơ bệnh nhân
   - Cập nhật thông tin sau mỗi lần khám

## CÔNG NGHỆ SỬ DỤNG

### Frontend
- **Ngôn ngữ và Framework**:
  - TypeScript: Ngôn ngữ lập trình mạnh mẽ với hệ thống kiểu dữ liệu tĩnh
  - React: Thư viện JavaScript phổ biến cho việc xây dựng giao diện người dùng
  - Vite: Công cụ build hiện đại, nhanh chóng cho các ứng dụng web

- **Thư viện 3D và xử lý hình ảnh**:
  - Three.js: Thư viện JavaScript để tạo và hiển thị đồ họa 3D trong trình duyệt
  - @react-three/fiber: Renderer React cho Three.js, giúp tích hợp Three.js với React
  - @react-three/drei: Bộ công cụ hữu ích cho React Three Fiber
  - nifti-reader-js: Thư viện xử lý định dạng tệp NIFTI

- **Thiết kế giao diện**:
  - TailwindCSS: Framework CSS tiện ích cho việc xây dựng thiết kế tùy chỉnh
  - Responsive Design: Thiết kế đáp ứng cho nhiều kích thước màn hình

- **Công cụ quản lý trạng thái**:
  - React Context: Quản lý trạng thái ứng dụng, xác thực người dùng
  - localStorage: Lưu trữ dữ liệu cục bộ cho phiên làm việc

### Backend
- **Môi trường thực thi**:
  - Liên kết với Flask API (Python) thông qua RESTful endpoints
  - Xử lý yêu cầu xác thực và quản lý dữ liệu

### Cơ sở dữ liệu
- SQLite: Cơ sở dữ liệu nhẹ, dễ triển khai cho việc lưu trữ thông tin bệnh nhân, lịch hẹn
- File System/Local Storage: Lưu trữ dữ liệu hình ảnh MRI tạm thời

### Môi trường triển khai
- Phát triển: Localhost với Vite dev server
- Sản xuất: Có thể triển khai trên các nền tảng như Vercel, Netlify hoặc máy chủ web tùy chỉnh
- Tương thích với các trình duyệt hiện đại có hỗ trợ WebGL

## MÔ HÌNH DỮ LIỆU VÀ SƠ ĐỒ QUAN HỆ

### Mô hình dữ liệu chính

1. **User (Người dùng)**:
   - id: Định danh duy nhất
   - name: Tên đầy đủ
   - email: Địa chỉ email
   - password: Mật khẩu (đã được mã hóa)
   - role: Vai trò (admin, doctor, technician)
   - created_at: Thời điểm tạo tài khoản

2. **Patient (Bệnh nhân)**:
   - id: Định danh duy nhất
   - name: Tên đầy đủ
   - dob: Ngày sinh
   - gender: Giới tính
   - phone: Số điện thoại
   - address: Địa chỉ
   - medical_history: Lịch sử y tế
   - created_at: Thời điểm tạo hồ sơ
   - updated_at: Thời điểm cập nhật hồ sơ gần nhất

3. **MRI_Scan (Hình ảnh MRI)**:
   - id: Định danh duy nhất
   - patient_id: ID của bệnh nhân (khóa ngoại)
   - name: Tên của lần chụp MRI
   - date: Ngày chụp
   - data: Dữ liệu MRI đã xử lý (Float32Array)
   - dimensions: Kích thước [x, y, z]
   - slices: Vị trí mặt cắt mặc định ({x, y, z})
   - notes: Ghi chú của bác sĩ
   - created_at: Thời điểm tải lên

4. **Appointment (Lịch hẹn)**:
   - id: Định danh duy nhất
   - patient_id: ID của bệnh nhân (khóa ngoại)
   - doctor_id: ID của bác sĩ (khóa ngoại)
   - date: Ngày hẹn
   - time: Giờ hẹn
   - status: Trạng thái (scheduled, completed, cancelled)
   - reason: Lý do khám
   - notes: Ghi chú

### Sơ đồ quan hệ

1. **User - Patient**: Quan hệ một-nhiều
   - Một User (bác sĩ) có thể quản lý nhiều Patient
   - Mỗi Patient được quản lý bởi một User chính

2. **Patient - MRI_Scan**: Quan hệ một-nhiều
   - Một Patient có thể có nhiều MRI_Scan
   - Mỗi MRI_Scan thuộc về một Patient duy nhất

3. **Patient - Appointment**: Quan hệ một-nhiều
   - Một Patient có thể có nhiều Appointment
   - Mỗi Appointment thuộc về một Patient duy nhất

4. **User - Appointment**: Quan hệ một-nhiều
   - Một User (bác sĩ) có thể có nhiều Appointment
   - Mỗi Appointment được phụ trách bởi một User duy nhất

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### Kết luận

Hệ thống hiển thị và quản lý hình ảnh MRI 3D đã được phát triển thành công với các chức năng chính đáp ứng nhu cầu của người dùng trong lĩnh vực y tế. Ứng dụng cung cấp một nền tảng hiện đại, dễ sử dụng để hiển thị, tương tác và quản lý hình ảnh MRI 3D, giúp cải thiện quy trình làm việc của các chuyên gia y tế và nâng cao chất lượng chẩn đoán.

Các thành tựu chính bao gồm:
- Xây dựng thành công trình xem MRI 3D tương tác với các công cụ điều chỉnh hiển thị
- Phát triển chức năng hiển thị mặt cắt 2D theo ba mặt phẳng chính
- Tích hợp hệ thống quản lý bệnh nhân và lịch hẹn
- Tối ưu hóa hiệu suất xử lý dữ liệu NIFTI dung lượng lớn
- Thiết kế giao diện đáp ứng, thân thiện với người dùng

### Hướng phát triển tương lai

1. **Tích hợp trí tuệ nhân tạo**:
   - Phát triển các thuật toán AI để hỗ trợ phát hiện bất thường trong hình ảnh MRI
   - Tích hợp công cụ phân đoạn tự động các vùng quan tâm
   - Xây dựng hệ thống đề xuất chẩn đoán dựa trên dữ liệu lịch sử

2. **Mở rộng hỗ trợ định dạng hình ảnh**:
   - Bổ sung hỗ trợ các định dạng hình ảnh y tế khác như DICOM, Analyze, MINC
   - Hỗ trợ hiển thị đa phương thức (kết hợp MRI với CT, PET)
   - Phát triển công cụ chuyển đổi giữa các định dạng hình ảnh

3. **Tăng cường tính năng cộng tác**:
   - Phát triển chức năng chia sẻ và ghi chú trên hình ảnh
   - Xây dựng hệ thống thảo luận trực tuyến giữa các chuyên gia
   - Tích hợp công cụ hội chẩn từ xa

4. **Cải thiện hiệu suất và khả năng mở rộng**:
   - Tối ưu hóa hiệu suất xử lý cho các tệp tin kích thước lớn
   - Phát triển kiến trúc phân tán để xử lý dữ liệu lớn
   - Tích hợp với hệ thống lưu trữ đám mây

5. **Hỗ trợ thiết bị di động và AR/VR**:
   - Phát triển giao diện tối ưu cho thiết bị di động
   - Tích hợp công nghệ thực tế tăng cường (AR) và thực tế ảo (VR)
   - Xây dựng ứng dụng di động native để truy cập hệ thống

Hệ thống hiển thị và quản lý hình ảnh MRI 3D đã tạo nền tảng vững chắc cho việc phát triển các công cụ hiển thị và phân tích hình ảnh y tế tiên tiến. Với việc tiếp tục phát triển và mở rộng các tính năng, ứng dụng có tiềm năng trở thành một công cụ quan trọng trong công tác chẩn đoán và nghiên cứu y học hình ảnh.