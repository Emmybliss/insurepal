import Auth from './Auth';
import CustomerController from './CustomerController';
import Dashboard from './Dashboard';
import FinancialNoteController from './FinancialNoteController';
import MessageController from './MessageController';
import NotificationController from './NotificationController';
import PaymentController from './PaymentController';
import PolicyCategoryController from './PolicyCategoryController';
import PolicyClassController from './PolicyClassController';
import PolicyController from './PolicyController';
import PolicyTypeController from './PolicyTypeController';
import QuoteController from './QuoteController';
import ReportsController from './ReportsController';
import Settings from './Settings';
import SuperAdmin from './SuperAdmin';
const Controllers = {
    Auth: Object.assign(Auth, Auth),
    PaymentController: Object.assign(PaymentController, PaymentController),
    SuperAdmin: Object.assign(SuperAdmin, SuperAdmin),
    PolicyTypeController: Object.assign(PolicyTypeController, PolicyTypeController),
    PolicyCategoryController: Object.assign(PolicyCategoryController, PolicyCategoryController),
    PolicyClassController: Object.assign(PolicyClassController, PolicyClassController),
    PolicyController: Object.assign(PolicyController, PolicyController),
    Dashboard: Object.assign(Dashboard, Dashboard),
    CustomerController: Object.assign(CustomerController, CustomerController),
    QuoteController: Object.assign(QuoteController, QuoteController),
    FinancialNoteController: Object.assign(FinancialNoteController, FinancialNoteController),
    MessageController: Object.assign(MessageController, MessageController),
    NotificationController: Object.assign(NotificationController, NotificationController),
    ReportsController: Object.assign(ReportsController, ReportsController),
    Settings: Object.assign(Settings, Settings),
};

export default Controllers;
