package com.foodorder.order.controller;

import com.foodorder.order.dto.LoginRequest;
import com.foodorder.order.dto.LoginResponse;
import com.foodorder.order.dto.RegisterRequest;
import com.foodorder.order.entity.User;
import com.foodorder.order.repository.UserRepository;
import com.foodorder.order.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AdminAuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateAdmin(@Valid @RequestBody LoginRequest request) {
        log.info("[AdminAuthController] Attempting login for user: {}", request.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_CUSTOMER");

        log.info("[AdminAuthController] Login successful for user: {}, role: {}", request.getUsername(), role);

        return ResponseEntity.ok(LoginResponse.builder()
                .token(jwt)
                .username(userDetails.getUsername())
                .role(role)
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        log.info("[AdminAuthController] Registering customer user: {}", request.getUsername());

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is already taken!"));
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_CUSTOMER")
                .email(request.getEmail())
                .build();

        userRepository.save(user);
        log.info("[AdminAuthController] Customer registered successfully: {}", request.getUsername());

        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }
}
