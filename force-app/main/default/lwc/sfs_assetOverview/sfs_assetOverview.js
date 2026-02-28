import { LightningElement, api, wire } from 'lwc';
import { CloseActionScreenEvent } from 'lightning/actions';
import getAssetOverview from '@salesforce/apex/AssetOverviewController.getAssetOverview';

export default class Sfs_assetOverview extends LightningElement {
    @api recordId;

    data;
    error;
    isLoading = true;

    get asset() {
        return this.data ? this.data.asset : null;
    }

    get workOrders() {
        return this.data ? this.data.workOrders : [];
    }

    get warranties() {
        return this.data ? this.data.warranties : [];
    }

    get downtimePeriods() {
        return this.data ? this.data.downtimePeriods : [];
    }

    get cases() {
        return this.data ? this.data.cases : [];
    }

    get hasData() {
        return this.data && this.data.asset;
    }

    get hasNoAsset() {
        return !this.isLoading && !this.error && !this.hasData;
    }

    get assetName() {
        return this.asset ? this.asset.Name : 'Asset';
    }

    get statusClass() {
        if (!this.asset) return '';
        return this.asset.Status === 'Installed' ? 'status-normal' : 'status-critical';
    }

    get statusLabel() {
        if (!this.asset) return '';
        return this.asset.Status === 'Installed' ? 'Normal' : this.asset.Status;
    }

    get statusIcon() {
        if (!this.asset) return 'utility:info';
        return this.asset.Status === 'Installed' ? 'utility:success' : 'utility:warning';
    }

    get statusVariant() {
        if (!this.asset) return '';
        return this.asset.Status === 'Installed' ? 'success' : 'warning';
    }

    get workOrderCount() {
        return this.workOrders.length;
    }

    get warrantyCount() {
        return this.warranties.length;
    }

    get downtimeCount() {
        return this.downtimePeriods.length;
    }

    get caseCount() {
        return this.cases.length;
    }

    get hierarchyData() {
        return this.data ? this.data.hierarchyData : null;
    }

    get hierarchyCount() {
        return this.hierarchyData ? this.hierarchyData.totalInHierarchy : 0;
    }

    get computedMetrics() {
        return this.data ? this.data.computedMetrics : null;
    }

    @wire(getAssetOverview, { recordId: '$recordId' })
    wiredAssetOverview({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.data = data;
            this.error = undefined;
        } else if (error) {
            this.error = error.body ? error.body.message : 'An error occurred loading asset data.';
            this.data = undefined;
        }
    }

    handleClose() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}