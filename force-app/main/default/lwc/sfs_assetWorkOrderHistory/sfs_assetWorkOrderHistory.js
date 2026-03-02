import { LightningElement, api } from 'lwc';
import { formatDate, getWoStatusClass, getPriorityClass } from 'c/sfs_assetUtils';

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
            formattedStartDate: wo.StartDate ? formatDate(wo.StartDate) : '—',
            formattedEndDate: wo.EndDate ? formatDate(wo.EndDate) : '—',
            statusClass: getWoStatusClass(wo.Status),
            priorityClass: getPriorityClass(wo.Priority)
        }));
    }
}
