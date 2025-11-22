import React, { useState } from 'react';

interface ConfigSetupProps {
  onConnect: (config: { apiKey: string; clientId: string; masterSpreadsheetId: string }) => void;
}

// --- Hardcoded values as requested ---
// Client ID và Master Spreadsheet ID được cấu hình sẵn để đơn giản hóa quá trình đăng nhập cho người dùng.
const HARDCODED_CLIENT_ID = '1033223766929-nstgp82o92e45flngbvsi8isrhegi60i.apps.googleusercontent.com';
const HARDCODED_MASTER_SPREADSHEET_ID = '1ZY4epEmhscFzkZEXcCUG5HyuxiQIxuiNJx5_RsgE984'; // Example Master Sheet ID

const ConfigSetup: React.FC<ConfigSetupProps> = ({ onConnect }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isInvalidApiKey, setIsInvalidApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key để tiếp tục.');
      return;
    }
    
    // Check for the specific API key
    if (apiKey.trim() !== 'AIzaSyAHfqrq08IV9DI1whbHoX0HF3jABmRggIk') {
        setIsInvalidApiKey(true);
        return;
    }

    setError('');
    onConnect({ 
        apiKey: apiKey.trim(), 
        clientId: HARDCODED_CLIENT_ID, 
        masterSpreadsheetId: HARDCODED_MASTER_SPREADSHEET_ID 
    });
  };
  
  if (isInvalidApiKey) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-primary text-text-primary">
            <div className="text-center p-8 bg-secondary rounded-lg shadow-lg">
                <i className="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                <h1 className="text-5xl font-bold text-red-400">400 Bad Request</h1>
                <p className="text-xl text-text-secondary mt-4">API Key không hợp lệ.</p>
                <p className="text-text-secondary mt-2">Vui lòng kiểm tra lại API Key và thử lại.</p>
                <button 
                    onClick={() => setIsInvalidApiKey(false)} 
                    className="mt-8 bg-highlight text-primary font-bold py-2 px-6 rounded-md hover:bg-teal-400 transition duration-300"
                >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Quay lại
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-secondary rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-highlight">Xác thực ứng dụng</h1>
          <p className="mt-2 text-text-secondary">
            Vui lòng nhập API Key của bạn để kết nối và bắt đầu sử dụng.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-text-secondary mb-1">
              Google API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight"
              placeholder="AIzaSy..."
              required
              autoFocus
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-highlight text-primary font-bold py-3 px-4 rounded-md hover:bg-teal-400 transition duration-300 disabled:bg-accent disabled:cursor-not-allowed"
          >
            Kết nối & Bắt đầu
          </button>
        </form>
         <div className="text-center text-xs text-text-secondary mt-4">
            <p>Client ID và Master Spreadsheet ID đã được cấu hình sẵn.</p>
         </div>
      </div>
    </div>
  );
};

export default ConfigSetup;
