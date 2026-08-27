// Lightweight in-page event bus so prediction pages can tell the
// NotificationBell to refresh immediately after a new prediction is made,
// instead of waiting for the next poll interval.
export const NOTIFY_REFRESH_EVENT = 'paddy:notification-refresh'

export const pingNotificationRefresh = () => {
  window.dispatchEvent(new Event(NOTIFY_REFRESH_EVENT))
}
