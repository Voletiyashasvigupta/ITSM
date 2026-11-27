package com.northstar.request.config;

import java.util.Map;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ messaging topology configuration for service request outbox publishing.
 *
 * <p><b>Purpose:</b> Declares durable topic exchanges, request queues, dead-letter exchanges (DLX),
 * dead-letter queues (DLQ), and routing key bindings for reliable event publishing.
 *
 * <p><b>Downstream / Workflow:</b> Used by {@link com.northstar.request.outbox.OutboxRelay} to publish
 * request submission messages to the RabbitMQ broker.
 */
@Configuration
public class RequestMessagingConfig {
    public static final String EXCHANGE = "service.requests";
    public static final String ROUTING_KEY = "request.submission";
    public static final String QUEUE = "servicenow.request.submissions";
    public static final String DEAD_EXCHANGE = "service.requests.dlx";
    public static final String DEAD_ROUTING_KEY = "request.submission.dead";
    public static final String DEAD_QUEUE = "servicenow.request.submissions.dlq";

    /**
     * Declares the primary durable topic exchange for service request events.
     *
     * @return Durable TopicExchange.
     */
    @Bean
    TopicExchange requestExchange() { return new TopicExchange(EXCHANGE, true, false); }

    /**
     * Declares the dead-letter topic exchange for unroutable or failed messages.
     *
     * @return Durable DLX TopicExchange.
     */
    @Bean
    TopicExchange deadLetterExchange() { return new TopicExchange(DEAD_EXCHANGE, true, false); }

    /**
     * Declares the request submissions queue wired with dead-letter exchange arguments.
     *
     * @return Durable Queue.
     */
    @Bean
    Queue requestQueue() {
        return new Queue(QUEUE, true, false, false,
                Map.of("x-dead-letter-exchange", DEAD_EXCHANGE, "x-dead-letter-routing-key", DEAD_ROUTING_KEY));
    }

    /**
     * Declares the dead-letter queue.
     *
     * @return Durable DLQ.
     */
    @Bean
    Queue deadLetterQueue() { return new Queue(DEAD_QUEUE, true); }

    /**
     * Binds requestQueue to requestExchange with routing key "request.submission".
     *
     * @return Binding instance.
     */
    @Bean
    Binding requestBinding() { return BindingBuilder.bind(requestQueue()).to(requestExchange()).with(ROUTING_KEY); }

    /**
     * Binds deadLetterQueue to deadLetterExchange with routing key "request.submission.dead".
     *
     * @return Binding instance.
     */
    @Bean
    Binding deadLetterBinding() { return BindingBuilder.bind(deadLetterQueue()).to(deadLetterExchange()).with(DEAD_ROUTING_KEY); }
}
