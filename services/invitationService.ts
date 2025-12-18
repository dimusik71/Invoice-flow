import { supabase } from './supabaseClient';

export interface InvitationResult {
  success: boolean;
  inviteLink?: string;
  error?: string;
}

export interface InviteUserParams {
  email: string;
  tenantId: string;
  role: string;
  tenantName: string;
}

export interface ParsedToken {
  tenantId: string;
  email: string;
  role: string;
  timestamp: number;
}

export const generateInvitationToken = (tenantId: string, email: string, role: string): string => {
  const tokenData = {
    tid: tenantId,
    email: email,
    role: role,
    ts: Date.now(),
    nonce: crypto.randomUUID()
  };
  return btoa(JSON.stringify(tokenData));
};

export const parseInvitationToken = (token: string): ParsedToken | null => {
  try {
    const decoded = JSON.parse(atob(token));
    return {
      tenantId: decoded.tid,
      email: decoded.email,
      role: decoded.role || 'Administrator',
      timestamp: decoded.ts
    };
  } catch {
    return null;
  }
};

export const sendMagicLinkInvite = async (params: InviteUserParams): Promise<InvitationResult> => {
  const { email, tenantId, role, tenantName } = params;
  
  try {
    const inviteToken = generateInvitationToken(tenantId, email, role);
    const redirectUrl = `${window.location.origin}?action=join&token=${inviteToken}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          tenant_id: tenantId,
          role: role,
          tenant_name: tenantName,
          invited_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Supabase OTP invite error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    return {
      success: true,
      inviteLink: redirectUrl
    };

  } catch (e: any) {
    console.error('Invitation service error:', e);
    return { 
      success: false, 
      error: e.message || 'Unknown error sending invitation' 
    };
  }
};

export const generateInvitationEmailContent = (
  tenantName: string,
  adminEmail: string,
  loginUrl: string
): { subject: string; body: string } => {
  const subject = `Welcome to ${tenantName} - Your InvoiceFlow Account`;
  
  const body = `Welcome to ${tenantName}!

You have been invited to join ${tenantName} as an Administrator on InvoiceFlow.

Your login details:
----------------------------
Email: ${adminEmail}
----------------------------

Click the link below to access your account. You'll receive a secure login link via email:

${loginUrl}

This invitation link will expire in 24 hours for security reasons.

If you did not expect this invitation, please ignore this email.

Best regards,
The InvoiceFlow Team`;

  return { subject, body };
};
