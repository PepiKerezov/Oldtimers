import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { NewOrderAdminEmail } from "@/emails/NewOrderAdminEmail";
import { OrderReceivedEmail } from "@/emails/OrderReceivedEmail";
import { NewContactAdminEmail } from "@/emails/NewContactAdminEmail";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

const FROM = `Old Timer's <${env.RESEND_FROM_EMAIL}>`;

export async function notifyAdminNewOrder(order: {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: number;
  partDesc: string;
  notes?: string | null;
}) {
  const client = getResend();
  if (!client) {
    logger.warn({ orderId: order.id }, "email.skip — RESEND_API_KEY missing");
    return;
  }
  const adminUrl = `${env.BETTER_AUTH_URL}/admin/orders/${order.id}`;
  await client.emails.send({
    from: FROM,
    to: env.ADMIN_EMAIL,
    subject: `Нова поръчка #${order.id.slice(0, 6)} — ${order.carMake} ${order.carModel}`,
    react: NewOrderAdminEmail({ ...order, orderId: order.id, adminUrl }),
  });
  logger.info({ orderId: order.id }, "email.notifyAdminNewOrder");
}

export async function confirmOrderToCustomer(order: {
  id: string;
  customerName: string;
  email: string;
  carMake: string;
  carModel: string;
  carYear: number;
}) {
  const client = getResend();
  if (!client) return;
  await client.emails.send({
    from: FROM,
    to: order.email,
    subject: "Получихме твоята заявка — Old Timer's",
    react: OrderReceivedEmail({
      customerName: order.customerName,
      carMake: order.carMake,
      carModel: order.carModel,
      carYear: order.carYear,
    }),
  });
  logger.info({ orderId: order.id }, "email.confirmOrderToCustomer");
}

export async function notifyAdminNewContact(submission: {
  id: string;
  name: string;
  email: string;
  message: string;
}) {
  const client = getResend();
  if (!client) {
    logger.warn({ submissionId: submission.id }, "email.skip — RESEND_API_KEY missing");
    return;
  }
  await client.emails.send({
    from: FROM,
    to: env.ADMIN_EMAIL,
    subject: `Ново съобщение от ${submission.name}`,
    replyTo: submission.email,
    react: NewContactAdminEmail({
      name: submission.name,
      email: submission.email,
      message: submission.message,
    }),
  });
  logger.info({ submissionId: submission.id }, "email.notifyAdminNewContact");
}
