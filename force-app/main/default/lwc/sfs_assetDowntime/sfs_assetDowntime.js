import { LightningElement, api } from 'lwc';
import { formatDateTime, getDowntimeTypeClass } from 'c/sfs_assetUtils';

export default class Sfs_assetDowntime extends LightningElement {
    @api downtimePeriods = [];

    get hasDowntime() {
        return this.downtimePeriods && this.downtimePeriods.length > 0;
    }

    get formattedDowntime() {
        if (!this.downtimePeriods) return [];
        return this.downtimePeriods.map(dp => ({
            ...dp,
            formattedStartTime: formatDateTime(dp.StartTime),
            formattedEndTime: formatDateTime(dp.EndTime),
            duration: this.calculateDuration(dp.StartTime, dp.EndTime),
            downtimeTypeLabel: dp.DowntimeType || '—',
            descriptionLabel: dp.Description || '—',
            typeClass: getDowntimeTypeClass(dp.DowntimeType)
        }));
    }

    calculateDuration(startStr, endStr) {
        if (!startStr || !endStr) return '—';
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffMs = end - start;
        if (diffMs <= 0) return '—';
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return hours + 'h ' + minutes + 'm';
        }
        return minutes + 'm';
    }
}
