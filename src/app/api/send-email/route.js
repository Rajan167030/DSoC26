import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Nodemailer transporter as fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'akshittiwari29@gmail.com',
    pass: process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD
  }
});

export async function POST(request) {
  try {
    const { to, name, status, applicationId, role } = await request.json();
    const userName = to.split('@')[0];
    // if gg@gmail.com -> gg

    if (!to || !name || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (status === 'approved' && !role) {
      return NextResponse.json(
        { error: 'Role is required for approved emails' },
        { status: 400 }
      );
    }

    // Email templates based on status
    const getEmailContent = (status) => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://code.elitecoders.xyz';
      const roleKey = (role || '').toLowerCase();
      const displayRole = (() => {
        const readable = (roleKey || 'contributor').replace('-', ' ');
        return readable.charAt(0).toUpperCase() + readable.slice(1).toLowerCase();
      })();

      // Attachments per role + common banner
      const attachmentMap = {
        contributor: [
          {
            filename: 'DSoC-Contributor-ID-Template.png',
            path: 'https://drive.google.com/uc?export=download&id=1kr6sEDX7fp7xxHhQhbqOvfh4Nb5m-NvB'
          }
        ],
        mentor: [
          {
            filename: 'DSoC-Mentor-ID-Template.png',
            path: 'https://drive.google.com/uc?export=download&id=1NC-nBsU1EuDcRKxntR3rNUuRS0_NKC6g'
          }
        ],
        'project-admin': [
          {
            filename: 'DSoC-Project-Admin-ID-Template.png',
            path: 'https://drive.google.com/uc?export=download&id=1MhmyQJ4Twef7Yc7IiSO14a4jffouZ-Ms'
          },
          {
            filename: 'DSoC-Project-Admin-Instructions.pdf',
            path: 'https://drive.google.com/uc?export=download&id=1Ht_LWSHABm1kb0Hazh8UvWXuxmuWYtZX'
          }
        ]
      };

      const commonBanner = {
        filename: 'DSoC-Banner.png',
        path: 'https://drive.google.com/uc?export=download&id=1CHVPW_32naqJgqrNH4QA2xmNzljBzom9'
      };
      
      switch (status) {
        case 'approved': {
          const roleAttachments = attachmentMap[roleKey] || [];
          const attachments = [...roleAttachments, commonBanner];

          return {
            subject: '🎉 Welcome to DSoC 2026 - Your Application is Approved!',
            attachments,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.7; 
                    color: #1f2937;
                    background-color: #f9fafb;
                    padding: 20px;
                  }
                  .email-wrapper { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                  }
                  .header { 
                    background: #111827;
                    color: white;
                    padding: 40px 32px;
                    text-align: center;
                  }
                  .header h1 { 
                    font-size: 24px;
                    font-weight: 600;
                    line-height: 1.3;
                    margin-bottom: 8px;
                  }
                  .header p {
                    font-size: 15px;
                    opacity: 0.9;
                    font-weight: 400;
                  }
                  .content { 
                    padding: 40px 32px;
                    background: white;
                  }
                  
                  /* Status Section */
                  .status-section {
                    text-align: center;
                    margin-bottom: 32px;
                  }
                  .status-label {
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: #6b7280;
                    font-weight: 500;
                    margin-bottom: 12px;
                  }
                  .status-badge { 
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #111827;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 14px;
                  }
                  
                  /* Application ID Badge */
                  .app-id-badge {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 32px 0;
                    text-align: center;
                  }
                  .app-id-badge .label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #9ca3af;
                    font-weight: 600;
                    margin-bottom: 8px;
                  }
                  .app-id-badge .id {
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    color: #111827;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                  }
                  
                  /* Call to Action */
                  .cta-section {
                    margin: 32px 0;
                  }
                  .cta-text {
                    font-size: 15px;
                    color: #4b5563;
                    margin-bottom: 20px;
                    text-align: center;
                    line-height: 1.6;
                  }
                  .cta-text strong {
                    color: #111827;
                    font-weight: 600;
                  }
                  .cta-button { 
                    display: block;
                    width: 100%;
                    background: #111827;
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 16px;
                    text-align: center;
                    transition: background 0.2s;
                    border: none;
                  }
                  .cta-button:hover {
                    background: #1f2937;
                  }
                  .secondary-link {
                    display: block;
                    text-align: center;
                    margin-top: 12px;
                    font-size: 14px;
                    color: #6b7280;
                    text-decoration: none;
                    font-weight: 500;
                  }
                  .secondary-link:hover {
                    color: #111827;
                  }
                  
                  /* What's Next Section */
                  .whats-next {
                    background: #f9fafb;
                    border-radius: 6px;
                    padding: 28px 24px;
                    margin: 32px 0;
                    border: 1px solid #e5e7eb;
                  }
                  .whats-next h2 {
                    color: #111827;
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 6px;
                  }
                  .whats-next .subtitle {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 20px;
                  }
                  .whats-next ol {
                    counter-reset: step-counter;
                    list-style: none;
                    padding: 0;
                  }
                  .whats-next li {
                    counter-increment: step-counter;
                    margin: 16px 0;
                    padding-left: 40px;
                    position: relative;
                    color: #374151;
                    font-size: 14px;
                    line-height: 1.6;
                  }
                  .whats-next li:before {
                    content: counter(step-counter);
                    position: absolute;
                    left: 0;
                    top: 0;
                    background: #111827;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 12px;
                  }
                  .whats-next li strong {
                    color: #111827;
                    font-weight: 600;
                  }
                  .profile-url {
                    display: inline-block;
                    background: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #4b5563;
                    margin-top: 4px;
                    border: 1px solid #e5e7eb;
                  }
                  
                  /* Resources Section */
                  .resources {
                    border-top: 1px solid #e5e7eb;
                    padding-top: 24px;
                    margin-top: 32px;
                  }
                  .resources h3 {
                    color: #111827;
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 16px;
                  }
                  .resources ul {
                    list-style: none;
                    padding: 0;
                  }
                  .resources li {
                    margin: 12px 0;
                    font-size: 14px;
                    color: #4b5563;
                  }
                  .resources a {
                    color: #111827;
                    text-decoration: none;
                    font-weight: 500;
                  }
                  .resources a:hover {
                    text-decoration: underline;
                  }
                  
                  /* Footer */
                  .footer { 
                    background: #f9fafb;
                    color: #6b7280;
                    text-align: center;
                    padding: 24px 32px;
                    font-size: 13px;
                    line-height: 1.6;
                    border-top: 1px solid #e5e7eb;
                  }
                  .footer p {
                    margin: 6px 0;
                  }
                  .footer a {
                    color: #111827;
                    text-decoration: none;
                  }
                  .footer a:hover {
                    text-decoration: underline;
                  }
                  .footer .meta {
                    margin-top: 12px;
                    font-size: 12px;
                    color: #9ca3af;
                  }
                  
                  /* Mobile Responsive */
                  @media only screen and (max-width: 600px) {
                    body { padding: 12px; }
                    .header { padding: 32px 20px; }
                    .header h1 { font-size: 20px; }
                    .content { padding: 32px 20px; }
                    .cta-button { font-size: 15px; padding: 14px 24px; }
                    .whats-next { padding: 20px 18px; }
                  }
                </style>
              </head>
              <body>
                <div class="email-wrapper">
                  <!-- Header -->
                  <div class="header">
                    <h1>Congratulations, ${name}!</h1>
                    <p>You're officially part of DSoC 2026</p>
                  </div>
                  
                  <div class="content">
                    <!-- Status -->
                    <div class="status-section">
                      <div class="status-label">Application Status</div>
                      <div class="status-badge">
                        <span>✓</span>
                        <span>APPROVED</span>
                      </div>
                    </div>
                    
                    <!-- Application ID Badge -->
                    <div class="app-id-badge">
                      <div class="label">APPLICATION ID</div>
                      <div class="id">${applicationId}</div>
                    </div>

                    <div style="text-align:center; margin: 8px 0 24px 0; font-size: 14px; color: #4b5563;">
                      Your approved role: <strong style="color:#111827;text-transform:capitalize;">${displayRole}</strong>
                    </div>
                    
                    <!-- CTA Section -->
                    <div class="cta-section">
                      <p class="cta-text">
                        <strong>Next step:</strong> Generate your official DSoC 2026 ID Card to access your dashboard and community.
                      </p>
                      <a href="${baseUrl}/id-card/generate" class="cta-button">
                        Generate Your ID Card
                      </a>
                      <a href="${baseUrl}/profile/${userName.toLowerCase().replace(/\s+/g, '')}" class="secondary-link">
                        View your profile →
                      </a>
                    </div>
                    
                    <!-- What's Next -->
                    <div class="whats-next">
                      <h2>What's Next?</h2>
                      <p class="subtitle">Complete these steps to get started</p>
                      <ol>
                        <li>
                          <strong>Complete these task to be eligible for certificates - <a href="https://code.elitecoders.xyz/tasks">Link</a>
                        </li>
                        <li>
                          <strong>Download your ID assets</strong> – Role-specific ID card and banner are attached to this email.
                        </li>
                        <li>
                          <strong>${displayRole} onboarding is complete</strong> – Your registration has been recorded, you can access the website.
                        </li>
                        <li>
                             <strong>Post your ID card on social media</strong> – Share your DSoC participation on <strong>LinkedIn</strong> and help spread the open-source spirit.
                        </li>
                        <li>
                          <strong>Please stay tuned</strong> – Projects and contribution guidelines will be visible once onboarding is completed
                        </li>
                        <li>
                          <strong>Contributions begin on 1st January</strong> – You can start contributing once projects go live
                        </li>
                      </ol>

                    </div>
                    
                    <!-- Resources -->
                    <div class="resources">
                      <h3>Important Resources</h3>
                      <ul>
                        <li>
                          <a href="${baseUrl}/leaderboard">Leaderboard</a> – Track your ranking
                        </li>
                        <li>
                          <a href="https://code.elitecoders.xyz">Dashboard</a> – Your personalized stats
                        </li>
                        <li>
                          <a href="${baseUrl}/#community">Guidelines</a> – Code of conduct
                        </li>
                        <li>
                          <a href="mailto:code@elitecoders.xyz">Support</a> – Contact our team
                        </li>
                      </ul>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 32px;">
                      Happy Coding!<br>
                      <strong style="color: #111827;">The DSoC Team</strong>
                    </p>
                  </div>
                  
                  <!-- Footer -->
                  <div class="footer">
                    <p><strong>DSoC 2026</strong> – Devnovate Summer of Code</p>
                    <p><a href="https://github.com/hackwithindia">github.com/hackwithindia</a> • <a href="mailto:hello@hackwithindia.tech">hello@hackwithindia.tech</a></p>
                    <p class="meta">This is an automated email. Please do not reply directly to this message.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Congratulations ${name}!\n\nYour ECWoC 2026 application has been APPROVED!\nRole: ${displayRole}\nApplication ID: ${applicationId}\n\nNext step: Generate your official ECWoC 2026 ID Card\n${baseUrl}/id-card/generate\n\nWhat's Next?\n1. Download attachments – role-specific ID card and banner (see email attachments)\n2. Access your profile – ${baseUrl}/profile/${userName.toLowerCase().replace(/\s+/g, '')}\n3. Join the community – Connect with others\n4. Start contributing – Browse projects and make impact\n\nImportant Resources:\nLeaderboard: ${baseUrl}/leaderboard\nDashboard: https://code.elitecoders.xyz\nGuidelines: ${baseUrl}/#community\nSupport: code@elitecoders.xyz\n\nHappy Coding!\nThe ECWoC Team\n\ncode.elitecoders.xyz • code@elitecoders.xyz`
          };
        }
        
        case 'rejected':
          return {
            subject: 'ECWoC 2026 Application Status Update',
            attachments: [],
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6; 
                    color: #1f2937;
                    background-color: #f3f4f6;
                    padding: 20px;
                  }
                  .email-wrapper { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  }
                  .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                  }
                  .header h1 { 
                    font-size: 24px;
                    font-weight: 600;
                  }
                  .content { 
                    padding: 40px 30px;
                    background: white;
                  }
                  .status-badge { 
                    display: inline-block;
                    background: #ef4444;
                    color: white;
                    padding: 8px 20px;
                    border-radius: 24px;
                    font-weight: 600;
                    font-size: 14px;
                    margin: 20px 0;
                  }
                  .app-id-box {
                    background: #f9fafb;
                    border-left: 4px solid #667eea;
                    padding: 16px;
                    margin: 20px 0;
                    border-radius: 8px;
                  }
                  .encouragement {
                    background: #f0fdf4;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 30px 0;
                    border-left: 4px solid #10b981;
                  }
                  .encouragement h3 {
                    color: #166534;
                    font-size: 18px;
                    margin-bottom: 16px;
                  }
                  .encouragement ul {
                    margin-left: 20px;
                  }
                  .encouragement li {
                    margin: 10px 0;
                    color: #1f2937;
                  }
                  .footer { 
                    background: #1f2937;
                    color: #9ca3af;
                    text-align: center;
                    padding: 30px;
                    font-size: 13px;
                  }
                  .footer p {
                    margin: 8px 0;
                  }
                  .footer a {
                    color: #60a5fa;
                    text-decoration: none;
                  }
                  .divider {
                    height: 1px;
                    background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                    margin: 30px 0;
                  }
                </style>
              </head>
              <body>
                <div class="email-wrapper">
                  <div class="header">
                    <h1>ECWoC 2026 Application Update</h1>
                  </div>
                  
                  <div class="content">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hello ${name},</p>
                    
                    <p style="margin-bottom: 20px;">
                      Thank you for your interest in participating in DSoC 2026 (Devnovate Summer of Code).
                    </p>
                    
                    <p style="margin-bottom: 20px;">
                      After careful review of all applications, we regret to inform you that your application has been 
                      <span class="status-badge">✗ NOT SELECTED</span> for this edition.
                    </p>
                    
                    <div class="app-id-box">
                      <strong style="color: #667eea;">Application ID:</strong> ${applicationId}
                    </div>
                    
                    <div class="encouragement">
                      <h3>🌟 Keep Growing!</h3>
                      <p style="margin-bottom: 16px;">While we couldn't accept your application this time, we strongly encourage you to:</p>
                      <ul>
                        <li>Continue contributing to open source projects independently</li>
                        <li>Build your skills and work on personal projects</li>
                        <li>Apply again in future editions of ECWoC</li>
                        <li>Stay connected with the open source community</li>
                        <li>Check out other open source programs throughout the year</li>
                      </ul>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <p style="margin-top: 30px; font-size: 16px; color: #4b5563;">
                      We appreciate your interest in ECWoC and wish you the very best in your coding journey. Keep building amazing things! 🚀
                    </p>
                    
                    <p style="margin-top: 20px; font-size: 16px;">
                      <strong>Best regards,</strong><br>
                      <span style="color: #6b7280;">The ECWoC Team</span>
                    </p>
                  </div>
                  
                  <div class="footer">
                    <p><strong>DSoC 2026</strong> - Devnovate Summer of Code</p>
                    <p>Website: <a href="https://github.com/hackwithindia">github.com/hackwithindia</a> | Email: <a href="mailto:hello@hackwithindia.tech">hello@hackwithindia.tech</a></p>
                    <p style="margin-top: 16px; font-size: 12px;">This is an automated email. Please do not reply directly to this message.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Hello ${name},\n\nThank you for your interest in ECWoC 2026.\n\nAfter careful review, we regret to inform you that your application (${applicationId}) has not been selected for this edition.\n\nWe encourage you to:\n- Continue contributing to open source\n- Build your skills and work on projects\n- Apply again in future editions\n- Stay connected with the community\n\nWe appreciate your interest and wish you the best in your coding journey!\n\nBest regards,\nThe ECWoC Team\n\nWebsite: https://code.elitecoders.xyz\nEmail: code@elitecoders.xyz`
          };
        
        default: // pending
          return {
            subject: 'ECWoC Application Status Update - Under Review',
            attachments: [],
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  .badge { background: #f59e0b; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Application Status Update</h1>
                  </div>
                  <div class="content">
                    <h2>Hello ${name},</h2>
                    <p>Your ECWoC application status has been updated.</p>
                    
                    <p>Current Status: <strong class="badge">⏳ UNDER REVIEW</strong></p>
                    
                    <p><strong>Application ID:</strong> ${applicationId}</p>
                    
                    <p>Our team is reviewing your application. You will receive another email once a final decision has been made.</p>
                    
                    <p style="margin-top: 30px;">Thank you for your patience!</p>
                    
                    <p><strong>Best regards,</strong><br>The ECWoC Team</p>
                  </div>
                  <div class="footer">
                    <p>DSoC 2026 - Devnovate Summer of Code<br>
                    This is an automated email. Please do not reply directly to this message.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Hello ${name},\n\nYour ECWoC application (${applicationId}) is now UNDER REVIEW.\n\nYou will receive another email once a final decision has been made.\n\nThank you for your patience!\nThe ECWoC Team`
          };
      }
    };

    const emailContent = getEmailContent(status);

    // Try sending via Resend first (if available)
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'ECWoC <onboarding@resend.dev>',
          to: [to],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          attachments: emailContent.attachments || []
        });

        if (error) {
          console.warn('⚠️ Resend failed, trying Nodemailer fallback...', error.message);
          throw new Error('Resend failed');
        }

        console.log('✅ Email sent via Resend:', {
          to,
          subject: emailContent.subject,
          status: status.toUpperCase(),
          emailId: data.id
        });

        return NextResponse.json({
          success: true,
          message: 'Email sent successfully via Resend',
          emailId: data.id,
          provider: 'resend'
        });
      } catch (resendError) {
        // Fallback to Nodemailer
        console.log('📧 Resend failed, attempting to send via Nodemailer...');
      }
    }
    
    // Use Nodemailer (either as fallback or primary if Resend not available)
    try {
      const info = await transporter.sendMail({
          from: `"ECWoC" <${process.env.SMTP_USER || 'noreply@ecwoc.com'}>`,
          to: to,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            attachments: emailContent.attachments || []
      });

      console.log('✅ Email sent via Nodemailer:', {
        to,
        subject: emailContent.subject,
        status: status.toUpperCase(),
        messageId: info.messageId
      });

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Nodemailer',
        messageId: info.messageId,
        provider: 'nodemailer'
      });
    } catch (nodemailerError) {
      console.error('❌ Email sending failed:', {
        error: nodemailerError.message
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send email', 
          details: nodemailerError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    );
  }
}
