# Performance Analysis Dashboard - Data Flow Guide

## 📊 **Overview**
This guide explains how each metric in the Performance Analysis Dashboard is calculated, which database fields are used, and which application pages provide the input data.

---

## 🗃️ **Database Tables & Key Fields**

### **OPEX_INITIATIVES Table**
- `ID` - Primary key
- `EXPECTED_SAVINGS` - Expected savings amount (used for potential savings)
- `ACTUAL_SAVINGS` - Actual achieved savings (rarely used directly)
- `BUDGET_TYPE` - "budgeted" or "non-budgeted" (lowercase)
- `CREATED_AT` - When initiative was created (for FY filtering)
- `TITLE`, `SITE`, `STATUS`, etc.

### **OPEX_MONTHLY_MONITORING_ENTRIES Table**
- `ID` - Primary key
- `INITIATIVE_ID` - Foreign key to OPEX_INITIATIVES
- `MONITORING_MONTH` - Format: "YYYY-MM" (e.g., "2024-04")
- `TARGET_VALUE` - Monthly target savings (used for projections)
- `ACHIEVED_VALUE` - Monthly actual savings achieved
- `KPI_DESCRIPTION` - Description of the KPI being tracked

---

## 📈 **Metric Calculations Explained**

### **1. Total Listed Initiatives (Number)**
```sql
-- Overall
SELECT COUNT(*) FROM OPEX_INITIATIVES

-- Budget Type Specific
SELECT COUNT(*) FROM OPEX_INITIATIVES 
WHERE LOWER(COALESCE(BUDGET_TYPE, 'budgeted')) = 'budgeted'
```
**Data Source:** Initiative creation from any page that creates initiatives

---

### **2. Potential Savings (Annualized) - Rs Lakhs**
```sql
-- Calculation: SUM(EXPECTED_SAVINGS) × 12
SELECT SUM(EXPECTED_SAVINGS) * 12 FROM OPEX_INITIATIVES
WHERE LOWER(COALESCE(BUDGET_TYPE, 'budgeted')) = 'budgeted'
```
**Data Source:** 
- **Page:** Initiative Creation/Edit Form
- **Field:** `expectedSavings` input field
- **Logic:** Takes the expected savings per initiative and multiplies by 12 to get annual potential

---

### **3. Potential Savings (Current FY) - Rs Lakhs**
```sql
-- Only initiatives created in current financial year (Apr-Mar)
SELECT SUM(EXPECTED_SAVINGS) FROM OPEX_INITIATIVES 
WHERE CREATED_AT >= '2025-04-01 00:00:00' 
AND CREATED_AT <= '2026-03-31 23:59:59'
AND LOWER(COALESCE(BUDGET_TYPE, 'budgeted')) = 'budgeted'
```
**Data Source:**
- **Page:** Initiative Creation Form
- **Field:** `expectedSavings` input field
- **Filter:** Only initiatives created in current financial year

---

### **4. Actual Savings (Current FY) - Rs Lakhs**
```sql
-- Sum of all ACHIEVED_VALUE from monitoring entries in current FY
SELECT SUM(ACHIEVED_VALUE) FROM OPEX_MONTHLY_MONITORING_ENTRIES mme
JOIN OPEX_INITIATIVES i ON mme.INITIATIVE_ID = i.ID
WHERE mme.MONITORING_MONTH >= '2025-04' 
AND mme.MONITORING_MONTH <= '2026-03'
AND mme.ACHIEVED_VALUE IS NOT NULL
AND LOWER(COALESCE(i.BUDGET_TYPE, 'budgeted')) = 'budgeted'
```
**Data Source:**
- **Page:** Monthly Monitoring Entry Form
- **Field:** `achievedValue` input field
- **When:** Users enter monthly actual achievements

---

### **5. Savings Projection (Current FY) - Rs Lakhs**
```sql
-- Sum of all TARGET_VALUE from monitoring entries in current FY
SELECT SUM(TARGET_VALUE) FROM OPEX_MONTHLY_MONITORING_ENTRIES mme
JOIN OPEX_INITIATIVES i ON mme.INITIATIVE_ID = i.ID
WHERE mme.MONITORING_MONTH >= '2025-04' 
AND mme.MONITORING_MONTH <= '2026-03'
AND mme.TARGET_VALUE IS NOT NULL
AND LOWER(COALESCE(i.BUDGET_TYPE, 'budgeted')) = 'budgeted'
```
**Data Source:**
- **Page:** Monthly Monitoring Entry Form
- **Field:** `targetValue` input field
- **When:** Users set monthly targets for each initiative

---

