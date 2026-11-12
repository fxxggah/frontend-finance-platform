import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import {
  mockCreditCards,
  mockInvoices,
  mockInvoicePayments,
  mockTransactions,
  TODAY,
} from "@/lib/mock-data";
import { listTransactions } from "./transactions";
import { ApiError } from "@/lib/api/errors";
import type {
  CreditCard,
  CreditCardRequest,
  InvoiceDetail,
  InvoicePaymentRequest,
  InvoiceSummary,
} from "@/types";

let localCards = [...mockCreditCards];
const localInvoices = structuredClone(mockInvoices);
const localPayments = structuredClone(mockInvoicePayments);

// Apenas o transporte mock calcula status; no modo real ele vem da API.
function updateMockInvoiceStatus(invoice: InvoiceSummary): void {
  if (TODAY <= invoice.closingDate) invoice.status = "OPEN";
  else if (Math.round(invoice.paid * 100) >= Math.round(invoice.total * 100)) invoice.status = "PAID";
  else if (TODAY > invoice.dueDate) invoice.status = "OVERDUE";
  else if (invoice.paid > 0) invoice.status = "PARTIALLY_PAID";
  else invoice.status = "CLOSED";
}

/**
 * Retorna os cartões de crédito cadastrados com limites e dados da fatura atual.
 * GET /api/v1/credit-cards
 */
export async function listCreditCards(includeArchived = false): Promise<CreditCard[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    if (includeArchived) {
      return localCards;
    }
    return localCards.filter((card) => !card.archived);
  }

  const cards = await apiFetch<CreditCard[]>("/credit-cards");
  return includeArchived ? cards : cards.filter(card => !card.archived);
}

/**
 * Retorna detalhes de um cartão de crédito específico por ID.
 * GET /api/v1/credit-cards/{id}
 */
export async function getCreditCard(id: number): Promise<CreditCard> {
  if (USE_MOCK) {
    await simulateNetworkDelay(200);
    const card = localCards.find((c) => c.id === id);
    if (!card) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Cartão de crédito não encontrado",
      });
    }
    return card;
  }

  const card = (await listCreditCards(true)).find(item => item.id === id);
  if (!card) throw new ApiError({ status: 404, title: "Cartão não encontrado", detail: "Este cartão não está disponível." });
  return card;
}

/**
 * Registra um novo cartão de crédito.
 * POST /api/v1/credit-cards
 */
