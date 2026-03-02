import { LightningElement, api } from 'lwc';
import { formatDate, getWarrantyStatusClass } from 'c/sfs_assetUtils';

export default class Sfs_assetWarranties extends LightningElement {
    @api warranties = [];

    get hasWarranties() {
        return this.warranties && this.warranties.length > 0;
    }

    get formattedWarranties() {
        if (!this.warranties) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.warranties.map(w => {
            const endDate = w.EndDate ? new Date(w.EndDate) : null;
            const isActive = endDate ? endDate >= today : false;

            return {
                ...w,
                formattedStartDate: formatDate(w.StartDate),
                formattedEndDate: formatDate(w.EndDate),
                isActive: isActive,
                statusLabel: isActive ? 'Active' : 'Expired',
                statusClass: getWarrantyStatusClass(isActive),
                laborCoveredFormatted: w.LaborCovered != null ? w.LaborCovered + '%' : '—',
                partsCoveredFormatted: w.PartsCovered != null ? w.PartsCovered + '%' : '—',
                expensesCoveredFormatted: w.ExpensesCovered != null ? w.ExpensesCovered + '%' : '—',
                warrantyTypeLabel: w.WarrantyType || '—'
            };
        });
    }
}
