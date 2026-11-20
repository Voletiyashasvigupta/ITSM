package com.northstar.request.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.request.entity.ServiceRequestEntity;
import com.northstar.request.repository.RequestHistoryRepository;
import com.northstar.request.repository.ServiceRequestRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class LocalRequestServiceAccessTest {
    @Test void rejectsDetailReadsByWrongUserInServiceLayer(){
        UUID id=UUID.randomUUID(); ServiceRequestRepository repository=mock(ServiceRequestRepository.class);
        ServiceRequestEntity entity=mock(ServiceRequestEntity.class);
        when(repository.findById(id)).thenReturn(Optional.of(entity));
        when(entity.getRequesterId()).thenReturn("alice"); when(entity.getRequestedForId()).thenReturn("alice"); when(entity.getApproverId()).thenReturn("manager");
        LocalRequestService service=new LocalRequestServiceImpl(repository,mock(RequestHistoryRepository.class),new ObjectMapper(),new RequestStateMachine());
        assertThrows(ResponseStatusException.class,()->service.get(id,"bob",false));
    }
}
