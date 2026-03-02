/**
 * Shared utility functions for SFS Asset components.
 * Import individual functions: import { formatDate, getPriorityClass } from 'c/sfs_assetUtils';
 */

// ===== Date Formatting =====

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== Status Class Helpers =====

export function getAssetStatusClass(status) {
    const statusMap = {
        'Installed': 'badge badge-installed',
        'Active': 'badge badge-installed',
        'Shipped': 'badge badge-shipped',
        'Purchased': 'badge badge-shipped',
        'Decommissioned': 'badge badge-decommissioned',
        'Obsolete': 'badge badge-decommissioned',
        'Under Maintenance': 'badge badge-maintenance'
    };
    return statusMap[status] || 'badge badge-default';
}

export function getWoStatusClass(status) {
    const statusMap = {
        'New': 'badge badge-new',
        'In Progress': 'badge badge-in-progress',
        'Completed': 'badge badge-completed',
        'Closed': 'badge badge-completed',
        'Canceled': 'badge badge-canceled'
    };
    return statusMap[status] || 'badge badge-default';
}

export function getCaseStatusClass(status) {
    const statusMap = {
        'New': 'badge badge-new',
        'Working': 'badge badge-working',
        'Escalated': 'badge badge-escalated',
        'Closed': 'badge badge-closed',
        'Waiting on Customer': 'badge badge-waiting'
    };
    return statusMap[status] || 'badge badge-default';
}

export function getPriorityClass(priority) {
    const priorityMap = {
        'Critical': 'priority-critical',
        'High': 'priority-high',
        'Medium': 'priority-medium',
        'Low': 'priority-low'
    };
    return priorityMap[priority] || '';
}

export function getWarrantyStatusClass(isActive) {
    return isActive ? 'badge badge-active' : 'badge badge-expired';
}

export function getDowntimeTypeClass(type) {
    if (type === 'Unplanned') return 'badge badge-unplanned';
    if (type === 'Planned') return 'badge badge-planned';
    return 'badge badge-default';
}
