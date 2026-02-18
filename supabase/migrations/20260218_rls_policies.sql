-- Enable RLS on all user-facing tables
ALTER TABLE "Recipient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

-- Recipient: users can only see/modify their own
CREATE POLICY "Users can view own recipients" ON "Recipient" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own recipients" ON "Recipient" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own recipients" ON "Recipient" FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can delete own recipients" ON "Recipient" FOR DELETE USING (auth.uid()::text = "userId");

-- Order: users can only see/create their own
CREATE POLICY "Users can view own orders" ON "Order" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own orders" ON "Order" FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- Template: users can view system templates + their own, insert their own
CREATE POLICY "Users can view accessible templates" ON "Template" FOR SELECT USING ("aiGenerated" = false OR auth.uid()::text = "userId");
CREATE POLICY "Users can insert own templates" ON "Template" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own templates" ON "Template" FOR UPDATE USING (auth.uid()::text = "userId");
CREATE POLICY "Users can delete own templates" ON "Template" FOR DELETE USING (auth.uid()::text = "userId");

-- UserUsage: users can only see/modify their own
CREATE POLICY "Users can view own usage" ON "UserUsage" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own usage" ON "UserUsage" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "Users can update own usage" ON "UserUsage" FOR UPDATE USING (auth.uid()::text = "userId");

-- User: users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON "User" FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (auth.uid()::text = id);

-- Event: users can insert their own events
CREATE POLICY "Users can view own events" ON "Event" FOR SELECT USING (auth.uid()::text = "userId");
CREATE POLICY "Users can insert own events" ON "Event" FOR INSERT WITH CHECK (auth.uid()::text = "userId");
