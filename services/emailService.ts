
import { EmailServiceConfig } from "../types";

/**
 * EMAIL SERVICE (REAL-WORLD IMPLEMENTATION)
 * Uses EmailJS REST API to send emails via connected organizational accounts (Gmail/Outlook).
 * This runs entirely client-side without a backend.
 */

export const sendRealEmail = async (
    config: EmailServiceConfig,
    toEmail: string,
    subject: string,
    message: string
): Promise<boolean> => {
    // 1. Validate Configuration
    if (!config.serviceId || !config.templateId || !config.publicKey) {
        console.warn("EmailService: Missing configuration keys. Emails will not be sent.");
        return false;
    }

    if (!toEmail || toEmail.trim() === '') {
        console.warn("EmailService: No recipient email provided.");
        return false;
    }

    try {
        const payload = {
            service_id: config.serviceId,
            template_id: config.templateId,
            user_id: config.publicKey,
            template_params: {
                to_email: toEmail,
                subject: subject,
                message: message
            }
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log(`EmailService: Successfully sent email to ${toEmail}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`EmailService: Failed to send. ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error("EmailService: Network error", error);
        return false;
    }
};
