public class SFS_AssetHierarchy {
    
    @AuraEnabled
    public static Asset getAssetHierarchy(Id woId) {
        System.debug('woId'+woId);
        Id assetId=getAssetId(woId);
        if(assetId==null)
        {
            return null;
        }
        Asset assetData=[SELECT Id,Name,Status,InstallDate,SerialNumber,Entitlement_Status__c,(SELECT Id,Name,Status,InstallDate,SerialNumber,Entitlement_Status__c from ChildAssets where ParentId=:assetId) from Asset where Id=:assetId LIMIT 1];

        // populate assets with data from Asset objects
        return assetData;
    }

    
    public static Id getAssetId(Id woId)
    {
        return [SELECT AssetId from WorkOrder where Id=:woId LIMIT 1].AssetId;
    }
  
    

}