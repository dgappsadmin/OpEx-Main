# Quick Reference: Dashboard Field Mapping

## 🔍 **Why Your Progress Shows 0.0%?**

Your **Savings Projection** shows ₹0.00L because:

### **Missing Data in Monthly Monitoring:**
```sql
-- This query returns empty results:
SELECT SUM(TARGET_VALUE) FROM OPEX_MONTHLY_MONITORING_ENTRIES
WHERE MONITORING_MONTH >= '2025-04' AND MONITORING_MONTH <= '2026-03'
AND TARGET_VALUE IS NOT NULL
```

**Solution:** Users need to enter data in **Monthly Monitoring Form**

---

## 📝 **Required User Actions for Data**

### **1. Initiative Creation Form** (`/initiative/new`)
```typescript
Fields needed for dashboard:
- expectedSavings: number     // ₹ amount (becomes Potential Savings)
- budgetType: "budgeted" | "non-budgeted"  // Filter for analysis
- site: string               // For site-specific filtering
- startDate: Date           // For timeline tracking
```

### **2. Monthly Monitoring Form** (`/monitoring`)
```typescript
Fields needed for dashboard:
- monitoringMonth: "YYYY-MM"  // e.g., "2025-04" 
- targetValue: number         // Monthly target (becomes Projection)
- achievedValue: number       // Monthly actual (becomes Actual Savings)
- initiativeId: number        // Links to initiative
```

---

## 🔄 **Data Flow Example**

### **Step 1: User Creates Initiative**
```
Page: /initiative/new
Input: expectedSavings = 1200000 (₹12L)
Input: budgetType = "budgeted"
Result: Potential Savings (Annualized) = ₹144L (12L × 12)
```

### **Step 2: User Enters Monthly Targets**
```
Page: /monitoring
Month: 2025-04 (April)
Input: targetValue = 100000 (₹1L target for April)
Input: achievedValue = 95000 (₹0.95L actually achieved)

Month: 2025-05 (May)  
Input: targetValue = 100000 (₹1L target for May)
Input: achievedValue = 105000 (₹1.05L actually achieved)
```

### **Step 3: Dashboard Calculations**
```
Savings Projection = ₹2.00L (1L + 1L from targets)
Actual Savings = ₹2.00L (0.95L + 1.05L from achieved)
Progress = 16.7% (₹2L projection ÷ ₹12L potential × 100)
```

---

## ⚡ **Quick Fix for Zero Values**

### **If "Total Initiatives" = 0:**
- Check if initiatives exist in database
- Verify `OPEX_INITIATIVES` table has data

### **If "Potential Savings" = ₹0.00L:**
- Check `EXPECTED_SAVINGS` field in initiatives
- Ensure values are not NULL or zero

### **If "Savings Projection" = ₹0.00L:**
- Check `OPEX_MONTHLY_MONITORING_ENTRIES` table
- Ensure `TARGET_VALUE` fields have data
- Verify `MONITORING_MONTH` format is "YYYY-MM"
- Check date range matches current financial year

### **If "Actual Savings" = ₹0.00L:**
- Check `ACHIEVED_VALUE` fields in monitoring entries
- Users need to enter actual monthly achievements

### **If "Progress" = 0.0%:**
- Usually means Savings Projection is zero
- Fix the monitoring entries first

---

## 🗂️ **Database Table Structure**

### **OPEX_INITIATIVES**
```sql
ID                 NUMBER      -- Primary key
EXPECTED_SAVINGS   NUMBER      -- Used for potential savings (₹)
BUDGET_TYPE        VARCHAR(50) -- "budgeted" or "non-budgeted"
SITE              VARCHAR(50) -- Site filter
CREATED_AT        TIMESTAMP   -- Current FY filter
TITLE             VARCHAR(200)-- Display name
STATUS            VARCHAR(20) -- Initiative status
```

### **OPEX_MONTHLY_MONITORING_ENTRIES**
```sql
ID                NUMBER      -- Primary key
INITIATIVE_ID     NUMBER      -- FK to OPEX_INITIATIVES
MONITORING_MONTH  VARCHAR(7)  -- "YYYY-MM" format
TARGET_VALUE      NUMBER      -- Monthly target (₹) -> Projection
ACHIEVED_VALUE    NUMBER      -- Monthly actual (₹) -> Actual Savings
KPI_DESCRIPTION   VARCHAR     -- What is being measured
CREATED_AT        TIMESTAMP   -- Entry creation time
```

---

## 🎯 **Expected User Workflow**

1. **Manager creates initiative** → Sets expected yearly savings
2. **Monthly review meetings** → Team sets monthly targets  
3. **End of month** → Team enters actual achievements
4. **Dashboard updates** → Shows real-time progress

**Result:** Professional dashboard with meaningful metrics showing true operational excellence progress.

---

## 🔧 **API Endpoints Used**

- `GET /api/dashboard/performance-analysis` - Fetches all calculated metrics
- `POST /api/initiatives` - Creates new initiatives (affects potential savings)
- `POST /api/monitoring` - Adds monthly entries (affects projections/actuals)

The dashboard automatically recalculates all metrics when new data is entered through these forms.