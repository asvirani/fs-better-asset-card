import { LightningElement, api } from 'lwc';

export default class Sfs_assetDowntime extends LightningElement {
    @api downtimePeriods = [];

    get hasDowntime() {
        return this.downtimePeriods && this.downtimePeriods.length > 0;
    }

    get formattedDowntime() {
        if (!this.downtimePeriods) return [];
        return this.downtimePeriods.map(dp => ({
            ...dp,
            formattedStartTime: this.formatDateTime(dp.StartTime),
            formattedEndTime: this.formatDateTime(dp.EndTime),
            duration: this.calculateDuration(dp.StartTime, dp.EndTime),
            downtimeTypeLabel: dp.DowntimeType || '—',
            descriptionLabel: dp.Description || '—',
            typeClass: this.getTypeClass(dp.DowntimeType)
        }));
    }

    formatDateTime(dtStr) {
        if (!dtStr) return '—';
        const d = new Date(dtStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    getTypeClass(type) {
        if (type === 'Unplanned') return 'badge badge-unplanned';
        if (type === 'Planned') return 'badge badge-planned';
        return 'badge badge-default';
    }
}