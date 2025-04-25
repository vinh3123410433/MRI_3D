import React from 'react';

const FeatureCards: React.FC = () => {
  return (
    <div id="features" className="py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase animate-fade-in-down">
            Tính năng
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl animate-fade-in">
            Giải pháp toàn diện cho việc phân tích MRI
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto animate-fade-in-up">
            Khám phá các tính năng mạnh mẽ giúp việc phân tích và quản lý dữ liệu MRI trở nên dễ dàng hơn.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div className="relative bg-white p-6 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="absolute -top-6 left-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg transform transition-transform duration-300 hover:rotate-12">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium text-gray-900">Hiển thị 3D</h3>
                <p className="mt-4 text-base text-gray-500">
                  Xem mô hình MRI dưới dạng 3D với khả năng xoay, thu phóng và di chuyển linh hoạt. Hỗ trợ nhiều định dạng file phổ biến.
                </p>
              </div>
            </div>

            <div className="relative bg-white p-6 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="absolute -top-6 left-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg transform transition-transform duration-300 hover:rotate-12">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium text-gray-900">Quản lý bệnh nhân</h3>
                <p className="mt-4 text-base text-gray-500">
                  Hệ thống quản lý thông tin bệnh nhân toàn diện với tính năng tìm kiếm và lọc nâng cao. Theo dõi lịch sử khám bệnh dễ dàng.
                </p>
              </div>
            </div>

            <div className="relative bg-white p-6 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="absolute -top-6 left-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg transform transition-transform duration-300 hover:rotate-12">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-medium text-gray-900">Phân tích dữ liệu</h3>
                <p className="mt-4 text-base text-gray-500">
                  Công cụ phân tích hình ảnh MRI với các tính năng đo lường và so sánh chuyên nghiệp. Hỗ trợ xuất báo cáo chi tiết.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;