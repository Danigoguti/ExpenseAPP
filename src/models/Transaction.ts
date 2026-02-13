export interface RawRevolutRow {
  [key: string]: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  product: string;
  startedDate: Date;
  completedDate: Date;
  description: string;
  amount: number;
  fee: number;
  currency: string;
  state: TransactionState;
  balance: number;
  categoryId: string | null;
  importedAt: Date;
  importBatchId: string;
}

export type TransactionType =
  | 'CARD_PAYMENT'
  | 'TOPUP'
  | 'TRANSFER'
  | 'EXCHANGE'
  | 'ATM'
  | 'REWARD'
  | 'FEE'
  | 'OTHER';

export type TransactionState =
  | 'COMPLETED'
  | 'PENDING'
  | 'REVERTED'
  | 'DECLINED'
  | 'FAILED';

// Maps localized type strings to our canonical types
const TYPE_ALIASES: Record<string, TransactionType> = {
  // English
  'CARD_PAYMENT': 'CARD_PAYMENT',
  'TOPUP': 'TOPUP',
  'TOP-UP': 'TOPUP',
  'TOP_UP': 'TOPUP',
  'TRANSFER': 'TRANSFER',
  'EXCHANGE': 'EXCHANGE',
  'ATM': 'ATM',
  'REWARD': 'REWARD',
  'CASHBACK': 'REWARD',
  'FEE': 'FEE',
  // Spanish
  'PAGO CON TARJETA': 'CARD_PAYMENT',
  'PAGO_CON_TARJETA': 'CARD_PAYMENT',
  'TRANSFERIR': 'TRANSFER',
  'TRANSFERENCIA': 'TRANSFER',
  'RECARGA': 'TOPUP',
  'CAJERO': 'ATM',
  'CAMBIO': 'EXCHANGE',
  'RECOMPENSA': 'REWARD',
  'COMISION': 'FEE',
  'COMISIÓN': 'FEE',
  // French
  'PAIEMENT PAR CARTE': 'CARD_PAYMENT',
  'VIREMENT': 'TRANSFER',
  'RECHARGE': 'TOPUP',
  'RÉCOMPENSE': 'REWARD',
  'FRAIS': 'FEE',
  // German
  'KARTENZAHLUNG': 'CARD_PAYMENT',
  'ÜBERWEISUNG': 'TRANSFER',
  'AUFLADUNG': 'TOPUP',
  'GELDAUTOMAT': 'ATM',
  'UMTAUSCH': 'EXCHANGE',
  'BELOHNUNG': 'REWARD',
  'GEBÜHR': 'FEE',
  // Portuguese
  'PAGAMENTO COM CARTÃO': 'CARD_PAYMENT',
  'PAGAMENTO COM CARTAO': 'CARD_PAYMENT',
  'TRANSFERÊNCIA': 'TRANSFER',
  // Italian
  'PAGAMENTO CON CARTA': 'CARD_PAYMENT',
  'TRASFERIMENTO': 'TRANSFER',
  'RICARICA': 'TOPUP',
  'BANCOMAT': 'ATM',
  'PREMIO': 'REWARD',
  'COMMISSIONE': 'FEE',
};

// Maps localized state strings to our canonical states
const STATE_ALIASES: Record<string, TransactionState> = {
  // English
  'COMPLETED': 'COMPLETED',
  'PENDING': 'PENDING',
  'REVERTED': 'REVERTED',
  'DECLINED': 'DECLINED',
  'FAILED': 'FAILED',
  // Spanish
  'COMPLETADO': 'COMPLETED',
  'COMPLETADA': 'COMPLETED',
  'PENDIENTE': 'PENDING',
  'REVERTIDO': 'REVERTED',
  'REVERTIDA': 'REVERTED',
  'RECHAZADO': 'DECLINED',
  'RECHAZADA': 'DECLINED',
  'FALLIDO': 'FAILED',
  'FALLIDA': 'FAILED',
  // French
  'TERMINÉ': 'COMPLETED',
  'TERMINEE': 'COMPLETED',
  'EN ATTENTE': 'PENDING',
  'ANNULÉ': 'REVERTED',
  'REFUSÉ': 'DECLINED',
  'ÉCHOUÉ': 'FAILED',
  // German
  'ABGESCHLOSSEN': 'COMPLETED',
  'AUSSTEHEND': 'PENDING',
  'RÜCKGÄNGIG': 'REVERTED',
  'ABGELEHNT': 'DECLINED',
  'FEHLGESCHLAGEN': 'FAILED',
  // Portuguese
  'CONCLUÍDO': 'COMPLETED',
  'CONCLUIDO': 'COMPLETED',
  // Italian
  'COMPLETATO': 'COMPLETED',
  'COMPLETATA': 'COMPLETED',
  'IN SOSPESO': 'PENDING',
  'RIFIUTATO': 'DECLINED',
  'RIFIUTATA': 'DECLINED',
};

export function parseTransactionType(raw: string): TransactionType {
  const normalized = raw.trim().toUpperCase();
  return TYPE_ALIASES[normalized]
    ?? TYPE_ALIASES[normalized.replace(/\s+/g, '_')]
    ?? 'OTHER';
}

export function parseTransactionState(raw: string): TransactionState {
  const normalized = raw.trim().toUpperCase();
  return STATE_ALIASES[normalized] ?? 'COMPLETED';
}
