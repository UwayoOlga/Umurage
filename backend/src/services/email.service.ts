import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,  
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || '',
            },
        });
    }

    async sendAdminInvitation(email: string, name: string, level: string, location: string, token: string) {
        const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-account?token=${token}`;

        const htmlTemplate = `
           <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
                    .header { background: #059669; padding: 32px; text-align: center; color: white; }
                    .content { padding: 40px; color: #334155; line-height: 1.6; }
                    .badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 99px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
                    .button { display: inline-block; background: #059669; color: white !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 24px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2); }
                    .footer { padding: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
                    .token-box { background: #f1f5f9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 14px; margin-top: 8px; border: 1px dashed #cbd5e1; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0; font-size: 24px;">Umurage Invitation</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${name}</strong>,</p>
                        <p>You have been officially invited to join the <strong>Umurage Enterprise Dashboard</strong> as a system administrator.</p>
                        
                        <div style="margin: 24px 0;">
                            <span class="badge">ASSIGNED ROLE: ${level.toUpperCase()} ADMIN</span>
                            <div style="font-size: 14px; margin-top: 8px;">Locality: <strong>${location}</strong></div>
                        </div>

                        <p>To access your dashboard and start monitoring your area, please click the button below to set up your secure password:</p>
                        
                        <center>
                            <a href="${setupLink}" class="button">Activate My Account</a>
                        </center>

                        <p style="font-size: 13px; color: #64748b; margin-top: 32px;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <small>${setupLink}</small>
                        </p>

                        <p style="font-size: 13px; color: #64748b;">Your recovery token (if needed during setup):</p>
                        <div class="token-box">${token}</div>
                    </div>
                    <div class="footer">
                        © 2026 Umurage Digital Solutions. All rights reserved.<br>
                        This is an official administrative enrollment email.
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            await this.transporter.sendMail({
                from: `"Umurage Administration" <${process.env.EMAIL_FROM || 'admin@umurage.rw'}>`,
                to: email,
                subject: 'Action Required: Activate Your Admin Account',
                html: htmlTemplate,
            });
            console.log(`✅ Invitation Email sent to ${email}`);
        } catch (error) {
            console.error('❌ Failed to send invitation email:', error);
            // In development, we fallback to logging the link
            console.log('\n--- SIMULATED EMAIL INVITATION ---');
            console.log(`To: ${email}`);
            console.log(`Link: ${setupLink}`);
            console.log('----------------------------------\n');
        }
    }
}

export const emailService = new EmailService();
