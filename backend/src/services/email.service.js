const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'JobPortal'}" <${process.env.EMAIL_FROM}>`,
      to, subject, html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`Email failed to ${to}: ${err.message}`);
      throw err;
    }
  }

  // ── Templates ────────────────────────────────────────────────────────────

  wrap(content) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
      <div style="background:#fff;padding:30px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <img src="${process.env.CLIENT_URL}/logo.png" alt="JobPortal" style="height:40px;margin-bottom:20px;" onerror="this.style.display='none'"/>
        ${content}
        <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">
          JobPortal &bull; <a href="${process.env.CLIENT_URL}" style="color:#6b7280;">Visit Site</a>
        </p>
      </div>
    </div>`;
  }

  btn(text, url, color = '#2563eb') {
    return `<a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">${text}</a>`;
  }

  async sendWelcome(user, verifyUrl) {
    return this.send({
      to: user.email,
      subject: 'Welcome to JobPortal! Verify your email',
      html: this.wrap(`
        <h2 style="color:#1f2937;">Welcome, ${user.firstName}! 🎉</h2>
        <p>Thank you for signing up. Verify your email to unlock all features.</p>
        ${this.btn('Verify Email Address', verifyUrl)}
        <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours.</p>
      `),
    });
  }

  async sendPasswordReset(user, resetUrl) {
    return this.send({
      to: user.email,
      subject: 'Password Reset Request - JobPortal',
      html: this.wrap(`
        <h2 style="color:#1f2937;">Reset Your Password 🔒</h2>
        <p>Hi ${user.firstName}, you requested a password reset.</p>
        ${this.btn('Reset Password', resetUrl, '#dc2626')}
        <p style="color:#6b7280;font-size:13px;">Link expires in 1 hour. Ignore if you didn't request this.</p>
      `),
    });
  }

  async sendApplicationConfirmation(jobseeker, job, companyName) {
    return this.send({
      to: jobseeker.email,
      subject: `Application Submitted - ${job.title}`,
      html: this.wrap(`
        <h2 style="color:#059669;">Application Received ✅</h2>
        <p>Hi ${jobseeker.firstName},</p>
        <p>Your application for <strong>${job.title}</strong> at <strong>${companyName}</strong> has been submitted.</p>
        <p>We'll notify you when the employer reviews your application.</p>
        <p style="color:#6b7280;">Good luck! 🤞</p>
      `),
    });
  }

  async sendApplicationStatusUpdate(jobseeker, job, status, note = '') {
    const map = {
      shortlisted:          { color: '#059669', icon: '⭐', label: 'Shortlisted' },
      interview_scheduled:  { color: '#7c3aed', icon: '📅', label: 'Interview Scheduled' },
      interviewed:          { color: '#2563eb', icon: '💬', label: 'Interview Completed' },
      offered:              { color: '#d97706', icon: '🎁', label: 'Offer Extended' },
      hired:                { color: '#059669', icon: '🎉', label: 'Hired!' },
      rejected:             { color: '#dc2626', icon: '❌', label: 'Not Selected' },
    };
    const s = map[status] || { color: '#2563eb', icon: '📋', label: status };

    return this.send({
      to: jobseeker.email,
      subject: `Application Update: ${s.label} - ${job.title}`,
      html: this.wrap(`
        <h2 style="color:${s.color};">${s.icon} Application Status Update</h2>
        <p>Hi ${jobseeker.firstName},</p>
        <p>Your application for <strong>${job.title}</strong> has been updated to: <strong style="color:${s.color}">${s.label}</strong></p>
        ${note ? `<div style="background:#f3f4f6;padding:12px;border-radius:6px;border-left:3px solid ${s.color};"><p style="margin:0;"><strong>Message from employer:</strong><br>${note}</p></div>` : ''}
        ${this.btn('View Application', `${process.env.CLIENT_URL}/jobseeker/applications`)}
      `),
    });
  }

  async sendNewApplicationAlert(employer, jobTitle, applicantName) {
    return this.send({
      to: employer.email,
      subject: `New Application - ${jobTitle}`,
      html: this.wrap(`
        <h2 style="color:#2563eb;">New Application Received 📬</h2>
        <p>Hi ${employer.firstName},</p>
        <p><strong>${applicantName}</strong> applied for <strong>${jobTitle}</strong>.</p>
        ${this.btn('Review Application', `${process.env.CLIENT_URL}/employer/applications`)}
      `),
    });
  }

  async sendJobAlert(user, jobs) {
    const jobList = jobs.map((j) =>
      `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin:8px 0;">
        <strong>${j.title}</strong><br>
        <span style="color:#6b7280;">${j.company || ''} &bull; ${j.city || 'Remote'}</span>
       </div>`
    ).join('');

    return this.send({
      to: user.email,
      subject: `${jobs.length} New Jobs Match Your Alert`,
      html: this.wrap(`
        <h2 style="color:#2563eb;">New Jobs Found 🔔</h2>
        <p>Hi ${user.firstName}, ${jobs.length} new job${jobs.length > 1 ? 's' : ''} match your alert:</p>
        ${jobList}
        ${this.btn('View All Jobs', `${process.env.CLIENT_URL}/jobs`)}
      `),
    });
  }

  async sendPackageExpiryWarning(user, packageName, expiresAt) {
    return this.send({
      to: user.email,
      subject: '⚠️ Your Package Expires Soon - JobPortal',
      html: this.wrap(`
        <h2 style="color:#d97706;">⚠️ Package Expiring Soon</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your <strong>${packageName}</strong> package expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong>.</p>
        <p>Renew now to keep your jobs and features active.</p>
        ${this.btn('Renew Package', `${process.env.CLIENT_URL}/packages`)}
      `),
    });
  }

  async sendPaymentConfirmation(user, invoice) {
    return this.send({
      to: user.email,
      subject: `Payment Confirmed - Invoice #${invoice._id}`,
      html: this.wrap(`
        <h2 style="color:#059669;">Payment Confirmed ✅</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your payment of <strong>${invoice.amount}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Invoice ID</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>#${invoice._id}</strong></td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Amount</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>${invoice.amount}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280;">Date</td><td style="padding:8px;"><strong>${new Date().toLocaleDateString()}</strong></td></tr>
        </table>
        ${this.btn('View Invoice', `${process.env.CLIENT_URL}/invoices/${invoice._id}`)}
      `),
    });
  }

  async sendInterviewScheduled(candidate, job, interview) {
    return this.send({
      to: candidate.email,
      subject: `Interview Scheduled - ${job.title}`,
      html: this.wrap(`
        <h2 style="color:#7c3aed;">Interview Scheduled 📅</h2>
        <p>Hi ${candidate.firstName},</p>
        <p>Your interview for <strong>${job.title}</strong> has been scheduled.</p>
        <div style="background:#f5f3ff;padding:16px;border-radius:6px;border-left:3px solid #7c3aed;">
          <p style="margin:4px 0;"><strong>Date & Time:</strong> ${new Date(interview.scheduledAt).toLocaleString()}</p>
          <p style="margin:4px 0;"><strong>Type:</strong> ${interview.type || 'To be confirmed'}</p>
          ${interview.link ? `<p style="margin:4px 0;"><strong>Link:</strong> <a href="${interview.link}">${interview.link}</a></p>` : ''}
          ${interview.location ? `<p style="margin:4px 0;"><strong>Location:</strong> ${interview.location}</p>` : ''}
          ${interview.notes ? `<p style="margin:4px 0;"><strong>Notes:</strong> ${interview.notes}</p>` : ''}
        </div>
      `),
    });
  }
}

module.exports = new EmailService();
