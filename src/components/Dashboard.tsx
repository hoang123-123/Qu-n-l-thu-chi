
import React, { useState } from 'react';
import useDataManager from '../hooks/useDataManager';
import MonthlyComparisonChart from './MonthlyComparisonChart';
import DailyExpenseChart from './DailyExpenseChart';
import AIChatbox from './AIChatbox';
import SettingsModal from './SettingsModal';
import { TransactionType, TransactionSource } from '../types';

interface DashboardProps {
    userSpreadsheetId: string;
    accessToken: string;
    onSignOut: () => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const Dashboard: React.FC<DashboardProps> = ({ userSpreadsheetId, accessToken, onSignOut }) => {
    const {
        transactions,
        initialBalances,
        monthlyIncomeGoal,
        newTxData,
        currentDate,
        balances,
        currentMonthStats,
        monthlyData,
        dailyData,
        selectedMonth,
        uniqueMonths,
        selectedMonthSummary,
        aiAdvice,
        isAiLoading,
        aiError,
        isSaving,
        error,
        isLoading,
        loadingMessage,
        setInitialBalances,
        setMonthlyIncomeGoal,
        setCurrentDate,
        setNewTxData,
        setSelectedMonth,
        handleSaveSettings,
        handleAddTransaction,
        handleDeleteTransaction,
        handleGetAiAdvice,
        setError,
    } = useDataManager({ userSpreadsheetId, accessToken });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

     if (isLoading) {
         return (
             <div className="absolute inset-0 bg-primary bg-opacity-75 flex items-center justify-center z-50">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-highlight text-4xl"></i>
                    <p className="mt-4 text-lg">{loadingMessage}</p>
                     {error && <p className="text-red-400 mt-4 text-sm max-w-md">{error}</p>}
                </div>
            </div>
        )
    }

    const handleNewTxChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTxData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleInitialBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInitialBalances(prev => ({ ...prev, [name]: value }));
    };

