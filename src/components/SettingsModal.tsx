import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialBalances: { general: string; provision: string };
    monthlyIncomeGoal: string;
    currentDate: string;
    handleInitialBalanceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleIncomeGoalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setCurrentDate: (date: string) => void;
    handleSaveSettings: (e: React.FormEvent) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    initialBalances,
    monthlyIncomeGoal,
    currentDate,
    handleInitialBalanceChange,
    handleIncomeGoalChange,
    setCurrentDate,
    handleSaveSettings,
}) => {
    if (!isOpen) {
        return null;
    }

    const onFormSubmit = (e: React.FormEvent) => {
        handleSaveSettings(e);
        onClose(); // Tự động đóng modal sau khi lưu
    };

    return (
        <div className="fixed inset-0 bg-primary bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-highlight">Thiết lập</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl" aria-label="Đóng">
                        &times;
                    </button>
                </div>
                <form onSubmit={onFormSubmit}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="general" className="block text-sm font-medium text-text-secondary mb-1">Số dư chính ban đầu</label>
                                <input type="number" name="general" id="general" value={initialBalances.general} onChange={handleInitialBalanceChange} placeholder="0" className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight" />
                            </div>
                            <div>
                                <label htmlFor="provision" className="block text-sm font-medium text-text-secondary mb-1">Quỹ dự phòng ban đầu</label>
                                <input type="number" name="provision" id="provision" value={initialBalances.provision} onChange={handleInitialBalanceChange} placeholder="0" className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="incomeGoal" className="block text-sm font-medium text-text-secondary mb-1">Hạn mức chi tiêu hàng tháng</label>
                                <input type="number" name="incomeGoal" id="incomeGoal" value={monthlyIncomeGoal} onChange={handleIncomeGoalChange} placeholder="0" className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight" />
                            </div>
                            <div>
                               <label htmlFor="currentDate" className="block text-sm font-medium text-text-secondary mb-1">Ngày hiện tại (để tính toán)</label>
                                <input type="date" name="currentDate" id="currentDate" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="w-full bg-primary border border-accent rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-highlight" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                         <button type="button" onClick={onClose} className="bg-accent text-text-primary font-bold py-2 px-6 rounded-md hover:bg-gray-600 transition duration-300">
                            Hủy
                        </button>
                        <button type="submit" className="bg-highlight text-primary font-bold py-2 px-6 rounded-md hover:bg-teal-400 transition duration-300">
                            Lưu Cài Đặt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;