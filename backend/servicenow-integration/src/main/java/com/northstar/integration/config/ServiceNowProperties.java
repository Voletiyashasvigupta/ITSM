package com.northstar.integration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "servicenow")
public record ServiceNowProperties(String baseUrl, String clientId, String clientSecret, String tokenUri) {
    public boolean credentialsConfigured() {
        return present(baseUrl) && present(clientId) && present(clientSecret) && present(tokenUri);
    }

    private static boolean present(String value) {
        return value != null && !value.isBlank();
    }

    @Override
    public String toString() {
        return "ServiceNowProperties[baseUrl=" + baseUrl + ", credentialsConfigured=" + credentialsConfigured() + "]";
    }
}
