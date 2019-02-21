#!/bin/bash
## following instructions from this page https://docs.microsoft.com/en-us/azure/container-registry/container-registry-auth-aks
ACR_NAME=avantsoftdocker
SERVICE_PRINCIPAL_NAME=acr-service-principal

# Populate the ACR login server and resource id.
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_REGISTRY_ID=$(az acr show --name $ACR_NAME --query id --output tsv)

# Create a 'Reader' role assignment with a scope of the ACR resource.
az ad sp delete --id http://$SERVICE_PRINCIPAL_NAME 
SP_PASSWD=$(az ad sp create-for-rbac --name $SERVICE_PRINCIPAL_NAME --role Reader --scopes $ACR_REGISTRY_ID --query password --output tsv)

# Get the service principal client id.
CLIENT_ID=$(az ad sp show --id http://$SERVICE_PRINCIPAL_NAME --query appId --output tsv)

# Output used when creating Kubernetes secret.
echo "Service principal ID: $CLIENT_ID"
echo "Service principal password: $SP_PASSWD"

kubectl delete secret acr-auth
kubectl create secret docker-registry acr-auth --docker-server avantsoftdocker-on.azurecr.io --docker-username $CLIENT_ID --docker-password $SP_PASSWD --docker-email justin@avantsoft.com