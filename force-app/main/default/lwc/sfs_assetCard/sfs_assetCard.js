import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAssetOverview from '@salesforce/apex/AssetOverviewController.getAssetOverview';

export default class Sfs_assetCard extends NavigationMixin(LightningElement) {
    @api recordId;

    // Admin-configurable properties from App Builder
    // Defaults set in meta.xml; LWC doesn't allow @api Boolean init to true
    @api showMetrics;
    @api showServiceHistory;
    @api showHierarchy;
    @api maxRecentWorkOrders;

    data;
    error;
    isLoading = true;
    expandedSections = {};

    // ===== Wire Adapter =====
    @wire(getAssetOverview, { recordId: '$recordId' })
    wiredAssetOverview({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.data = data;
            this.error = undefined;
        } else if (error) {
            this.error = error.body ? error.body.message : 'Unable to load asset data.';
            this.data = undefined;
        }
    }

    // ===== Computed Properties: Data Access =====

    get asset() { return this.data ? this.data.asset : null; }
    get computedMetrics() { return this.data ? this.data.computedMetrics : null; }
    get workOrders() { return this.data ? this.data.workOrders : []; }
    get warranties() { return this.data ? this.data.warranties : []; }
    get cases() { return this.data ? this.data.cases : []; }
    get hierarchyData() { return this.data ? this.data.hierarchyData : null; }

    get hasData() { return this.data && this.data.asset; }
    get hasNoAsset() { return !this.isLoading && !this.error && !this.hasData; }

    // ===== Device Header =====

    get productName() {
        if (this.asset && this.asset.Product2) return this.asset.Product2.Name;
        if (this.asset) return this.asset.Name;
        return '--';
    }

    get serialNumber() {
        return this.asset ? this.asset.SerialNumber || '--' : '--';
    }

    get installDate() {
        return this.asset ? this.asset.InstallDate || null : null;
    }

    get accountName() {
        if (this.asset && this.asset.Account) return this.asset.Account.Name;
        return '--';
    }

    get contactName() {
        if (this.asset && this.asset.Contact) return this.asset.Contact.Name;
        return null;
    }

    get productFamily() {
        if (this.asset && this.asset.Product2) return this.asset.Product2.Family;
        return null;
    }

    get productFamilyLabel() {
        const familyMap = {
            'CRM': 'Cardiac Rhythm Mgmt',
            'Diagnostics': 'Diagnostics',
            'EP Systems': 'EP Systems',
            'Structural Heart': 'Structural Heart',
            'Neuromodulation': 'Neuromodulation'
        };
        return familyMap[this.productFamily] || this.productFamily;
    }

    get hasProductFamily() {
        return !!this.productFamily;
    }

    get productFamilyClass() {
        const classMap = {
            'CRM': 'family-badge family-crm',
            'Diagnostics': 'family-badge family-diagnostics',
            'EP Systems': 'family-badge family-ep',
            'Structural Heart': 'family-badge family-structural',
            'Neuromodulation': 'family-badge family-neuro'
        };
        return classMap[this.productFamily] || 'family-badge';
    }

    // ===== Device Status =====

    get deviceStatus() {
        return this.asset ? this.asset.Status || '--' : '--';
    }

    get deviceStatusClass() {
        const s = this.deviceStatus;
        if (s === 'Installed') return 'status-badge status-good';
        if (s === 'Shipped' || s === 'Purchased') return 'status-badge status-info';
        if (s === 'Obsolete' || s === 'Decommissioned') return 'status-badge status-critical';
        return 'status-badge status-warning';
    }

    get deviceStatusIcon() {
        const s = this.deviceStatus;
        if (s === 'Installed') return 'utility:success';
        if (s === 'Obsolete' || s === 'Decommissioned') return 'utility:error';
        return 'utility:warning';
    }

    get deviceStatusVariant() {
        const s = this.deviceStatus;
        if (s === 'Installed') return 'success';
        if (s === 'Obsolete' || s === 'Decommissioned') return 'error';
        return 'warning';
    }

    // ===== Warranty Status =====

    get warrantyStatus() {
        return this.computedMetrics ? this.computedMetrics.warrantyStatus || '--' : '--';
    }

    get warrantyStatusClass() {
        const s = this.warrantyStatus;
        if (s === 'Active') return 'status-badge status-good';
        if (s === 'Expired') return 'status-badge status-critical';
        if (s === 'No Warranty') return 'status-badge status-neutral';
        return 'status-badge';
    }

    get warrantyServices() {
        return this.computedMetrics ? this.computedMetrics.warrantyServices || 'None' : 'None';
    }

    get hasActiveWarranty() {
        return this.warrantyStatus === 'Active';
    }

    get warrantyIcon() {
        if (this.warrantyStatus === 'Active') return 'utility:shield';
        if (this.warrantyStatus === 'Expired') return 'utility:warning';
        return 'utility:info';
    }

    // ===== Performance Status =====

    get performanceStatus() {
        return this.computedMetrics ? this.computedMetrics.performanceStatus || '--' : '--';
    }

    get performanceStatusClass() {
        const s = this.performanceStatus;
        if (s === 'Normal') return 'status-badge status-good';
        if (s === 'Degraded') return 'status-badge status-warning';
        if (s === 'Critical') return 'status-badge status-critical';
        return 'status-badge';
    }

    // ===== Performance Metrics =====

    get availability() {
        if (this.computedMetrics && this.computedMetrics.availability != null) {
            return Number(this.computedMetrics.availability).toFixed(1) + '%';
        }
        return '--';
    }

    get availabilityRaw() {
        return this.computedMetrics && this.computedMetrics.availability != null
            ? Number(this.computedMetrics.availability) : null;
    }

