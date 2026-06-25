import { FloatingWhatsApp } from 'react-floating-whatsapp';

const WhatsAppChat: React.FC = () => {
    return (
        <div className="fixed right-5 bottom-5 z-50">
            {/* WhatsApp Floating Chat */}
            <FloatingWhatsApp
                phoneNumber="+2348169668690" // Replace with your WhatsApp number
                accountName="InsurePal" // Your business or support name
                avatar="/images/insurepal-logo.png" // Replace with the path to your avatar/logo image
                statusMessage="Typically replies within 3 minutes" // Optional: Status message
                chatMessage="Hi there! How can we help you?" // Default message
                notification={true} // Disable internal notifications from the library
                notificationDelay={5}
                notificationSound={true}
                darkMode={false} // Optional: Enable/disable dark mode
                className="relative text-gray-700"
            />
        </div>
    );
};

export default WhatsAppChat;
