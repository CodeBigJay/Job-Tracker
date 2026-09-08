package com.jobtracker.model;
import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor @Builder @AllArgsConstructor
public class Note { @Id @GeneratedValue(strategy=GenerationType.UUID) UUID id; @ManyToOne(fetch=FetchType.LAZY,optional=false) JobApplication application; @Column(nullable=false,length=5000) String content; LocalDateTime createdAt; @PrePersist void p(){createdAt=LocalDateTime.now();} }