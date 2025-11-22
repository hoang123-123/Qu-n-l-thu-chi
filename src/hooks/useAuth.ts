import { useState, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// --- CONFIGURATION ---
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const USERS_SHEET_NAME = 'Users';
const AUTH_STORAGE_KEY = 'finance_tracker_auth_session';

// --- Hardcoded values ---
const API_KEY = 'AIzaSyAHfqrq08IV9DI1whbHoX0HF3jABmRggIk';
const CLIENT_ID = '1033223766929-nstgp82o92e45flngbvsi8isrhegi60i.apps.googleusercontent.com';
const MASTER_SPREADSHEET_ID = '1ZY4epEmhscFzkZEXcCUG5HyuxiQIxuiNJx5_RsgE984';

const GAPI_CONFIG = {
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    masterSpreadsheetId: MASTER_SPREADSHEET_ID,
};


export interface AuthError {
    message: string;
    email?: string;
    masterSheetId?: string;
}

interface StoredAuthState {
    gapiConfig: { apiKey: string; clientId: string; masterSpreadsheetId: string };
    accessToken: string;
    userSpreadsheetId: string;
}

const useAuth = () => {
    // Initialize state with hardcoded config
    const [gapiConfig, setGapiConfig] = useState(GAPI_CONFIG);
    const [userSpreadsheetId, setUserSpreadsheetId] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    
    const [scriptsReady, setScriptsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Đang khởi tạo...');
    const [error, setError] = useState<AuthError | null>(null);

    const [tokenClient, setTokenClient] = useState<any>(null);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    // Effect to check for scripts readiness
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.gapi && window.google) {
                clearInterval(interval);
                setScriptsReady(true);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const saveSession = (data: StoredAuthState) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    };

    const clearSession = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };
    
     const processUserAuth = useCallback(async (currentAccessToken: string, currentGapiConfig: any) => {
        setIsLoading(true);
        setError(null);
        window.gapi.client.setToken({ access_token: currentAccessToken });
        
        let userInfo: any = null;

        try {
            setLoadingMessage('Đang xác thực người dùng...');
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${currentAccessToken}` }
            });

            if (!userInfoResponse.ok) throw new Error('Không thể lấy thông tin người dùng.');

            userInfo = await userInfoResponse.json();
            const userId = userInfo.sub;
            const userName = userInfo.name || `User ${userId.substring(0, 5)}`;
            
            if (!userId) throw new Error("Không thể xác định ID người dùng.");
            
            setLoadingMessage('Đang kiểm tra Sheet Chủ...');
            const masterMeta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: currentGapiConfig.masterSpreadsheetId });
            const usersSheet = masterMeta.result.sheets.find((s: any) => s.properties.title === USERS_SHEET_NAME);

            if (!usersSheet) {
                setLoadingMessage(`Đang tạo sheet '${USERS_SHEET_NAME}'...`);
                await window.gapi.client.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                    resource: { requests: [{ addSheet: { properties: { title: USERS_SHEET_NAME } } }] }
                });
                await window.gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                    range: `${USERS_SHEET_NAME}!A1:B1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [['userId', 'spreadsheetId']] }
                });
            } else {
                 const headerResponse = await window.gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                    range: `${USERS_SHEET_NAME}!A1:B1`,
                });
                const header = headerResponse.result.values ? headerResponse.result.values[0] : [];
                 if (header[0] !== 'userId' || header[1] !== 'spreadsheetId') {
                    setLoadingMessage('Phát hiện Sheet Chủ chưa được cấu hình, đang khởi tạo...');
                    await window.gapi.client.sheets.spreadsheets.values.update({
                        spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                        range: `${USERS_SHEET_NAME}!A1:B1`,
                        valueInputOption: 'USER_ENTERED',
                        resource: { values: [['userId', 'spreadsheetId']] }
                    });
                }
            }
            
            setLoadingMessage('Đang tìm kiếm dữ liệu của bạn...');
            const response = await window.gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                range: `${USERS_SHEET_NAME}!A:B`,
            });

            const userMap = response.result.values || [];
            if (userMap.length > 0 && userMap[0][0] === 'userId') userMap.shift();
            const userEntry = userMap.find((row: string[]) => row[0] === userId);
            
            let finalSpreadsheetId = null;

            if (authMode === 'login') {
                if (userEntry && userEntry[1]) {
                    setLoadingMessage('Đăng nhập thành công. Đang tải dữ liệu...');
                    finalSpreadsheetId = userEntry[1];
                } else {
                    throw new Error("Tài khoản không tồn tại. Vui lòng đăng ký trước.");
                }
            } else {
                if (userEntry) {
                    throw new Error("Tài khoản đã tồn tại. Vui lòng đăng nhập.");
                }
                
                setLoadingMessage(`Chào mừng ${userName}! Đang tạo không gian làm việc mới...`);
                const newSheet = await window.gapi.client.sheets.spreadsheets.create({
                    resource: {
                        properties: { title: `Personal Finance Tracker Data - ${userName}` },
                        sheets: [
                            { properties: { title: 'Transactions' } },
                            { properties: { title: 'Config' } },
                        ]
                    }
                });
                
                finalSpreadsheetId = newSheet.result.spreadsheetId;
                
                await window.gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: currentGapiConfig.masterSpreadsheetId,
                    range: `${USERS_SHEET_NAME}!A:B`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [[userId, finalSpreadsheetId]] }
                });
            }
            
            if (finalSpreadsheetId) {
                setUserSpreadsheetId(finalSpreadsheetId);
                // Save the complete session to localStorage
                saveSession({ gapiConfig: currentGapiConfig, accessToken: currentAccessToken, userSpreadsheetId: finalSpreadsheetId });
            }

            setIsLoading(false);
        } catch (err: any) {
            console.error("Error during user auth process:", err);
            if (err.status === 403) {
                 setError({
                    message: `Lỗi quyền truy cập (403). Tài khoản của bạn không có quyền truy cập vào Bảng tính Chủ (Master Spreadsheet).`,
                    email: userInfo?.email,
                    masterSheetId: currentGapiConfig.masterSpreadsheetId,
                });
            } else {
                setError({ message: `Đã xảy ra lỗi: ${err.result?.error?.message || err.message}.` });
            }
            setAccessToken(null);
            clearSession();
            setIsLoading(false);
        }
    }, [authMode]);

    // This effect initializes the GAPI client and GIS token client
    useEffect(() => {
        if (!scriptsReady || tokenClient) return;

        setLoadingMessage('Đang khởi tạo dịch vụ Google...');

        window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                    apiKey: gapiConfig.apiKey,
                    discoveryDocs: DISCOVERY_DOCS,
                });

                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: gapiConfig.clientId,
                    scope: SCOPES,
                    callback: (tokenResponse: any) => {
                        if (tokenResponse.error) {
                            setError({ message: `Lỗi xác thực: ${tokenResponse.error_description || tokenResponse.error}` });
                            setAccessToken(null);
                            clearSession();
                            return;
                        }
                        const newAccessToken = tokenResponse.access_token;
                        setAccessToken(newAccessToken);
                        processUserAuth(newAccessToken, gapiConfig);
                    },
                });
                setTokenClient(client);
            } catch (err: any) {
                let errorMessage = 'Lỗi không xác định';
                if (err.details) { errorMessage = err.details; }
                else if (err.error) { errorMessage = `${err.error}: ${err.error_description || 'Đã có lỗi xảy ra'}`; }
                else if (err.message) { errorMessage = err.message; }
                setError({ message: `Không thể khởi tạo Google API client. Lỗi: ${errorMessage}.` });
                console.error("GAPI Init Error:", err);
            }
        });
    }, [gapiConfig, scriptsReady, processUserAuth, tokenClient]);

    // This effect runs once on mount to check for a stored session
    useEffect(() => {
        if (!scriptsReady) return;

        const savedSessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedSessionRaw) {
            try {
                const savedSession: StoredAuthState = JSON.parse(savedSessionRaw);
                setLoadingMessage('Đang kiểm tra phiên đăng nhập...');
                
                // Validate the token by fetching user info
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${savedSession.accessToken}` }
                }).then(response => {
                    if (response.ok) {
                        // Token is valid, restore session
                        setAccessToken(savedSession.accessToken);
                        setUserSpreadsheetId(savedSession.userSpreadsheetId);
                        setIsLoading(false);
                    } else {
                        // Token is invalid/expired, clear session
                        clearSession();
                        setIsLoading(false);
                    }
                });
            } catch (e) {
                console.error("Failed to parse saved session", e);
                clearSession();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false); // No session found, proceed to config screen
        }
    }, [scriptsReady]);

    const handleAuth = () => {
        setError(null);
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: '' });
        } else {
            setError({ message: "Lỗi: Dịch vụ xác thực chưa sẵn sàng. Vui lòng thử lại." });
        }
    };

    const handleSignOut = () => {
        if (accessToken) {
            window.google.accounts.oauth2.revoke(accessToken, () => {});
        }
        clearSession();
        setAccessToken(null);
        setUserSpreadsheetId(null);
        setError(null);
        setTokenClient(null); // Reset token client to allow re-initialization
    };

    return {
        gapiConfig,
        accessToken,
        userSpreadsheetId,
        tokenClient,
        isLoading: isLoading || (!!gapiConfig && !tokenClient),
        loadingMessage,
        error,
        setAuthMode,
        handleAuth,
        handleSignOut,
        setError,
        authMode
    };
};

export default useAuth;