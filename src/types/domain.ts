export type UUID = string
export type ISODate = string

export type CompanyRole = 'owner' | 'admin' | 'finance' | 'stock' | 'sales' | 'accountant' | 'viewer'
export type EntityStatus = 'active' | 'inactive'
export type FiscalDocumentType = 'nfe' | 'nfce' | 'nfse'
export type FiscalDocumentStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'cancelled'
export type FinancialEntryType = 'payable' | 'receivable'
export type FinancialEntryStatus = 'open' | 'partial' | 'paid' | 'overdue' | 'cancelled'

export interface Company {
  id: UUID
  legalName: string
  tradeName: string
  document: string
  taxRegime: string | null
  status: EntityStatus
  createdAt: ISODate
}

export interface BusinessPartner {
  id: UUID
  companyId: UUID
  kind: 'customer' | 'supplier' | 'both'
  name: string
  document: string | null
  email: string | null
  phone: string | null
  status: EntityStatus
}

export interface Product {
  id: UUID
  companyId: UUID
  sku: string
  name: string
  kind: 'product' | 'service'
  unit: string
  salePrice: number
  costPrice: number
  minimumStock: number
  status: EntityStatus
}

export interface FinancialEntry {
  id: UUID
  companyId: UUID
  type: FinancialEntryType
  description: string
  amount: number
  dueDate: ISODate
  status: FinancialEntryStatus
}
