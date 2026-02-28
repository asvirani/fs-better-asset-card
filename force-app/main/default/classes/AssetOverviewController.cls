public with sharing class AssetOverviewController {

    @AuraEnabled(cacheable=true)
    public static AssetOverviewData getAssetOverview(Id recordId) {
        String sObjectType = recordId.getSObjectType().getDescribe().getName();
        Id assetId;

        if (sObjectType == 'Asset') {
            assetId = recordId;
        } else if (sObjectType == 'Case') {
            List<Case> cases = [SELECT AssetId FROM Case WHERE Id = :recordId LIMIT 1];
            if (!cases.isEmpty() && cases[0].AssetId != null) {
                assetId = cases[0].AssetId;
            }
        } else if (sObjectType == 'WorkOrder') {
            List<WorkOrder> wos = [SELECT AssetId FROM WorkOrder WHERE Id = :recordId LIMIT 1];
            if (!wos.isEmpty() && wos[0].AssetId != null) {
                assetId = wos[0].AssetId;
            }
        } else if (sObjectType == 'ServiceAppointment') {
            List<ServiceAppointment> sas = [SELECT ParentRecordId FROM ServiceAppointment WHERE Id = :recordId LIMIT 1];
            if (!sas.isEmpty() && sas[0].ParentRecordId != null) {
                String parentPrefix = String.valueOf(sas[0].ParentRecordId).substring(0, 3);
                if (parentPrefix == '0WO') {
                    List<WorkOrder> wos = [SELECT AssetId FROM WorkOrder WHERE Id = :sas[0].ParentRecordId LIMIT 1];
                    if (!wos.isEmpty() && wos[0].AssetId != null) {
                        assetId = wos[0].AssetId;
                    }
                }
            }
        }

        if (assetId == null) {
            return null;
        }

        AssetOverviewData data = new AssetOverviewData();

        data.asset = [
            SELECT Id, Name, Status, SerialNumber, InstallDate,
                   Product2.Name, Product2.Family, Account.Name,
                   Contact.Name, ParentId,
                   /* Standard performance/downtime fields */
                   Availability, Reliability,
                   SumDowntime, SumUnplannedDowntime,
                   MeanTimeToRepair, MeanTimeBetweenFailures,
                   /* Custom fields (fallback) */
                   Entitlement_Status__c,
                   SDO_Service_Perform_Status__c,
                   Asset_Availability__c,
                   Asset_Reliability__c,
                   Asset_Downtime__c,
                   Average_Repair_Time__c,
                   Average_Time_Between_Failures__c,
                   SDO_Service_Warranty_Services__c
            FROM Asset
            WHERE Id = :assetId
            LIMIT 1
        ];

        data.workOrders = [
            SELECT Id, WorkOrderNumber, Subject, Status, StartDate, EndDate,
                   Priority, WorkType.Name, CreatedDate
            FROM WorkOrder
            WHERE AssetId = :assetId
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];

        data.warranties = [
            SELECT Id, AssetWarrantyNumber, WarrantyType, StartDate, EndDate,
                   LaborCovered, PartsCovered, ExpensesCovered
            FROM AssetWarranty
            WHERE AssetId = :assetId
            ORDER BY EndDate DESC
        ];

        data.downtimePeriods = [
            SELECT Id, AssetDowntimePeriodNumber, StartTime, EndTime,
                   DowntimeType, Description
            FROM AssetDowntimePeriod
            WHERE AssetId = :assetId
            ORDER BY StartTime DESC
            LIMIT 20
        ];

        data.cases = [
            SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate
            FROM Case
            WHERE AssetId = :assetId
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];

        // ===== Next Scheduled Maintenance =====
        List<MaintenanceAsset> maintenanceAssets = [
            SELECT MaintenancePlan.NextSuggestedMaintenanceDate
            FROM MaintenanceAsset
            WHERE AssetId = :assetId
            AND MaintenancePlan.NextSuggestedMaintenanceDate >= TODAY
            ORDER BY MaintenancePlan.NextSuggestedMaintenanceDate ASC
            LIMIT 1
        ];

        // ===== Computed Warranty & Performance Data =====
        data.computedMetrics = computeMetrics(data.asset, data.warranties, data.downtimePeriods, data.workOrders, maintenanceAssets);

        // ===== Work Order Trend (12-month sparkline) =====
        List<AggregateResult> woAgg = [
            SELECT CALENDAR_YEAR(CreatedDate) yr, CALENDAR_MONTH(CreatedDate) mo, COUNT(Id) cnt
            FROM WorkOrder
            WHERE AssetId = :assetId
            AND CreatedDate >= LAST_N_MONTHS:12
            GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
            ORDER BY CALENDAR_YEAR(CreatedDate) ASC, CALENDAR_MONTH(CreatedDate) ASC
        ];
        data.workOrderTrend = buildWorkOrderTrend(woAgg);

        // ===== Hierarchy Data =====
        data.hierarchyData = buildHierarchy(assetId, data.asset);

        return data;
    }

    private static List<MonthlyWorkOrderCount> buildWorkOrderTrend(List<AggregateResult> aggResults) {
        List<String> monthAbbrevs = new List<String>{
            'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
        };

        // Build 12-element list covering last 12 months (including current)
        Date today = Date.today();
        List<MonthlyWorkOrderCount> trend = new List<MonthlyWorkOrderCount>();
        Map<String, MonthlyWorkOrderCount> lookup = new Map<String, MonthlyWorkOrderCount>();

        for (Integer i = 11; i >= 0; i--) {
            Date d = today.addMonths(-i);
            MonthlyWorkOrderCount mwc = new MonthlyWorkOrderCount();
            mwc.month = monthAbbrevs[d.month() - 1];
            mwc.count = 0;
            trend.add(mwc);
            lookup.put(d.year() + '-' + d.month(), mwc);
        }

        // Fill in counts from aggregate results
        for (AggregateResult ar : aggResults) {
            Integer yr = (Integer) ar.get('yr');
            Integer mo = (Integer) ar.get('mo');
            String key = yr + '-' + mo;
            if (lookup.containsKey(key)) {
                lookup.get(key).count = (Integer) ar.get('cnt');
            }
        }

        return trend;
    }

    private static HierarchyData buildHierarchy(Id assetId, Asset currentAsset) {
        HierarchyData hd = new HierarchyData();

        // Get current asset's parent info
        Id parentId = currentAsset.ParentId;

        // Find the root asset (walk up the tree, max 5 levels)
        Id rootId = assetId;
        if (parentId != null) {
            // Query ancestors up to 5 levels
            Id walkId = parentId;
            Integer depth = 0;
            while (walkId != null && depth < 5) {
                List<Asset> parents = [
                    SELECT Id, Name, Status, SerialNumber, Product2.Name, ParentId
                    FROM Asset WHERE Id = :walkId LIMIT 1
                ];
                if (parents.isEmpty()) break;
                rootId = parents[0].Id;
                walkId = parents[0].ParentId;
                depth++;
            }
        }

        // Now query the full tree from root (root + children + grandchildren)
        Asset rootAsset = [
            SELECT Id, Name, Status, SerialNumber, Product2.Name, ParentId,
                (SELECT Id, Name, Status, SerialNumber, Product2.Name, ParentId
                 FROM ChildAssets ORDER BY Name)
            FROM Asset WHERE Id = :rootId LIMIT 1
        ];

        hd.rootNode = mapNode(rootAsset, assetId);
        hd.rootNode.isExpanded = true;

        // For each child of root, query their children (grandchildren)
        if (rootAsset.ChildAssets != null) {
            hd.rootNode.children = new List<HierarchyNode>();
            for (Asset child : rootAsset.ChildAssets) {
                HierarchyNode childNode = mapNode(child, assetId);
                // Query grandchildren
                List<Asset> grandchildren = [
                    SELECT Id, Name, Status, SerialNumber, Product2.Name, ParentId
                    FROM Asset WHERE ParentId = :child.Id ORDER BY Name
                ];
                if (!grandchildren.isEmpty()) {
                    childNode.children = new List<HierarchyNode>();
                    childNode.hasChildren = true;
                    for (Asset gc : grandchildren) {
                        childNode.children.add(mapNode(gc, assetId));
                    }
                }
                hd.rootNode.children.add(childNode);
            }
            hd.rootNode.hasChildren = true;
        }

        hd.totalInHierarchy = countNodes(hd.rootNode);
        return hd;
    }

    private static HierarchyNode mapNode(Asset a, Id currentAssetId) {
        HierarchyNode node = new HierarchyNode();
        node.assetId = a.Id;
        node.name = a.Name;
        node.status = a.Status;
        node.serialNumber = a.SerialNumber;
        node.productName = a.Product2 != null ? a.Product2.Name : null;
        node.isCurrent = (a.Id == currentAssetId);
        node.hasChildren = false;
        node.isExpanded = (a.Id == currentAssetId);
        node.children = new List<HierarchyNode>();
        return node;
    }

    private static Integer countNodes(HierarchyNode node) {
        Integer count = 1;
        if (node.children != null) {
            for (HierarchyNode child : node.children) {
                count += countNodes(child);
            }
        }
        return count;
    }

    // ===== Compute Warranty & Performance Metrics =====

    private static ComputedMetrics computeMetrics(Asset a, List<AssetWarranty> warranties,
            List<AssetDowntimePeriod> downtimePeriods, List<WorkOrder> workOrders,
            List<MaintenanceAsset> maintenanceAssets) {
        ComputedMetrics m = new ComputedMetrics();

        // --- Warranty Status ---
        Date today = Date.today();
        Boolean hasActiveWarranty = false;
        String warrantySvcParts = '';
        for (AssetWarranty w : warranties) {
            if (w.StartDate != null && w.EndDate != null && w.StartDate <= today && w.EndDate >= today) {
                hasActiveWarranty = true;
                List<String> covered = new List<String>();
                if (w.LaborCovered != null && w.LaborCovered > 0) covered.add('Labor');
                if (w.PartsCovered != null && w.PartsCovered > 0) covered.add('Parts');
                if (w.ExpensesCovered != null && w.ExpensesCovered > 0) covered.add('Expenses');
                if (!covered.isEmpty()) {
                    warrantySvcParts = String.join(covered, ', ');
                }
            }
        }

        // Use custom field first, fallback to computed
        m.warrantyStatus = a.Entitlement_Status__c;
        if (String.isBlank(m.warrantyStatus)) {
            if (warranties.isEmpty()) {
                m.warrantyStatus = 'No Warranty';
            } else if (hasActiveWarranty) {
                m.warrantyStatus = 'Active';
            } else {
                m.warrantyStatus = 'Expired';
            }
        }

        m.warrantyServices = a.SDO_Service_Warranty_Services__c;
        if (String.isBlank(m.warrantyServices)) {
            if (hasActiveWarranty && String.isNotBlank(warrantySvcParts)) {
                m.warrantyServices = warrantySvcParts;
            } else if (hasActiveWarranty) {
                m.warrantyServices = 'Covered';
            } else {
                m.warrantyServices = 'None';
            }
        }

        // --- Performance Status ---
        m.performanceStatus = a.SDO_Service_Perform_Status__c;
        if (String.isBlank(m.performanceStatus)) {
            Decimal downtime = a.SumDowntime != null ? a.SumDowntime :
                              (a.Asset_Downtime__c != null ? a.Asset_Downtime__c : 0);
            Integer recentWOCount = 0;
            Date thirtyDaysAgo = Date.today().addDays(-30);
            for (WorkOrder wo : workOrders) {
                if (wo.CreatedDate != null && wo.CreatedDate >= thirtyDaysAgo) {
                    recentWOCount++;
                }
            }
            if (downtime > 100 || recentWOCount >= 3) {
                m.performanceStatus = 'Critical';
            } else if (downtime > 40 || recentWOCount >= 2) {
                m.performanceStatus = 'Degraded';
            } else {
                m.performanceStatus = 'Normal';
            }
        }

        // --- Availability (use standard field first, then custom, then compute) ---
        if (a.Availability != null) {
            m.availability = a.Availability;
        } else if (a.Asset_Availability__c != null) {
            m.availability = a.Asset_Availability__c;
        } else if (a.InstallDate != null) {
            // Compute from install date and cumulative downtime
            Decimal totalHoursSinceInstall = Date.valueOf(a.InstallDate).daysBetween(Date.today()) * 24;
            Decimal downtimeHrs = a.SumDowntime != null ? a.SumDowntime : 0;
            if (totalHoursSinceInstall > 0) {
                m.availability = ((totalHoursSinceInstall - downtimeHrs) / totalHoursSinceInstall) * 100;
            }
        }

        // --- Reliability (use standard field first, then custom) ---
        if (a.Reliability != null) {
            m.reliability = a.Reliability;
        } else if (a.Asset_Reliability__c != null) {
            m.reliability = a.Asset_Reliability__c;
        } else if (a.InstallDate != null && !downtimePeriods.isEmpty()) {
            // Estimate: (total hours - unplanned downtime) / total hours * 100
            Decimal totalHours = Date.valueOf(a.InstallDate).daysBetween(Date.today()) * 24;
            Decimal unplannedDown = a.SumUnplannedDowntime != null ? a.SumUnplannedDowntime : 0;
            if (totalHours > 0) {
                m.reliability = ((totalHours - unplannedDown) / totalHours) * 100;
            }
        }

        // --- Downtime (use standard field first, then custom) ---
        m.downtimeHours = a.SumDowntime != null ? a.SumDowntime :
                          (a.Asset_Downtime__c != null ? a.Asset_Downtime__c : null);

        // --- Mean Time to Repair ---
        m.avgRepairTime = a.MeanTimeToRepair != null ? a.MeanTimeToRepair :
                          (a.Average_Repair_Time__c != null ? a.Average_Repair_Time__c : null);

        // If still null, compute from downtime periods
        if (m.avgRepairTime == null && !downtimePeriods.isEmpty()) {
            Decimal totalRepairHours = 0;
            Integer repairCount = 0;
            for (AssetDowntimePeriod dp : downtimePeriods) {
                if (dp.StartTime != null && dp.EndTime != null) {
                    Decimal hours = (Decimal)(dp.EndTime.getTime() - dp.StartTime.getTime()) / (1000 * 60 * 60);
                    totalRepairHours += hours;
                    repairCount++;
                }
            }
            if (repairCount > 0) {
                m.avgRepairTime = totalRepairHours / repairCount;
            }
        }

        // --- Mean Time Between Failures ---
        m.mtbf = a.MeanTimeBetweenFailures != null ? a.MeanTimeBetweenFailures :
                 (a.Average_Time_Between_Failures__c != null ? a.Average_Time_Between_Failures__c : null);

        // If still null, compute from install date and downtime period count
        if (m.mtbf == null && a.InstallDate != null && !downtimePeriods.isEmpty()) {
            Decimal totalHours = Date.valueOf(a.InstallDate).daysBetween(Date.today()) * 24;
            Decimal operatingHours = totalHours - (a.SumDowntime != null ? a.SumDowntime : 0);
            if (downtimePeriods.size() > 0 && operatingHours > 0) {
                m.mtbf = operatingHours / downtimePeriods.size();
            }
        }

        // --- Last Service Date ---
        for (WorkOrder wo : workOrders) {
            if (wo.Status == 'Completed' || wo.Status == 'Closed') {
                if (wo.EndDate != null) {
                    m.lastServiceDate = formatDatetime(wo.EndDate);
                } else {
                    m.lastServiceDate = formatDatetime(wo.CreatedDate);
                }
                break; // workOrders already sorted by CreatedDate DESC
            }
        }

        // --- Next Scheduled Service ---
        if (!maintenanceAssets.isEmpty() && maintenanceAssets[0].MaintenancePlan.NextSuggestedMaintenanceDate != null) {
            m.nextScheduledService = formatDate(maintenanceAssets[0].MaintenancePlan.NextSuggestedMaintenanceDate);
        } else {
            // Fallback: next future open WorkOrder StartDate
            for (Integer i = workOrders.size() - 1; i >= 0; i--) {
                WorkOrder wo = workOrders[i];
                if (wo.StartDate != null && wo.StartDate >= today &&
                    wo.Status != 'Completed' && wo.Status != 'Closed' && wo.Status != 'Canceled') {
                    m.nextScheduledService = formatDatetime(wo.StartDate);
                    break;
                }
            }
        }

        // --- Install Date & Asset Age ---
        if (a.InstallDate != null) {
            m.installDateFormatted = formatDate(a.InstallDate);
            m.assetAge = computeAge(a.InstallDate, Date.today());
        }

        return m;
    }

    private static String formatDate(Date d) {
        if (d == null) return null;
        Datetime dt = Datetime.newInstance(d.year(), d.month(), d.day());
        return dt.format('MMM d, yyyy');
    }

    private static String formatDatetime(Object val) {
        if (val == null) return null;
        if (val instanceof Datetime) {
            return ((Datetime)val).format('MMM d, yyyy');
        }
        if (val instanceof Date) {
            return formatDate((Date)val);
        }
        return String.valueOf(val);
    }

    private static String computeAge(Date installDate, Date referenceDate) {
        Integer totalMonths = installDate.monthsBetween(referenceDate);
        Integer years = totalMonths / 12;
        Integer months = Math.mod(totalMonths, 12);
        if (years > 0 && months > 0) {
            return years + ' yr ' + months + ' mo';
        } else if (years > 0) {
            return years + ' yr';
        } else if (months > 0) {
            return months + ' mo';
        }
        return '< 1 mo';
    }

    public class ComputedMetrics {
        @AuraEnabled public String warrantyStatus;
        @AuraEnabled public String warrantyServices;
        @AuraEnabled public String performanceStatus;
        @AuraEnabled public Decimal availability;
        @AuraEnabled public Decimal reliability;
        @AuraEnabled public Decimal downtimeHours;
        @AuraEnabled public Decimal avgRepairTime;
        @AuraEnabled public Decimal mtbf;
        @AuraEnabled public String lastServiceDate;
        @AuraEnabled public String nextScheduledService;
        @AuraEnabled public String installDateFormatted;
        @AuraEnabled public String assetAge;
    }

    public class AssetOverviewData {
        @AuraEnabled public Asset asset;
        @AuraEnabled public List<WorkOrder> workOrders;
        @AuraEnabled public List<AssetWarranty> warranties;
        @AuraEnabled public List<AssetDowntimePeriod> downtimePeriods;
        @AuraEnabled public List<Case> cases;
        @AuraEnabled public HierarchyData hierarchyData;
        @AuraEnabled public ComputedMetrics computedMetrics;
        @AuraEnabled public List<MonthlyWorkOrderCount> workOrderTrend;
    }

    public class MonthlyWorkOrderCount {
        @AuraEnabled public String month;
        @AuraEnabled public Integer count;
    }

    public class HierarchyData {
        @AuraEnabled public HierarchyNode rootNode;
        @AuraEnabled public Integer totalInHierarchy;
    }

    public class HierarchyNode {
        @AuraEnabled public String assetId;
        @AuraEnabled public String name;
        @AuraEnabled public String status;
        @AuraEnabled public String serialNumber;
        @AuraEnabled public String productName;
        @AuraEnabled public Boolean isCurrent;
        @AuraEnabled public Boolean hasChildren;
        @AuraEnabled public Boolean isExpanded;
        @AuraEnabled public List<HierarchyNode> children;
    }
}