
import { EmailServiceConfig } from "../types";

/**
 * EMAIL SERVICE
 * Supports:
 * 1. EmailJS (No backend required)
 * 2. Microsoft Graph API (Direct User Send)
 * 3. Google Gmail API (Direct User Send)
 */

export const sendRealEmail = async (
    config: EmailServiceConfig,
    toEmail: string,
    subject: string,
    message: string
): Promise<boolean> => {
    
    if (!toEmail || toEmail.trim() === '') {
        console.warn("EmailService: No recipient email provided.");
        return false;
    }

    // --- 1. MICROSOFT GRAPH API STRATEGY ---
    if (config.provider === 'microsoft' && config.accessToken) {
        try {
            console.log("EmailService: Sending via Microsoft Graph API...");
            const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        subject: subject,
                        body: {
                            contentType: "Text",
                            content: message
                        },
                        toRecipients: [
                            { emailAddress: { address: toEmail } }
                        ]
                    },
                    saveToSentItems: "true"
                })
            });

            if (response.ok) {
                console.log(`EmailService: Successfully sent via Microsoft to ${toEmail}`);
                return true;
            } else {
                const err = await response.text();
                console.error("Microsoft Graph Error:", err);
                // If token expired, we might want to trigger a re-auth in the UI (out of scope for this function)
                return false;
            }
        } catch (e) {
            console.error("Microsoft Graph Network Error", e);
            return false;
        }
    }

    // --- 2. GOOGLE GMAIL API STRATEGY ---
    if (config.provider === 'google' && config.accessToken) {
        try {
            console.log("EmailService: Sending via Gmail API...");
            // Construct MIME message
            const emailContent = [
                `To: ${toEmail}`,
                `Subject: ${subject}`,
                `Content-Type: text/plain; charset="UTF-8"`,
                ``,
                message
            ].join('\n');

            // Base64Url encode
            const base64EncodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    raw: base64EncodedEmail
                })
            });

            if (response.ok) {
                console.log(`EmailService: Successfully sent via Gmail to ${toEmail}`);
                return true;
            } else {
                const err = await response.text();
                console.error("Gmail API Error:", err);
                return false;
            }
        } catch (e) {
            console.error("Gmail API Network Error", e);
            return false;
        }
    }

    // --- 3. EMAILJS STRATEGY (FALLBACK / DEFAULT) ---
    if (config.provider === 'emailjs' && config.serviceId && config.templateId && config.publicKey) {
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
                console.log(`EmailService: Successfully sent via EmailJS to ${toEmail}`);
                return true;
            } else {
                const errorText = await response.text();
                console.error(`EmailService: Failed to send via EmailJS. ${errorText}`);
                return false;
            }
        } catch (error) {
            console.error("EmailService: EmailJS Network error", error);
            return false;
        }
    }

    console.warn("EmailService: No valid provider configured.");
    return false;
};