### **6. Progress Percentage**
```java
// Formula: (Savings Projection / Potential Savings Current FY) × 100
BigDecimal progressPercentage = BigDecimal.ZERO;
if (potentialSavingsCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
    progressPercentage = savingsProjectionCurrentFY
        .divide(potentialSavingsCurrentFY, 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
}
```
**Example:**
- Potential Savings (Current FY): ₹10.00L
- Savings Projection (Current FY): ₹7.50L
- Progress: 75.0%

---

## 🔄 **Data Flow Journey**

### **Step 1: Initiative Creation**
**Page:** Initiative Creation Form (`/initiative/new`)
```typescript
// User inputs:
expectedSavings: 500000  // ₹5L per initiative (₹60L annualized)
budgetType: "budgeted"   // or "non-budgeted"
site: "Plant A"
// ... other fields
```
**Impact:** Affects metrics #1, #2, #3

### **Step 2: Monthly Monitoring**
**Page:** Monthly Monitoring Form (`/monitoring`)
```typescript
// User inputs for each initiative monthly:
monitoringMonth: "2024-04"   // April 2024
targetValue: 50000           // ₹0.50L target for this month
achievedValue: 45000         // ₹0.45L actually achieved
kpiDescription: "Cost reduction through process optimization"
```
**Impact:** Affects metrics #4, #5, #6

---

## 📊 **Dashboard Display Examples**

### **Example Scenario:**
- **Initiative:** "Process Optimization Project"
- **Expected Savings:** ₹5,00,000 (₹5L)
- **Budget Type:** "budgeted"
- **Created:** April 2025 (Current FY)

**Monthly Monitoring Entries:**
- April 2025: Target=₹50,000, Achieved=₹45,000
- May 2025: Target=₹50,000, Achieved=₹52,000
- June 2025: Target=₹50,000, Achieved=₹48,000

### **Dashboard Will Show:**
```
PERFORMANCE ANALYSIS - BUDGET

Total Initiatives: 1
Potential Savings (Annualized): ₹60.00L (₹5L × 12)
Potential Savings (Current FY): ₹5.00L
Actual Savings (Current FY): ₹1.45L (45k+52k+48k = 145k)
Savings Projection (Current FY): ₹1.50L (50k+50k+50k = 150k)
Progress Percentage: 30.0% (₹1.50L ÷ ₹5.00L × 100)
```

---

## ⚠️ **Important Notes**

### **Why Progress Shows 0.0%?**
This happens when:
1. **No Monthly Monitoring Entries:** Users haven't entered monthly targets/achievements
2. **Wrong Budget Type:** Data exists but budget_type field is NULL or different case
3. **Wrong Financial Year:** Monitoring entries are outside current FY (Apr 2025 - Mar 2026)
4. **No Targets Set:** TARGET_VALUE fields are NULL or zero

### **To Fix Low/Zero Progress:**
1. **Ensure Monthly Monitoring:** Users must regularly update monthly targets and achievements
2. **Verify Budget Types:** Check that initiatives have correct "budgeted"/"non-budgeted" values
3. **Check Date Ranges:** Ensure monitoring entries are in current financial year format

### **Data Input Pages Required:**
1. **Initiative Creation/Edit Form** - Sets expected savings and budget type
2. **Monthly Monitoring Form** - Sets targets and achievements
3. **Bulk Import/Update Forms** - For historical data

---

## 🔧 **Database Fields Mapping**

| Dashboard Metric | Database Fields Used | Input Page/Form |
|------------------|---------------------|-----------------|
| Total Initiatives | `OPEX_INITIATIVES.ID` (COUNT) | Initiative Forms |
| Potential Annualized | `OPEX_INITIATIVES.EXPECTED_SAVINGS * 12` | Initiative Forms |
| Potential Current FY | `OPEX_INITIATIVES.EXPECTED_SAVINGS` + `CREATED_AT` filter | Initiative Forms |
| Actual Current FY | `OPEX_MONTHLY_MONITORING_ENTRIES.ACHIEVED_VALUE` | Monthly Monitoring |
| Projection Current FY | `OPEX_MONTHLY_MONITORING_ENTRIES.TARGET_VALUE` | Monthly Monitoring |
| Progress % | Calculated: (Projection ÷ Potential) × 100 | Both Forms |

---

## 🎯 **Next Steps for Users**

1. **Create Initiatives** with proper `expectedSavings` and `budgetType`
2. **Regular Monthly Monitoring** with realistic targets and actual achievements
3. **Verify Data Quality** - Check budget types and date formats
4. **Historical Data Import** if needed for complete analysis

This ensures the Performance Analysis Dashboard shows meaningful, accurate data that reflects real operational excellence progress.