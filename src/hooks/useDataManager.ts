
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, TransactionSource, MonthlyData, DailyData } from '../types';
import { GoogleGenAI } from "@google/genai";

const TRANSACTIONS_SHEET_NAME = 'Transactions';
const CONFIG_SHEET_NAME = 'Config';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const processMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
    const monthlySummary: { [key: string]: { income: number, expense: number } } = {};
    transactions.forEach(tx => {
        const month = tx.date.substring(0, 7);
        if (!monthlySummary[month]) {
            monthlySummary[month] = { income: 0, expense: 0 };
        }
        if (tx.type === TransactionType.INCOME) monthlySummary[month].income += tx.amount;
        else if (tx.type === TransactionType.EXPENSE) monthlySummary[month].expense += tx.amount;
    });
    return Object.keys(monthlySummary).map(month => ({
        month: month.substring(5, 7),
        income: monthlySummary[month].income,
        expense: monthlySummary[month].expense,
    })).sort((a, b) => a.month.localeCompare(b.month));
};

const processDailyData = (transactions: Transaction[], selectedMonth: string): DailyData[] => {
    const dailySummary: { [key: string]: number } = {};
    transactions
        .filter(tx => tx.date.startsWith(selectedMonth) && tx.type === TransactionType.EXPENSE)
        .forEach(tx => {
            const day = tx.date.substring(8, 10);
            if (!dailySummary[day]) dailySummary[day] = 0;
            dailySummary[day] += tx.amount;
        });
    return Object.keys(dailySummary).map(day => ({
        day: day,
        expense: dailySummary[day],
    })).sort((a, b) => a.day.localeCompare(b.day));
};

interface UseDataManagerProps {
    userSpreadsheetId: string | null;
    accessToken: string | null;
}

