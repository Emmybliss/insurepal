import customers from './customers';
import notifications from './notifications';
import quotes from './quotes';
const api = {
    quotes: Object.assign(quotes, quotes),
    customers: Object.assign(customers, customers),
    notifications: Object.assign(notifications, notifications),
};

export default api;
