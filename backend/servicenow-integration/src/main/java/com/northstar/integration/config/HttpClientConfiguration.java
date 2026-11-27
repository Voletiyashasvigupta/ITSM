package com.northstar.integration.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Spring configuration providing HTTP client builders for external ServiceNow communication.
 *
 * <p><b>Purpose:</b> Declares and exposes a reusable {@link RestClient.Builder} bean in the application context.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.northstar.integration.client.ServiceNowApiClient}
 * to construct the underlying RestClient that executes OAuth token requests and ServiceNow Table API calls.
 */
@Configuration
public class HttpClientConfiguration {

    /**
     * Provides a standard Spring RestClient builder.
     *
     * <p><b>Purpose:</b> Creates a fresh {@link RestClient.Builder} instance with standard HTTP message converters.
     *
     * <p><b>Downstream / Workflow:</b> Utilized by client components to build HTTP request execution pipelines.
     *
     * @return A new RestClient.Builder instance.
     */
    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
