package com.foodorder.order.config;

import com.foodorder.order.entity.User;
import com.foodorder.order.entity.Role;
import com.foodorder.order.entity.DeliveryPartner;
import com.foodorder.order.repository.UserRepository;
import com.foodorder.order.repository.RoleRepository;
import com.foodorder.order.repository.DeliveryPartnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Roles
        seedRole("CUSTOMER");
        seedRole("DELIVERY_PARTNER");
        seedRole("ADMIN");

        // 2. Seed Admin
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ROLE_ADMIN")
                    .email("admin@foodorder.com")
                    .build();
            userRepository.save(admin);
            log.info("[DatabaseInitializer] Admin user seeded successfully (Username: admin, Password: admin123)");
        }

        // 3. Seed Customer
        if (userRepository.findByUsername("customer").isEmpty()) {
            User customer = User.builder()
                    .username("customer")
                    .password(passwordEncoder.encode("customer123"))
                    .role("ROLE_CUSTOMER")
                    .email("customer@foodorder.com")
                    .build();
            userRepository.save(customer);
            log.info("[DatabaseInitializer] Customer user seeded successfully (Username: customer, Password: customer123)");
        }

        // 4. Seed Delivery Partner
        if (userRepository.findByUsername("delivery").isEmpty()) {
            User deliveryUser = User.builder()
                    .username("delivery")
                    .password(passwordEncoder.encode("delivery123"))
                    .role("ROLE_DELIVERY_PARTNER")
                    .email("delivery@foodorder.com")
                    .build();
            userRepository.save(deliveryUser);

            DeliveryPartner partner = DeliveryPartner.builder()
                    .username("delivery")
                    .fullName("John Courier")
                    .phone("+1 555-0199")
                    .status("AVAILABLE")
                    .build();
            partnerRepository.save(partner);
            log.info("[DatabaseInitializer] Delivery Partner seeded successfully (Username: delivery, Password: delivery123)");
        }
    }

    private void seedRole(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            roleRepository.save(Role.builder().name(roleName).build());
            log.info("[DatabaseInitializer] Role seeded: {}", roleName);
        }
    }
}
