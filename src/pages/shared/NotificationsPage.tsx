import { useAppStore } from '../../store/appStore';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Shield, AlertCircle, Calendar, TrendingUp, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useAppStore();

  const myNotifs = notifications
    .filter(n => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unread = myNotifs.filter(n => !n.isRead);

  const notifIcons: Record<string, React.ElementType> = {
    approval_request: AlertCircle,
    approved: Shield,
    rejected: AlertCircle,
    renewal: Calendar,
    birthday: Calendar,
    system: Shield,
    call: Phone,
  };

  const notifColors: Record<string, string> = {
    approval_request: 'bg-amber-100 text-amber-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    renewal: 'bg-blue-100 text-blue-600',
    birthday: 'bg-pink-100 text-pink-600',
    system: 'bg-slate-100 text-slate-600',
    call: 'bg-purple-100 text-purple-600',
  };

  const handleMarkAll = () => {
    markAllNotificationsRead(currentUser!.id);
    toast.success('All notifications marked as read');
  };

  const handleClear = () => {
    clearNotifications(currentUser!.id);
    toast.success('Notifications cleared');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm">{unread.length} unread · {myNotifs.length} total</p>
        </div>
        <div className="flex gap-2">
          {unread.length > 0 && (
            <button onClick={handleMarkAll} className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          {myNotifs.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {myNotifs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-500 mb-1">All caught up!</h3>
          <p className="text-slate-400 text-sm">No notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myNotifs.map(notif => {
            const Icon = notifIcons[notif.type] || Bell;
            const iconColor = notifColors[notif.type] || 'bg-slate-100 text-slate-600';

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all cursor-pointer hover:shadow-md ${
                  notif.isRead ? 'border-slate-100 opacity-75' : 'border-blue-100 ring-1 ring-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${notif.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{notif.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {format(parseISO(notif.createdAt), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {notif.link && (
                        <Link to={notif.link} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                          <ExternalLink className="w-3 h-3" /> View Details
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button
                          onClick={e => { e.stopPropagation(); markNotificationRead(notif.id); }}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          <Check className="w-3 h-3" /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
