package com.jobtracker.controller;

import com.jobtracker.model.User;
import com.jobtracker.repository.UserRepository;
import com.jobtracker.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    record Register(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8) String password
    ) {}

    record Login(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    record Response(String token, String email, String fullName) {}

    final UserRepository users;
    final PasswordEncoder encoder;
    final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    Response register(@Valid @RequestBody Register request) {
        String normalizedEmail = request.email().toLowerCase(Locale.ROOT);
        if (users.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = users.save(User.builder()
                .fullName(request.fullName().trim())
                .email(normalizedEmail)
                .password(encoder.encode(request.password()))
                .build());

        return new Response(jwt.create(user.getEmail()), user.getEmail(), user.getFullName());
    }

    @PostMapping("/login")
    Response login(@Valid @RequestBody Login request) {
        String normalizedEmail = request.email().toLowerCase(Locale.ROOT);
        User user = users.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!encoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return new Response(jwt.create(user.getEmail()), user.getEmail(), user.getFullName());
    }
}
