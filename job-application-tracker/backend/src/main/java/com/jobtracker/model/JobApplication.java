package com.jobtracker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;
import static com.jobtracker.model.Enums.Status;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    User user;

    @Column(nullable = false)
    String company;

    @Column(nullable = false)
    String jobTitle;

    String location;
    String jobUrl;
    String salary;
    String source;

    @Enumerated(EnumType.STRING)
    Status status;

    LocalDate appliedDate;
    LocalDate closingDate;

    @Column(length = 4000)
    String description;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = Status.SAVED;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
