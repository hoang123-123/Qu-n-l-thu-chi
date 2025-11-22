
import React from 'react';
import Dashboard from './components/Dashboard';
import useAuth from './hooks/useAuth';
import AuthError from './components/AuthError';

const App: React.FC = () => {
    const {
        accessToken,
        userSpreadsheetId,
        tokenClient,
        isLoading,
        loadingMessage,
        error,
        authMode,
        setAuthMode,
        handleAuth,
        handleSignOut,
        setError
    } = useAuth();

    // Nếu có lỗi quyền truy cập 403, hiển thị màn hình hướng dẫn đặc biệt
    if (error?.masterSheetId) {
        return <AuthError error={error} onRetry={() => setError(null)} />;
    }

    if (!accessToken) {
        const errorMessage = error ? error.message : null;
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
                <div className="bg-secondary p-8 rounded-lg shadow-lg text-center w-full max-w-md">
                    <h2 className="text-2xl font-bold text-highlight mb-4">
                        {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </h2>
                    <p className="text-text-secondary mb-6">
                        {authMode === 'login'
                            ? 'Sử dụng tài khoản Google của bạn để truy cập dữ liệu.'
                            : 'Tạo một tài khoản mới để bắt đầu theo dõi tài chính.'}
                    </p>
                    <button
                        onClick={handleAuth}
                        disabled={!tokenClient}
                        className="bg-highlight text-primary font-bold py-2 px-6 rounded-md hover:bg-teal-400 transition duration-300 flex items-center justify-center mx-auto w-full disabled:bg-accent disabled:cursor-not-allowed"
                    >
                        <i className="fab fa-google mr-2"></i>
                        {tokenClient ? (authMode === 'login' ? 'Đăng nhập với Google' : 'Đăng ký với Google') : 'Đang khởi tạo...'}
                    </button>
                    <p className="mt-6 text-sm">
                        {authMode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        <button
                            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }}
                            className="font-semibold text-highlight hover:underline"
                        >
                            {authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </p>
                    {errorMessage && <p className="text-red-400 mt-4 text-sm">{errorMessage}</p>}
                </div>
            </div>
        );
    }

    if (isLoading || !userSpreadsheetId) {
        return (
            <div className="absolute inset-0 bg-primary bg-opacity-75 flex items-center justify-center z-50">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-highlight text-4xl"></i>
                    <p className="mt-4 text-lg">{loadingMessage}</p>
                    {error && <p className="text-red-400 mt-4 text-sm max-w-md">{error.message}</p>}
                </div>
            </div>
        )
    }

    return (
        <Dashboard
            userSpreadsheetId={userSpreadsheetId}
            accessToken={accessToken}
            onSignOut={handleSignOut}
        />
    );
};

export default App;