export async function createCreditCard(data: CreditCardRequest): Promise<CreditCard> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const newCard: CreditCard = {
      id: Math.max(...localCards.map((c) => c.id), 0) + 1,
      name: data.name,
      creditLimit: data.creditLimit,
      usedLimit: 0,
      availableLimit: data.creditLimit,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      color: data.color || "#5B3DF5",
      icon: data.icon || "credit-card",
      archived: false,
      currentInvoice: {
        reference: "2026-11",
        closingDate: "2026-11-25",
        paid: 0,
        total: 0,
        status: "OPEN",
        dueDate: `2026-12-${String(data.dueDay).padStart(2, "0")}`,
      },
    };
    localCards.push(newCard);
    return newCard;
  }

  return apiFetch<CreditCard>("/credit-cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Atualiza um cartão de crédito existente.
 * PUT /api/v1/credit-cards/{id}
 */
export async function updateCreditCard(
  id: number,
  data: CreditCardRequest
): Promise<CreditCard> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const index = localCards.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Cartão não encontrado",
      });
    }

    const current = localCards[index];
    const used = current.usedLimit;
    const available = data.creditLimit - used;
    const updated: CreditCard = {
      ...current,
      name: data.name,
      creditLimit: data.creditLimit,
      availableLimit: available,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      color: data.color || current.color,
      icon: data.icon || current.icon,
    };
    localCards[index] = updated;
    return updated;
  }

  return apiFetch<CreditCard>(`/credit-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Remove ou arquiva um cartão de crédito.
 * DELETE /api/v1/credit-cards/{id}
 */
export async function deleteCreditCard(id: number): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const card = localCards.find((c) => c.id === id);
    if (!card) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Cartão não encontrado",
      });
    }

    // Se possui transações (card.id === 1), arquiva
    if (card.usedLimit > 0 || card.id === 1) {
      card.archived = true;
      return;
    } else {
      localCards = localCards.filter((c) => c.id !== id);
      return;
    }
  }

  return apiFetch<void>(`/credit-cards/${id}`, {
    method: "DELETE",
  });
}

/**
 * Retorna as faturas do cartão informado.
 * GET /api/v1/credit-cards/{id}/invoices
 */
export async function listInvoices(cardId: number): Promise<InvoiceSummary[]> {
  if (USE_MOCK) {
    await simulateNetworkDelay(250);
    return localInvoices;
  }

  return apiFetch<InvoiceSummary[]>(`/credit-cards/${cardId}/invoices`);
}

/**
 * Retorna os detalhes de uma fatura específica (compras e pagamentos).
 * GET /api/v1/credit-cards/{id}/invoices/{ym}
 */
export async function getInvoiceDetail(
  cardId: number,
  ym: string
): Promise<InvoiceDetail> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const invoice = localInvoices.find((i) => i.reference === ym);
    const baseSummary: InvoiceSummary = invoice || {
      reference: ym,
      closingDate: `${ym}-25`,
      dueDate: `${ym}-02`,
      total: 0,
      paid: 0,
      status: "OPEN",
    };

    const transactions = mockTransactions.filter(
      (t) => t.creditCard?.id === cardId && t.invoiceReference === ym
    );

    const payments = localPayments[ym] || [];

    return {
      ...baseSummary,
      transactions,
      payments,
    };
  }

  let invoice = (await listInvoices(cardId)).find(item => item.reference === ym);
  if (!invoice) {
    const current = (await getCreditCard(cardId)).currentInvoice;
    if (current?.reference === ym) invoice = current;
  }
  if (!invoice) throw new ApiError({ status: 404, title: "Fatura não encontrada", detail: "Esta fatura não está disponível." });
  const transactions: InvoiceDetail['transactions'] = [];
  // O contrato atual não oferece filtro por competência nem endpoint de detalhe.
  // Filtramos a competência retornada em cada lançamento, sem recalcular valores.
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const result = await listTransactions({ creditCardId: cardId, page, size: 100, sort: 'date,desc' });
    transactions.push(...result.content.filter(item => item.invoiceReference === ym));
    totalPages = result.totalPages;
    page += 1;
  }
  return { ...invoice, transactions };
}

/**
 * Registra pagamento parcial ou total, inclusive antes do fechamento.
 * POST /api/v1/credit-cards/{id}/invoices/{reference}/payments
 */
export async function payInvoice(
  cardId: number,
  reference: string,
  data: InvoicePaymentRequest
): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(350);
    const invoice = localInvoices.find((i) => i.reference === reference);
    if (!invoice) {
      throw new ApiError({
        status: 404,
        title: "Not Found",
        detail: "Fatura não encontrada",
      });
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new ApiError({
        status: 400,
        title: "Bad Request",
        detail: "O valor deve ser maior que zero",
        errors: [{ field: "amount", message: "O valor deve ser maior que zero" }],
      });
    }

    const amountCents = Math.round(data.amount * 100);
    const paidCents = Math.round(invoice.paid * 100);
    const remainingCents = Math.round(invoice.total * 100) - paidCents;
    if (amountCents > remainingCents) {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "O valor informado excede o saldo devedor da fatura",
      });
    }

    invoice.paid = (paidCents + amountCents) / 100;
    updateMockInvoiceStatus(invoice);

    if (!localPayments[reference]) {
      localPayments[reference] = [];
    }

    localPayments[reference].push({
      id: Math.floor(Math.random() * 100000) + 10,
      account: { id: data.accountId, name: "Conta" },
      amount: data.amount,
      date: data.date,
    });

    return;
  }

  return apiFetch<void>(`/credit-cards/${cardId}/invoices/${reference}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Estorna um pagamento de fatura.
 * DELETE /api/v1/credit-cards/{id}/invoices/{reference}/payments/{paymentId}
 */
export async function deleteInvoicePayment(
  cardId: number,
  reference: string,
  paymentId: number
): Promise<void> {
  if (USE_MOCK) {
    await simulateNetworkDelay(300);
    const invoice = localInvoices.find((i) => i.reference === reference);
    const list = localPayments[reference] || [];
    const payment = list.find((p) => p.id === paymentId);

    if (payment && invoice) {
      invoice.paid = Math.max(0, Math.round(invoice.paid * 100) - Math.round(payment.amount * 100)) / 100;
      updateMockInvoiceStatus(invoice);
      localPayments[reference] = list.filter((p) => p.id !== paymentId);
    }
    return;
  }

  return apiFetch<void>(
    `/credit-cards/${cardId}/invoices/${reference}/payments/${paymentId}`,
    {
      method: "DELETE",
    }
  );
}
