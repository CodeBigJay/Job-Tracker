package com.jobtracker.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.*;
import static com.jobtracker.model.Enums.InterviewType;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    JobApplication application;

    LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    InterviewType type;

    String interviewer;
    String meetingUrl;

    @Column(length = 3000)
    String notes;

    Boolean completed = false;
}
