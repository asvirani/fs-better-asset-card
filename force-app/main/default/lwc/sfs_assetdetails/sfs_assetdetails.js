import { LightningElement, api } from 'lwc';

export default class Sfs_assetdetails extends LightningElement {
    @api asset;
    @api computedMetrics;

    get hasAsset() {
        return this.asset && this.asset.Id;
    }

    get isInstalled() {
        return this.asset && this.asset.Status === 'Installed';
    }

    get statusIcon() {
        return this.isInstalled ? 'utility:success' : 'utility:warning';
    }

    get statusVariant() {
        return this.isInstalled ? 'success' : 'warning';
    }

    get statusLabel() {
        return this.isInstalled ? 'Installed' : (this.asset ? this.asset.Status : '—');
    }

    get productName() {
        return this.asset && this.asset.Product2 ? this.asset.Product2.Name : '—';
    }

    get accountName() {
        return this.asset && this.asset.Account ? this.asset.Account.Name : '—';
    }

    get contactName() {
        return this.asset && this.asset.Contact ? this.asset.Contact.Name : '—';
    }

    get serialNumber() {
        return this.asset ? this.asset.SerialNumber || '—' : '—';
    }

    get installDate() {
        return this.asset ? this.asset.InstallDate || '—' : '—';
    }

    // --- Warranty & Performance (from computed metrics) ---

    get warrantyStatus() {
        return this.computedMetrics ? this.computedMetrics.warrantyStatus || '—' : '—';
    }

    get warrantyStatusClass() {
        const status = this.warrantyStatus;
        if (status === 'Active') return 'status-good';
        if (status === 'Expired') return 'status-warning';
        return '';
    }

    get performanceStatus() {
        return this.computedMetrics ? this.computedMetrics.performanceStatus || '—' : '—';
    }

    get performanceStatusClass() {
        const status = this.performanceStatus;
        if (status === 'Normal') return 'status-good';
        if (status === 'Degraded') return 'status-warning';
        if (status === 'Critical') return 'status-critical';
        return '';
    }

    get warrantyServices() {
        return this.computedMetrics ? this.computedMetrics.warrantyServices || '—' : '—';
    }

    get availability() {
        if (this.computedMetrics && this.computedMetrics.availability != null) {
            return this.computedMetrics.availability.toFixed(1) + '%';
        }
        return '—';
    }

    get reliability() {
        if (this.computedMetrics && this.computedMetrics.reliability != null) {
            return this.computedMetrics.reliability.toFixed(1) + '%';
        }
        return '—';
    }

    get downtimeHours() {
        if (this.computedMetrics && this.computedMetrics.downtimeHours != null) {
            return this.computedMetrics.downtimeHours.toFixed(1) + ' hrs';
        }
        return '—';
    }

    get avgRepairTime() {
        if (this.computedMetrics && this.computedMetrics.avgRepairTime != null) {
            return this.computedMetrics.avgRepairTime.toFixed(1) + ' hrs';
        }
        return '—';
    }

    get mtbf() {
        if (this.computedMetrics && this.computedMetrics.mtbf != null) {
            return this.computedMetrics.mtbf.toFixed(0) + ' hrs';
        }
        return '—';
    }
}