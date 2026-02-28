# Field Service — Better Asset Card

A comprehensive Lightning Web Component suite for Salesforce Field Service that provides a rich, compact asset overview card on Work Order record pages. Displays device identity, warranty status, performance metrics, service history with 12-month trend sparkline, and asset hierarchy — all in a single card.

![Asset Card Screenshot](docs/screenshot-placeholder.png)

## What's New in v0.2

### 12-Month Service Trend Sparkline

A pure inline SVG area chart embedded in the Service History section showing work order volume over the last 12 months. Helps technicians and dispatchers quickly see whether an asset is trending toward failure or stabilizing.

- **Inline SVG area chart** — no external charting libraries, Locker Service compatible
- **Gradient fill** with stroke line for clear visual trend
- **Trend indicator** — "Trending Up" (red) / "Trending Down" (green) / "Stable" (gray)
- **Month labels** — abbreviated labels beneath the chart (every 3rd month)
- **Server-side aggregation** — separate SOQL aggregate query avoids the LIMIT 20 on work orders
- **Auto-hide** — hidden when no work order history exists

## What's Included

### Lightning Web Components

| Component | Description |
|---|---|
| `sfs_assetCard` | Main asset card — compact overview with collapsible sections for metrics, service history (with sparkline), and hierarchy |
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
| `AssetOverviewController` | Main controller — queries Asset, WorkOrder, AssetWarranty, AssetDowntimePeriod, and Case records. Computes availability, reliability, MTBF, and warranty status. Builds asset hierarchy tree. Aggregates 12-month work order trend data. |
| `SFS_AssetHierarchy` | Fetches parent/child asset hierarchy data |
| `SFS_AssetPredictionController` | Creates work plans from service predictions |
| `SDO_SFS_ASP` | SDO service prediction work plan creation |

## Prerequisites

- Salesforce org with **Field Service** enabled
- **Asset Lifecycle Management** features enabled (AssetWarranty, AssetDowntimePeriod objects)
- Assets linked to Work Orders
- Salesforce CLI (`sf`) installed locally

## Installation

### Option 1: Unlocked Package Install (Recommended)

**v0.2** (latest — includes sparkline trend):

Install via URL:

https://login.salesforce.com/packaging/installPackage.apexp?p0=04tKa000002bKhEIAU

Or via CLI:

```bash
sf package install --package 04tKa000002bKhEIAU --target-org my-org --wait 10
```

<details>
<summary>Previous versions</summary>

**v0.1** (initial release):

```bash
sf package install --package 04tKa000002bKcrIAE --target-org my-org --wait 10
```

Install URL: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tKa000002bKcrIAE

</details>

### Option 2: Deploy Source via CLI

```bash
# Clone the repo
git clone https://github.com/asvirani/fs-better-asset-card.git
cd fs-better-asset-card

# Authenticate to your org
sf org login web --alias my-org

# Deploy using the manifest
sf project deploy start --manifest manifest/package.xml --target-org my-org
```

### Option 3: Deploy Source Directly

```bash
sf project deploy start --source-dir force-app --target-org my-org
```

### After Deployment

1. Navigate to a **Work Order** record page in Lightning App Builder
2. Drag the **Asset Card** component onto the page layout
3. Configure the component properties:
   - **Show Performance Metrics** — toggle availability, reliability, and MTBF display
   - **Show Service History Summary** — toggle work order and case counts (includes sparkline)
   - **Show Asset Hierarchy** — toggle parent/child system hierarchy
   - **Recent Work Orders to Show** — number of recent WOs in the quick list (default: 3)

## Package Versions

| Version | Subscriber Package Version Id | Description |
|---------|-------------------------------|-------------|
| 0.2 | `04tKa000002bKhEIAU` | 12-month service trend sparkline, trend indicator |
| 0.1 | `04tKa000002bKcrIAE` | Initial release — asset card with metrics, history, hierarchy |

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