    const handleIncomeGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMonthlyIncomeGoal(e.target.value);
    };

    return (
        <div className="bg-primary text-text-primary min-h-screen font-sans flex flex-col relative">
            {(isSaving) && (
                <div className="absolute inset-0 bg-primary bg-opacity-75 flex items-center justify-center z-50">
                    <div className="text-center">
                        <i className="fas fa-spinner fa-spin text-highlight text-4xl"></i>
                        <p className="mt-4 text-lg">Đang lưu...</p>
                    </div>
                </div>
            )}
            <header className="bg-secondary p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-lg md:text-2xl font-bold text-highlight flex items-center">
                    <i className="fas fa-wallet mr-2"></i>
                    <span className="hidden sm:inline">Personal Finance Tracker</span>
                </h1>
                 <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="text-text-secondary hover:text-highlight text-xl transition duration-300"
                        aria-label="Mở cài đặt"
                    >
                        <i className="fas fa-cog"></i>
                    </button>
                    <button
                        onClick={onSignOut}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        <i className="fas fa-sign-out-alt mr-1 sm:mr-2"></i>
                        <span className="hidden sm:inline">Đăng xuất</span>
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-500 text-white p-4 m-4 rounded-lg shadow-lg text-center">
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="font-bold underline ml-4">Đóng</button>
                </div>
            )}

            <main className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-secondary p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold text-text-secondary mb-2">Số dư chính</h3>
                            <p className="text-3xl font-bold text-green-400">{formatCurrency(balances.general)}</p>
                        </div>
                        <div className="bg-secondary p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold text-text-secondary mb-2">Số dư quỹ dự phòng</h3>
                            <p className="text-3xl font-bold text-yellow-400">{formatCurrency(balances.provision)}</p>
                        </div>
                        <div className="bg-secondary p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold text-text-secondary mb-2">Thu nhập còn lại (kỳ này)</h3>
                            <p className={`text-3xl font-bold ${currentMonthStats.remaining >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                {formatCurrency(currentMonthStats.remaining)}
                            </p>
                            <div className="mt-4">
                                <div className="w-full bg-primary rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full ${currentMonthStats.progress > 85 ? 'bg-red-500' : currentMonthStats.progress > 60 ? 'bg-yellow-500' : 'bg-highlight'}`} style={{ width: `${currentMonthStats.progress}%` }} role="progressbar" ></div>
                                </div>
                                <div className="flex justify-between text-sm text-text-secondary mt-1">
                                    <span>Đã dùng: {formatCurrency(currentMonthStats.totalUsed)}</span>
                                    <span>Mục tiêu: {formatCurrency(parseFloat(monthlyIncomeGoal) || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="bg-secondary p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Thêm giao dịch mới</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-3">
                            <input type="text" name="description" value={newTxData.description} onChange={handleNewTxChange} placeholder="Mô tả" className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                            <input type="number" name="amount" value={newTxData.amount} onChange={handleNewTxChange} placeholder="Số tiền" className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                            <input type="date" name="date" value={newTxData.date} onChange={handleNewTxChange} className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight" required />
                            <select name="type" value={newTxData.type} onChange={handleNewTxChange} className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight">
                                <option value={TransactionType.EXPENSE}>Chi tiêu</option>
                                <option value={TransactionType.INCOME}>Thu nhập</option>
                                <option value={TransactionType.TRANSFER}>Chuyển khoản</option>
                            </select>
                            <select name="source" value={newTxData.source} onChange={handleNewTxChange} className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight">
                                <option value={TransactionSource.GENERAL}>Nguồn chính</option>
                                <option value={TransactionSource.PROVISION}>Quỹ dự phòng</option>
                            </select>
                            {newTxData.type === TransactionType.TRANSFER && (
                                <select name="destination" value={newTxData.destination} onChange={handleNewTxChange} className="w-full bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight">
                                    <option value={TransactionSource.GENERAL}>Nguồn chính</option>
                                    <option value={TransactionSource.PROVISION}>Quỹ dự phòng</option>
                                </select>
                            )}
                            <button type="submit" className="w-full bg-highlight text-primary font-bold py-2 px-4 rounded-md hover:bg-teal-400 transition duration-300">Thêm</button>
                        </form>
                    </div>
                                        
                    {selectedMonth && (
                        <div className="bg-secondary p-6 rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold text-text-secondary mb-4">Dòng tiền tháng {selectedMonth.substring(5, 7)}/{selectedMonth.substring(0, 4)}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center"><p>Thu nhập:</p><p className="font-bold text-green-400">(+) {formatCurrency(selectedMonthSummary.income)}</p></div>
                                <div className="flex justify-between items-center"><p>Chi tiêu:</p><p className="font-bold text-red-400">(-) {formatCurrency(selectedMonthSummary.expense)}</p></div>
                                <div className="flex justify-between items-center"><p>Chuyển khoản đi (Nguồn chính):</p><p className="font-bold text-yellow-400">(-) {formatCurrency(selectedMonthSummary.transferOut)}</p></div>
                                <hr className="border-accent my-2" />
                                <div className="flex justify-between items-center">
                                    <p className="text-xl font-bold">Còn lại:</p>
                                    <p className={`text-2xl font-bold ${selectedMonthSummary.remaining >= 0 ? 'text-highlight' : 'text-red-500'}`}>{formatCurrency(selectedMonthSummary.remaining)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <MonthlyComparisonChart data={monthlyData} />

                    <div className="bg-secondary p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Chi tiêu hàng ngày</h3>
                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-primary border border-accent rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-highlight" disabled={uniqueMonths.length === 0}>
                                {uniqueMonths.map(month => (<option key={month} value={month}>{month}</option>))}
                            </select>
                        </div>
                        <DailyExpenseChart data={dailyData} month={selectedMonth ? selectedMonth.substring(5, 7) : ''} />
                    </div>
                </div>

                <aside className="lg:col-span-1 bg-secondary p-6 rounded-lg shadow-lg flex flex-col">
                    <h3 className="text-xl font-bold mb-4">Giao dịch gần đây</h3>
                    <div className="space-y-4 overflow-y-auto flex-grow">
                        {transactions.slice(0, 20).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-primary rounded-md group">
                                <div>
                                    <p className="font-semibold">{tx.description}</p>
                                    <p className="text-sm text-text-secondary">{new Date(tx.date).toLocaleDateString('vi-VN')}
                                        <span className="mx-2">·</span>
                                        <span className={`${tx.type === TransactionType.INCOME ? 'text-green-400' : tx.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {tx.type === TransactionType.INCOME ? 'Thu nhập' : tx.type === TransactionType.EXPENSE ? 'Chi tiêu' : 'Chuyển khoản'}
                                        </span>
                                    </p>
                                </div>
                                <div className="text-right ml-2">
                                    <p className={`font-bold ${tx.type === TransactionType.INCOME ? 'text-green-400' : tx.type === TransactionType.EXPENSE ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {tx.type === TransactionType.INCOME ? '+' : tx.type === TransactionType.EXPENSE ? '-' : ''}{formatCurrency(tx.amount)}
                                    </p>
                                </div>
                                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"><i className="fas fa-trash"></i></button>
                            </div>
                        ))}
                        {transactions.length === 0 && !isLoading && (
                            <p className="text-text-secondary text-center mt-8">Không có giao dịch nào.</p>
                        )}
                    </div>
                </aside>
            </main>

            <AIChatbox
                handleGetAiAdvice={handleGetAiAdvice}
                isAiLoading={isAiLoading}
                aiAdvice={aiAdvice}
                aiError={aiError}
            />
            
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                initialBalances={initialBalances}
                monthlyIncomeGoal={monthlyIncomeGoal}
                currentDate={currentDate}
                handleInitialBalanceChange={handleInitialBalanceChange}
                handleIncomeGoalChange={handleIncomeGoalChange}
                setCurrentDate={setCurrentDate}
                handleSaveSettings={handleSaveSettings}
            />

            <footer className="bg-secondary text-center p-4 mt-auto">
                <p className="text-text-secondary text-sm">Developed by <a href="https://hoangtr.com.vn" target="_blank" rel="noopener noreferrer" className="text-highlight hover:underline">Hoang Tran</a>.</p>
                <p className="text-text-secondary text-sm mt-1">Support: <a href="mailto:huytrannguyen962@gmail.com" className="text-highlight hover:underline">huytrannguyen962@gmail.com</a></p>
            </footer>
        </div>
    );
};

export default Dashboard;
