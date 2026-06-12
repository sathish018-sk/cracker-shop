import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-950/30',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm shadow-red-500/20',
    },
    info: {
      icon: Info,
      iconColor: 'text-primary',
      iconBg: 'bg-blue-100 dark:bg-blue-950/30',
      confirmBtn: 'bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary shadow-sm shadow-primary/20',
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`p-3 rounded-xl h-fit ${config.iconBg} ${config.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground leading-6">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{message}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-border rounded-xl transition-all duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${config.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
