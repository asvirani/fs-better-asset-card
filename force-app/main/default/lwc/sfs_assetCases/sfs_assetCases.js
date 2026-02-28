import { LightningElement, api } from 'lwc';

export default class Sfs_assetCases extends LightningElement {
    @api cases = [];

    get hasCases() {
        return this.cases && this.cases.length > 0;
    }

    get formattedCases() {
        if (!this.cases) return [];
        return this.cases.map(c => ({
            ...c,
            formattedCreatedDate: this.formatDate(c.CreatedDate),
            statusClass: this.getStatusClass(c.Status),
            priorityClass: this.getPriorityClass(c.Priority)
        }));
    }

    formatDate(dtStr) {
        if (!dtStr) return '—';
        const d = new Date(dtStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    getStatusClass(status) {
        const statusMap = {
            'New': 'badge badge-new',
            'Working': 'badge badge-working',
            'Escalated': 'badge badge-escalated',
            'Closed': 'badge badge-closed',
            'Waiting on Customer': 'badge badge-waiting'
        };
        return statusMap[status] || 'badge badge-default';
    }

    getPriorityClass(priority) {
        const priorityMap = {
            'Critical': 'priority-critical',
            'High': 'priority-high',
            'Medium': 'priority-medium',
            'Low': 'priority-low'
        };
        return priorityMap[priority] || 'detail-value';
    }
}