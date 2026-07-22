import AuthenticatedSessionController from './AuthenticatedSessionController';
import ConfirmablePasswordController from './ConfirmablePasswordController';
import EmailVerificationNotificationController from './EmailVerificationNotificationController';
import EmailVerificationPromptController from './EmailVerificationPromptController';
import NewPasswordController from './NewPasswordController';
import PasswordResetLinkController from './PasswordResetLinkController';
import RegisteredUserController from './RegisteredUserController';
import SubscriberRegistrationController from './SubscriberRegistrationController';
import TenantRegistrationController from './TenantRegistrationController';
import VerifyEmailController from './VerifyEmailController';
const Auth = {
    SubscriberRegistrationController: Object.assign(SubscriberRegistrationController, SubscriberRegistrationController),
    TenantRegistrationController: Object.assign(TenantRegistrationController, TenantRegistrationController),
    RegisteredUserController: Object.assign(RegisteredUserController, RegisteredUserController),
    AuthenticatedSessionController: Object.assign(AuthenticatedSessionController, AuthenticatedSessionController),
    PasswordResetLinkController: Object.assign(PasswordResetLinkController, PasswordResetLinkController),
    NewPasswordController: Object.assign(NewPasswordController, NewPasswordController),
    EmailVerificationPromptController: Object.assign(EmailVerificationPromptController, EmailVerificationPromptController),
    VerifyEmailController: Object.assign(VerifyEmailController, VerifyEmailController),
    EmailVerificationNotificationController: Object.assign(EmailVerificationNotificationController, EmailVerificationNotificationController),
    ConfirmablePasswordController: Object.assign(ConfirmablePasswordController, ConfirmablePasswordController),
};

export default Auth;
