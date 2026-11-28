package com.northstar.catalog.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.catalog.dto.FormDefinitionDto;
import com.northstar.catalog.integration.ServiceNowCatalogClient;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

class CatalogFormDefinitionTest {

    private CatalogController controller;

    @BeforeEach
    void setUp() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ObjectMapper mapper = new ObjectMapper();
        ServiceNowCatalogClient serviceNow = mock(ServiceNowCatalogClient.class);
        controller = new CatalogController(redis, mapper, serviceNow);
    }

    @Test
    void providesCompleteAssetPurchaseFormDefinition() {
        FormDefinitionDto form = controller.getFormDefinition("asset-purchase");
        assertNotNull(form);
        assertEquals("Asset purchase", form.title());

        List<FormDefinitionDto.FormFieldDto> fields = form.fields();
        assertTrue(fields.stream().anyMatch(f -> "assetType".equals(f.name()) && "select".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "assetModel".equals(f.name()) && "text".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "quantity".equals(f.name()) && "number".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "estimatedBudget".equals(f.name()) && "number".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "deliveryLocation".equals(f.name()) && "text".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "deliveryContact".equals(f.name()) && "text".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "isExpedited".equals(f.name()) && "checkbox".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "accessories".equals(f.name()) && "multi-select".equals(f.kind())));
        assertTrue(fields.stream().anyMatch(f -> "referenceAsset".equals(f.name()) && "reference".equals(f.kind())));

        // Conditional field verification
        FormDefinitionDto.FormFieldDto expeditedJust = fields.stream()
                .filter(f -> "expeditedJustification".equals(f.name()))
                .findFirst()
                .orElse(null);
        assertNotNull(expeditedJust);
        assertNotNull(expeditedJust.condition());
        assertEquals("isExpedited", expeditedJust.condition().dependsOn());
        assertEquals("true", expeditedJust.condition().value());
        assertEquals("show", expeditedJust.condition().action());
    }
}
