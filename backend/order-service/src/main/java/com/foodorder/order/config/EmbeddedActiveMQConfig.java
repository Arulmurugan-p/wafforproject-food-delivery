package com.foodorder.order.config;

import org.apache.activemq.broker.BrokerService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "activemq.embedded", havingValue = "true", matchIfMissing = true)
public class EmbeddedActiveMQConfig {

    @Bean(initMethod = "start", destroyMethod = "stop")
    public BrokerService brokerService() throws Exception {
        BrokerService broker = new BrokerService();
        broker.setBrokerName("embedded-activemq");
        broker.setPersistent(false);
        broker.setUseJmx(false); // Disable JMX to avoid conflict/overhead
        broker.addConnector("tcp://localhost:61616");
        return broker;
    }
}
