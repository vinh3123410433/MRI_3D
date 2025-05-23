import React from "react";

interface HeroProps {
  onLearnMoreClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onLearnMoreClick }) => {
  const handleLearnMoreClick = (e: React.MouseEvent) => {
    if (onLearnMoreClick) {
      e.preventDefault();
      onLearnMoreClick();
    }
    // Nếu không có onLearnMoreClick, hoạt động mặc định sẽ được thực hiện (cuộn đến #features)
  };

  return (
    <div className="relative bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <svg
            className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-white transform translate-x-1/2"
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl">
                <span className="block animate-fade-in-down xl:inline">
                  ỨNG DỤNG CHUYỂN ĐỔI MRI
                </span>{" "}
                <span className="block animate-fade-in xl:inline">
                  THÀNH MÔ HÌNH 3D TRỰC QUAN
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 animate-fade-in-up">
                Hỗ trợ bác sĩ quản lý lịch hẹn, thông tin bệnh nhân, và dữ liệu ảnh MRI với mô hình 3D trực quan.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start animate-fade-in-up">
                <div className="rounded-md shadow">
                  <a
                    href="#features"
                    onClick={handleLearnMoreClick}
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Tìm hiểu thêm
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a
                    href="#features"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10 transition-all duration-300"
                  >
                    Xem demo
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 p-4">
        <img
          className="h-56 w-full object-contain sm:h-72 md:h-96 lg:w-full lg:h-full rounded-lg transform hover:scale-105 transition-transform duration-500"
          src="/images/brain1.png"
          alt="Brain MRI Visualization"
        />
      </div>
    </div>
  );
};

export default Hero;