    get availabilityClass() {
        const v = this.availabilityRaw;
        if (v == null) return 'metric-value';
        if (v >= 99) return 'metric-value metric-excellent';
        if (v >= 95) return 'metric-value metric-good';
        if (v >= 90) return 'metric-value metric-warning';
        return 'metric-value metric-critical';
    }

    get reliability() {
        if (this.computedMetrics && this.computedMetrics.reliability != null) {
            return Number(this.computedMetrics.reliability).toFixed(1) + '%';
        }
        return '--';
    }

    get mtbf() {
        if (this.computedMetrics && this.computedMetrics.mtbf != null) {
            const hours = this.computedMetrics.mtbf;
            const h = Number(hours);
            if (h >= 720) return Math.round(h / 720) + ' mo';
            if (h >= 168) return Math.round(h / 168) + ' wk';
            if (h >= 24) return Math.round(h / 24) + ' d';
            return h.toFixed(0) + ' hrs';
        }
        return '--';
    }

    get avgRepairTime() {
        if (this.computedMetrics && this.computedMetrics.avgRepairTime != null) {
            return Number(this.computedMetrics.avgRepairTime).toFixed(1) + ' hrs';
        }
        return '--';
    }

    get downtimeHours() {
        if (this.computedMetrics && this.computedMetrics.downtimeHours != null) {
            return Number(this.computedMetrics.downtimeHours).toFixed(1) + ' hrs';
        }
        return '--';
    }

    // ===== Service History Summary =====

    get totalWorkOrderCount() {
        return this.workOrders.length;
    }

    get openWorkOrderCount() {
        return this.workOrders.filter(wo =>
            wo.Status !== 'Completed' && wo.Status !== 'Closed' && wo.Status !== 'Canceled'
        ).length;
    }

    get openCaseCount() {
        return this.cases.filter(c =>
            c.Status !== 'Closed'
        ).length;
    }

    get recentWorkOrders() {
        const max = this.maxRecentWorkOrders || 3;
        return this.workOrders.slice(0, max).map(wo => ({
            Id: wo.Id,
            WorkOrderNumber: wo.WorkOrderNumber,
            Subject: wo.Subject || '--',
            Status: wo.Status,
            statusClass: this._woStatusClass(wo.Status),
            statusIcon: this._woStatusIcon(wo.Status)
        }));
    }

    get hasRecentWorkOrders() {
        return this.recentWorkOrders.length > 0;
    }

    _woStatusClass(status) {
        if (status === 'Completed' || status === 'Closed') return 'wo-status-complete';
        if (status === 'In Progress' || status === 'On Route') return 'wo-status-active';
        return 'wo-status-new';
    }

    _woStatusIcon(status) {
        if (status === 'Completed' || status === 'Closed') return 'utility:check';
        if (status === 'In Progress' || status === 'On Route') return 'utility:clock';
        return 'utility:new';
    }

    // ===== Hierarchy =====

    get hasHierarchyData() {
        return this.hierarchyData && this.hierarchyData.totalInHierarchy > 1;
    }

    get hierarchyTotalCount() {
        return this.hierarchyData ? this.hierarchyData.totalInHierarchy || 0 : 0;
    }

    get parentAssetName() {
        if (this.hierarchyData && this.hierarchyData.rootNode) {
            const root = this.hierarchyData.rootNode;
            if (!root.isCurrent) {
                return root.productName || root.name;
            }
        }
        return null;
    }

    get isSubComponent() {
        return this.asset ? this.asset.ParentId != null : false;
    }

    get childAssetCount() {
        if (this.hierarchyData && this.hierarchyData.rootNode) {
            const root = this.hierarchyData.rootNode;
            if (root.isCurrent && root.children) {
                return root.children.length;
            }
            return this._findCurrentNodeChildCount(root);
        }
        return 0;
    }

    get hasChildAssets() {
        return this.childAssetCount > 0;
    }

    _findCurrentNodeChildCount(node) {
        if (node.isCurrent) return node.children ? node.children.length : 0;
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                const count = this._findCurrentNodeChildCount(node.children[i]);
                if (count >= 0) return count;
            }
        }
        return 0;
    }

    // ===== Navigation =====

    navigateToAsset() {
        if (this.asset && this.asset.Id) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.asset.Id,
                    objectApiName: 'Asset',
                    actionName: 'view'
                }
            });
        }
    }

    navigateToWorkOrder(event) {
        const woId = event.currentTarget.dataset.id;
        if (woId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: woId,
                    objectApiName: 'WorkOrder',
                    actionName: 'view'
                }
            });
        }
    }

    navigateToParentAsset() {
        if (this.asset && this.asset.ParentId) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.asset.ParentId,
                    objectApiName: 'Asset',
                    actionName: 'view'
                }
            });
        }
    }

    // ===== Collapsible Sections =====
    toggleSection(event) {
        const section = event.currentTarget.dataset.section;
        // Create a new object to trigger reactivity
        const updated = Object.assign({}, this.expandedSections);
        updated[section] = !updated[section];
        this.expandedSections = updated;
    }

    get isMetricsExpanded() { return !!this.expandedSections.metrics; }
    get isHistoryExpanded() { return !!this.expandedSections.history; }
    get isHierarchyExpanded() { return !!this.expandedSections.hierarchy; }

    get metricsChevron() { return this.isMetricsExpanded ? 'utility:chevrondown' : 'utility:chevronright'; }
    get historyChevron() { return this.isHistoryExpanded ? 'utility:chevrondown' : 'utility:chevronright'; }
    get hierarchyChevron() { return this.isHierarchyExpanded ? 'utility:chevrondown' : 'utility:chevronright'; }
}