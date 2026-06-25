import quotes from './quotes'
import customers from './customers'
import notifications from './notifications'
const api = {
    quotes: Object.assign(quotes, quotes),
customers: Object.assign(customers, customers),
notifications: Object.assign(notifications, notifications),
}

export default api