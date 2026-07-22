export type Role = "MASTER" | "EMPLOYEE" | "CUSTOM";
export type ClientStatus = "ACTIVE" | "INACTIVE";
export type PoolType = "FIBRA" | "VINIL" | "ALVENARIA";
export type ServiceFrequency =
  | "WEEKLY_1"
  | "WEEKLY_2"
  | "BIWEEKLY"
  | "MONTHLY";
export type AppointmentStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "LATE";
export type VisitStatus = "PENDING" | "STARTED" | "COMPLETED" | "CANCELLED";
export type PhotoType =
  | "ARRIVAL"
  | "FINAL"
  | "GALLERY"
  | "CLIENT_HOME"
  | "PRODUCT"
  | "SIGNATURE";
export type StockSource = "CLIENT" | "COMPANY";
export type NotificationType =
  | "LATE_VISIT"
  | "LOW_STOCK"
  | "NEW_APPOINTMENT"
  | "MISSED_CLIENT"
  | "COMPANY_LOW_STOCK"
  | "GENERAL";
export type ExpenseCategory = "FUEL" | "PARTS" | "TOOLS" | "OTHER";
export type SaleType = "PRODUCT" | "EXTRA_SERVICE";
export type EquipmentType =
  | "PUMP"
  | "FILTER"
  | "HEATER"
  | "CHLORINATOR"
  | "LIGHTING"
  | "OTHER";

export const PERMISSIONS = [
  "clients:read",
  "clients:write",
  "clients:delete",
  "employees:read",
  "employees:write",
  "employees:delete",
  "stock:read",
  "stock:write",
  "reports:read",
  "schedule:write",
  "visits:execute",
  "finance:read",
  "finance:write",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  MASTER: [...PERMISSIONS],
  EMPLOYEE: [
    "clients:read",
    "stock:read",
    "visits:execute",
    "schedule:write",
  ],
  CUSTOM: [],
};

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  password: string;
  avatarUrl?: string;
  isOnline: boolean;
  active: boolean;
  customPermissions: Permission[];
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  photoUrl?: string;
  poolType: PoolType;
  volumeLiters?: number;
  serviceFrequency?: ServiceFrequency;
  serviceDays: string[];
  serviceTime?: string;
  responsibleId?: string;
  status: ClientStatus;
  qrCodeToken: string;
  createdAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  category?: string;
  supplier?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  unit: string;
  code?: string;
  photoUrl?: string;
  active: boolean;
}

export interface ClientStockItem {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  notes?: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  companyId: string;
  clientId: string;
  employeeId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface ServiceVisit {
  id: string;
  companyId: string;
  appointmentId?: string;
  clientId: string;
  employeeId: string;
  status: VisitStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMinutes?: number;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  /** Distância do GPS de chegada ao endereço do cliente (m). */
  startDistanceMeters?: number;
  /** true se GPS ficou longe do endereço — atendimento ainda é liberado. */
  locationMismatch?: boolean;
  gpsUnavailable?: boolean;
  observations?: string;
  signatureDataUrl?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
  required: boolean;
}

export interface ChecklistResponse {
  visitId: string;
  itemId: string;
  checked: boolean;
  checkedAt?: string;
}

export interface WaterReading {
  id: string;
  visitId?: string;
  clientId?: string;
  ph?: number;
  chlorine?: number;
  alkalinity?: number;
  temperature?: number;
  notes?: string;
  recordedAt: string;
}

export interface VisitProductUsage {
  id: string;
  visitId: string;
  productId: string;
  quantity: number;
  source: StockSource;
  createdAt: string;
}

export interface VisitPhoto {
  id: string;
  visitId: string;
  type: PhotoType;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface VisitNote {
  id: string;
  visitId: string;
  content: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  clientId: string;
  type: EquipmentType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  notes?: string;
  maintenances: {
    id: string;
    date: string;
    description: string;
    cost?: number;
  }[];
}

export interface Expense {
  id: string;
  companyId: string;
  employeeId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

export interface Sale {
  id: string;
  companyId: string;
  clientId?: string;
  employeeId: string;
  type: SaleType;
  description?: string;
  total: number;
  date: string;
  dueDate?: string;
  pixPayload?: string;
  status?: "OPEN" | "PAID" | "CANCELLED";
  items: {
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
    productId?: string;
    deliveredAt?: string;
  }[];
}

export interface AppNotification {
  id: string;
  companyId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RecurringReminder {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  frequencyDays: number;
  nextRunAt: string;
  active: boolean;
}

export interface DemoStore {
  company: Company;
  users: User[];
  clients: Client[];
  products: Product[];
  clientStock: ClientStockItem[];
  appointments: Appointment[];
  visits: ServiceVisit[];
  checklistItems: ChecklistItem[];
  checklistResponses: ChecklistResponse[];
  readings: WaterReading[];
  usages: VisitProductUsage[];
  photos: VisitPhoto[];
  notes: VisitNote[];
  equipment: Equipment[];
  expenses: Expense[];
  sales: Sale[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  reminders: RecurringReminder[];
}

export const CHECKLIST_LABELS = [
  "Aspirou piscina",
  "Escovou paredes",
  "Limpou borda",
  "Limpou skimmer",
  "Lavou filtro",
  "Retrolavagem",
  "Testou pH",
  "Testou cloro",
  "Corrigiu pH",
  "Adicionou cloro",
  "Adicionou barrilha",
  "Aplicou algicida",
  "Aplicou clarificante",
  "Retirou folhas",
  "Limpou casa de máquinas",
  "Verificou bomba",
  "Verificou filtro",
  "Verificou timer",
  "Verificou vazamentos",
  "Limpeza geral",
] as const;

export const POOL_TYPE_LABELS: Record<PoolType, string> = {
  FIBRA: "Fibra",
  VINIL: "Vinil",
  ALVENARIA: "Alvenaria",
};

export const SERVICE_FREQUENCY_LABELS: Record<ServiceFrequency, string> = {
  WEEKLY_1: "1x por semana",
  WEEKLY_2: "2x por semana",
  BIWEEKLY: "A cada 15 dias",
  MONTHLY: "1x por mês",
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  PUMP: "Bomba",
  FILTER: "Filtro",
  HEATER: "Aquecedor",
  CHLORINATOR: "Clorador",
  LIGHTING: "Iluminação",
  OTHER: "Outro",
};

export const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  FUEL: "Combustível",
  PARTS: "Peças",
  TOOLS: "Ferramentas",
  OTHER: "Outros",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  LATE: "Atrasado",
};
