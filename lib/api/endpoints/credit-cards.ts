import { apiFetch } from "@/lib/api/client";
import { simulateNetworkDelay, USE_MOCK } from "@/lib/config";
import {
  mockCreditCards,
  mockInvoices,
  mockInvoicePayments,
  mockTransactions,
} from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import type {
  CreditCard,
  CreditCardRequest,
  InvoiceDetail,
  InvoicePaymentRequest,
  InvoiceSummary,
} from "@/types";

let localCards = [...mockCreditCards];
let localInvoices = [...mockInvoices];
let localPayments = { ...mockInvoicePayments };

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

  return apiFetch<CreditCard[]>("/credit-cards", {
    params: { includeArchived },
  });
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

  return apiFetch<CreditCard>(`/credit-cards/${id}`);
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
export async function deleteCreditCard(id: number): Promise<{ archived: boolean }> {
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
      return { archived: true };
    } else {
      localCards = localCards.filter((c) => c.id !== id);
      return { archived: false };
    }
  }

  return apiFetch<{ archived: boolean }>(`/credit-cards/${id}`, {
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

  return apiFetch<InvoiceDetail>(`/credit-cards/${cardId}/invoices/${ym}`);
}

/**
 * Registra o pagamento de uma fatura fechada ou vencida.
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

    if (invoice.status === "OPEN") {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "Não é possível registrar pagamento em fatura aberta",
      });
    }

    const remaining = invoice.total - invoice.paid;
    if (data.amount > remaining + 0.001) {
      throw new ApiError({
        status: 422,
        title: "Unprocessable Content",
        detail: "O valor informado excede o saldo devedor da fatura",
      });
    }

    invoice.paid += data.amount;
    if (invoice.paid >= invoice.total - 0.01) {
      invoice.status = "PAID";
    } else {
      invoice.status = "PARTIALLY_PAID";
    }

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
      invoice.paid = Math.max(0, invoice.paid - payment.amount);
      if (invoice.paid === 0) {
        invoice.status = "CLOSED";
      } else {
        invoice.status = "PARTIALLY_PAID";
      }
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
