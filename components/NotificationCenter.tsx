
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, AlertTriangle, Info, CheckCircle, AlertOctagon } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Invoice } from '../types';

interface NotificationCenterProps {
  onNavigate: (view: string, invoiceId?: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.targetId && notif.targetView) {
      onNavigate(notif.targetView, notif.targetId);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertOctagon size={16} className="text-rose-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-rose-50 border-rose-100';
      case 'warning': return 'bg-amber-50 border-amber-100';
      case 'success': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-slate-400 hover:text-white transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Notifications</h4>
            <div className="flex gap-1">
              <button onClick={markAllAsRead} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors" title="Mark all read">
                <Check size={14} />
              </button>
              <button onClick={clearNotifications} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors" title="Clear all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-full border shrink-0 h-fit ${getBgColor(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className={`text-sm font-semibold ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>{notif.title}</h5>
                        {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 text-right">
                        {notif.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
