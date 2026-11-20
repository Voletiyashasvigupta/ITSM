package com.northstar.request.config;

import java.util.Map;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RequestMessagingConfig {
    public static final String EXCHANGE = "service.requests";
    public static final String ROUTING_KEY = "request.submission";
    public static final String QUEUE = "servicenow.request.submissions";
    public static final String DEAD_EXCHANGE = "service.requests.dlx";
    public static final String DEAD_ROUTING_KEY = "request.submission.dead";
    public static final String DEAD_QUEUE = "servicenow.request.submissions.dlq";

    @Bean
    TopicExchange requestExchange() { return new TopicExchange(EXCHANGE, true, false); }

    @Bean
    TopicExchange deadLetterExchange() { return new TopicExchange(DEAD_EXCHANGE, true, false); }

    @Bean
    Queue requestQueue() {
        return new Queue(QUEUE, true, false, false,
                Map.of("x-dead-letter-exchange", DEAD_EXCHANGE, "x-dead-letter-routing-key", DEAD_ROUTING_KEY));
    }

    @Bean
    Queue deadLetterQueue() { return new Queue(DEAD_QUEUE, true); }

    @Bean
    Binding requestBinding() { return BindingBuilder.bind(requestQueue()).to(requestExchange()).with(ROUTING_KEY); }

    @Bean
    Binding deadLetterBinding() { return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with(DEAD_ROUTING_KEY); }
}
