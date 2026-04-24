import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import React, { createElement } from 'react';
import { isProductionEnvironment } from '@/src/lib/constants';
import { createOutboundEmail, updateOutboundEmail } from '@/src/queries/emails';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface SendEmailOptions<T = Record<string, any>> {
  templateName: string;
  template: React.ComponentType<T>;
  templateProps: T;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  sentByUserId?: string | null;
  attachments?: EmailAttachment[];
}

interface SendPreRenderedEmailOptions {
  templateName: string;
  htmlContent: string;
  textContent: string;
  templateData?: any;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  sentByUserId?: string | null;
  attachments?: EmailAttachment[];
}

function shouldSendEmails(): boolean {
  if (isProductionEnvironment) {
    return true;
  }

  return process.env.SEND_EMAILS_DEVELOPMENT === 'true';
}

function shouldSkipQueue(): boolean {
  return process.env.EMAIL_SKIP_QUEUE === 'true';
}

export function createEmailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export function getEmailRecipients(params: {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}) {
  const isNotProduction = !isProductionEnvironment;
  const developmentCatchAll =
    process.env.DEVELOPMENT_CATCH_ALL_ADDRESS || 'rafael@platan.us';

  const emailTo = isNotProduction ? developmentCatchAll : params.to;
  const emailCc = isNotProduction ? undefined : params.cc;
  const emailBcc = isNotProduction ? undefined : params.bcc;
  const emailReplyTo = params.replyTo || process.env.EMAIL_REPLY_TO;

  // Log email routing for debugging
  console.log(
    `📧 [EMAIL ROUTING] isNotProduction: ${isNotProduction}, NODE_ENV: ${process.env.NODE_ENV}, Original To: ${params.to}, Actual To: ${emailTo}`,
  );

  return { emailTo, emailCc, emailBcc, emailReplyTo };
}

async function renderTemplate<T>(Template: React.ComponentType<T>, props: T) {
  const element = createElement(Template as React.ComponentType<any>, props);
  const html = await render(element);
  const text = await render(element, { plainText: true });

  return { html, text };
}

async function sendEmailImmediately(
  emailRecord: any,
  params: {
    to: string | string[];
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    attachments?: EmailAttachment[];
  },
) {
  const shouldSend = shouldSendEmails();

  if (!shouldSend) {
    await updateOutboundEmail(emailRecord.id, {
      status: 'sent',
      sentAt: new Date(),
      externalMessageId: 'dev-mock-id',
    });

    console.log(
      `📧 Email ${emailRecord.id} not sent in development (SEND_EMAILS_DEVELOPMENT !== "true")`,
    );
    return;
  }

  const transporter = createEmailTransporter();
  const { emailTo, emailCc, emailBcc, emailReplyTo } = getEmailRecipients({
    to: params.to,
    cc: params.cc,
    bcc: params.bcc,
    replyTo: params.replyTo,
  });

  const mailOptions: any = {
    from: process.env.DEFAULT_FROM_EMAIL || 'mailer@hack.platan.us',
    to: emailTo,
    cc: emailCc,
    bcc: emailBcc,
    replyTo: emailReplyTo,
    subject: params.subject,
    html: params.htmlContent,
    text: params.textContent,
  };

  if (params.attachments && params.attachments.length > 0) {
    mailOptions.attachments = params.attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }));
  }

  const result = await transporter.sendMail(mailOptions);

  await updateOutboundEmail(emailRecord.id, {
    status: 'sent',
    sentAt: new Date(),
    externalMessageId: result.messageId,
  });

  console.log(`📧 Email ${emailRecord.id} sent immediately`);
}

async function sendEmailInternal(params: {
  templateName: string;
  htmlContent: string;
  textContent: string;
  templateData?: any;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  sentByUserId?: string | null;
  attachments?: EmailAttachment[];
}) {
  const emailRecord = await createOutboundEmail({
    templateName: params.templateName,
    to: Array.isArray(params.to) ? params.to[0] : params.to,
    cc: params.cc || null,
    bcc: params.bcc || null,
    replyTo: params.replyTo || process.env.EMAIL_REPLY_TO || null,
    subject: params.subject,
    htmlContent: params.htmlContent,
    textContent: params.textContent,
    templateData: params.templateData,
    sentByAdminId: params.sentByUserId || null,
    status: 'pending',
  });

  if (shouldSkipQueue()) {
    try {
      await sendEmailImmediately(emailRecord, {
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        replyTo: emailRecord.replyTo || undefined,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        attachments: params.attachments,
      });
    } catch (error) {
      console.error(
        `📧 Failed to send email ${emailRecord.id} immediately:`,
        error,
      );
      await updateOutboundEmail(emailRecord.id, {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    console.log(
      `📧 Email queued for sending (ID: ${emailRecord.id}, To: ${params.to}, Subject: ${params.subject})`,
    );
  }

  return { success: true, outboundEmailId: emailRecord.id };
}

export async function sendEmail<T>(options: SendEmailOptions<T>) {
  const { html, text } = await renderTemplate(
    options.template,
    options.templateProps,
  );

  return sendEmailInternal({
    templateName: options.templateName,
    htmlContent: html,
    textContent: text,
    templateData: options.templateProps,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    replyTo: options.replyTo,
    subject: options.subject,
    sentByUserId: options.sentByUserId,
    attachments: options.attachments,
  });
}

export async function sendPreRenderedEmail(
  options: SendPreRenderedEmailOptions,
) {
  return sendEmailInternal({
    templateName: options.templateName,
    htmlContent: options.htmlContent,
    textContent: options.textContent || '',
    templateData: options.templateData,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    replyTo: options.replyTo,
    subject: options.subject,
    sentByUserId: options.sentByUserId,
    attachments: options.attachments,
  });
}
