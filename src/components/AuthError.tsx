import React from 'react';
import { AuthError as AuthErrorType } from '../hooks/useAuth';

interface AuthErrorProps {
  error: AuthErrorType;
  onRetry: () => void;
}

const AuthError: React.FC<AuthErrorProps> = ({ error, onRetry }) => {
  const isPermissionError = error.email && error.masterSheetId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-4">
      <div className="bg-secondary p-8 rounded-lg shadow-lg text-center w-full max-w-3xl">
        <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <h2 className="text-2xl font-bold text-red-400 mb-4">Đã xảy ra lỗi về Quyền Truy Cập (403)</h2>
        <p className="text-text-secondary mb-6">{error.message}</p>

        {isPermissionError && (
          <div className="text-left bg-primary p-6 rounded-md border border-accent">
            <h3 className="font-bold text-highlight mb-3">Để khắc phục, vui lòng thử các bước sau:</h3>
            
            <p className="text-lg font-semibold text-text-primary mb-2">Bước 1: Kiểm tra quyền chia sẻ Sheet</p>
            <ol className="list-decimal list-inside space-y-2 text-text-primary pl-4">
              <li>
                Truy cập file Google Sheets ("Sheet Chủ") qua link sau:
                <a href={`https://docs.google.com/spreadsheets/d/${error.masterSheetId}/edit`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline block bg-accent p-2 rounded-md my-2 text-center font-mono break-all select-all">
                  Mở Sheet Chủ
                </a>
              </li>
              <li>Nhấn nút <span className="font-bold">"Share" (Chia sẻ)</span> ở góc trên bên phải.</li>
              <li>
                Nhập địa chỉ email của bạn:
                 <div className="bg-accent p-2 rounded-md my-2 text-center font-mono select-all">
                  {error.email}
                </div>
              </li>
              <li>Đảm bảo quyền được chọn là <span className="font-bold">"Editor" (Người chỉnh sửa)</span> và nhấn "Send" (Gửi).</li>
            </ol>
            
            <hr className="border-accent my-6" />

             <p className="text-lg font-semibold text-text-primary mb-2">Bước 2: Kiểm tra API đã được kích hoạt chưa</p>
             <p className="text-sm text-text-secondary mb-3">Lỗi này thường xảy ra nhất khi các API cần thiết chưa được kích hoạt trong dự án Google Cloud của bạn.</p>
             <ol className="list-decimal list-inside space-y-2 text-text-primary pl-4">
              <li>
                  Truy cập trang <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Thư viện API</a> trong Google Cloud Project của bạn.
              </li>
              <li>
                  Sử dụng thanh tìm kiếm, tìm <strong className="text-highlight">"Google Sheets API"</strong> và đảm bảo nó đã được <span className="font-bold">BẬT (ENABLED)</span>.
              </li>
              <li>
                  Tương tự, tìm <strong className="text-highlight">"Google Drive API"</strong> và đảm bảo nó cũng đã được <span className="font-bold">BẬT (ENABLED)</span>.
              </li>
            </ol>
             <p className="mt-6 text-sm text-text-secondary">Sau khi hoàn tất cả hai bước trên, hãy quay lại đây và thử lại.</p>
          </div>
        )}

        <button
          onClick={onRetry}
          className="mt-8 bg-highlight text-primary font-bold py-2 px-6 rounded-md hover:bg-teal-400 transition duration-300 flex items-center justify-center mx-auto"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Quay lại & Thử lại
        </button>
      </div>
    </div>
  );
};

export default AuthError;
