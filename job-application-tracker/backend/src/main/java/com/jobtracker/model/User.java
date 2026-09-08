package com.jobtracker.model;
import jakarta.persistence.*; import lombok.*; import java.util.*;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor @Builder @AllArgsConstructor
public class User { @Id @GeneratedValue(strategy=GenerationType.UUID) UUID id; @Column(unique=true,nullable=false) String email; @Column(nullable=false) String password; @Column(nullable=false) String fullName; }