-- Aquatec RLS policies for Supabase PostgreSQL
-- Apply after Prisma migrate in the Supabase SQL editor.

-- Enable RLS on tenant tables
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientStockItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;

-- Helper: current user's company from JWT claim or profile table
-- Adjust to your auth mapping (supabase auth.uid() -> User.supabaseUserId)

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT "companyId"
  FROM "User"
  WHERE "supabaseUserId" = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT "role"::text
  FROM "User"
  WHERE "supabaseUserId" = auth.uid()::text
  LIMIT 1;
$$;

-- Example company-scoped SELECT policies
CREATE POLICY company_select_clients ON "Client"
  FOR SELECT USING ("companyId" = public.current_company_id());

CREATE POLICY company_select_products ON "Product"
  FOR SELECT USING ("companyId" = public.current_company_id());

CREATE POLICY company_select_appointments ON "Appointment"
  FOR SELECT USING ("companyId" = public.current_company_id());

CREATE POLICY company_select_visits ON "ServiceVisit"
  FOR SELECT USING ("companyId" = public.current_company_id());

CREATE POLICY master_write_clients ON "Client"
  FOR ALL USING (
    "companyId" = public.current_company_id()
    AND public.current_role() = 'MASTER'
  );

CREATE POLICY employee_update_own_visits ON "ServiceVisit"
  FOR UPDATE USING (
    "companyId" = public.current_company_id()
    AND (
      public.current_role() = 'MASTER'
      OR "employeeId" IN (
        SELECT id FROM "User" WHERE "supabaseUserId" = auth.uid()::text
      )
    )
  );
