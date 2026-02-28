import { LightningElement, api } from 'lwc';

export default class SfsAssetHierarchy extends LightningElement {
    @api hierarchyData;

    expandedNodes = new Set();

    get hasHierarchy() {
        return this.hierarchyData && this.hierarchyData.rootNode;
    }

    get totalInHierarchy() {
        return this.hierarchyData ? this.hierarchyData.totalInHierarchy : 0;
    }

    get rootNode() {
        if (!this.hasHierarchy) return null;
        const root = this.hierarchyData.rootNode;
        return {
            ...root,
            children: this.mapChildren(root.children)
        };
    }

    get rootNodeClass() {
        const base = 'node-card';
        return this.hierarchyData.rootNode.isCurrent
            ? base + ' node-current'
            : base;
    }

    get rootStatusClass() {
        return this.getStatusClass(this.hierarchyData.rootNode.status);
    }

    mapChildren(children) {
        if (!children) return [];
        return children.map(child => ({
            ...child,
            nodeClass: child.isCurrent ? 'node-card node-current' : 'node-card',
            statusClass: this.getStatusClass(child.status),
            expandIcon: this.expandedNodes.has(child.assetId) ? 'utility:chevrondown' : 'utility:chevronright',
            showChildren: child.hasChildren && this.expandedNodes.has(child.assetId),
            children: this.mapGrandchildren(child.children)
        }));
    }

    mapGrandchildren(children) {
        if (!children) return [];
        return children.map(gc => ({
            ...gc,
            nodeClass: gc.isCurrent ? 'node-card node-current' : 'node-card',
            statusClass: this.getStatusClass(gc.status)
        }));
    }

    getStatusClass(status) {
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

    handleToggle(event) {
        event.stopPropagation();
        const nodeId = event.currentTarget.dataset.id;
        // Create a new Set to trigger reactivity
        const updated = new Set(this.expandedNodes);
        if (updated.has(nodeId)) {
            updated.delete(nodeId);
        } else {
            updated.add(nodeId);
        }
        this.expandedNodes = updated;
    }

    handleNodeClick() {
        // Could navigate to asset record in future
    }
}