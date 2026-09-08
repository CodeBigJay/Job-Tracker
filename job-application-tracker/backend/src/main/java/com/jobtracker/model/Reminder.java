package com.jobtracker.model;
import jakarta.persistence.*; import lombok.*; import java.time.*; import java.util.*;
@Entity @Getter @Setter @NoArgsConstructor @Builder @AllArgsConstructor
public class Reminder { @Id @GeneratedValue(strategy=GenerationType.UUID) UUID id; @ManyToOne(fetch=FetchType.LAZY,optional=false) JobApplication application; String title; LocalDateTime remindAt; Boolean completed=false; }