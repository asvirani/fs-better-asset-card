# Field Service — Better Asset Card

A comprehensive Lightning Web Component suite for Salesforce Field Service that provides a rich, compact asset overview card on Work Order record pages. Displays device identity, warranty status, performance metrics, service history, and asset hierarchy — all in a single card.

![Asset Card Screenshot](docs/screenshot-placeholder.png)

## What's Included

### Lightning Web Components

| Component | Description |
|---|---|
| `sfs_assetCard` | Main asset card — compact overview with collapsible sections for metrics, service history, and hierarchy |
| `sfs_assetOverview` | Full asset overview with tabbed detail views |
| `sfs_assetdetails` | Asset detail display (name, serial, status, install date) |
| `sfs_assetCases` | Related cases list for the asset |
| `sfs_assetDowntime` | Asset downtime period history |
| `sfs_assetWarranties` | Warranty coverage details |
| `sfs_assetWorkOrderHistory` | Work order history timeline |
| `sfs_assetprediction` | Service prediction with work plan creation |
| `sfs_assethierarchy` | Asset hierarchy tree (parent/child relationships) |
| `sfsAssetHierarchy` | Alternate hierarchy viewer |
| `sdo_sfs_assetserviceprediction` | SDO service prediction component |
| `sdo_sfs_assethealthscore_tabnext` | Asset health score tab |

### Apex Controllers

| Class | Description |
|---|---|
| `AssetOverviewController` | Main controller — queries Asset, WorkOrder, AssetWarranty, AssetDowntimePeriod, and Case records. Computes availability, reliability, MTBF, and warranty status. Builds asset hierarchy tree. |
| `SFS_AssetHierarchy` | Fetches parent/child asset hierarchy data |
| `SFS_AssetPredictionController` | Creates work plans from service predictions |
| `SDO_SFS_ASP` | SDO service prediction work plan creation |

## Prerequisites

- Salesforce org with **Field Service** enabled
- **Asset Lifecycle Management** features enabled (AssetWarranty, AssetDowntimePeriod objects)
- Assets linked to Work Orders
- Salesforce CLI (`sf`) installed locally

## Installation

### Option 1: Deploy via CLI (Recommended)

```bash
# Clone the repo
git clone https://github.com/asvirani/fs-better-asset-card.git
cd fs-better-asset-card

# Authenticate to your org
sf org login web --alias my-org

# Deploy using the manifest
sf project deploy start --manifest manifest/package.xml --target-org my-org
```

### Option 2: Deploy Source Directly

```bash
sf project deploy start --source-dir force-app --target-org my-org
```

### Option 3: Manual Install

1. Copy the contents of `force-app/main/default/classes/` to your org's Apex classes
2. Copy the contents of `force-app/main/default/lwc/` to your org's LWC directory
3. Deploy via VS Code with the Salesforce Extensions pack

### After Deployment

1. Navigate to a **Work Order** record page in Lightning App Builder
2. Drag the **Asset Card** component onto the page layout
3. Configure the component properties:
   - **Show Performance Metrics** — toggle availability, reliability, and MTBF display
   - **Show Service History Summary** — toggle work order and case counts
   - **Show Asset Hierarchy** — toggle parent/child system hierarchy
   - **Recent Work Orders to Show** — number of recent WOs in the quick list (default: 3)

## Project Structure

```
fs-better-asset-card/
├── force-app/main/default/
│   ├── classes/                  # Apex controllers
│   │   ├── AssetOverviewController.cls
│   │   ├── SFS_AssetHierarchy.cls
│   │   ├── SFS_AssetPredictionController.cls
│   │   └── SDO_SFS_ASP.cls
│   └── lwc/                     # Lightning Web Components
│       ├── sfs_assetCard/       # Main card component
│       ├── sfs_assetOverview/
│       ├── sfs_assetdetails/
│       ├── sfs_assetCases/
│       ├── sfs_assetDowntime/
│       ├── sfs_assetWarranties/
│       ├── sfs_assetWorkOrderHistory/
│       ├── sfs_assetprediction/
│       ├── sfs_assethierarchy/
│       ├── sfsAssetHierarchy/
│       ├── sdo_sfs_assetserviceprediction/
│       └── sdo_sfs_assethealthscore_tabnext/
├── manifest/
│   └── package.xml              # Deployment manifest
├── config/
│   └── project-scratch-def.json
└── sfdx-project.json
```

## Author

**Armaan Virani**