const useDataManager = ({ userSpreadsheetId, accessToken }: UseDataManagerProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [initialBalances, setInitialBalances] = useState({ general: '0', provision: '0' });
    const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState('0');
    const [lastRolloverMonth, setLastRolloverMonth] = useState('');
    const [sheetIds, setSheetIds] = useState<{ [key: string]: number }>({});
    
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Đang tải dữ liệu...');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTxData, setNewTxData] = useState({
        description: '', amount: '', date: new Date().toISOString().split('T')[0],
        type: TransactionType.EXPENSE, source: TransactionSource.GENERAL, destination: TransactionSource.GENERAL,
    });

    const [aiAdvice, setAiAdvice] = useState<string>('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const initializeSheetsIfNeeded = useCallback(async (spreadsheetId: string, configValues: any[], transactionValues: any[]) => {
        let needsInitialization = false;
        const requests = [];
        if (!configValues || configValues.length === 0) {
            needsInitialization = true;
            requests.push({
                range: `${CONFIG_SHEET_NAME}!A1:B4`,
                values: [['INITIAL_GENERAL_BALANCE', '0'], ['INITIAL_PROVISION_BALANCE', '0'], ['MONTHLY_INCOME_GOAL', '0'], ['LAST_ROLLOVER_MONTH', '']],
            });
        }
        if (!transactionValues || transactionValues.length === 0) {
            needsInitialization = true;
            requests.push({
                range: `${TRANSACTIONS_SHEET_NAME}!A1:G1`,
                values: [['id', 'date', 'description', 'amount', 'type', 'source', 'destination']],
            });
        }
        if (needsInitialization) {
            setLoadingMessage('Phát hiện sheet trống, đang khởi tạo...');
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: { valueInputOption: 'USER_ENTERED', data: requests },
            });
            return true;
        }
        return false;
    }, []);

    const loadAllData = useCallback(async (spreadsheetId: string) => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Đang tải dữ liệu...');
        try {
            const metaResponse = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
            const sheets: { [key: string]: number } = {};
            metaResponse.result.sheets.forEach((s: any) => { sheets[s.properties.title] = s.properties.sheetId; });
            setSheetIds(sheets);

            if (!sheets[TRANSACTIONS_SHEET_NAME] || !sheets[CONFIG_SHEET_NAME]) {
                throw new Error(`Không tìm thấy sheet. Vui lòng đảm bảo bạn đã tạo sheet '${TRANSACTIONS_SHEET_NAME}' và '${CONFIG_SHEET_NAME}'.`);
            }

            const [configResponse, transactionsResponse] = await Promise.all([
                window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: `${CONFIG_SHEET_NAME}!A:B` }),
                window.gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: `${TRANSACTIONS_SHEET_NAME}!A:G` })
            ]);

            const configValues = configResponse.result.values || [];
            const transactionValues = transactionsResponse.result.values || [];

            const wasInitialized = await initializeSheetsIfNeeded(spreadsheetId, configValues, transactionValues);
            if (wasInitialized) {
                // Recurse to reload data after initialization
                await loadAllData(spreadsheetId); 
                return;
            }

            const configMap: { [key: string]: string } = {};
            configValues.forEach((row: string[]) => { if (row[0]) configMap[row[0]] = row[1]; });
            setInitialBalances({ general: configMap['INITIAL_GENERAL_BALANCE'] || '0', provision: configMap['INITIAL_PROVISION_BALANCE'] || '0' });
            setMonthlyIncomeGoal(configMap['MONTHLY_INCOME_GOAL'] || '0');
            setLastRolloverMonth(configMap['LAST_ROLLOVER_MONTH'] || '');

            if (transactionValues.length > 0) transactionValues.shift();
            const loadedTransactions = transactionValues.map((row: any[], index: number): Transaction => ({
                id: row[0], date: row[1], description: row[2], amount: parseFloat(row[3]) || 0, type: row[4] as TransactionType,
                source: row[5] as TransactionSource, destination: row[6] as TransactionSource | undefined, rowIndex: index + 2,
            })).filter(tx => tx.id && tx.date);
            setTransactions(loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(`Không thể tải dữ liệu. Lỗi: ${err.result?.error?.message || err.message}.`);
        } finally {
            setIsLoading(false);
        }
    }, [initializeSheetsIfNeeded]);

    useEffect(() => {
        if (accessToken && userSpreadsheetId) {
            window.gapi.client.setToken({ access_token: accessToken });
            loadAllData(userSpreadsheetId);
        }
    }, [accessToken, userSpreadsheetId, loadAllData]);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSpreadsheetId) return;

        const amount = parseFloat(newTxData.amount);
        if (!newTxData.description.trim() || isNaN(amount) || amount <= 0) {
            alert("Vui lòng điền đầy đủ và chính xác các thông tin.");
            return;
        }
        if (newTxData.type === TransactionType.TRANSFER && newTxData.source === newTxData.destination) {
            alert("Nguồn và đích không được giống nhau.");
            return;
        }

        const newTransaction: Omit<Transaction, 'rowIndex'> = {
            id: `txn-${new Date().getTime()}`, date: new Date(newTxData.date).toISOString(),
            description: newTxData.description.trim(), amount: amount, type: newTxData.type, source: newTxData.source,
            destination: newTxData.type === TransactionType.TRANSFER ? newTxData.destination : undefined,
        };

        setIsSaving(true);
        try {
            await window.gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: userSpreadsheetId, range: `${TRANSACTIONS_SHEET_NAME}!A:G`, valueInputOption: 'USER_ENTERED',
                resource: { values: [[newTransaction.id, newTransaction.date, newTransaction.description, newTransaction.amount, newTransaction.type, newTransaction.source, newTransaction.destination || '']] },
            });
            const updatedTransactions = [...transactions, { ...newTransaction, rowIndex: transactions.length + 2 }]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(updatedTransactions);
            setNewTxData({
                description: '', amount: '', date: new Date().toISOString().split('T')[0],
                type: TransactionType.EXPENSE, source: TransactionSource.GENERAL, destination: TransactionSource.GENERAL,
            });
        } catch (err: any) {
            setError(`Không thể thêm giao dịch. Lỗi: ${err.result?.error?.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTransaction = async (txIdToDelete: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa giao dịch này không?`) || !userSpreadsheetId) return;
        const txToDelete = transactions.find(tx => tx.id === txIdToDelete);
        if (!txToDelete || txToDelete.rowIndex === undefined) {
            setError("Không tìm thấy thông tin giao dịch để xóa.");
            return;
        }
        setIsSaving(true);
        try {
            await window.gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: userSpreadsheetId,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: { sheetId: sheetIds[TRANSACTIONS_SHEET_NAME], dimension: 'ROWS', startIndex: txToDelete.rowIndex - 1, endIndex: txToDelete.rowIndex },
                        },
                    }],
                },
            });
            setTransactions(prev => prev.filter(tx => tx.id !== txIdToDelete));
        } catch (err: any) {
            setError(`Không thể xóa giao dịch. Lỗi: ${err.result?.error?.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userSpreadsheetId) return;
        setIsSaving(true);
        try {
            const data = [
                { range: `${CONFIG_SHEET_NAME}!A1:B1`, values: [['INITIAL_GENERAL_BALANCE', initialBalances.general]] },
                { range: `${CONFIG_SHEET_NAME}!A2:B2`, values: [['INITIAL_PROVISION_BALANCE', initialBalances.provision]] },
                { range: `${CONFIG_SHEET_NAME}!A3:B3`, values: [['MONTHLY_INCOME_GOAL', monthlyIncomeGoal]] },
                { range: `${CONFIG_SHEET_NAME}!A4:B4`, values: [['LAST_ROLLOVER_MONTH', lastRolloverMonth]] },
            ];
            await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: userSpreadsheetId,
                resource: { valueInputOption: 'USER_ENTERED', data },
            });
            // Removed alert for a smoother modal experience
        } catch (err: any) {
            setError(`Không thể lưu cài đặt. Lỗi: ${err.result?.error?.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Balances calculation is moved here
     const balances = useMemo(() => {
        const initialGeneral = parseFloat(initialBalances.general) || 0;
        const initialProvision = parseFloat(initialBalances.provision) || 0;
        let general = initialGeneral;
        let provision = initialProvision;
        transactions.forEach(tx => {
            switch (tx.type) {
                case TransactionType.INCOME:
                    if (tx.source === TransactionSource.GENERAL) general += tx.amount; else provision += tx.amount;
                    break;
                case TransactionType.EXPENSE:
                    if (tx.source === TransactionSource.GENERAL) general -= tx.amount; else provision -= tx.amount;
                    break;
                case TransactionType.TRANSFER:
                    if (tx.source === TransactionSource.GENERAL) { general -= tx.amount; provision += tx.amount; } 
                    else { provision -= tx.amount; general += tx.amount; }
                    break;
            }
        });
        return { general, provision };
    }, [transactions, initialBalances]);

    const handleGetAiAdvice = async () => {
        setIsAiLoading(true);
        setAiAdvice('');
        setAiError(null);
        try {
            // Fix: Use process.env.API_KEY as per guidelines
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const transactionSummary = transactions
                .slice(0, 20)
                .map(tx => `- ${tx.description}: ${formatCurrency(tx.amount)} (${tx.type}) vào ngày ${new Date(tx.date).toLocaleDateString('vi-VN')}`)
                .join('\n');

            // Fix: Corrected typo `formatCamera` to `formatCurrency` and improved the prompt for better AI-generated financial advice.
            const prompt = `Bạn là một chuyên gia tư vấn tài chính cá nhân thân thiện và chuyên nghiệp. Dựa vào dữ liệu tài chính dưới đây, hãy đưa ra một bản phân tích và một vài lời khuyên hữu ích bằng tiếng Việt.

**Dữ liệu tài chính:**
*   Số dư chính hiện tại: ${formatCurrency(balances.general)}
*   Số dư quỹ dự phòng: ${formatCurrency(balances.provision)}
*   Hạn mức chi tiêu trong kỳ: ${formatCurrency(parseFloat(monthlyIncomeGoal))}
*   Tổng chi tiêu trong kỳ này: ${formatCurrency(currentMonthStats.totalUsed)}
*   Số tiền còn lại trong kỳ: ${formatCurrency(currentMonthStats.remaining)}

**Lịch sử 20 giao dịch gần đây:**
${transactionSummary || "Không có giao dịch nào."}

**Yêu cầu của bạn:**
1.  **Phân tích tổng quan:** Đưa ra nhận xét ngắn gọn (2-3 câu) về tình hình tài chính hiện tại dựa trên dữ liệu.
2.  **Xác định các khoản chi lớn:** Chỉ ra 2-3 khoản chi tiêu lớn nhất hoặc các danh mục chi tiêu thường xuyên nhất từ danh sách giao dịch.
3.  **Đưa ra lời khuyên:** Cung cấp 2-3 lời khuyên cụ thể, mang tính hành động để người dùng có thể tiết kiệm tốt hơn hoặc quản lý chi tiêu hiệu quả hơn trong kỳ tới.
4.  **Định dạng:** Sử dụng markdown để định dạng câu trả lời cho dễ đọc, bao gồm tiêu đề, danh sách (gạch đầu dòng), và **in đậm** các điểm quan trọng.
5.  **Giọng văn:** Sử dụng giọng văn tích cực, khuyến khích và không phán xét.`;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            setAiAdvice(response.text);
        } catch (err) {
            console.error("Error getting AI advice:", err);
            setAiError("Đã có lỗi xảy ra khi lấy tư vấn từ AI. Vui lòng thử lại.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    useEffect(() => {
        if (!accessToken || !userSpreadsheetId) return;

        const now = new Date(currentDate);
        const dayOfMonth = now.getDate();
        const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (dayOfMonth >= 15 && lastRolloverMonth !== currentMonthStr) {
            const prevPeriodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
            const prevPeriodEndDate = new Date(now.getFullYear(), now.getMonth(), 15);
            const prevPeriodTransactions = transactions.filter(tx => new Date(tx.date) >= prevPeriodStartDate && new Date(tx.date) < prevPeriodEndDate);
            const spent = prevPeriodTransactions.filter(tx => tx.type === TransactionType.EXPENSE).reduce((sum, tx) => sum + tx.amount, 0);
            const transferOut = prevPeriodTransactions.filter(tx => tx.type === TransactionType.TRANSFER && tx.source === TransactionSource.GENERAL).reduce((sum, tx) => sum + tx.amount, 0);
            const totalUsed = spent + transferOut;
            const goal = parseFloat(monthlyIncomeGoal) || 0;
            const rolloverAmount = goal - totalUsed;

            if (rolloverAmount > 0) {
                const newBalance = (parseFloat(initialBalances.general) || 0) + rolloverAmount;
                const updatedBalances = { ...initialBalances, general: newBalance.toString() };
                const data = [
                    { range: `${CONFIG_SHEET_NAME}!B1`, values: [[newBalance.toString()]] },
                    { range: `${CONFIG_SHEET_NAME}!B4`, values: [[currentMonthStr]] },
                ];
                window.gapi.client.sheets.spreadsheets.values.batchUpdate({ spreadsheetId: userSpreadsheetId, resource: { valueInputOption: 'USER_ENTERED', data } })
                    .then(() => {
                        setInitialBalances(updatedBalances);
                        setLastRolloverMonth(currentMonthStr);
                        alert(`Đã quyết toán kỳ trước. Số dư ${formatCurrency(rolloverAmount)} đã được cộng vào số dư chính.`);
                    }).catch((err: any) => setError(`Không thể cập nhật quyết toán. Lỗi: ${err.result?.error?.message}`));
            } else {
                 window.gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: userSpreadsheetId, range: `${CONFIG_SHEET_NAME}!B4`, valueInputOption: 'USER_ENTERED', resource: { values: [[currentMonthStr]] } })
                    .then(() => setLastRolloverMonth(currentMonthStr));
            }
        }
    }, [currentDate, transactions, monthlyIncomeGoal, initialBalances, lastRolloverMonth, userSpreadsheetId, accessToken]);

    const currentMonthStats = useMemo(() => {
        const goal = parseFloat(monthlyIncomeGoal) || 0;
        const now = new Date(currentDate);
        const dayOfMonth = now.getDate();
        let startDate, endDate;
        if (dayOfMonth < 15) {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
            endDate = new Date(now.getFullYear(), now.getMonth(), 15);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 15);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        }
        const periodTransactions = transactions.filter(tx => new Date(tx.date) >= startDate && new Date(tx.date) < endDate);
        const spent = periodTransactions.filter(tx => tx.type === TransactionType.EXPENSE).reduce((sum, tx) => sum + tx.amount, 0);
        const transferOut = periodTransactions.filter(tx => tx.type === TransactionType.TRANSFER && tx.source === TransactionSource.GENERAL).reduce((sum, tx) => sum + tx.amount, 0);
        const totalUsed = spent + transferOut;
        const remaining = goal > 0 ? goal - totalUsed : 0;
        const progress = goal > 0 ? (totalUsed / goal) * 100 : 0;
        return { remaining, totalUsed, progress: Math.min(progress, 100) };
    }, [transactions, monthlyIncomeGoal, currentDate]);

    const uniqueMonths = useMemo(() => Array.from(new Set(transactions.map(tx => tx.date.substring(0, 7)))).sort().reverse(), [transactions]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    useEffect(() => {
        if (uniqueMonths.length > 0 && (!selectedMonth || !uniqueMonths.includes(selectedMonth))) {
            setSelectedMonth(uniqueMonths[0]);
        } else if (uniqueMonths.length === 0) {
            setSelectedMonth('');
        }
    }, [uniqueMonths, selectedMonth]);

    const monthlyData = useMemo(() => processMonthlyData(transactions), [transactions]);
    const dailyData = useMemo(() => selectedMonth ? processDailyData(transactions, selectedMonth) : [], [transactions, selectedMonth]);

    const selectedMonthSummary = useMemo(() => {
        if (!selectedMonth) return { income: 0, expense: 0, transferOut: 0, remaining: 0 };
        const summary = { income: 0, expense: 0, transferOut: 0 };
        transactions.filter(tx => tx.date.startsWith(selectedMonth)).forEach(tx => {
            if (tx.type === TransactionType.INCOME) summary.income += tx.amount;
            else if (tx.type === TransactionType.EXPENSE) summary.expense += tx.amount;
            else if (tx.type === TransactionType.TRANSFER && tx.source === TransactionSource.GENERAL) summary.transferOut += tx.amount;
        });
        return { ...summary, remaining: summary.income - summary.expense - summary.transferOut };
    }, [transactions, selectedMonth]);

    return {
        transactions, initialBalances, monthlyIncomeGoal, newTxData, currentDate,
        balances, currentMonthStats, monthlyData, dailyData, selectedMonth, uniqueMonths, selectedMonthSummary,
        aiAdvice, isAiLoading, aiError, isSaving, error, isLoading, loadingMessage,
        setInitialBalances, setMonthlyIncomeGoal, setCurrentDate, setNewTxData, setSelectedMonth,
        handleSaveSettings, handleAddTransaction, handleDeleteTransaction, handleGetAiAdvice, setError,
    };
};

export default useDataManager;
