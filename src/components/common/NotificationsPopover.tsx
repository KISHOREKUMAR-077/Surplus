import React from 'react';
import { Bell, CheckCheck, Clock, ShieldCheck, Truck, Building, AlertCircle, X } from 'lucide-react';
import { NotificationItem } from '../../types';
import { store } from '../../services/store';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDonation?: (donationId: string) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onSelectDonation,
}) => {
  if (!isOpen) return null;

  const notifications = store.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    store.markAllNotificationsRead();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-sm">Notifications & Dispatch Alerts</h4>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 font-mono">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 p-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active notifications right now.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (notif.donationId && onSelectDonation) {
                  onSelectDonation(notif.donationId);
                  onClose();
                }
              }}
              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                !notif.read ? 'bg-emerald-50/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                  {notif.title}
                </h5>
                <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                  {notif.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {notif.message}
              </p>
              {notif.donationId && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {notif.donationId}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold hover:underline">
                    View & Track →
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[10px] text-slate-400">
          SLAstice Live Socket & Webhook Dispatch System
        </span>
      </div>
    </div>
  );
};
