import { eq } from 'drizzle-orm';
import { isProductionEnvironment } from '@/src/lib/constants';
import { db } from '@/src/lib/db';
import { outboundEmails } from '@/src/lib/db/schema';
import { createEmailTransporter, getEmailRecipients } from '@/src/lib/email';

function shouldSendEmails(): boolean {
  if (isProductionEnvironment) {
    return true;
  }

  return process.env.SEND_EMAILS_DEVELOPMENT === 'true';
}

export async function processEmailQueue() {
  const pendingEmails = await db
    .select()
    .from(outboundEmails)
    .where(eq(outboundEmails.status, 'pending'))
    .limit(30);

  if (pendingEmails.length === 0) {
    console.log('[CRON] 📧 No pending emails to process');
    return;
  }

  console.log(`[CRON] 📧 Processing ${pendingEmails.length} pending emails`);

  for (const email of pendingEmails) {
    try {
      const shouldSend = shouldSendEmails();

      if (!shouldSend) {
        await db
          .update(outboundEmails)
          .set({
            status: 'sent',
            sentAt: new Date(),
            externalMessageId: 'dev-mock-id',
            updatedAt: new Date(),
          })
          .where(eq(outboundEmails.id, email.id));

        console.log(
          `[CRON] 📧 Email ${email.id} not sent in development (SEND_EMAILS_DEVELOPMENT !== "true")`,
        );
        continue;
      }

      const transporter = createEmailTransporter();
      const { emailTo, emailCc, emailBcc, emailReplyTo } = getEmailRecipients({
        to: email.to,
        cc: email.cc ?? undefined,
        bcc: email.bcc ?? undefined,
        replyTo: email.replyTo ?? undefined,
      });

      const result = await transporter.sendMail({
        from: process.env.DEFAULT_FROM_EMAIL || 'mailer@hack.platan.us',
        to: emailTo,
        cc: emailCc,
        bcc: emailBcc,
        replyTo: emailReplyTo,
        subject: email.subject,
        html: email.htmlContent,
        text: email.textContent ?? undefined,
      });

      await db
        .update(outboundEmails)
        .set({
          status: 'sent',
          sentAt: new Date(),
          externalMessageId: result.messageId,
          updatedAt: new Date(),
        })
        .where(eq(outboundEmails.id, email.id));

      console.log(`[CRON] 📧 Email ${email.id} sent successfully`);
    } catch (error) {
      console.error(`[CRON] 📧 Error processing email ${email.id}:`, error);

      await db
        .update(outboundEmails)
        .set({
          status: 'failed',
          failureReason:
            error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(outboundEmails.id, email.id));
    }
  }

  console.log(`[CRON] 📧 Finished processing ${pendingEmails.length} emails`);
}
