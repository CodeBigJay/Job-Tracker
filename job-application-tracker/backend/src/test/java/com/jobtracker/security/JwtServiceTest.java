package com.jobtracker.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET =
            "job-tracker-test-secret-key-that-is-long-enough-for-hmac";

    @Test
    void createsAndValidatesTokenForEmail() {
        JwtService service = new JwtService(SECRET, 60_000);

        String token = service.create("candidate@example.com");

        assertNotNull(token);
        assertTrue(service.valid(token));
        assertEquals("candidate@example.com", service.email(token));
    }

    @Test
    void rejectsMalformedToken() {
        JwtService service = new JwtService(SECRET, 60_000);

        assertFalse(service.valid("not-a-valid-jwt"));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService service = new JwtService(SECRET, -1);
        String token = service.create("candidate@example.com");

        assertFalse(service.valid(token));
    }
}
