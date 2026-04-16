import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import '../styles/Toast.css';

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast glass toast-${toast.type}`}>
                    <div className="toast-icon">
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        {toast.type === 'warning' && <AlertTriangle size={20} />}
                    </div>
                    <div className="toast-message">{toast.message}</div>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>
                        <X size={16} />
                    </button>
                    <div
                        className="toast-progress"
                        style={{ animationDuration: `${toast.duration || 5000}ms` }}
                    />
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
