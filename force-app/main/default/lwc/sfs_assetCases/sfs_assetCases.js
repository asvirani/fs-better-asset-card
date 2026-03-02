import { LightningElement, api } from 'lwc';
import { formatDate, getCaseStatusClass, getPriorityClass } from 'c/sfs_assetUtils';

export default class Sfs_assetCases extends LightningElement {
    @api cases = [];

    get hasCases() {
        return this.cases && this.cases.length > 0;
    }

    get formattedCases() {
        if (!this.cases) return [];
        return this.cases.map(c => ({
            ...c,
            formattedCreatedDate: formatDate(c.CreatedDate),
            statusClass: getCaseStatusClass(c.Status),
            priorityClass: getPriorityClass(c.Priority)
        }));
    }
}
