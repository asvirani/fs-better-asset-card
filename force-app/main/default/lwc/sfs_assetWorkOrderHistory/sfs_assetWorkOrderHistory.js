import { LightningElement, api } from 'lwc';

export default class Sfs_assetWorkOrderHistory extends LightningElement {
    @api workOrders = [];

    get hasWorkOrders() {
        return this.workOrders && this.workOrders.length > 0;
    }

    get formattedWorkOrders() {
        if (!this.workOrders) return [];
        return this.workOrders.map(wo => ({
            ...wo,
            workTypeName: wo.WorkType ? wo.WorkType.Name : '—',
            formattedStartDate: wo.StartDate ? this.formatDate(wo.StartDate) : '—',
            formattedEndDate: wo.EndDate ? this.formatDate(wo.EndDate) : '—',
            statusClass: this.getStatusClass(wo.Status),
            priorityClass: this.getPriorityClass(wo.Priority)
        }));
    }

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    getStatusClass(status) {
        const statusMap = {
            'New': 'badge badge-new',
            'In Progress': 'badge badge-in-progress',
            'Completed': 'badge badge-completed',
            'Closed': 'badge badge-completed',
            'Canceled': 'badge badge-canceled'
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
        return priorityMap[priority] || '';
    }
}