package com.jobtracker.repository;

import com.jobtracker.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    List<Interview> findByApplicationIdOrderByScheduledAtAsc(UUID applicationId);
    Optional<Interview> findByIdAndApplicationId(UUID id, UUID applicationId);
}
