import NotificationCenter from '../components/common/NotificationCenter';

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h1 className="page-header">Notification Center</h1>
        <p className="page-sub">All system notifications — filter by unread or pinned</p>
      </div>
      <NotificationCenter />
    </div>
  );
}
