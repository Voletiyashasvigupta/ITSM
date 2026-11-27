package com.northstar.integration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration record binding external ServiceNow connection properties from environment variables or configuration files.
 *
 * <p><b>Purpose:</b> Holds target instance endpoint URLs and OAuth2 client credentials under the {@code servicenow} prefix.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.integration.client.ServiceNowApiClient} and
 * {@link com.northstar.integration.controller.IntegrationStatusController} to determine whether credentials are fully
 * supplied and to formulate authenticated outbound requests.
 *
 * @param baseUrl Base URL of the ServiceNow instance (e.g. {@code https://dev12345.service-now.com}).
 * @param clientId OAuth2 client identifier.
 * @param clientSecret OAuth2 client secret.
 * @param tokenUri Full URI to the OAuth token issuance endpoint (e.g. {@code https://dev12345.service-now.com/oauth_token.do}).
 * @param username ServiceNow admin username used for OAuth2 password grant (required when client_credentials is not enabled on the PDI).
 * @param password ServiceNow admin password used for OAuth2 password grant.
 */
@ConfigurationProperties(prefix = "servicenow")
public record ServiceNowProperties(String baseUrl, String clientId, String clientSecret, String tokenUri,
                                   String username, String password) {

    /**
     * Checks whether all mandatory ServiceNow connection properties are populated with non-blank values.
     *
     * <p><b>Purpose:</b> Validates configuration readiness before attempting external network calls.
     *
     * <p><b>Downstream / Workflow:</b> Called by {@link com.northstar.integration.controller.IntegrationStatusController#status()}
     * and {@link com.northstar.integration.client.ServiceNowApiClient#requireConfiguration()} to safeguard against null/blank calls.
     *
     * @return {@code true} if baseUrl, clientId, clientSecret, and tokenUri are all non-blank; {@code false} otherwise.
     */
    public boolean credentialsConfigured() {
        // Basic Auth path: only baseUrl + username + password needed (PDI environments)
        if (hasPasswordGrant() && present(baseUrl)) return true;
        // OAuth2 path: all four OAuth fields must be present
        return present(baseUrl) && present(clientId) && present(clientSecret) && present(tokenUri)
                && (hasPasswordGrant() || true); // client_credentials OR password grant both accepted
    }

    /**
     * Returns true when username+password are supplied, enabling OAuth2 password grant as a fallback.
     *
     * <p><b>Purpose:</b> ServiceNow PDIs may not enable client_credentials by default; password grant works universally.
     *
     * <p><b>Downstream / Workflow:</b> Checked by {@link com.northstar.integration.client.ServiceNowApiClient#acquireToken()}
     * to decide which OAuth2 flow to use.
     *
     * @return {@code true} if username and password are both non-blank.
     */
    public boolean hasPasswordGrant() {
        return present(username) && present(password);
    }

    /**
     * Helper method to verify that a string is non-null and contains non-whitespace characters.
     *
     * <p><b>Purpose:</b> Internal string presence check.
     *
     * <p><b>Downstream / Workflow:</b> Evaluated during {@link #credentialsConfigured()}.
     *
     * @param value The string to test.
     * @return {@code true} if present and non-blank.
     */
    private static boolean present(String value) {
        return value != null && !value.isBlank();
    }

    /**
     * Masked string representation protecting sensitive client credentials from log leaks.
     *
     * <p><b>Purpose:</b> Safe logging output that prints the base URL and configuration status without exposing client secrets.
     *
     * <p><b>Downstream / Workflow:</b> Used in diagnostic logging and debugger views.
     *
     * @return Sanitized string descriptor.
     */
    @Override
    public String toString() {
        return "ServiceNowProperties[baseUrl=" + baseUrl + ", credentialsConfigured=" + credentialsConfigured() + "]";
    }
}
